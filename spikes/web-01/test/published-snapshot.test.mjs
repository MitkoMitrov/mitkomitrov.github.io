import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import fixture from '../fixtures/article.json' with {type:'json'};
import {capturePublishedSnapshot, readSnapshot, writeSnapshot, snapshotDigest,
  parsePublicationRequest, assertSnapshotCurrent} from '../lib/published-snapshot.mjs';
import {assertManifestMatches, sandboxLiveUrl} from '../scripts/check-public-manifest.mjs';
import {loadArticles} from '../lib/content.mjs';

test('sandbox URL accepts the inherited HTTPS domain while refusing the portfolio root and arbitrary destinations', () => {
  for (const origin of ['https://mitko.mk', 'https://mitkomitrov.github.io']) {
    assert.equal(sandboxLiveUrl(origin+'/mitko-web01-publishing-test/').origin, origin);
  }
  for (const value of ['http://mitko.mk/mitko-web01-publishing-test/', 'https://mitko.mk/',
    'https://example.com/mitko-web01-publishing-test/', 'https://mitko.mk/other/',
    'https://user:password@mitko.mk/mitko-web01-publishing-test/',
    'https://mitko.mk/mitko-web01-publishing-test/?unexpected=1']) {
    assert.throws(() => sandboxLiveUrl(value));
  }
});

test('legacy direct cloud mode is refused so routes cannot make separate cloud reads', async () => {
  const previous = process.env.WEB01_CONTENT_SOURCE;
  try {
    process.env.WEB01_CONTENT_SOURCE = 'sanity';
    await assert.rejects(loadArticles(), /Direct per-route cloud reads are disabled/);
  } finally {
    if (previous === undefined) delete process.env.WEB01_CONTENT_SOURCE;
    else process.env.WEB01_CONTENT_SOURCE = previous;
  }
});

test('deployment guard matches all published IDs/revisions and rejects edits, missing output and invalid manifests', () => {
  const manifest = {snapshot:'a'.repeat(64), articles:[{id:fixture._id,rev:fixture._rev,slug:fixture.slug.current}]};
  assertManifestMatches(manifest, [fixture]);
  assertManifestMatches(manifest, [fixture,{...fixture,_id:'drafts.private'}]);
  assert.throws(() => assertManifestMatches(manifest, [{...fixture,_rev:'newer'}]));
  assert.throws(() => assertManifestMatches(manifest, []));
  assert.throws(() => assertManifestMatches({...manifest,snapshot:'invalid'}, [fixture]));
});

test('capture fetches once; digest is stable across query/object order and saved snapshot validates', async () => {
  let reads = 0;
  const second = {...fixture, _id:'another-article', slug:{current:'another-article'}};
  const snapshot = await capturePublishedSnapshot({fetch:async () => {reads++; return [fixture,second];}});
  assert.equal(reads, 1);
  assert.equal(snapshot.digest, snapshotDigest([second,{...fixture, title:fixture.title}]));
  const directory = await mkdtemp(join(tmpdir(), 'web01-snapshot-'));
  try {
    const path = join(directory, 'snapshot.json');
    await writeSnapshot(path, snapshot);
    assert.deepEqual(await readSnapshot(path), snapshot);
    const modified = structuredClone(snapshot);
    modified.articles[0].summary = 'Unexpected modification';
    await writeFile(path, JSON.stringify(modified));
    await assert.rejects(readSnapshot(path), /modified/);
  } finally {await rm(directory, {recursive:true, force:true});}
});

test('invalid requests, draft injection and duplicate slugs fail before an artifact is accepted', async () => {
  for (const request of [
    {id:'drafts.private',rev:'r1',operation:'publish'},
    {id:12,rev:'r1',operation:'publish'},
    {id:'article',rev:'$(echo bad)',operation:'publish'},
    {id:'article',rev:'r1',operation:'publish',ref:'untrusted'},
    [], 'untrusted',
  ]) assert.throws(() => parsePublicationRequest(request), /Invalid/);
  await assert.rejects(capturePublishedSnapshot({fetch:async () => [{...fixture,_id:'drafts.private'}]}), /published articles only/);
  await assert.rejects(capturePublishedSnapshot({fetch:async () => [fixture,{...fixture,_id:'duplicate'}]}), /Duplicate/);
});

