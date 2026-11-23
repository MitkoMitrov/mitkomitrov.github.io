import test from 'node:test';
import assert from 'node:assert/strict';
import {Schema} from '@sanity/schema';
import {JSDOM} from 'jsdom';
import {article, table} from '../schema.mjs';
import {tablePasteResult} from '../lib/table-paste.mjs';
import {portableTextMarkdown} from '../../src/lib/portable-text.mjs';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
const renderer = await createMarkdownProcessor();
const renderBody = async blocks => (await renderer.render(portableTextMarkdown(blocks))).code;

const schema = Schema.compile({name:'paste-test', types:[article, table, {
  name:'code', type:'object', fields:[{name:'code',type:'text'},{name:'language',type:'string'}],
}]});
const bodyType = schema.get('article').fields.find(field => field.name === 'body').type;
const clipboard = (html, types = ['text/html', 'text/plain']) => ({
  types, getData:type => type === 'text/html' ? html : 'plain fallback',
});
const options = {parseHtml: html => new JSDOM(html).window.document};
const html = `<h2>Cache test</h2><h3>Read path</h3>
<p>A <strong>bold</strong>, <em>italic</em>, <code>cache:key</code> and <a href="https://redis.io/docs/">Redis link</a>.</p>
<ul><li>Check the cache.</li><li>Query the database on a miss.</li></ul>
<ol><li>Load the value.</li><li>Store it with a TTL.</li></ol>
<table><thead><tr><th>Operation</th><th>Result</th></tr></thead><tbody>
<tr><td>Cache hit</td><td>Return <strong>cached</strong> value</td></tr>
<tr><td>Cache miss</td><td>Query the database</td></tr></tbody></table><p>After table.</p>`;

test('actual clipboard converter fixes table flattening and preserves surrounding rich content through render', async () => {
  const result = tablePasteResult(clipboard(html), bodyType, options);
  const blocks = JSON.parse(JSON.stringify(result.insert)); // saved structured data
  const dom = new JSDOM(await renderBody(blocks)).window.document;
  assert.equal(dom.querySelector('h2').textContent, 'Cache test');
  assert.equal(dom.querySelector('h3').textContent, 'Read path');
  assert.deepEqual([...dom.querySelectorAll('ul li')].map(el => el.textContent.trim()), ['Check the cache.', 'Query the database on a miss.']);
  assert.equal(dom.querySelectorAll('ol li').length, 2);
  assert.equal(dom.querySelector('a').href, 'https://redis.io/docs/');
  assert.equal(dom.querySelector('p code').textContent, 'cache:key');
  assert.deepEqual([...dom.querySelectorAll('thead th')].map(el => el.textContent.trim()), ['Operation', 'Result']);
  assert.deepEqual([...dom.querySelectorAll('tbody tr')].map(row => [...row.cells].map(cell => cell.textContent)), [
    ['Cache hit', 'Return cached value'], ['Cache miss', 'Query the database'],
  ]);
  assert.equal(dom.querySelector('td strong').textContent, 'cached');
  assert.equal(dom.body.lastElementChild.textContent, 'After table.');
});

test('HTML without tables, missing HTML and native Portable Text copy keep native synchronous fallback', () => {
  for (const data of [null, clipboard(''), clipboard('<p>Normal <b>paste</b></p>'), clipboard(html, ['text/html','application/x-portable-text'])]) {
    assert.equal(tablePasteResult(data, bodyType, options), undefined);
  }
});

test('Word-shaped simple tables, empty cells, multiple tables and unique nested keys are retained', async () => {
  const input = '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><table class="MsoTableGrid"><tr><td><p><b>A</b></p></td><td></td></tr></table><p>Between</p><table><tr><td>B &amp; C</td></tr></table></body></html>';
  const a = tablePasteResult(clipboard(input), bodyType, options).insert;
  const b = tablePasteResult(clipboard(input), bodyType, options).insert;
  assert.equal(a.filter(block => block._type === 'table').length, 2);
  assert.equal(a.find(block => block._type === 'table').headerRows, 0);
  const keys = [];
  function walk(value) {
    if (!value || typeof value !== 'object') return;
    if (value._key) keys.push(value._key);
    Object.values(value).forEach(walk);
  }
  walk([a,b]);
  assert.equal(new Set(keys).size, keys.length);
  const dom = new JSDOM(await renderBody(a)).window.document;
  assert.equal(dom.querySelectorAll('td').length, 3);
  assert.match(dom.body.textContent.replace(/\s+/g, ''), /ABetweenB&C/);
});

test('unsupported merged/nested cells and row headers are refused before insertion', () => {
  for (const input of [
    '<table><tr><td colspan="2">Merged</td></tr></table>',
    '<table><tr><td rowspan="2">Merged</td></tr><tr><td>X</td></tr></table>',
    '<table><tr><td><table><tr><td>Nested</td></tr></table></td></tr></table>',
    '<table><tr><th>Row header</th><td>Value</td></tr></table>',
  ]) assert.throws(() => tablePasteResult(clipboard(input), bodyType, options), /not supported|supported yet/);
});
