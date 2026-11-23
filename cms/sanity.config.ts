import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {codeInput} from '@sanity/code-input'
import {article, table} from './schema.mjs'
import {BodyInput} from './BodyInput'
import {ArticlePreview} from './Preview'
import {PublicationStatus} from './PublicationStatus'

// Identifiers are public. Authentication and draft authorization stay in Sanity.
// There are no API tokens, GitHub credentials or analytics tags in this bundle.
const schema = {...article, fields: article.fields.map(field => field.name === 'body'
  ? {...field, components: {input: BodyInput}} : field)}
export default defineConfig({
  name: 'production', title: 'mitko.mk · Articles',
  projectId: 'o3i9jgij', dataset: 'production',
  plugins: [structureTool({defaultDocumentNode: (S, {schemaType}) => schemaType === 'article'
    ? S.document().views([S.view.form(), S.view.component(ArticlePreview).title('Preview'), S.view.component(PublicationStatus).title('Publication')])
    : S.document()}), codeInput()],
  schema: {types: [schema, table]},
  form: {components: {portableText: {plugins: props => props.renderDefault({
    ...props, plugins: {...props.plugins, table: {enabled: true}, typography: {enabled: false}},
  })}}},
})
