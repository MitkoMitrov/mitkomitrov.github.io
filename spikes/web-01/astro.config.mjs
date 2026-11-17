import {defineConfig} from 'astro/config';
const base = process.env.WEB01_BASE_PATH || '/';
export default defineConfig({output:'static', base,
  site:base === '/mitko-web01-publishing-test/' ? 'https://mitkomitrov.github.io' : 'https://example.invalid'});
