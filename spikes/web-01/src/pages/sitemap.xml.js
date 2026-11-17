import {loadArticles} from '../../lib/content.mjs';
export const prerender = true;
export async function GET({site}) {
  const articles = await loadArticles();
  const base = new URL(import.meta.env.BASE_URL, site || 'https://example.invalid');
  const urls = [base.href, ...articles.map(article => new URL(`articles/${article.slug.current}/`, base).href)];
  return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    +urls.map(url => `<url><loc>${url}</loc></url>`).join('')+'</urlset>', {headers:{'Content-Type':'application/xml'}});
}
