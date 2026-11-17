import {getCollection} from 'astro:content';
import {articles as external} from '../data/articles.mjs';
import {mergeCatalogue, publishedEntries} from './article-model.mjs';

export async function getPublishedArticles() {
  return publishedEntries(await getCollection('articles'));
}
export async function getArticleCatalogue() {
  return mergeCatalogue(await getCollection('articles'), external);
}
