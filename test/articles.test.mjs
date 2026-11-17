import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {JSDOM} from 'jsdom';
import {articles} from '../src/data/articles.mjs';
import {readArticles} from '../scripts/article-metadata.mjs';
import {mergeCatalogue} from '../src/lib/article-model.mjs';

const document = new JSDOM(await readFile('dist/articles/index.html', 'utf8'), {url: 'https://mitko.mk/articles/'}).window.document;
const expected = mergeCatalogue(await readArticles(), articles);

test('article catalogue renders every published entry as a thumbnail card, newest first', () => {
  assert.equal(document.querySelector('h1').textContent, 'Articles');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://mitko.mk/articles/');
  const cards = [...document.querySelectorAll('.article-card')];
  assert.equal(cards.length, expected.length);
  for (const [index, card] of cards.entries()) {
    assert.equal(card.querySelector('h2').textContent, expected[index].title);
    assert.equal(card.querySelector('a').getAttribute('href'), expected[index].href);
    assert.equal(card.querySelector('time').dateTime, expected[index].date);
    if (expected[index].thumbnail) {
      assert.equal(card.querySelector('img').getAttribute('src'), expected[index].thumbnail);
      assert.equal(card.querySelector('img').getAttribute('alt'), '', 'The adjacent title labels the decorative cover');
    } else assert.ok(card.querySelector('.article-card-placeholder'));
    assert.ok(card.textContent.includes(expected[index].source === 'website' ? 'Read article' : 'Read on LinkedIn'));
    assert.ok(card.textContent.includes('Redis'));
  }
  assert.equal(document.querySelectorAll('script:not([type="application/ld+json"]):not([data-analytics-bootstrap]), astro-island, iframe').length, 0);
});

test('catalogue images, navigation and cross-page anchors resolve in the static build', async () => {
  for (const element of document.querySelectorAll('a[href], img[src], link[href]')) {
    const raw = element.getAttribute(element.hasAttribute('src') ? 'src' : 'href');
    const url = new URL(raw, 'https://mitko.mk/articles/');
    if (url.origin !== 'https://mitko.mk') continue;
    const pathname = url.pathname.endsWith('/') ? url.pathname + 'index.html' : url.pathname;
    const file = resolve('dist', '.' + decodeURIComponent(pathname));
    assert.ok(file.startsWith(resolve('dist') + sep));
    await access(file);
    if (url.hash) {
      const destination = new JSDOM(await readFile(file, 'utf8')).window.document;
      assert.ok(destination.getElementById(decodeURIComponent(url.hash.slice(1))), `Missing cross-page target: ${raw}`);
    }
  }
});