test('obsolete publish/unpublish requests are rejected; fresh delete request builds absence', async () => {
  const request = {id:fixture._id, rev:fixture._rev, operation:'publish'};
  await assert.rejects(capturePublishedSnapshot({request, fetch:async () => [{...fixture,_rev:'newer'}]}), /Superseded/);
  const unpublish = {...request, operation:'unpublish'};
  await assert.rejects(capturePublishedSnapshot({request:unpublish, fetch:async () => [fixture]}), /superseded/);
  const absent = await capturePublishedSnapshot({request:unpublish, fetch:async () => []});
  assert.deepEqual(absent.articles, []);
});

test('final check rejects unrelated changes, same-ID edits and deletion after snapshot capture', async () => {
  const snapshot = await capturePublishedSnapshot({fetch:async () => [fixture]});
  assert.equal(await assertSnapshotCurrent(snapshot, async () => [fixture]), snapshot.digest);
  for (const changed of [[], [{...fixture,_rev:'newer'}], [fixture,{...fixture,_id:'other',slug:{current:'other'}}]]) {
    await assert.rejects(assertSnapshotCurrent(snapshot, async () => changed), /changed after capture/);
  }
});

test('actual snapshot builds share one listing/article/manifest and unpublish removes route and listing', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'web01-snapshot-build-'));
  const path = join(directory, 'snapshot.json');
  const output = join(directory, 'dist');
  const build = digest => execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs','build','--outDir',output], {
    stdio:'pipe', env:{...process.env, WEB01_CONTENT_SOURCE:'snapshot', WEB01_SNAPSHOT_FILE:path,
      WEB01_SNAPSHOT_DIGEST:digest, WEB01_BASE_PATH:'/mitko-web01-publishing-test/', WEB01_EXPECTED_ID:'', WEB01_EXPECTED_REV:''},
  });
  try {
    const snapshot = await capturePublishedSnapshot({fetch:async () => [fixture]});
    await writeSnapshot(path, snapshot);
    build(snapshot.digest);
    const index = await readFile(join(output,'index.html'),'utf8');
    assert.match(index, /href="\/mitko-web01-publishing-test\/articles\/a-bounded-cache\/"/);
    const manifest = JSON.parse(await readFile(join(output,'publication.json'),'utf8'));
    assert.equal(manifest.snapshot, snapshot.digest);
    assert.deepEqual(manifest.articles, [{id:fixture._id,rev:fixture._rev,slug:fixture.slug.current}]);
    const article = await readFile(join(output,'articles',fixture.slug.current,'index.html'),'utf8');
    assert.match(article, /data-revision="sample-revision-1"/);
    assert.match(article, /<table>/);
    assert.match(await readFile(join(output,'sitemap.xml'),'utf8'), /mitko-web01-publishing-test\/articles\/a-bounded-cache\//);
    assert.match(await readFile(join(output,'sitemap.xml'),'utf8'), /https:\/\/mitko.mk\/mitko-web01-publishing-test\//);
    const empty = await capturePublishedSnapshot({fetch:async () => []});
    await writeSnapshot(path, empty);
    build(empty.digest);
    assert.doesNotMatch(await readFile(join(output,'index.html'),'utf8'), /a-bounded-cache/);
    await assert.rejects(readFile(join(output,'articles',fixture.slug.current,'index.html')), {code:'ENOENT'});
    assert.deepEqual(JSON.parse(await readFile(join(output,'publication.json'),'utf8')).articles, []);
    assert.doesNotMatch(await readFile(join(output,'sitemap.xml'),'utf8'), /a-bounded-cache/);
  } finally {await rm(directory, {recursive:true, force:true});}
});
