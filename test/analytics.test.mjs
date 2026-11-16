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
  const location = {hostname: new URL(url).hostname, protocol: new URL(url).protocol, reload: () => reloads++};
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

test('both public pages block Google until a visitor explicitly accepts', () => {
  for (const html of [home, catalogue]) {
    const page = visit({html});
    assert.equal(page.scripts().length, 0);
    assert.equal(page.commands().length, 0);
    assert.equal(page.panel().hidden, false);
    page.click('accept');
    assert.equal(page.window.localStorage.getItem(storageKey), 'granted');
    assert.equal(page.panel().hidden, true);
    assert.deepEqual(page.scripts().map(script => script.src), [`https://www.googletagmanager.com/gtag/js?id=${measurementId}`]);
    assert.equal(page.scripts()[0].async, true);
    const commands = page.commands();
    assert.equal(commands[0][2].analytics_storage, 'denied');
    assert.equal(commands[0][2].ad_storage, 'denied');
    assert.deepEqual(commands[1], ['consent', 'update', {analytics_storage: 'granted'}]);
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

test('decline is remembered, loads nothing, and can be changed from the footer', () => {
  const page = visit();
  page.click('decline');
  assert.equal(page.window.localStorage.getItem(storageKey), 'denied');
  assert.equal(page.scripts().length, 0);
  const next = visit({html: catalogue, saved: 'denied'});
  assert.equal(next.panel().hidden, true);
  assert.equal(next.scripts().length, 0);
  next.click('preferences');
  assert.equal(next.panel().hidden, false);
  assert.ok(next.document.activeElement.hasAttribute('data-analytics-accept'));
  next.click('accept');
  assert.equal(next.scripts().length, 1);
});

test('withdrawal disables collection, clears GA cookies and reloads to remove Google listeners', () => {
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

test('blocked browser storage and invalid saved choices fail closed until opt-in', () => {
  for (const options of [{unavailable: true}, {saved: 'invalid'}]) {
    const page = visit(options);
    assert.equal(page.scripts().length, 0);
    assert.equal(page.panel().hidden, false);
    page.click('accept');
    assert.equal(page.scripts().length, 1);
  }
});
