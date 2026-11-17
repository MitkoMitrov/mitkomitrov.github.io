import {createHash} from 'node:crypto';
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {dirname} from 'node:path';
import {fetchPublished, publishedArticles, assertRevision} from './publication.mjs';

export const snapshotTarget = {projectId:'o3i9jgij', dataset:'web01'};
const canonical = value => Array.isArray(value) ? value.map(canonical)
  : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
function sortedArticles(documents) {
  const selected = publishedArticles(documents);
  if (selected.length !== documents.length) throw new Error('Snapshot must contain published articles only.');
  return [...selected].sort((a,b) => a._id.localeCompare(b._id));
}
export function snapshotDigest(documents) {
  return createHash('sha256').update(JSON.stringify(canonical(sortedArticles(documents)))).digest('hex');
}
export function parsePublicationRequest(value) {
  if (value == null) return null;
  if (typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).some(key => !['id','rev','operation'].includes(key))
    || typeof value.id !== 'string' || typeof value.rev !== 'string'
    || !/^[a-zA-Z0-9_-]{1,128}$/.test(value.id || '')
    || !/^[a-zA-Z0-9_-]{1,128}$/.test(value.rev || '')
    || !['publish','unpublish'].includes(value.operation)) throw new Error('Invalid publication request.');
  return {id:value.id, rev:value.rev, operation:value.operation};
}
export function assertPublicationRequest(documents, request) {
  if (!request) return;
  if (request.operation === 'unpublish') {
    if (documents.some(document => document._id === request.id)) throw new Error('Unpublish request is superseded: article is published.');
  } else assertRevision(documents, request);
}
export async function capturePublishedSnapshot({fetch = fetchPublished, request = null} = {}) {
  request = parsePublicationRequest(request);
  const articles = sortedArticles(await fetch(snapshotTarget.projectId, snapshotTarget.dataset));
  assertPublicationRequest(articles, request);
  return {version:1, ...snapshotTarget, request, digest:snapshotDigest(articles), articles};
}
export function validateSnapshot(snapshot) {
  if (snapshot.version !== 1 || snapshot.projectId !== snapshotTarget.projectId || snapshot.dataset !== snapshotTarget.dataset
    || snapshot.digest !== snapshotDigest(snapshot.articles)) throw new Error('Invalid or modified published snapshot.');
  assertPublicationRequest(snapshot.articles, parsePublicationRequest(snapshot.request));
  return snapshot;
}
export async function writeSnapshot(path, snapshot) {
  validateSnapshot(snapshot);
  await mkdir(dirname(path), {recursive:true});
  await writeFile(path, JSON.stringify(snapshot)+'\n');
}
export async function readSnapshot(path) {return validateSnapshot(JSON.parse(await readFile(path, 'utf8')));}
export async function assertSnapshotCurrent(snapshot, fetch = fetchPublished) {
  validateSnapshot(snapshot);
  const current = await capturePublishedSnapshot({fetch, request:snapshot.request});
  if (current.digest !== snapshot.digest) throw new Error('Published content changed after capture; rebuild before deployment.');
  return current.digest;
}
