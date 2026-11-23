import {mkdir, rm, writeFile, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {articleSchema} from '../src/lib/article-model.mjs';
import {cmsTarget, cmsDigest, fetchCmsDocuments, validateCmsDocuments, portableTextMarkdown} from '../src/lib/cms-content.mjs';
import {readArticles} from './article-metadata.mjs';

export async function prepareCms(root = process.cwd(), documents, {request = process.env.CMS_PUBLICATION_EVENT ? JSON.parse(process.env.CMS_PUBLICATION_EVENT) : null} = {}) {
  // No token is accepted. Only the anonymous published perspective is fetched.
  const docs = documents === undefined ? await fetchCmsDocuments() : validateCmsDocuments(documents);
  const legacy = await readArticles(root);
  const ids = new Set(legacy.map(({data}) => data.articleId));
  const slugs = new Set(legacy.map(({data}) => data.slug));
  const entries = docs.map(doc => {
    const data = articleSchema.parse({
      articleId:doc.articleId, slug:doc.slug?.current, title:doc.title, summary:doc.summary,
      topic:doc.topic, tags:doc.tags, author:'Mitko Mitrov', published:doc.published,
      status:'published', ...(doc.updated ? {updated:doc.updated} : {}),
      ...(doc.thumbnail ? {thumbnail:doc.thumbnail} : {}),
    });
    if (ids.has(data.articleId) || slugs.has(data.slug)) throw Error('CMS article collides with an existing article');
    if (data.published > new Date().toISOString().slice(0,10)) throw Error('Scheduled CMS publication is not supported');
    ids.add(data.articleId); slugs.add(data.slug);
    return {documentId:doc._id, revision:doc._rev, data, body:portableTextMarkdown(doc.body)};
  });
  if (request) {
    if (!request || typeof request !== 'object' || Object.keys(request).some(k => !['id','rev','operation'].includes(k))
      || !/^[a-zA-Z0-9_-]+$/.test(request.id || '') || !/^[a-zA-Z0-9_-]+$/.test(request.rev || '')
      || !['publish','unpublish'].includes(request.operation)) throw Error('Invalid publication request');
    const current = docs.find(d => d._id === request.id);
    if (request.operation === 'publish' ? current?._rev !== request.rev : Boolean(current)) throw Error('Publication request has been superseded');
  }
  const snapshot = {version:1, ...cmsTarget, digest:cmsDigest(docs), documents:docs, entries};
  const target = join(root, '.generated/cms');
  // Validation completes before replacing the previous generated snapshot.
  await rm(target, {recursive:true,force:true});
  await mkdir(target, {recursive:true});
  for (const entry of entries) await writeFile(join(target, `${entry.data.slug}.md`), `---\n${JSON.stringify(entry.data)}\n---\n\n${entry.body}`);
  await writeFile(join(root,'.generated/cms-snapshot.json'), JSON.stringify(snapshot));
  console.log(`Prepared ${entries.length} published CMS articles.`);
  return snapshot;
}
export async function readCmsSnapshot(root = process.cwd()) {
  const snapshot = JSON.parse(await readFile(join(root,'.generated/cms-snapshot.json'),'utf8'));
  if (snapshot.version !== 1 || snapshot.projectId !== cmsTarget.projectId || snapshot.dataset !== cmsTarget.dataset
    || snapshot.digest !== cmsDigest(validateCmsDocuments(snapshot.documents))) throw Error('Invalid CMS snapshot');
  return snapshot;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) await prepareCms();
