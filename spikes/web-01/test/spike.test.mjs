import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {JSDOM} from 'jsdom';
import {importHTML,sampleArticle} from '../lib/import-surrogate.mjs';
import {renderBody} from '../lib/render.mjs';
import {publishedArticles,assertRevision,publicationEvent,requestBuild,deploymentState} from '../lib/publication.mjs';
const input = await readFile(new URL('../fixtures/word-surrogate.html',import.meta.url),'utf8');
const fixture = JSON.parse(await readFile(new URL('../fixtures/article.json',import.meta.url),'utf8'));

test('surrogate conversion, edit, disk save, reload, static render and export preserve content',async()=>{
  const doc = sampleArticle(importHTML(input));
  doc.title = 'Edited cache title';
  const dir = await mkdtemp(join(tmpdir(),'web01-'));
  try {
    await writeFile(join(dir,'saved.json'),JSON.stringify(doc));
    const restored = JSON.parse(await readFile(join(dir,'saved.json'),'utf8'));
    assert.deepEqual(restored,doc);
    const dom = new JSDOM(renderBody(restored.body)).window.document;
    assert.equal(dom.querySelector('h2').textContent,'Cache invalidation in practice');
    assert.equal(dom.querySelector('strong').textContent,'explicit expiry');
    assert.equal(dom.querySelector('em').textContent,'measure the result');
    assert.equal(dom.querySelector('a').href,'https://redis.io/docs/');
    assert.equal(dom.querySelectorAll('li').length,2);
    assert.equal(dom.querySelectorAll('thead th[scope="col"]').length,2);
    assert.equal(dom.querySelectorAll('tbody tr').length,2);
    assert.equal(dom.querySelector('p > code').textContent,'article:42');
    assert.equal(dom.querySelector('pre code').className,'language-csharp');
    assert.equal(dom.querySelector('pre code').textContent,new JSDOM(input).window.document.querySelector('pre').textContent);
    assert.match(dom.querySelector('.text-small').textContent,/Small operational/);
    assert.match(dom.querySelector('.text-large').textContent,/Large takeaway/);
  } finally {await rm(dir,{recursive:true,force:true})}
});

test('default conversion does not preserve custom font-size styles; requires explicit mapping',()=>{
  const body = importHTML(input,false);
  assert.ok(!body.some(b => ['small','large'].includes(b.style)));
});

test('renderer escapes hostile code and text and rejects unsafe URLs',()=>{
  const doc = structuredClone(fixture);
  doc.body = [
    {_type:'block',_key:'x',style:'normal',children:[{_type:'span',_key:'s',text:'<script>alert(1)</script>',marks:['bad']}],markDefs:[{_key:'bad',_type:'link',href:'javascript:alert(1)'}]},
    {_type:'code',_key:'c',language:'"><img src=x>',code:'</code><script>alert(2)</script>'},
  ];
  const dom = new JSDOM(renderBody(doc.body)).window.document;
  assert.equal(dom.querySelectorAll('script,img,a').length,0);
  assert.match(dom.body.textContent,/<script>alert\(1\)/);
  assert.equal(dom.querySelector('code').textContent,doc.body[1].code);
});

test('drafts, versions and dotted IDs never enter public selection; duplicate slugs fail closed',()=>{
  const draft = {...fixture,_id:'drafts.web01-sample',title:'PRIVATE-CANARY'};
  assert.deepEqual(publishedArticles([fixture,draft,{...draft,_id:'versions.release.article'}]),[fixture]);
  assert.throws(()=>publishedArticles([fixture,{...fixture,_id:'other'}]),/Duplicate/);
  assert.throws(()=>publishedArticles([{...fixture,slug:{current:'../../private'}}]),/Invalid/);
  assert.equal(publicationEvent(draft),null);
});

test('build snapshot requires exact requested published revision',()=>{
  assert.equal(assertRevision([fixture],{id:fixture._id,rev:fixture._rev}),fixture);
  assert.throws(()=>assertRevision([fixture],{id:fixture._id,rev:'older-revision'}),/Superseded/);
});

