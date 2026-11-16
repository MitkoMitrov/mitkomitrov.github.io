import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {resolve, sep} from 'node:path';
import {JSDOM} from 'jsdom';
import {articles} from '../src/data/portfolio.mjs';

const html = await readFile('dist/index.html', 'utf8');
const document = new JSDOM(html, {url: 'https://mitko.mk/'}).window.document;

test('homepage renders the agreed hierarchy and shared navigation without JavaScript', () => {
  assert.deepEqual([...document.querySelectorAll('main > section')].map(section => section.id), ['home', 'articles', 'experience', 'work', 'contact']);
  assert.deepEqual([...document.querySelectorAll('nav[aria-label="Primary navigation"] a')].map(link => link.textContent), ['Articles', 'Experience', 'Projects']);
  assert.equal(document.querySelector('h1').textContent, 'Mitko Mitrov');
  assert.ok(document.querySelector('#home').textContent.trim().split(/\s+/).length <= 40, 'Keep the introduction scannable');
  assert.equal(document.querySelectorAll('a[href="/CV/CV.html"]').length, 0, 'No CV action in the minimal homepage');
  assert.equal(document.querySelectorAll('.timeline > li').length, 3);
  assert.deepEqual([...document.querySelectorAll('.timeline h3')].map(item => item.textContent), ['Meta5Team', 'Freelance', 'SPD Computing']);
  assert.deepEqual([...document.querySelectorAll('.timeline-period time')].map(time => time.dateTime), ['2022-03', '2021-09', '2019-10', '2021-05']);
  assert.match(document.querySelector('.timeline').textContent, /50\+ kiosks/);
  assert.equal(document.querySelector('meta[name="color-scheme"]').content, 'light');
  assert.equal(document.querySelectorAll('main').length, 1);
  assert.equal(document.querySelectorAll('h1').length, 1);
  assert.ok(document.title.includes('Mitko Mitrov'));
  assert.equal(document.querySelector('link[rel="canonical"]').href, 'https://mitko.mk/');
  assert.equal(document.querySelectorAll('script:not([type="application/ld+json"])').length, 0);
  assert.equal(document.querySelectorAll('astro-island').length, 0);
  const person = JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent);
  assert.equal(person.name, 'Mitko Mitrov');
  assert.equal(document.querySelectorAll('form, iframe, canvas').length, 0);
});

test('selected work uses CV-backed facts and distinguishes production, past and development', () => {
  const work = [...document.querySelectorAll('.project-list > li')];
  assert.equal(work.length, 3);
  assert.match(work[0].textContent, /Imenologija.*In development/s);
  assert.match(work[1].textContent, /Past project.*about 1,000 daily users during operation/s);
  assert.match(work[2].textContent, /AI Daily Stock Reports.*Past project.*about 30%/s);
  for (const item of work) {
    assert.ok(item.querySelector('h3'));
    assert.ok(item.querySelector('.project-summary').textContent.length > 50);
  }
  assert.equal(document.querySelectorAll('a[href*="whowinselections.com"], a[href*="imenologija.mk"]').length, 0, 'Do not advertise unverified products as live');
  assert.doesNotMatch(document.querySelector('main').textContent, /coming soon|lorem ipsum|guarantee zero|15% returning/i);
});

test('homepage links three real LinkedIn Redis articles in descending publication order', () => {
  const links = [...document.querySelectorAll('#articles .article-link')];
  assert.equal(links.length, 3);
  assert.deepEqual(links.map(link => link.href), articles.map(article => article.href));
  for (const link of links) assert.equal(new URL(link.href).hostname, 'www.linkedin.com');
  const dates = [...document.querySelectorAll('#articles time')].map(time => time.dateTime);
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.match(document.querySelector('#articles').textContent, /published on LinkedIn/i);
  assert.equal(document.querySelectorAll('a[href^="/articles/"]').length, 0, 'WEB-04 routes are not implemented here');
});

test('every first-party URL, stylesheet and preserved bookmark resolves in the static artifact', async () => {
  const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
  assert.equal(new Set(ids).size, ids.length, 'Duplicate IDs break navigation');
  for (const id of ['about', 'experience', 'skills', 'work', 'contact']) assert.ok(document.getElementById(id));
  for (const element of document.querySelectorAll('a[href], img[src], link[href]')) {
    const attribute = element.hasAttribute('src') ? 'src' : 'href';
    const raw = element.getAttribute(attribute);
    assert.ok(raw && raw !== '#', `Empty link on ${element.outerHTML}`);
    const url = new URL(raw, 'https://mitko.mk/');
    if (url.origin !== 'https://mitko.mk') continue;
    if (url.hash) assert.ok(document.getElementById(decodeURIComponent(url.hash.slice(1))), `Missing target ${url.hash}`);
    const file = resolve('dist', '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    assert.ok(file.startsWith(resolve('dist') + sep));
    await access(file);
  }
});

test('keyboard and semantic access have a skip target, section labels and working contact links', async () => {
  assert.equal(document.querySelector('body > a.skip-link').getAttribute('href'), '#main');
  assert.equal(document.querySelector('main').getAttribute('tabindex'), '-1');
  for (const section of document.querySelectorAll('main > section')) {
    assert.ok(document.getElementById(section.getAttribute('aria-labelledby')));
  }
  for (const image of document.querySelectorAll('img')) assert.ok(image.hasAttribute('alt'));
  assert.equal(document.querySelector('.header-contact').href, 'mailto:mitkomitrov09@gmail.com');
  assert.equal(document.querySelector('.contact-email').href, 'mailto:mitkomitrov09@gmail.com');
  assert.equal(document.querySelectorAll('a[target="_blank"]').length, 0);
  const css = await readFile('src/styles/global.css', 'utf8');
  assert.match(css, /a:focus-visible\s*\{[^}]*outline:\s*2px solid var\(--accent\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  // Check actual foreground/background contrast for either light or dark palettes.
  const luminance = hex => {
    const rgb = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const color = name => css.match(new RegExp(`--${name}: (#[0-9a-f]{6})`))[1];
  const background = luminance(color('background'));
  for (const name of ['text', 'muted', 'accent']) {
    const foreground = luminance(color(name));
    assert.ok((Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05) >= 4.5, `${name} text fails AA contrast`);
  }
});
