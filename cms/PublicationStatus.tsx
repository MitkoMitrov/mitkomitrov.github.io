import {useCallback, useEffect, useState} from 'react'

const actions = 'https://github.com/MitkoMitrov/mitkomitrov.github.io/actions'
export function PublicationStatus({document, documentId}: {document: {published?: {_id:string;_rev:string;slug?:{current?:string}}; displayed?: {_id?:string;slug?:{current?:string}}}; documentId:string}) {
  const [status, setStatus] = useState('Checking publication…')
  const [runUrl, setRunUrl] = useState(actions)
  const id = (documentId || document.displayed?._id || '').replace(/^drafts\./,'')
  const published = document.published
  const check = useCallback(async () => {
    try {
      const response = await fetch('https://mitko.mk/publication.json?check=' + Date.now(), {cache:'no-store'})
      if (!response.ok) throw Error('Manifest unavailable')
      const manifest = await response.json()
      const live = manifest.articles.find((entry: {_id?:string;id:string}) => entry.id === id)
      if (published && live?.rev === published._rev) {setStatus('Live · the deployed site confirms this published revision.'); return}
      if (!published && !live) {setStatus('Not published · no article appears in the deployed CMS manifest.'); return}
      const result = await fetch('https://api.github.com/repos/MitkoMitrov/mitkomitrov.github.io/actions/runs?event=repository_dispatch&per_page=20')
      if (!result.ok) throw Error('Workflow status unavailable')
      const data = await result.json()
      const key = published ? `${id}@${published._rev}` : `${id}@`
      const run = data.workflow_runs.find((r: {display_title:string}) => r.display_title.includes(key) && (published || r.display_title.endsWith('(unpublish)')))
      if (!run) {setStatus('Awaiting build · saved in Sanity, but no matching deployment is confirmed.'); return}
      setRunUrl(run.html_url)
      if (run.status === 'queued' || run.status === 'waiting' || run.status === 'pending') setStatus('Queued · the public site has not updated yet.')
      else if (run.status !== 'completed') setStatus('Building · the public site has not confirmed this revision yet.')
      else if (run.conclusion !== 'success') setStatus('Failed or unconfirmed · check the run log and live site before retrying.')
      else setStatus('Build completed · waiting for the live site to confirm this revision.')
    } catch {setStatus('Status unavailable · check GitHub Actions. This is not confirmation that the article is live.')}
  }, [id, published?._rev])
  useEffect(() => {check(); const timer = setInterval(() => {if (!globalThis.document.hidden) check()}, 120000); return () => clearInterval(timer)}, [check])
  return <div style={{padding:24,fontSize:16,lineHeight:1.6}}>
    <h2>Website publication</h2><p role="status" aria-live="polite">{status}</p>
    <p>Saving a draft does not deploy it. Publish saves the public revision in Sanity; the website updates only after a successful build.</p>
    <button onClick={check}>Refresh status</button> <a href={runUrl} target="_blank" rel="noopener noreferrer">Open GitHub Actions</a>
    {published?.slug?.current && <p><a href={`https://mitko.mk/articles/${encodeURIComponent(published.slug.current)}/`} target="_blank" rel="noopener noreferrer">Open public article</a></p>}
  </div>
}
