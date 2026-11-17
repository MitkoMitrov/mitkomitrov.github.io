import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {createClient} from '@sanity/client';
import fixture from '../fixtures/article.json' with {type:'json'};
import {runPrivateAcceptance, TEST_TARGET} from '../lib/private-acceptance.mjs';

const runId = 'a'.repeat(32);
const firstId = `drafts.web01-check-${runId}`;
const existingId = 'drafts.owner-article-must-stay';

// Real SDK requests against an isolated HTTP transport. This verifies runner
// guardrails/failure handling, not Sanity's actual cloud permission behavior.
async function harness(options, work) {
  const docs = new Map([[existingId, {_id:existingId, _type:'article', title:'Owner draft', _rev:'owner-r1'}]]);
  if (options.collision) docs.set(firstId, {_id:firstId, _type:'article', title:'Pre-existing document', _rev:'prior'});
  const before = structuredClone([...docs]);
  const requests = [], events = [];
  let rev = 0;
  const server = createServer(async (request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const authorized = request.headers.authorization === 'Bearer synthetic-owner-token';
    let input = '';
    for await (const chunk of request) input += chunk;
    const body = input ? JSON.parse(input) : undefined;
    requests.push({path:url.pathname, search:url.searchParams, authorized, body});
    const send = (status, value) => {response.writeHead(status, {'Content-Type':'application/json'}); response.end(JSON.stringify(value));};
    if (url.pathname.includes('/data/doc/')) {
      const ids = url.pathname.split('/').at(-1).split(',').map(decodeURIComponent);
      return send(200, {documents:ids.flatMap(id => docs.has(id) && (authorized || options.leak) ? [docs.get(id)] : []),
        omitted:ids.filter(id => !authorized || !docs.has(id)).map(id => ({id, reason:docs.has(id) ? 'permission' : 'existence'}))});
    }
    if (url.pathname.includes('/data/query/')) return send(200, {result:options.leak ? 1 : 0});
    if (!url.pathname.includes('/data/mutate/')) return send(404, {error:{description:'Unknown synthetic endpoint'}});
    if (!authorized) {
      assert.equal(url.searchParams.get('dryRun'), 'true');
      return send(403, {error:{description:'Permission denied'}});
    }
    const changes = new Map(structuredClone([...docs]));
    const results = [];
    for (const mutation of body.mutations) {
      if (mutation.create) {
        const value = mutation.create;
        if (changes.has(value._id)) return send(409, {error:{description:'Already exists'}});
        const document = {...value, _rev:`r${++rev}`, _createdAt:'2026-11-17T00:00:00Z', _updatedAt:'2026-11-17T00:00:00Z'};
        changes.set(value._id, document);
        results.push({id:value._id, operation:'create', document});
        if (options.lostCreateResponse && value._id === firstId) {
          docs.set(value._id, document);
          return send(503, {error:{description:'Lost response after write'}});
        }
      } else if (mutation.patch) {
        const patch = mutation.patch, old = changes.get(patch.id);
        if (patch.set?.title === 'STALE WRITE MUST NOT LAND') {
          if (options.staleStatus) return send(options.staleStatus, {error:{description:'Synthetic stale failure'}});
        }
        if (options.cleanupFailure && patch.set?.web01CheckRun) return send(503, {error:{description:'Cleanup unavailable'}});
        if (patch.ifRevisionID && patch.ifRevisionID !== old?._rev) return send(409, {error:{description:'Revision conflict'}});
        const document = {...old, ...patch.set, _rev:`r${++rev}`};
        changes.set(patch.id, document);
        results.push({id:patch.id, operation:'update', document});
      } else if (mutation.delete) {
        changes.delete(mutation.delete.id);
        results.push({id:mutation.delete.id, operation:'delete'});
      } else return send(400, {error:{description:'Unexpected mutation'}});
    }
    docs.clear();
    for (const [id, value] of changes) docs.set(id, value);
    send(200, {transactionId:`tx${rev}`, results});
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const config = {...TEST_TARGET, apiVersion:'2025-02-19', useCdn:false, perspective:'raw',
    apiHost:`http://127.0.0.1:${server.address().port}`, useProjectHostname:false, maxRetries:0};
  const owner = createClient({...config, token:'synthetic-owner-token'});
  const resume = createClient({...config, token:'synthetic-owner-token'});
  const anonymous = createClient(config);
  try {
    await work({docs, before, requests, events, owner, resume, anonymous,
      run:extra => runPrivateAcceptance({owner, resume, anonymous, fixture, runId, report:event => events.push(event), ...extra})});
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('private runner uses real SDK draft operations, round trips full body, rejects stale revision and cleans only its documents', async () => {
  await harness({}, async ({run, docs, before, requests, events}) => {
    const result = await run();
    assert.equal(result.state, 'passed', JSON.stringify(result));
    assert.equal(result.checks.length, 4);
    assert.deepEqual(result.cleanupPending, []);
    assert.deepEqual([...docs], before);
    const mutations = requests.flatMap(request => request.body?.mutations || []);
    assert.ok(mutations.length > 5);
    for (const mutation of mutations) {
      const id = mutation.create?._id || mutation.patch?.id || mutation.delete?.id;
      assert.ok(id.startsWith('drafts.web01-check-'));
    }
    assert.doesNotMatch(JSON.stringify(events), /synthetic-owner-token|Owner draft|<table>/);
  });
});

test('anonymous read leakage fails the check and still cleans its temporary draft', async () => {
  await harness({leak:true}, async ({run, docs, before}) => {
    const result = await run();
    assert.equal(result.state, 'failed');
    assert.equal(result.failure.check, 'anonymous-draft-read-and-dry-run-write-denial');
    assert.deepEqual([...docs], before);
  });
});

test('a transport error is not misreported as an expected revision conflict', async () => {
  await harness({staleStatus:503}, async ({run, docs, before}) => {
    const result = await run();
    assert.equal(result.state, 'failed');
    assert.equal(result.failure.statusCode, 503);
    assert.equal(result.failure.check, 'api-revision-guard-rejects-stale-write');
    assert.deepEqual([...docs], before);
  });
});

test('a lost create response still cleans a draft that the server actually created', async () => {
  await harness({lostCreateResponse:true}, async ({run, docs, before}) => {
    const result = await run();
    assert.equal(result.state, 'failed');
    assert.deepEqual([...docs], before);
    assert.deepEqual(result.cleanupPending, []);
  });
});

test('a collision never deletes or overwrites the pre-existing document', async () => {
  await harness({collision:true}, async ({run, docs, before}) => {
    assert.equal((await run()).state, 'failed');
    assert.deepEqual([...docs], before);
  });
});

test('failed cleanup reports exact synthetic IDs and cannot claim overall success', async () => {
  await harness({cleanupFailure:true}, async ({run}) => {
    const result = await run();
    assert.equal(result.state, 'failed');
    assert.deepEqual(result.cleanupPending, [firstId, `${firstId}-restore`]);
  });
});

test('wrong target and missing authentication fail before any HTTP request', async () => {
  await harness({}, async ({run, owner, requests}) => {
    await assert.rejects(run({owner:owner.withConfig({dataset:'production'})}), /disposable web01/);
    await assert.rejects(run({owner:owner.withConfig({token:undefined})}), /with-user-token/);
    await assert.rejects(run({runId:'drafts.owner-article-must-stay'}), /Invalid synthetic/);
    assert.equal(requests.length, 0);
  });
});
