import test from 'node:test';
import assert from 'node:assert/strict';
import {observePaste} from '../lib/paste-probe.mjs';
import {importHTML} from '../lib/import-surrogate.mjs';

test('paste observer distinguishes HTML from plain text without consuming or retaining content', () => {
  for (const html of ['', '<p><b>synthetic-bold</b> and <i>synthetic-italic</i></p>']) {
    const values = {'text/html':html,'text/plain':'synthetic-bold and synthetic-italic'};
    const clipboard = {types:Object.keys(values),getData:type => values[type] || ''};
    let result;
    assert.equal(observePaste(clipboard, value => {result=value}), undefined);
    assert.deepEqual(result,{html:Boolean(html),plainText:true,portableText:false});
    assert.doesNotMatch(JSON.stringify(result),/synthetic|<p>/);
    assert.deepEqual(values,{'text/html':html,'text/plain':'synthetic-bold and synthetic-italic'});
  }
});

test('paste observer supports missing clipboard and native Portable Text metadata', () => {
  let result;
  observePaste(null, value => {result=value});
  assert.deepEqual(result,{html:false,plainText:false,portableText:false});
  observePaste({types:['application/x-portable-text'],getData:()=>''}, value => {result=value});
  assert.equal(result.portableText,true);
});

test('locked native HTML conversion retains supported bold/italic without custom rules', () => {
  const examples = [
    '<p>A <strong>bold</strong> and <em>italic</em> sentence.</p>',
    '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body><p class="MsoNormal">A <b>bold</b> and <i>italic</i> sentence.</p></body></html>',
  ];
  for (const html of examples) {
    const spans = importHTML(html, false).flatMap(block => block.children || []);
    assert.ok(spans.some(span => span.text === 'bold' && span.marks.includes('strong')));
    assert.ok(spans.some(span => span.text === 'italic' && span.marks.includes('em')));
  }
  // These are synthetic HTML inputs, not captured Word clipboard payloads.
});
