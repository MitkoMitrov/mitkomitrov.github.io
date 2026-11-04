// Local fixture round trip only. Cloud dataset export requires owner authentication.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const article = JSON.parse(await readFile(new URL('../fixtures/article.json',import.meta.url),'utf8'));
await mkdir(new URL('../artifacts/',import.meta.url),{recursive:true});
await writeFile(new URL('../artifacts/sample.ndjson',import.meta.url),JSON.stringify(article)+'\n');
const restored = JSON.parse(await readFile(new URL('../artifacts/sample.ndjson',import.meta.url),'utf8'));
assert.deepEqual(restored,article);
await writeFile(new URL('../artifacts/restored.json',import.meta.url),JSON.stringify(restored,null,2)+'\n');
console.log('PASS: fixture NDJSON export/restore preserves all fields and body. No cloud restore attempted.');
