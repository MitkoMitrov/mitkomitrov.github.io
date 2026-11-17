import {loadArticles} from '../../lib/content.mjs';
export const prerender = true;
export async function GET() {
  const articles = await loadArticles();
  return new Response(JSON.stringify({snapshot:process.env.WEB01_SNAPSHOT_DIGEST || null,articles:articles.map(a=>({id:a._id,rev:a._rev,slug:a.slug.current}))}),{headers:{'Content-Type':'application/json'}});
}
