import fixture from '../fixtures/article.json' with {type:'json'};
import {readFile} from 'node:fs/promises';
import {publishedArticles,assertRevision} from './publication.mjs';
import {readSnapshot} from './published-snapshot.mjs';
// Explicit opt-in. Fixture build is offline. File source is only for synthetic local tests.
export async function loadArticles() {
  let docs;
  if (process.env.WEB01_CONTENT_SOURCE === 'snapshot') {
    if (!process.env.WEB01_SNAPSHOT_FILE) throw new Error('A captured published snapshot is required.');
    docs = (await readSnapshot(process.env.WEB01_SNAPSHOT_FILE)).articles;
  } else if (process.env.WEB01_CONTENT_SOURCE === 'sanity') {
    throw new Error('Direct per-route cloud reads are disabled. Use npm run build:published to capture one snapshot.');
  } else if (process.env.WEB01_CONTENT_SOURCE === 'test-file') {
    docs = publishedArticles(JSON.parse(await readFile(process.env.WEB01_TEST_FILE,'utf8')));
  } else {
    docs = publishedArticles([fixture]);
  }
  if (process.env.WEB01_EXPECTED_ID || process.env.WEB01_EXPECTED_REV) {
    assertRevision(docs,{id:process.env.WEB01_EXPECTED_ID,rev:process.env.WEB01_EXPECTED_REV});
  }
  return docs;
}
