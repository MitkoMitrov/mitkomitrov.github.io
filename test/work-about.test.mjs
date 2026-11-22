import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {caseStudies} from '../src/data/case-studies.mjs';

test('About and every project page render full static content and resolve local links', async () => {
  const paths=['about/index.html','work/index.html',...caseStudies.map(p => `work/${p.slug}/index.html`)];
  for (const path of paths) {
    const page=new JSDOM(await readFile(`dist/${path}`,'utf8'),{url:`https://mitko.mk/${path}`}).window.document;
    assert.equal(page.querySelectorAll('h1').length,1);
    assert.ok(page.querySelector('a[href="mailto:mitkomitrov09@gmail.com"]'));
    assert.doesNotMatch(page.querySelector('main').textContent,/lorem ipsum|coming soon|TODO|1000 users|25 kiosks/i);
    for (const link of page.querySelectorAll('a[href^="/"]')) {
      const url=new URL(link.href);
      if (url.hash) continue;
      await access(`dist${url.pathname}${url.pathname.endsWith('/')?'index.html':''}`);
    }
  }
  for (const project of caseStudies) {
    const page=new JSDOM(await readFile(`dist/work/${project.slug}/index.html`,'utf8')).window.document;
    assert.equal(page.querySelector('[data-project-page]').getAttribute('data-project-id'),project.id);
    for (const section of ['problem-title','contribution-title','decisions-title','result-title']) assert.ok(page.getElementById(section));
    assert.equal(page.querySelectorAll('[data-project-site]').length,project.href?1:0);
  }
});
