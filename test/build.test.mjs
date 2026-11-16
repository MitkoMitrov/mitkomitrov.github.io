import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, mkdir, readFile, rm, writeFile, symlink} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {JSDOM} from 'jsdom';
import {parse} from 'yaml';
import {splitLegacyDocument} from '../src/lib/legacy-document.mjs';
import {preparePublic} from '../scripts/prepare-public.mjs';
import {verifyBuild} from '../scripts/verify-build.mjs';

test('Astro generates the complete existing homepage with identical body, CSS, metadata and scripts', async () => {
  const source = new JSDOM(await readFile('index.html', 'utf8')).window.document;
  const built = new JSDOM(await readFile('dist/index.html', 'utf8')).window.document;
  assert.equal(built.body.innerHTML.trim(), source.body.innerHTML.trim());
  assert.equal(built.head.innerHTML.trim(), source.head.innerHTML.trim());
  assert.equal(built.querySelectorAll('html').length, 1);
  assert.equal(built.querySelectorAll('body').length, 1);
  for (const link of built.querySelectorAll('a[href^="#"]')) {
    if (link.hash) assert.ok(built.getElementById(decodeURIComponent(link.hash.slice(1))), `Missing target ${link.hash}`);
  }
  // The raw-HTML bridge is entirely build-time; there is no content loader in-browser.
  assert.equal(built.querySelectorAll('script').length, source.querySelectorAll('script').length);
  assert.ok(built.body.textContent.includes('Mitko'));
});

test('artifact preserves all public files byte-for-byte and excludes repository-only files', async () => {
  assert.ok(await verifyBuild() > 10);
});

test('legacy bridge rejects an unsupported document shell rather than silently losing attributes', () => {
  assert.deepEqual(splitLegacyDocument('<!doctype html><html lang="en"><head><title>x</title></head><body>visible</body></html>'), {head:'<title>x</title>',body:'visible'});
  assert.throws(() => splitLegacyDocument('<html><head></head><body>missing contract</body></html>'), /Unsupported/);
  assert.throws(() => splitLegacyDocument('<!doctype html><html lang="en"><head></head><body class="new">x</body></html>'), /Unsupported/);
});

test('public staging removes stale files and fails closed on domain changes, missing input or symlinks', async () => {
  const root = await mkdtemp(join(tmpdir(), 'web03-'));
  try {
    await mkdir(join(root, 'assets'));
    await mkdir(join(root, 'CV'));
    await writeFile(join(root, 'assets/test.txt'), 'public');
    await writeFile(join(root, 'CV/CV.html'), 'cv');
    await writeFile(join(root, 'CNAME'), 'mitko.mk');
    await preparePublic(root);
    await writeFile(join(root, '.generated/public/stale-private-canary.txt'), 'SYNTHETIC-ONLY');
    await preparePublic(root);
    await assert.rejects(readFile(join(root, '.generated/public/stale-private-canary.txt')), {code:'ENOENT'});
    await writeFile(join(root, 'CNAME'), 'wrong.example');
    await assert.rejects(preparePublic(root), /domain changes/);
    assert.equal(await readFile(join(root, '.generated/public/CNAME'), 'utf8'), 'mitko.mk');
    await rm(join(root, 'CNAME'));
    await assert.rejects(preparePublic(root), {code:'ENOENT'});
    await writeFile(join(root, 'CNAME'), 'mitko.mk');
    await symlink(join(root, 'CNAME'), join(root, 'assets/link'));
    await assert.rejects(preparePublic(root), /symbolic links/);
  } finally {await rm(root, {recursive:true,force:true});}
});

test('workflow isolates PR builds from Pages writes and requires a successful checked build', async () => {
  const workflow = parse(await readFile('.github/workflows/pages.yml', 'utf8'));
  assert.deepEqual(workflow.on.push.branches, ['master']);
  assert.deepEqual(workflow.on.pull_request.branches, ['master']);
  assert.equal(workflow.on.pull_request_target, undefined);
  assert.deepEqual(workflow.permissions, {contents:'read'});
  assert.equal(workflow.jobs.deploy.needs, 'build');
  assert.match(workflow.jobs.deploy.if, /github\.ref == 'refs\/heads\/master'/);
  assert.match(workflow.jobs.deploy.if, /github\.event_name == 'push'/);
  assert.match(workflow.jobs.deploy.if, /github\.repository == 'MitkoMitrov\/mitkomitrov.github.io'/);
  assert.equal(workflow.jobs.deploy.permissions.pages, 'write');
  assert.equal(workflow.jobs.deploy.permissions['id-token'], 'write');
  const steps = workflow.jobs.build.steps;
  const check = steps.findIndex(step => step.run === 'npm run check');
  const upload = steps.findIndex(step => step.uses?.startsWith('actions/upload-pages-artifact@'));
  assert.ok(check >= 0 && upload > check);
  assert.ok(steps.some(step => step.run === 'npm ci'));
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps) if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
  }
});
