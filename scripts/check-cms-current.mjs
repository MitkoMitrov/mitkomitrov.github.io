import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {cmsDigest, fetchCmsDocuments} from '../src/lib/cms-content.mjs';
import {readCmsSnapshot} from './prepare-cms.mjs';

export async function checkCmsCurrent() {
  const snapshot = await readCmsSnapshot();
  assert.equal(cmsDigest(await fetchCmsDocuments()), snapshot.digest, 'Published CMS content changed during build. Rebuild before deployment.');
  console.log('PASS: built CMS snapshot still matches published content.');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await checkCmsCurrent();
