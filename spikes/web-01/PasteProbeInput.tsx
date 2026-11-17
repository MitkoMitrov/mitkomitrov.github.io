import {useCallback, useState} from 'react'
import {PortableTextInput, type PortableTextInputProps} from 'sanity'
import {observePaste} from './lib/paste-probe.mjs'
import {tablePasteResult} from './lib/table-paste.mjs'

type Observation = {html: boolean; plainText: boolean; portableText: boolean}

// Isolated WEB-01 input: native paste except for HTML tables.
export function PasteProbeInput(props: PortableTextInputProps) {
  const [lastPaste, setLastPaste] = useState<Observation | null>(null)
  const [pasteError, setPasteError] = useState<string | null>(null)
  const onPaste = useCallback<NonNullable<PortableTextInputProps['onPaste']>>(data => {
    observePaste(data.event.clipboardData, setLastPaste)
    setPasteError(null)
    try {
      const result = tablePasteResult(data.event.clipboardData, props.schemaType)
      if (result) return Promise.resolve(result)
    } catch (error) {
      setPasteError(`Table was not pasted: ${error instanceof Error ? error.message : 'Conversion failed.'}`)
      // Studio catches a rejected custom paste without inserting. Neither an
      // empty insert (which can alter the selection) nor native fallback is safe.
      return Promise.reject(new Error('Unsupported table paste cancelled.'))
    }
    return props.onPaste?.(data)
  }, [props.onPaste, props.schemaType])

  return <div>
    <p role="status" aria-live="polite" style={{fontSize: 13, margin: '0 0 12px'}}>
      {lastPaste
        ? `Last paste: ${lastPaste.html ? 'rich HTML received' : lastPaste.portableText ? 'Portable Text received' : lastPaste.plainText ? 'plain text only received' : 'no supported text received'}.`
        : 'WEB-01 paste check: paste into Body to check whether rich formatting reaches the editor.'}
      {' Clipboard contents are not logged or saved by this diagnostic.'}
    </p>
    {pasteError && <p role="alert">{pasteError}</p>}
    <PortableTextInput {...props} onPaste={onPaste} />
  </div>
}
