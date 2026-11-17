import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const html = await readFile('dist/articles/redis-cache-aside-ttl-eviction/index.html', 'utf8');
function reader({enabled = true} = {}) {
  const {window} = new JSDOM(html, {url:'https://mitko.mk/articles/redis-cache-aside-ttl-eviction/'});
  const {document} = window;
  let clock = 0, focused = true, visibility = 'visible', on = enabled, timer;
  let rect = {top:100, bottom:3100, height:3000};
  const events = [], copies = [];
  Object.defineProperty(document, 'visibilityState', {get:() => visibility});
  document.hasFocus = () => focused;
  Object.defineProperty(window, 'innerHeight', {value:800});
  document.querySelector('[data-article-body]').getBoundingClientRect = () => rect;
  window.setInterval = fn => {timer = fn; return 1;};
  window.setTimeout = () => 1;
  window.portfolioAnalytics = {enabled:() => on, track:(name, data) => {if (!on) return false; events.push({name, data}); return true;}};
  const navigator = {clipboard:{writeText:async text => {copies.push(text);}}};
  const script = document.querySelector('[data-article-tools]').textContent;
  new Function('window', 'document', 'performance', 'navigator', script)(window, document, {now:() => clock}, navigator);
  return {
    window, document, events, copies,
    advance(seconds, active = true) {for (let i = 0; i < seconds; i++) {clock += 1000; if (active && i % 10 === 0) window.dispatchEvent(new window.Event('pointermove')); timer();}},
    depth75() {rect = {top:-1450, bottom:1550, height:3000}; window.dispatchEvent(new window.Event('scroll'));},
    footer() {rect = {top:-3100, bottom:-100, height:3000}; window.dispatchEvent(new window.Event('scroll'));},
    hidden(value) {visibility = value ? 'hidden' : 'visible'; document.dispatchEvent(new window.Event('visibilitychange'));},
    focus(value) {focused = value; window.dispatchEvent(new window.Event(value ? 'focus' : 'blur'));},
    enable(value) {on = value; window.dispatchEvent(new window.Event(value ? 'analytics:enabled' : 'analytics:disabled'));},
  };
}
const reads = reader => reader.events.filter(event => event.name === 'article_read');

test('estimated read requires BOTH 60 active seconds and 75% of the article body; emits once', () => {
  const page = reader();
  page.advance(70);
  assert.equal(reads(page).length, 0);
  page.depth75();
  page.advance(1);
  assert.equal(reads(page).length, 1);
  assert.equal(reads(page)[0].data.is_estimate, 1);
  assert.equal(reads(page)[0].data.article_id, 'redis-cache-aside');
  page.advance(80);
  assert.equal(reads(page).length, 1);
  const scroll = page.events.filter(event => event.name === 'article_scroll').map(event => event.data.percent_scrolled);
  assert.deepEqual(scroll, [25,50,75]);
});

test('scroll alone, idle tabs, background tabs, unfocused windows and footer time do not count as reads', () => {
  for (const mode of ['idle', 'hidden', 'unfocused', 'footer']) {
    const page = reader(); page.depth75();
    if (mode === 'hidden') page.hidden(true);
    if (mode === 'unfocused') page.focus(false);
    if (mode === 'footer') page.footer();
    page.advance(120, mode !== 'idle');
    assert.equal(reads(page).length, 0, mode);
    const seconds = page.events.filter(event => event.name === 'article_engagement').reduce((sum, event) => sum + event.data.active_seconds, 0);
    assert.ok(seconds <= (mode === 'idle' ? 30 : 0), `${mode}: ${seconds}`);
  }
});

test('disabled analytics emits nothing and never backfills time accumulated while opted out', () => {
  const page = reader({enabled:false}); page.depth75(); page.advance(120);
  assert.equal(page.events.length, 0);
  page.enable(true); page.advance(59);
  assert.equal(reads(page).length, 0);
  page.advance(1);
  assert.equal(reads(page).length, 1);
  page.enable(false);
  const count = page.events.length;
  page.advance(120);
  assert.equal(page.events.length, count);
});

test('reading resumes after returning to a foreground tab without counting hidden time', () => {
  const page = reader(); page.depth75(); page.advance(20);
  page.hidden(true); page.advance(300);
  page.hidden(false); page.advance(39);
  assert.equal(reads(page).length, 0);
  page.advance(1);
  assert.equal(reads(page).length, 1);
});

test('copy code works independently of analytics and preserves indentation and characters', async () => {
  const page = reader({enabled:false});
  const button = page.document.querySelector('[data-copy-code]');
  assert.equal(button.hidden, false);
  button.click();
  await Promise.resolve();
  assert.deepEqual(page.copies, [page.document.querySelector('pre code').textContent]);
  assert.match(page.copies[0], /\n    if hit/);
  assert.equal(page.document.querySelector('[data-copy-status]').textContent, 'Code copied.');
  assert.equal(page.events.length, 0);
});
