import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {codeInput} from '@sanity/code-input'
import {article, table} from './schema.mjs'

// Public identifiers only. Never place API tokens or GitHub credentials here.
// Placeholder permits an offline Studio bundle build; it does NOT connect a project.
export default defineConfig({
  name: 'web01', title: 'WEB-01 article spike',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'web01spike',
  dataset: process.env.SANITY_STUDIO_DATASET || 'web01',
  plugins: [structureTool(), codeInput()],
  schema: {types: [article, table]},
  form: {components: {portableText: {plugins: props => props.renderDefault({
    ...props, plugins: {...props.plugins, table: {enabled: true}, typography: {enabled: false}},
  })}}},
})
