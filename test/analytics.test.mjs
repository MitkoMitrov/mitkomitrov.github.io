import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';

const storageKey = 'mitko.analytics.v1';
const measurementId = 'G-5J3W5EZLQL';
const home = await readFile('dist/index.html', 'utf8');
const catalogue = await readFile('dist/articles/index.html', 'utf8');

function visit({html = home, url = 'https://mitko.mk/', saved, unavailable = false} = {}) {
  // No external resources or tracking requests are loaded by these tests.
  const {window} = new JSDOM(html, {url});
  if (saved) window.localStorage.setItem(storageKey, saved);
  let reloads = 0;
  const location = {hostname: new URL(url).hostname, protocol: new URL(url).protocol, pathname:new URL(url).pathname, search:new URL(url).search, reload: () => reloads++};
  const storage = unavailable ? {getItem() {throw Error('blocked');}, setItem() {throw Error('blocked');}} : window.localStorage;
  const bootstraps = window.document.querySelectorAll('[data-analytics-bootstrap]');
  assert.equal(bootstraps.length, 1, 'Exactly one analytics initializer on each page');
  new Function('window', 'document', 'location', 'localStorage', bootstraps[0].textContent)(window, window.document, location, storage);
  return {
    window, document: window.document, reloads: () => reloads,
    click: selector => window.document.querySelector(`[data-analytics-${selector}]`).click(),
    panel: () => window.document.querySelector('[data-analytics-panel]'),
    scripts: () => [...window.document.querySelectorAll('script[src]')],
    commands: () => (window.dataLayer || []).map(args => [...args]),
  };
}

test('both public pages start GA once by default and show an honest inline opt-out', () => {
  for (const html of [home, catalogue]) {
    const page = visit({html});
    assert.equal(page.scripts().length, 1);
    assert.equal(page.window.localStorage.getItem(storageKey), null, 'Do not manufacture a saved consent choice');
    assert.equal(page.panel().hidden, false);
    assert.match(page.panel().textContent, /uses Google Analytics cookies automatically/);
    assert.match(page.document.querySelector('[data-analytics-status]').textContent, /currently on/);
    page.click('accept');
    assert.equal(page.window.localStorage.getItem(storageKey), 'granted');
    assert.equal(page.panel().hidden, true);
    assert.deepEqual(page.scripts().map(script => script.src), [`https://www.googletagmanager.com/gtag/js?id=${measurementId}`]);
    assert.equal(page.scripts()[0].async, true);
    const commands = page.commands();
    assert.equal(commands[0][2].analytics_storage, 'granted');
    assert.equal(commands[0][2].ad_storage, 'denied');
    assert.equal(commands[0][2].ad_user_data, 'denied');
    assert.equal(commands[0][2].ad_personalization, 'denied');
    assert.equal(commands.filter(command => command[0] === 'config').length, 1);
    assert.equal(commands.at(-1)[1], measurementId);
    assert.equal(commands.at(-1)[2].allow_google_signals, false);
    assert.equal(commands.at(-1)[2].allow_ad_personalization_signals, false);
    assert.equal(commands.some(command => command[0] === 'event' && command[1] === 'page_view'), false, 'Config sends the initial page view; do not duplicate it');
    page.click('preferences');
    page.click('accept');
    assert.equal(page.scripts().length, 1);
    assert.equal(page.commands().filter(command => command[0] === 'config').length, 1);
  }
});

test('decline is remembered and earlier opt-outs remain blocked on both public routes', () => {
  const page = visit();
  page.click('decline');
  assert.equal(page.window.localStorage.getItem(storageKey), 'denied');
  assert.equal(page.window['ga-disable-' + measurementId], true);
  assert.equal(page.reloads(), 1);
  for (const html of [home, catalogue]) {
    const next = visit({html, saved: 'denied'});
    assert.equal(next.panel().hidden, true);
    assert.equal(next.scripts().length, 0);
    assert.equal(next.commands().length, 0);
    next.click('preferences');
    assert.equal(next.panel().hidden, false);
    assert.match(next.document.querySelector('[data-analytics-status]').textContent, /currently off/);
    assert.ok(next.document.activeElement.hasAttribute('data-analytics-accept'));
    next.click('accept');
    assert.equal(next.scripts().length, 1);
    assert.equal(next.window['ga-disable-' + measurementId], false);
  }
});

test('opt-out disables collection, clears GA cookies and reloads to remove Google listeners', () => {
  const page = visit({saved: 'granted'});
  assert.equal(page.scripts().length, 1);
  page.document.cookie = '_ga=synthetic; Path=/; Secure';
  page.document.cookie = '_ga_5J3W5EZLQL=synthetic; Domain=mitko.mk; Path=/; Secure';
  page.document.cookie = 'unrelated=keep; Path=/; Secure';
  page.click('preferences');
  page.click('decline');
  assert.equal(page.window['ga-disable-' + measurementId], true);
  assert.equal(page.window.localStorage.getItem(storageKey), 'denied');
  assert.equal(page.document.cookie, 'unrelated=keep');
  assert.equal(page.reloads(), 1);
});

