import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {cmsDigest, fetchCmsDocuments} from '../src/lib/cms-content.mjs';

export function assertPublicationCurrent(expected, documents, sourceSha) {
  assert.equal(expected.version, 1);
  assert.match(expected.sourceSha || '', /^[a-f0-9]{40}$/);
  assert.equal(expected.sourceSha, sourceSha, 'Source changed after build; rebuild the current main branch.');
  assert.equal(expected.snapshot, cmsDigest(documents), 'Published content changed after build; rebuild before deploying.');
  assert.deepEqual(expected.articles.map(a => [a.id,a.rev,a.articleId,a.slug]).sort(), documents.map(d => [d._id,d._rev,d.articleId,d.slug.current]).sort());
}
export async function verifyPublication(expected, {live = false} = {}) {
  const headers = process.env.GITHUB_TOKEN ? {Authorization:`Bearer ${process.env.GITHUB_TOKEN}`} : {};
  const source = await fetch('https://api.github.com/repos/MitkoMitrov/mitkomitrov.github.io/git/ref/heads/master', {headers, signal:AbortSignal.timeout(20000)});
  assert.ok(source.ok, 'Cannot confirm the current source commit.');
  assertPublicationCurrent(expected, await fetchCmsDocuments(), (await source.json()).object.sha);
  if (live) {
    let confirmed = false;
    for (let attempt = 0; attempt < 10; attempt++) {
      try {
        const response = await fetch(`https://mitko.mk/publication.json?snapshot=${expected.snapshot}&source=${expected.sourceSha}`, {cache:'no-store',signal:AbortSignal.timeout(10000)});
        if (response.ok) {
          const actual = await response.json();
          assert.deepEqual(actual, expected);
          confirmed = true; break;
        }
      } catch { /* A timeout is an unconfirmed outcome, not proof of rollback. */ }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    assert.ok(confirmed, 'The live manifest did not confirm this artifact. Inspect the live site before retrying.');
  }
  console.log(live ? 'PASS: live site confirms this source and publication snapshot.' : 'PASS: artifact matches current source and published content.');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {await verifyPublication(JSON.parse(process.env.EXPECTED_PUBLICATION || 'null'), {live:process.env.VERIFY_LIVE === '1'});}
  catch (error) {console.error(error.message);process.exitCode=1;}
}
