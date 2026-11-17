import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {capturePublishedSnapshot, writeSnapshot, assertSnapshotCurrent} from '../lib/published-snapshot.mjs';

try {
  const request = process.env.WEB01_EVENT_JSON ? JSON.parse(process.env.WEB01_EVENT_JSON) : null;
  const snapshot = await capturePublishedSnapshot({request});
  const path = resolve('artifacts/published-snapshot.json');
  await writeSnapshot(path, snapshot);
  execFileSync(process.execPath, [fileURLToPath(new URL('../node_modules/astro/bin/astro.mjs', import.meta.url)), 'build'], {
    stdio:'inherit', env:{...process.env, WEB01_CONTENT_SOURCE:'snapshot', WEB01_SNAPSHOT_FILE:path,
      WEB01_SNAPSHOT_DIGEST:snapshot.digest, WEB01_EXPECTED_ID:'', WEB01_EXPECTED_REV:''},
  });
  await assertSnapshotCurrent(snapshot);
  console.log(`PASS: published build uses one snapshot (${snapshot.articles.length} articles; ${snapshot.digest}).`);
  console.log('Built locally only. No GitHub Pages deployment was performed.');
} catch {
  console.error('Published build failed or its snapshot was superseded. Do not deploy this output; retry the latest publication.');
  process.exitCode = 1;
}
