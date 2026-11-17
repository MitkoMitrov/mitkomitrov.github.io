import {readSnapshot, assertSnapshotCurrent} from '../lib/published-snapshot.mjs';
try {
  const snapshot = await readSnapshot('artifacts/published-snapshot.json');
  await assertSnapshotCurrent(snapshot);
  console.log(`PASS: published snapshot is still current (${snapshot.digest}).`);
} catch {
  console.error('Snapshot is missing, modified or superseded. Deployment must stop.');
  process.exitCode = 1;
}
