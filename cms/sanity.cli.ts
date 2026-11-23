import {defineCliConfig} from 'sanity/cli'
export default defineCliConfig({
  api: {projectId: 'o3i9jgij', dataset: 'production'},
  // Deploy to a dedicated production Studio; keep the WEB-01 Studio untouched.
  studioHost: 'mitko-mk-editor',
})
