import {defineCliConfig} from 'sanity/cli'
export default defineCliConfig({api: {
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'web01spike',
  dataset: process.env.SANITY_STUDIO_DATASET || 'web01',
}})
