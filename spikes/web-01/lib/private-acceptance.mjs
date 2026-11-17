import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {renderBody} from './render.mjs';

export const TEST_TARGET = {projectId:'o3i9jgij', dataset:'web01'};
const content = ({_id, _rev, _createdAt, _updatedAt, ...value}) => value;

// Opt-in owner CLI check. Only newly generated drafts are written/deleted;
// no existing article is read, exported, published or changed.
export async function runPrivateAcceptance({owner, resume, anonymous, fixture, report = () => {}, runId = randomUUID().replaceAll('-', '')}) {
  for (const client of [owner, resume, anonymous]) {
    const config = client.config();
    assert.equal(config.projectId, TEST_TARGET.projectId, 'Only the WEB-01 test project is allowed.');
    assert.equal(config.dataset, TEST_TARGET.dataset, 'Only the disposable web01 dataset is allowed.');
    assert.equal(config.useCdn, false, 'Acceptance checks must bypass the CDN.');
  }
  assert.ok(owner.config().token && resume.config().token, 'Run through Sanity CLI with --with-user-token.');
  assert.ok(!anonymous.config().token, 'The anonymous check must not have a token.');
  assert.match(runId, /^[a-f0-9]{32}$/, 'Invalid synthetic run ID.');
  const ids = [`drafts.web01-check-${runId}`, `drafts.web01-check-${runId}-restore`];
  const intended = new Set();
  const checks = [];
  let stage = 'initialization', failure, directory;
  const cleanupPending = [];
  const start = name => {stage = name; report({state:'checking', check:name});};
  const pass = () => {checks.push(stage); report({state:'passed', check:stage});};
  const create = async document => {
    assert.ok(ids.includes(document._id) && document._id.startsWith('drafts.'), 'Only this run’s synthetic drafts may be created.');
    intended.add(document._id); // A response can be lost after the write succeeds.
    return owner.create(document, {visibility:'sync'});
  };
  try {
    start('private-cloud-save-and-fresh-client-read');
    const input = {...content(structuredClone(fixture)),
      _id:ids[0], title:'WEB-01 automated disposable check',
      slug:{_type:'slug', current:`web01-check-${runId}`}, web01CheckRun:runId,
    };
    await create(input);
    const saved = await resume.getDocument(ids[0]);
    assert.deepEqual(content(saved), content(input), 'Saved synthetic content changed.');
    assert.match(renderBody(saved.body), /<table>/);
    assert.match(renderBody(saved.body), /language-csharp/);
    pass();

    start('anonymous-draft-read-and-dry-run-write-denial');
    assert.ok(!await anonymous.getDocument(ids[0]), 'Anonymous direct read returned a draft.');
    assert.equal(await anonymous.fetch('count(*[_id == $id])', {id:ids[0]}, {perspective:'raw'}), 0, 'Anonymous raw query returned a draft.');
    let denied = false;
    try {
      await anonymous.mutate([{patch:{id:ids[0], set:{title:'MUST NOT BE WRITTEN'}}}], {dryRun:true});
    } catch (error) {if ([401,403].includes(error.statusCode)) denied = true; else throw error;}
    assert.ok(denied, 'Anonymous validation-only mutation was not denied.');
    pass();

    start('api-revision-guard-rejects-stale-write');
    const newer = await owner.patch(ids[0]).ifRevisionId(saved._rev)
      .set({summary:'A newer synthetic revision.'}).commit({visibility:'sync'});
    let conflict = false;
    try {
      await resume.patch(ids[0]).ifRevisionId(saved._rev)
        .set({title:'STALE WRITE MUST NOT LAND'}).commit({visibility:'sync'});
    } catch (error) {if (error.statusCode === 409) conflict = true; else throw error;}
    assert.ok(conflict, 'Stale API revision was not rejected with 409.');
    const current = await resume.getDocument(ids[0]);
    assert.equal(current.title, input.title);
    assert.equal(current._rev, newer._rev);
    assert.equal(current.summary, newer.summary);
    pass();

    start('synthetic-ndjson-cloud-restore');
    directory = await mkdtemp(join(tmpdir(), 'web01-private-check-'));
    const path = join(directory, 'synthetic.ndjson');
    await writeFile(path, JSON.stringify(current)+'\n', {mode:0o600});
    const backup = JSON.parse(await readFile(path, 'utf8'));
    assert.equal(backup._id, ids[0]);
    assert.equal(backup.web01CheckRun, runId);
    await create({...content(backup), _id:ids[1]});
    const restored = await resume.getDocument(ids[1]);
    assert.deepEqual(content(restored), content(current), 'Restored synthetic content changed.');
    assert.equal(renderBody(restored.body), renderBody(current.body));
    assert.ok(!await anonymous.getDocument(ids[1]), 'Anonymous read returned the restored draft.');
    pass();
  } catch (error) {failure = {check:stage, statusCode:error.statusCode};}
  finally {
    for (const id of intended) {
      try {
        const document = await owner.getDocument(id);
        if (!document) continue;
        // A failed create must never authorize deletion of a pre-existing doc.
        if (document.web01CheckRun !== runId) continue;
        await owner.transaction()
          .patch(id, patch => patch.ifRevisionId(document._rev).set({web01CheckRun:runId}))
          .delete(id).commit({visibility:'sync'});
        assert.ok(!await owner.getDocument(id), 'Synthetic draft cleanup did not finish.');
      } catch {cleanupPending.push(id);}
    }
    if (directory) {
      try {await rm(directory, {recursive:true, force:true});}
      catch {failure ||= {check:'temporary-backup-cleanup'};}
    }
  }
  const result = {state:failure || cleanupPending.length ? 'failed' : 'passed',
    checks, ...(failure ? {failure} : {}), cleanupPending};
  report(result);
  return result;
}
