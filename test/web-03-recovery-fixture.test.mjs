import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Evidence-only fixture. This draft PR will be closed without merging.
test('WEB-03 recovered build generates a publication manifest', async () => {
  const manifest = JSON.parse(await readFile('dist/publication.json', 'utf8'));
  assert.match(manifest.sourceSha, /^[a-f0-9]{40}$/);
  assert.ok(Array.isArray(manifest.articles));
});
