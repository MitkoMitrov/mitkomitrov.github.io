import {spawnSync} from 'node:child_process';
import {writeFile, rm} from 'node:fs/promises';

const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run','build'], {
  stdio:'inherit', env:{...process.env, PORTFOLIO_PREVIEW:'1'},
});
if (result.status !== 0) process.exit(result.status || 1);
// Every Cloudflare deployment is a preview; GitHub Pages remains production.
await rm('dist/CNAME', {force:true});
await writeFile('dist/_headers', '/*\n  X-Robots-Tag: noindex, nofollow\n\n/publication.json\n  Access-Control-Allow-Origin: *\n');
await writeFile('dist/robots.txt', 'User-agent: *\nDisallow: /\n');
console.log('Prepared Cloudflare preview: no custom domain, noindex and disallowed crawling.');
