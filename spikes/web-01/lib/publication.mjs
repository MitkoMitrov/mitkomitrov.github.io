// Only public published data belongs in this module. No write token is accepted.
import {createClient} from '@sanity/client';
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function publishedArticles(docs) {
  const selected = docs.filter(d => d._type === 'article' && typeof d._id === 'string' && !d._id.includes('.'));
  const seen = new Set();
  for (const doc of selected) {
    if (!doc._rev || !doc.title || !doc.summary || !doc.topic || !doc.body?.length || !slugPattern.test(doc.slug?.current)) throw new Error('Invalid published article');
    if (seen.has(doc.slug.current)) throw new Error('Duplicate published slug');
    seen.add(doc.slug.current);
  }
  return selected;
}
export function assertRevision(docs, expected) {
  const doc = publishedArticles(docs).find(d => d._id === expected.id);
  if (!doc || doc._rev !== expected.rev) throw new Error('Superseded or missing published revision; rebuild latest');
  return doc;
}
export async function fetchPublished(projectId, dataset) {
  const client = createClient({projectId,dataset,apiVersion:'2025-02-19',useCdn:false,perspective:'published'});
  return publishedArticles(await client.fetch('*[_type == "article" && !(_id in path("drafts.**")) && !(_id in path("versions.**"))]'));
}
export function publicationEvent(doc) {
  if (!doc || doc._type !== 'article' || doc._id.includes('.')) return null;
  publishedArticles([doc]);
  return {event_type:'sanity-published',client_payload:{id:doc._id,rev:doc._rev}};
}
// A mockable server-side equivalent of a managed Sanity webhook, NOT browser code.
// Real deployment uses provider-managed delivery, not this helper.
export async function requestBuild(doc, {token, fetchImpl, repository}) {
  const event = publicationEvent(doc);
  if (!event) return {state:'draft-saved'};
  if (!token || !fetchImpl || !/^[\w-]+\/[\w.-]+$/.test(repository)) throw new Error('Server-only credentials/transport/destination required');
  const response = await fetchImpl(`https://api.github.com/repos/${repository}/dispatches`,{
    method:'POST',headers:{Authorization:`Bearer ${token}`,Accept:'application/vnd.github+json','Content-Type':'application/json','X-GitHub-Api-Version':'2026-03-10'},body:JSON.stringify(event),
  });
  if (response.status !== 204) throw new Error(`Build request rejected (${response.status})`);
  // 204 means dispatch accepted; it does NOT prove a workflow was queued or deployed.
  return {state:'requested',key:`${doc._id}@${doc._rev}`};
}
export function deploymentState(run, deployedRevision, wantedRevision) {
  if (deployedRevision === wantedRevision) return 'live';
  if (!run) return 'awaiting-build';
  if (run.status === 'queued' || run.status === 'waiting') return 'queued';
  if (run.status !== 'completed') return 'building';
  if (run.conclusion !== 'success') return 'failed';
  return 'awaiting-live-manifest';
}
