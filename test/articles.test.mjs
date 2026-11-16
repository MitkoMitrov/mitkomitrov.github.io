import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {JSDOM} from 'jsdom';
import {articles} from '../src/data/articles.mjs';

const document = new JSDOM(await readFile('dist/articles/index.html', 'utf8'), {url: 'https://mitko.mk/articles/'}).window.document;

test('article catalogue renders every published entry as a thumbnail card, newest first', () => {
  assert.equal(document.querySelector('h1').textContent, 'Articles');
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://mitko.mk/articles/');
  const cards = [...document.querySelectorAll('.article-card')];
  const expected = [...articles].sort((a, b) => b.date.localeCompare(a.date));
  assert.equal(cards.length, expected.length);
  for (const [index, card] of cards.entries()) {
    assert.equal(card.querySelector('h2').textContent, expected[index].title);
    assert.equal(card.querySelector('a').getAttribute('href'), expected[index].href);
    assert.equal(card.querySelector('time').dateTime, expected[index].date);
    assert.equal(card.querySelector('img').getAttribute('src'), expected[index].thumbnail);
    assert.equal(card.querySelector('img').getAttribute('alt'), '', 'The adjacent title labels the decorative cover');
    assert.match(card.textContent, /Read on LinkedIn/);
  }
  assert.equal(document.querySelectorAll('script:not([type="application/ld+json"]), astro-island, iframe').length, 0);
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
