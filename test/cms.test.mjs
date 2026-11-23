import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createMarkdownProcessor} from '@astrojs/markdown-remark';
import {JSDOM} from 'jsdom';
import {portableTextMarkdown, cmsDigest, validateCmsDocuments, fetchCmsDocuments} from '../src/lib/cms-content.mjs';
import {prepareCms, readCmsSnapshot} from '../scripts/prepare-cms.mjs';
import {assertPublicationCurrent} from '../scripts/verify-publication.mjs';
import {articleMarkup} from '../src/lib/remark-article.mjs';

const block = (text, extra = {}) => ({_type:'block',style:'normal',children:[{_type:'span',text,marks:[]}],markDefs:[],...extra});
const sample = () => ({_type:'article',_id:'synthetic-cms',_rev:'revision-a',articleId:'cms-example',
  title:'Synthetic CMS example',slug:{current:'synthetic-cms-example'},summary:'A synthetic example for validating private-safe static publication.',
  topic:'Architecture',tags:['Architecture'],published:'2026-01-01',body:[
    block('Read path',{style:'h2'}),
    block('Escaped <script>alert(1)</script> text.'),
    block('A bold phrase',{children:[{_type:'span',text:'A bold phrase',marks:['strong']}]}),
    block('Check the cache.',{listItem:'bullet',level:1}),
    {_type:'table',headerRows:1,rows:[{cells:[{value:[block('Operation')]},{value:[block('Result')]}]},{cells:[{value:[block('Cache hit')]},{value:[block('Return value')]}]}]},
    {_type:'code',language:'csharp',code:'if (key != null) {\n  return "<value>";\n}\n// ``` must survive'},
  ]});

test('CMS rich content uses the real Markdown/code/table renderer and escapes unsafe input', async () => {
  const document = sample();
  document.body.push(block('Unsafe link',{markDefs:[{_key:'link',_type:'link',href:'javascript:alert(1)'}],children:[{_type:'span',text:'Unsafe link',marks:['link']}]}));
  const renderer = await createMarkdownProcessor({rehypePlugins:[articleMarkup],shikiConfig:{theme:'github-light'}});
  const result = new JSDOM((await renderer.render(portableTextMarkdown(document.body))).code).window.document;
  assert.equal(result.querySelector('h2').textContent,'Read path');
  assert.equal(result.querySelector('strong').textContent,'A bold phrase');
  assert.equal(result.querySelectorAll('table tr').length,2);
  assert.equal(result.querySelector('table tbody td').textContent,'Cache hit');
  assert.equal(result.querySelector('pre code').textContent,document.body.find(b => b._type === 'code').code);
  assert.equal(result.querySelectorAll('script,iframe,a[href^="javascript:"]').length,0);
  assert.match(result.body.textContent, /<script>alert\(1\)<\/script>/);
  assert.ok(result.querySelector('.code-block [data-copy-code]'));
});
test('CMS rejects draft/version documents, unknown blocks and duplicate identities before generating files', () => {
  for (const id of ['drafts.synthetic','versions.release.synthetic']) assert.throws(() => validateCmsDocuments([{...sample(),_id:id}]), /Private or invalid/);
  assert.throws(() => validateCmsDocuments([sample(),sample()]), /Duplicate/);
  assert.throws(() => portableTextMarkdown([{_type:'html',html:'<script>run()</script>'}]), /Unsupported/);
});
test('CMS anonymous fetch is published-only and fails closed on transport/API failures', async () => {
  await fetchCmsDocuments(async (url, options) => {
    assert.match(url, /perspective=published/); assert.ok(!options.headers);
    return {ok:true,json:async () => ({result:[sample()]})};
  });
  await assert.rejects(fetchCmsDocuments(async () => ({ok:false,status:503})), /failed \(503\)/);
  await assert.rejects(fetchCmsDocuments(async () => ({ok:true,json:async () => ({result:[{...sample(),_id:'drafts.synthetic'}]})})), /Private/);
});
test('CMS snapshots preserve stable identity, reject legacy collisions and obsolete publish/unpublish requests', async () => {
  const root = await mkdtemp(join(tmpdir(),'portfolio-cms-'));
  try {
    await mkdir(join(root,'src/content/articles'),{recursive:true});
    const doc=sample();
    const result=await prepareCms(root,[doc],{request:{id:doc._id,rev:doc._rev,operation:'publish'}});
    assert.equal((await readCmsSnapshot(root)).digest,cmsDigest([doc]));
    assert.equal(result.entries[0].data.articleId,'cms-example');
    assert.match(await readFile(join(root,'.generated/cms/synthetic-cms-example.md'),'utf8'),/A bold phrase/);
    await assert.rejects(prepareCms(root,[{...doc,_rev:'revision-b'}],{request:{id:doc._id,rev:doc._rev,operation:'publish'}}),/superseded/);
    await assert.rejects(prepareCms(root,[doc],{request:{id:doc._id,rev:doc._rev,operation:'unpublish'}}),/superseded/);
    const legacy={...result.entries[0].data};
    await writeFile(join(root,'src/content/articles/existing.md'),`---\n${JSON.stringify(legacy)}\n---\nExisting article.\n`);
    await assert.rejects(prepareCms(root,[doc],{request:null}),/collides/);
    assert.equal((await readCmsSnapshot(root)).digest,result.digest,'A rejected snapshot must not replace the prior snapshot');
  } finally {await rm(root,{recursive:true,force:true});}
});
test('deployment refuses a changed source commit, edited article or obsolete empty snapshot', () => {
  const doc=sample(), source='a'.repeat(40);
  const expected={version:1,sourceSha:source,snapshot:cmsDigest([doc]),articles:[{id:doc._id,rev:doc._rev,articleId:doc.articleId,slug:doc.slug.current}]};
  assertPublicationCurrent(expected,[doc],source);
  assert.throws(() => assertPublicationCurrent(expected,[doc],'b'.repeat(40)),/Source changed/);
  assert.throws(() => assertPublicationCurrent(expected,[{...doc,_rev:'revision-b'}],source),/Published content changed/);
  assert.throws(() => assertPublicationCurrent({...expected,snapshot:cmsDigest([]),articles:[]},[doc],source),/Published content changed/);
});
