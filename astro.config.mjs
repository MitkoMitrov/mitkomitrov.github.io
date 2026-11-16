import {defineConfig} from 'astro/config';

export default defineConfig({
  site: 'https://mitko.mk',
  output: 'static',
  // Existing assets/CV/CNAME remain the source of truth during the transition.
  publicDir: './.generated/public',
  compressHTML: false,
  devToolbar: {enabled: false},
});
