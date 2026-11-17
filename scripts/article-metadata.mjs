import {readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {parse} from 'yaml';
import {articleSchema, publishedEntries} from '../src/lib/article-model.mjs';

export async function readArticles(root = process.cwd()) {
  const directory = join(root, 'src/content/articles');
  const entries = [];
  for (const name of (await readdir(directory)).filter(name => name.endsWith('.md'))) {
    const markdown = await readFile(join(directory, name), 'utf8');
    const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
    if (!match) throw Error(`Missing article metadata: ${name}`);
    entries.push({id: name.slice(0, -3), data: articleSchema.parse(parse(match[1])), body: markdown.slice(match[0].length)});
  }
  return entries;
}
export async function readPublishedArticles(root = process.cwd()) {
  return publishedEntries(await readArticles(root));
}
