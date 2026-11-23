import {getPublishedArticles} from '../lib/articles';
import {caseStudies} from '../data/case-studies.mjs';
export async function GET() {
  const entries = await getPublishedArticles();
  const paths = ['/', '/articles/', '/about/', '/work/', ...caseStudies.map(project => `/work/${project.slug}/`), ...entries.map(({data}) => `/articles/${data.slug}/`)];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(path => `<url><loc>https://mitko.mk${path}</loc></url>`).join('')}</urlset>`;
  return new Response(xml, {headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
