import {cp, lstat, mkdir, readdir, readFile, rm} from 'node:fs/promises';
import {join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const publicSources = ['assets', 'CV', 'CNAME'];

export async function filesUnder(path, prefix = '') {
  const stat = await lstat(path);
  if (stat.isSymbolicLink()) throw new Error(`Public assets cannot contain symbolic links: ${prefix}`);
  if (stat.isFile()) return [prefix];
  if (!stat.isDirectory()) throw new Error(`Unsupported public asset: ${prefix}`);
  const files = [];
  for (const name of (await readdir(path)).sort()) {
    files.push(...await filesUnder(join(path, name), prefix ? `${prefix}/${name}` : name));
  }
  return files;
}

export async function preparePublic(root = fileURLToPath(new URL('../', import.meta.url))) {
  const target = join(root, '.generated/public');
  if ((await readFile(join(root, 'CNAME'), 'utf8')).trim() !== 'mitko.mk') {
    throw new Error('CNAME must remain mitko.mk; domain changes require explicit review.');
  }
  // Validate every source before deleting stale generated files.
  for (const source of publicSources) await filesUnder(join(root, source), source);
  await rm(target, {recursive: true, force: true});
  await mkdir(target, {recursive: true});
  for (const source of publicSources) await cp(join(root, source), join(target, source), {recursive: true});
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await preparePublic();
  console.log('Prepared public assets, CV and unchanged CNAME.');
}
