import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {filesUnder, publicSources} from './prepare-public.mjs';

export async function verifyBuild(root = fileURLToPath(new URL('../', import.meta.url))) {
  const output = join(root, 'dist');
  const html = await readFile(join(output, 'index.html'), 'utf8');
  assert.match(html, /<html lang="en">/);
  assert.match(html, /rel="canonical" href="https:\/\/mitko\.mk\/"/);
  for (const id of ['home', 'articles', 'about', 'experience', 'skills', 'work', 'contact']) {
    assert.ok(html.includes(`id="${id}"`), `Missing important anchor: ${id}`);
  }
  // The build artifact contains the explicit public allowlist, not the repository.
  const expected = ['index.html'];
  for (const source of publicSources) {
    for (const path of await filesUnder(join(root, source), source)) {
      expected.push(path);
      assert.deepEqual(await readFile(join(output, path)), await readFile(join(root, path)), `Changed public asset: ${path}`);
    }
  }
  // WEB-02 adds a build-generated stylesheet; executable chunks and new routes
  // require their own reviewed contract rather than allowing arbitrary output.
  const actual = await filesUnder(output);
  const styles = actual.filter(path => /^_astro\/[A-Za-z0-9_.-]+\.css$/.test(path));
  assert.ok(styles.length > 0, 'Missing generated homepage styles');
  expected.push(...styles);
  assert.deepEqual(actual.sort(), expected.sort(), 'Unexpected/missing published files; review the public allowlist before adding routes.');
  return expected.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await verifyBuild();
  console.log(`Verified ${count} static files; URLs/domain/assets preserved and source-only files excluded.`);
}
