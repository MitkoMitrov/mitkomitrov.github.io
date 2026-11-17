import {defineCliConfig} from 'sanity/cli'
export default defineCliConfig({
  deployment: {appId: 'lmcoe9fx7g4l5s3sfbwfn0kl'},
  api: {
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'o3i9jgij',
  dataset: process.env.SANITY_STUDIO_DATASET || 'web01',
}})