test('localhost and preview domains never initialize GA even with saved consent', () => {
  for (const url of ['http://localhost:4321/', 'http://127.0.0.1:4173/', 'https://preview.pages.dev/', 'https://mitkomitrov.github.io/', 'http://mitko.mk/']) {
    const page = visit({url, saved: 'granted'});
    assert.equal(page.scripts().length, 0);
    assert.equal(page.panel().hidden, true);
    assert.equal(page.document.querySelector('[data-analytics-preferences]').hidden, true);
  }
});

test('an unsavable decline stays disabled in memory instead of reloading and re-enabling GA', () => {
  const page = visit({unavailable: true});
  assert.equal(page.scripts().length, 1);
  page.click('decline');
  assert.equal(page.window['ga-disable-' + measurementId], true);
  assert.equal(page.reloads(), 0);
  assert.equal(page.panel().hidden, false);
  assert.match(page.document.querySelector('[data-analytics-status]').textContent, /currently off.*could not save/);
  assert.equal(page.commands().filter(command => command[0] === 'config').length, 1);
  page.click('accept');
  assert.equal(page.window['ga-disable-' + measurementId], false);
  assert.equal(page.scripts().length, 1);
});

test('a decline in another tab immediately disables this tab and reloads without GA', () => {
  const page = visit();
  page.window.localStorage.setItem(storageKey, 'denied');
  page.window.dispatchEvent(new page.window.StorageEvent('storage', {key: storageKey, newValue: 'denied'}));
  assert.equal(page.window['ga-disable-' + measurementId], true);
  assert.equal(page.reloads(), 1);
  const next = visit({saved: page.window.localStorage.getItem(storageKey)});
  assert.equal(next.scripts().length, 0);
});

test('invalid saved choices use the default policy without recording consent', () => {
  const page = visit({saved: 'invalid'});
  assert.equal(page.scripts().length, 1);
  assert.equal(page.panel().hidden, false);
  assert.equal(page.window.localStorage.getItem(storageKey), 'invalid');
});

test('contact and outbound article events are deduplicated and contain no contact details', async () => {
  const page = visit({html:await readFile('dist/articles/redis-cache-aside-ttl-eviction/index.html', 'utf8')});
  page.document.addEventListener('click', event => event.preventDefault());
  page.document.querySelector('.header-contact').click();
  page.document.querySelector('[data-article-outbound]').click();
  const events = page.commands().filter(command => command[0] === 'event');
  assert.deepEqual(events.map(command => command[1]), ['contact_click', 'article_outbound']);
  assert.equal(events[0][2].contact_method, 'email');
  assert.doesNotMatch(JSON.stringify(events), /mailto:|@|linkedin\.com\/in/);
  page.click('decline');
  const count = page.commands().length;
  page.document.querySelector('.header-contact').click();
  assert.equal(page.commands().length, count);
});

test('article metadata accompanies GA page views and custom events stop after opt-out', async () => {
  const page = visit({html:await readFile('dist/articles/redis-cache-aside-ttl-eviction/index.html', 'utf8')});
  const config = page.commands().find(command => command[0] === 'config');
  assert.equal(config[2].article_id, 'redis-cache-aside');
  assert.equal(config[2].article_topic, 'Redis');
  assert.equal(page.window.portfolioAnalytics.track('article_read', {article_id:'redis-cache-aside', is_estimate:1}), true);
  page.click('decline');
  assert.equal(page.window.portfolioAnalytics.enabled(), false);
  assert.equal(page.window.portfolioAnalytics.track('article_read', {article_id:'redis-cache-aside'}), false);
});

test('debug mode is explicit and never enabled on ordinary visits', () => {
  assert.equal(visit().commands().find(command => command[0] === 'config')[2].debug_mode, undefined);
  assert.equal(visit({url:'https://mitko.mk/?analytics_debug=1'}).commands().find(command => command[0] === 'config')[2].debug_mode, true);
});

test('case-study page views, project clicks and contact intent carry project context once and stop after opt-out', async () => {
  const page=visit({html:await readFile('dist/work/marketagent/index.html','utf8'),url:'https://mitko.mk/work/marketagent/'});
  page.document.addEventListener('click', event => event.preventDefault());
  assert.equal(page.commands().find(c => c[0] === 'config')[2].project_id,'marketagent');
  page.document.querySelector('[data-project-site]').click();
  page.document.querySelector('.case-contact a').click();
  const events=page.commands().filter(c => c[0] === 'event');
  assert.deepEqual(events.map(c => c[1]),['project_outbound','contact_click']);
  assert.ok(events.every(c => c[2].project_id === 'marketagent' && c[2].page_path === '/work/marketagent/'));
  assert.doesNotMatch(JSON.stringify(events),/mailto:|@/);
  page.click('decline');
  page.document.querySelector('[data-project-site]').click();
  assert.equal(page.commands().filter(c => c[0] === 'event').length,2);
});
