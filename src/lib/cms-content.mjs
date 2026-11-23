import {createHash} from 'node:crypto';
import {portableTextMarkdown} from './portable-text.mjs';
export {portableTextMarkdown} from './portable-text.mjs';
export const cmsTarget = {projectId:'o3i9jgij', dataset:'production'};
const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
export function cmsDigest(documents) {return createHash('sha256').update(JSON.stringify(canonical([...documents].sort((a,b) => a._id.localeCompare(b._id))))).digest('hex');}
export function validateCmsDocuments(documents) {
  if (!Array.isArray(documents)) throw Error('CMS response must be an array');
  const ids = new Set(), slugs = new Set();
  for (const doc of documents) {
    if (doc._type !== 'article' || !/^[a-zA-Z0-9_-]+$/.test(doc._id || '') || !/^[a-zA-Z0-9_-]+$/.test(doc._rev || '')) throw Error('Private or invalid CMS document');
    if (ids.has(doc._id) || slugs.has(doc.slug?.current)) throw Error('Duplicate CMS identity or slug');
    ids.add(doc._id); slugs.add(doc.slug?.current);
    portableTextMarkdown(doc.body);
  }
  return documents;
}
export async function fetchCmsDocuments(fetchImpl = fetch) {
  const query = '*[_type == "article" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]';
  const url = `https://${cmsTarget.projectId}.api.sanity.io/v2025-02-19/data/query/${cmsTarget.dataset}?perspective=published&query=${encodeURIComponent(query)}`;
  const response = await fetchImpl(url, {signal:AbortSignal.timeout(20000)});
  if (!response.ok) throw Error(`Published CMS request failed (${response.status})`);
  const result = await response.json();
  return validateCmsDocuments(result.result);
}
