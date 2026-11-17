// Offline HTML conversion experiment; NOT the Studio clipboard implementation.
import {htmlToBlocks} from '@portabletext/block-tools';
import {Schema} from '@sanity/schema';
import {JSDOM} from 'jsdom';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {article, table} from '../schema.mjs';
const code = {name: 'code', type: 'object', fields: [{name:'code',type:'text'},{name:'language',type:'string'}]};
const schema = Schema.compile({name:'web01',types:[article, table, code]});
const bodyType = schema.get('article').fields.find(f => f.name === 'body').type;
export function importHTML(html, custom = true) {
  let seq = 0;
  const key = () => `k${++seq}`;
  return htmlToBlocks(html, bodyType, {
    parseHtml: input => new JSDOM(input).window.document,
    keyGenerator: key,
    rules: custom ? [{deserialize(el, next, block) {
      if (el.nodeType !== 1) return undefined;
      if (['SCRIPT','STYLE','IFRAME','OBJECT','IMG'].includes(el.tagName)) return [];
      if (el.tagName === 'TABLE') return block({
        _type: 'table', _key: key(), headerRows: el.querySelector('tr th') ? 1 : 0,
        rows: [...el.rows].map(r => ({_type:'row',_key:key(),cells:[...r.cells].map(c => ({
          _type:'cell',_key:key(),value:importHTML(c.innerHTML),
        }))})),
      });
      if (el.tagName === 'PRE') return block({
        _type:'code',_key:key(),language:el.querySelector('code')?.className.match(/language-([\w#+-]+)/)?.[1] || 'text',
        code:el.textContent,
      });
      if (el.tagName === 'P' && ['14px','24px'].includes(el.style.fontSize)) return {
        _type:'block',_key:key(),style:el.style.fontSize === '14px' ? 'small' : 'large',
        children:next(el.childNodes),markDefs:[],
      };
      return undefined;
    }}] : [],
  });
}
export function sampleArticle(body) {
  return {_id:'web01-sample',_type:'article',_rev:'sample-revision-1',title:'A bounded cache',
    slug:{_type:'slug',current:'a-bounded-cache'},summary:'A synthetic public article for WEB-01.',topic:'Redis',body};
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = await readFile(new URL('../fixtures/word-surrogate.html',import.meta.url),'utf8');
  const value = sampleArticle(importHTML(input));
  await writeFile(new URL('../fixtures/article.json',import.meta.url),JSON.stringify(value,null,2)+'\n');
  console.log('Converted surrogate HTML to public synthetic Portable Text fixture.');
}
