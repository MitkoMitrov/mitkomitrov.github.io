import fixture from '../fixtures/article.json' with {type:'json'};
import {readFile} from 'node:fs/promises';
import {publishedArticles,fetchPublished,assertRevision} from './publication.mjs';
// Explicit opt-in. Fixture build is offline. File source is only for synthetic local tests.
export async function loadArticles() {
  let docs;
  if (process.env.WEB01_CONTENT_SOURCE === 'sanity') {
    if (!process.env.WEB01_PROJECT_ID || process.env.WEB01_DATASET !== 'web01') throw new Error('Use an isolated web01 dataset');
    docs = await fetchPublished(process.env.WEB01_PROJECT_ID, process.env.WEB01_DATASET);
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
