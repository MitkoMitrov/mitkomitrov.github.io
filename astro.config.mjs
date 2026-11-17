import {defineConfig} from 'astro/config';
import {articleMarkup} from './src/lib/remark-article.mjs';
import {unified} from '@astrojs/markdown-remark';

export default defineConfig({
  site: 'https://mitko.mk',
  output: 'static',
  markdown: {processor: unified({rehypePlugins: [articleMarkup]}), shikiConfig: {theme: 'github-light'}},
  // Existing assets/CV/CNAME remain the source of truth during the transition.
  publicDir: './.generated/public',
  compressHTML: false,
  devToolbar: {enabled: false},
});
