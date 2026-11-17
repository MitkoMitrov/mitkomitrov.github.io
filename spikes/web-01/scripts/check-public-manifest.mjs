import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const records = items => [...items].sort((a,b) => a.id.localeCompare(b.id));
export function sandboxLiveUrl(value) {
  const base = new URL(value);
  assert.ok(['https://mitko.mk', 'https://mitkomitrov.github.io'].includes(base.origin));
  assert.equal(base.pathname, '/mitko-web01-publishing-test/');
  assert.ok(!base.username && !base.password && !base.search && !base.hash);
  return base;
}
export function assertManifestMatches(manifest, documents) {
  assert.match(manifest.snapshot, /^[a-f0-9]{64}$/);
  assert.ok(Array.isArray(manifest.articles));
  const current = documents.filter(document => !document._id.includes('.')).map(document => ({
    id:document._id, rev:document._rev, slug:document.slug?.current,
  }));
  assert.deepEqual(records(manifest.articles), records(current), 'Published revisions changed; deployment must stop.');
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const manifest = JSON.parse(await readFile(process.argv[2], 'utf8'));
    const query = '*[_type == "article"]{_id,_rev,slug}';
    const url = `https://o3i9jgij.api.sanity.io/v2025-02-19/data/query/web01?perspective=published&query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {signal:AbortSignal.timeout(20000)});
    assert.ok(response.ok);
    assertManifestMatches(manifest, (await response.json()).result);
    console.log('PASS: artifact manifest matches current published revisions.');
    if (process.env.WEB01_LIVE_URL) {
      const base = sandboxLiveUrl(process.env.WEB01_LIVE_URL);
      let matched = false;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const liveUrl = new URL('publication.json', base);
          liveUrl.searchParams.set('snapshot', manifest.snapshot);
          const live = await fetch(liveUrl, {signal:AbortSignal.timeout(10000)});
          if (live.ok) {
            const value = await live.json();
            assert.equal(value.snapshot, manifest.snapshot);
            assert.deepEqual(records(value.articles), records(manifest.articles));
            matched = true;
            break;
          }
        } catch { /* Retry eventual Pages/CDN propagation without logging content. */ }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      assert.ok(matched, 'Live manifest did not confirm this artifact.');
      console.log('PASS: live sandbox manifest confirms this snapshot.');
    }
  } catch {
    console.error('Publication verification failed. This artifact must not be reported as current/live.');
    process.exitCode = 1;
  }
}
