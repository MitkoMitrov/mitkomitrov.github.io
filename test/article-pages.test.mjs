import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {JSDOM} from 'jsdom';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {readArticles, readPublishedArticles} from '../scripts/article-metadata.mjs';
import {publishedEntries, articleSchema} from '../src/lib/article-model.mjs';
import {articleMarkup} from '../src/lib/remark-article.mjs';
import {filesUnder} from '../scripts/prepare-public.mjs';
import {caseStudies} from '../src/data/case-studies.mjs';

const entries = await readPublishedArticles();
test('migrated LinkedIn articles preserve all original text and locally playable media', async () => {
  const sources = JSON.parse(await readFile('docs/architecture/REDIS-MIGRATION-SOURCES.json', 'utf8'));
  assert.equal(sources.length, 3);
  for (const source of sources) {
    const entry = entries.find(entry => entry.data.articleId === source.articleId);
    assert.equal(entry.data.originalUrl, source.originalUrl);
    assert.equal(entry.data.published, source.published);
    const html = await readFile(`dist/articles/${source.slug}/index.html`, 'utf8');
    const document = new JSDOM(html).window.document;
    const body = document.querySelector('[data-article-body]');
    const videos = [...body.querySelectorAll('video')];
    assert.equal(videos.length, source.videos);
    for (const video of videos) {
      assert.ok(video.hasAttribute('controls'));
      assert.equal(video.hasAttribute('autoplay'), false);
      assert.equal(video.getAttribute('preload'), 'none');
      assert.ok(video.getAttribute('aria-label'));
      const path = video.querySelector('source').getAttribute('src');
      assert.match(path, /^\/assets\/video\/articles\/[a-z-]+\.mp4$/);
      const bytes = await readFile(`dist${path}`);
      assert.ok(bytes.subarray(0, 64).includes(Buffer.from('ftyp')));
      assert.ok((await readFile(`dist${video.getAttribute('poster')}`)).length);
      assert.equal(video.querySelector('a').getAttribute('href'), path);
    }
    body.querySelectorAll('.article-media').forEach(node => node.remove());
    // The existing typography processor curls apostrophes; words and all other punctuation must match.
    const text = body.textContent.replace(/\s+/g, ' ').trim().replace(/’/g, "'");
    assert.equal(createHash('sha256').update(text).digest('hex'), source.normalizedTextSha256, `Original text changed in ${source.articleId}`);
    assert.equal(text.split(/\s+/).length, source.sourceTextWords);
    assert.equal(body.querySelectorAll('iframe,script').length, 0);
    assert.doesNotMatch(body.innerHTML, /media\.licdn\.com|dms\.licdn\.com|Recommended by LinkedIn/);
  }
});
test('published article routes contain the complete body and valid article metadata without client fetching', async () => {
  assert.ok(entries.length >= 5, 'Keep all five original Redis articles alongside CMS publications');
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
    assert.ok(document.querySelector('[data-article-body]').textContent.trim().length > 0);
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
  assert.deepEqual(urls.sort(), ['https://mitko.mk/', 'https://mitko.mk/articles/', 'https://mitko.mk/about/', 'https://mitko.mk/work/', ...caseStudies.map(project => `https://mitko.mk/work/${project.slug}/`), ...entries.map(({data}) => `https://mitko.mk/articles/${data.slug}/`)].sort());
  for (const draft of (await readArticles()).filter(entry => entry.data.status !== 'published')) assert.ok(!urls.includes(`https://mitko.mk/articles/${draft.data.slug}/`));
  assert.ok(urls.every(url => url.startsWith('https://mitko.mk/')));
  assert.match(await readFile('dist/robots.txt', 'utf8'), /Sitemap: https:\/\/mitko.mk\/sitemap.xml/);
});
