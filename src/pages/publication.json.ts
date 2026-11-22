import {readCmsSnapshot} from '../../scripts/prepare-cms.mjs';
export async function GET() {
  const snapshot = await readCmsSnapshot();
  return new Response(JSON.stringify({version:1, snapshot:snapshot.digest, sourceSha:process.env.DEPLOY_SOURCE_SHA || process.env.CF_PAGES_COMMIT_SHA || null,
    articles:snapshot.entries.map(entry => ({id:entry.documentId, rev:entry.revision, articleId:entry.data.articleId, slug:entry.data.slug})),
  }), {headers:{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','X-Robots-Tag':'noindex'}});
}
