import {defineCliConfig} from 'sanity/cli'
export default defineCliConfig({api: {
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'o3i9jgij',
  dataset: process.env.SANITY_STUDIO_DATASET || 'web01',
}})