test('mock transport: draft save sends nothing; published retry uses same id/rev and no article body',async()=>{
  const calls=[];
  const mock = async (url,options) => {calls.push({url,...options});return {status:204}};
  const options={token:'synthetic-test-token',fetchImpl:mock,repository:'example/web01-test'};
  assert.equal((await requestBuild({...fixture,_id:'drafts.web01-sample'},options)).state,'draft-saved');
  assert.equal(calls.length,0);
  const a=await requestBuild(fixture,options), b=await requestBuild(fixture,options);
  assert.equal(a.key,b.key);
  assert.equal(a.state,'requested');
  assert.equal(calls.length,2); // delivery may repeat; identity, not transport, is idempotent
  assert.equal(calls[0].headers.Authorization,'Bearer synthetic-test-token');
  assert.deepEqual(JSON.parse(calls[0].body),{event_type:'sanity-published',client_payload:{id:fixture._id,rev:fixture._rev}});
  assert.deepEqual(publishedArticles([fixture]).map(d=>d.slug.current),['a-bounded-cache']);
  await assert.rejects(requestBuild(fixture,{...options,fetchImpl:async()=>({status:401})}),/rejected \(401\)/);
  await assert.rejects(requestBuild(fixture,{...options,fetchImpl:async()=>{throw new Error('offline')}}),/offline/);
  await assert.rejects(requestBuild(fixture,{...options,token:''}),/Server-only/);
});

test('status never calls accepted dispatch or successful build live without matching deployed revision',()=>{
  assert.equal(deploymentState(null,null,'r1'),'awaiting-build');
  assert.equal(deploymentState({status:'queued'},null,'r1'),'queued');
  assert.equal(deploymentState({status:'in_progress'},null,'r1'),'building');
  assert.equal(deploymentState({status:'completed',conclusion:'failure'},null,'r1'),'failed');
  assert.equal(deploymentState({status:'completed',conclusion:'success'},null,'r1'),'awaiting-live-manifest');
  assert.equal(deploymentState(null,'r1','r1'),'live');
});

test('generated Astro output contains full static article with no client scripts or draft canary',async()=>{
  const html=await readFile(new URL('../dist/articles/a-bounded-cache/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html).window.document;
  assert.equal(dom.querySelectorAll('script').length,0);
  assert.equal(dom.querySelector('h1').textContent,fixture.title);
  assert.ok(dom.querySelector('article[data-revision="sample-revision-1"]'));
  const expected=new JSDOM(input).window.document.body.textContent.replace(/\s+/g,' ').trim();
  const actual=dom.querySelector('.body').textContent.replace(/\s+/g,' ').trim();
  for (const text of ['Cache invalidation in practice','explicit expiry','Cache miss','article:42','<cache> & ready']) assert.ok(actual.includes(text));
  assert.equal(dom.querySelector('pre code').textContent,new JSDOM(input).window.document.querySelector('pre').textContent);
  assert.ok(expected.includes('Cache invalidation'));
  assert.doesNotMatch(html,/PRIVATE-CANARY|drafts\.|versions\.|synthetic-test-token/);
  assert.match(html,/overflow-x:auto/);
});

// Build-level injection uses only synthetic public test text, never private drafts.
test('actual build excludes injected draft; mismatched revision aborts build',async()=>{
  const dir = await mkdtemp(join(tmpdir(),'web01-build-'));
  const inputPath=join(dir,'synthetic.json');
  try {
    await writeFile(inputPath,JSON.stringify([fixture,{...fixture,_id:'drafts.synthetic',title:'PRIVATE-CANARY',slug:{current:'must-not-exist'}}]));
    const env={...process.env,WEB01_CONTENT_SOURCE:'test-file',WEB01_TEST_FILE:inputPath,WEB01_EXPECTED_ID:fixture._id,WEB01_EXPECTED_REV:fixture._rev};
    execFileSync(process.execPath,['node_modules/astro/bin/astro.mjs','build'],{env,stdio:'pipe'});
    const html=await readFile('dist/articles/a-bounded-cache/index.html','utf8');
    const manifest=await readFile('dist/publication.json','utf8');
    assert.doesNotMatch(html+manifest,/PRIVATE-CANARY|drafts\.|must-not-exist/);
    assert.deepEqual(JSON.parse(manifest).articles,[{id:fixture._id,rev:fixture._rev,slug:fixture.slug.current}]);
    await assert.rejects(readFile('dist/articles/must-not-exist/index.html'),{code:'ENOENT'});
    assert.throws(()=>execFileSync(process.execPath,['node_modules/astro/bin/astro.mjs','build'],{env:{...env,WEB01_EXPECTED_REV:'obsolete'},stdio:'pipe'}),/Command failed/);
  } finally {
    await rm(dir,{recursive:true,force:true});
    // Leave an ordinary fixture build for visual inspection after the negative test.
    execFileSync(process.execPath,['node_modules/astro/bin/astro.mjs','build'],{env:{...process.env,WEB01_CONTENT_SOURCE:'fixture',WEB01_EXPECTED_ID:'',WEB01_EXPECTED_REV:''},stdio:'pipe'});
  }
});
