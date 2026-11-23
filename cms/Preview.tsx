import {useEffect, useState} from 'react'
import {toHTML} from '@portabletext/to-html'
import {codeToHtml} from 'shiki/bundle/web'
import css from '../src/styles/global.css?inline'
import {escapeHtml, safeHref, portableTextMarkdown} from '../src/lib/portable-text.mjs'

export function ArticlePreview({document}: {document: {displayed: Record<string, any>}}) {
  const [html, setHtml] = useState('')
  const [error, setError] = useState('')
  const article = document.displayed
  useEffect(() => {
    let active = true
    async function render() {
      // Same supported content boundary as the static compiler. Never send drafts
      // to a preview URL, remote service, analytics provider or public repository.
      portableTextMarkdown(article.body)
      const highlights = new Map<string, string>()
      for (const block of article.body || []) if (block._type === 'code') {
        const key = JSON.stringify([block.language, block.code])
        highlights.set(key, await codeToHtml(block.code, {lang:block.language || 'text', theme:'github-light'}))
      }
      const body = (value: any[]) => toHTML(value, {onMissingComponent: message => {throw Error(message)}, components: {
        block: {small: ({children}) => `<p class="text-small">${children}</p>`, large: ({children}) => `<p class="text-large">${children}</p>`},
        marks: {link: ({value, children}) => safeHref(value.href) ? `<a href="${escapeHtml(value.href)}">${children}</a>` : children},
        types: {
          code: ({value}) => `<figure class="code-block"><figcaption>${escapeHtml(value.language || 'text')}</figcaption>${highlights.get(JSON.stringify([value.language,value.code]))}</figure>`,
          table: ({value}) => {
            const row = (r: any, header: boolean) => `<tr>${r.cells.map((c: any) => `<${header ? 'th scope="col"' : 'td'}>${body(c.value)}</${header ? 'th' : 'td'}>`).join('')}</tr>`
            const head = value.headerRows === 1
            return `<div class="article-table" tabindex="0" role="region" aria-label="Article table"><table>${head ? `<thead>${row(value.rows[0],true)}</thead>` : ''}<tbody>${value.rows.slice(head ? 1 : 0).map((r: any) => row(r,false)).join('')}</tbody></table></div>`
          },
        },
      }})
      const result = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><style>${css}</style></head><body><article class="article-page"><header class="article-header"><p class="article-eyebrow">${escapeHtml(article.topic || '')} · Draft preview</p><h1>${escapeHtml(article.title || 'Untitled article')}</h1><p class="article-deck">${escapeHtml(article.summary || '')}</p><p class="article-byline">Mitko Mitrov · ${escapeHtml(article.published || '')}</p></header><div class="article-body">${body(article.body)}</div></article></body></html>`
      if (active) {setHtml(result); setError('')}
    }
    render().catch(() => {if (active) {setHtml(''); setError('Complete the article and use supported text, table and code blocks to preview.')}})
    return () => {active = false}
  }, [article])
  return <div style={{height:'100%',display:'flex',flexDirection:'column'}}>
    <p style={{padding:12,fontSize:14}}>Private local preview · shared site styles and code theme. Publication status is shown separately.</p>
    {error ? <p role="alert">{error}</p> : <iframe title="Private article preview" sandbox="" srcDoc={html} style={{flex:1,minHeight:600,border:0,width:'100%'}} />}
  </div>
}
