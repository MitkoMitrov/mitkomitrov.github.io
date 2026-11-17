import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {readArticles, readPublishedArticles} from '../scripts/article-metadata.mjs';
import {publishedEntries, articleSchema} from '../src/lib/article-model.mjs';
import {articleMarkup} from '../src/lib/remark-article.mjs';
import {filesUnder} from '../scripts/prepare-public.mjs';

const entries = await readPublishedArticles();
test('published article routes contain the complete body and valid article metadata without client fetching', async () => {
  assert.equal(entries.length, 2);
  for (const {data, body} of entries) {
    const html = await readFile(`dist/articles/${data.slug}/index.html`, 'utf8');
    const document = new JSDOM(html).window.document;
    assert.equal(document.querySelector('h1').textContent, data.title);
    assert.equal(document.querySelectorAll('h1').length, 1);
    assert.equal(document.querySelector('link[rel="canonical"]').getAttribute('href'), `https://mitko.mk/articles/${data.slug}/`);
    assert.equal(document.querySelector('meta[property="og:type"]').content, 'article');
    const article = [...document.querySelectorAll('script[type="application/ld+json"]')].map(node => JSON.parse(node.textContent)).find(data => data['@type'] === 'Article');
    assert.equal(article.headline, data.title);
    assert.equal(article.author.name, 'Mitko Mitrov');
    assert.equal(article.datePublished, data.published);
    const renderer = await createMarkdownProcessor({rehypePlugins:[articleMarkup], shikiConfig:{theme:'github-light'}});
    const rendered = new JSDOM((await renderer.render(body)).code).window.document.body;
    const normalize = text => text.replace(/\s+/g, ' ').trim();
    assert.equal(normalize(document.querySelector('[data-article-body]').textContent), normalize(rendered.textContent));
    assert.ok(document.querySelector('[data-article-body] p').textContent.length > 60);
    assert.equal(document.querySelector('[data-article-tools]').textContent.includes('fetch('), false);
    for (const link of document.querySelectorAll('a[href^="#"]')) assert.ok(document.getElementById(link.getAttribute('href').slice(1)));
  }
});

test('published Redis example has scrollable tables, escaped code, code language and copy controls in HTML', async () => {
  const html = await readFile('dist/articles/redis-cache-aside-ttl-eviction/index.html', 'utf8');
  const document = new JSDOM(html).window.document;
  assert.ok(document.querySelectorAll('.article-table table').length >= 2);
  assert.equal(document.querySelector('.article-table').getAttribute('tabindex'), '0');
  assert.equal(document.querySelector('.code-block figcaption span').textContent, 'text');
  assert.equal(document.querySelector('.code-block button').textContent, 'Copy code');
  assert.match(document.querySelector('pre code').textContent, /UPDATE and COMMIT row in DB/);
  const css = await readFile('src/styles/global.css', 'utf8');
  assert.match(css, /\.article-table\s*\{[^}]*overflow-x: auto/);
  assert.match(css, /\.code-block pre\s*\{[^}]*overflow-x: auto/);
});

test('synthetic draft exercises every supported formatting feature but never enters deployed output', async () => {
  const draft = (await readArticles()).find(entry => entry.data.status === 'draft');
  const renderer = await createMarkdownProcessor({rehypePlugins:[articleMarkup], shikiConfig:{theme:'github-light'}});
  const document = new JSDOM((await renderer.render(draft.body)).code).window.document;
  for (const selector of ['h2', 'h3', 'strong', 'em', 'a', 'ul li', 'ol li', '.text-small', '.text-large', '.article-table table', 'pre code span']) assert.ok(document.querySelector(selector), selector);
  assert.equal(document.querySelector('.code-block figcaption span').textContent, 'csharp');
  assert.match(document.querySelector('pre code').textContent, /<cache> & ready/);
  assert.equal(document.querySelectorAll('cache, script').length, 0);
  const files = await filesUnder('dist');
  assert.equal(files.some(path => path.includes('formatting-draft')), false);
  for (const file of files) {
    if (!/\.(html|xml|txt|css|js|json)$/.test(file)) continue;
    assert.ok(!(await readFile(`dist/${file}`, 'utf8')).includes('WEB04_SYNTHETIC_DRAFT_CANARY'), file);
  }
});

test('article identities and slugs are unique, metadata is validated and drafts/future posts stay unpublished', () => {
  const base = entries[0];
  assert.throws(() => publishedEntries([base, {...base, data:{...base.data, articleId:'different'}}]), /Duplicate/);
  assert.throws(() => publishedEntries([base, {...base, data:{...base.data, slug:'different'}}]), /Duplicate/);
  assert.equal(publishedEntries([{...base, data:{...base.data, status:'draft'}}]).length, 0);
  assert.equal(publishedEntries([{...base, data:{...base.data, published:'2099-01-01'}}]).length, 0);
  assert.equal(articleSchema.safeParse({...base.data, slug:'../../private'}).success, false);
  assert.equal(articleSchema.safeParse({...base.data, published:'not-a-date'}).success, false);
  assert.throws(() => publishedEntries([{...base, body:''}]), /body is empty/);
});

test('sitemap includes public articles only and robots points at the correct domain', async () => {
  const xml = await readFile('dist/sitemap.xml', 'utf8');
  const document = new JSDOM(xml, {contentType:'text/xml'}).window.document;
  const urls = [...document.querySelectorAll('loc')].map(node => node.textContent);
  assert.deepEqual(urls.sort(), ['https://mitko.mk/', 'https://mitko.mk/articles/', ...entries.map(({data}) => `https://mitko.mk/articles/${data.slug}/`)].sort());
  assert.doesNotMatch(xml, /draft|linkedin|sanity|preview/);
  assert.match(await readFile('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/mitko.mk\/sitemap.xml/);
});
