import {useCallback, useState} from 'react'
import {PortableTextInput, type PortableTextInputProps} from 'sanity'
import {observePaste} from './lib/paste-probe.mjs'

type Observation = {html: boolean; plainText: boolean; portableText: boolean}

// Isolated WEB-01 diagnostic; no custom importer or content replacement.
export function PasteProbeInput(props: PortableTextInputProps) {
  const [lastPaste, setLastPaste] = useState<Observation | null>(null)
  const onPaste = useCallback<NonNullable<PortableTextInputProps['onPaste']>>(data => {
    observePaste(data.event.clipboardData, setLastPaste)
    return props.onPaste?.(data)
  }, [props.onPaste])

  return <div>
    <p role="status" aria-live="polite" style={{fontSize: 13, margin: '0 0 12px'}}>
      {lastPaste
        ? `Last paste: ${lastPaste.html ? 'rich HTML received' : lastPaste.portableText ? 'Portable Text received' : lastPaste.plainText ? 'plain text only received' : 'no supported text received'}.`
        : 'WEB-01 paste check: paste into Body to check whether rich formatting reaches the editor.'}
      {' Clipboard contents are not logged or saved by this diagnostic.'}
    </p>
    <PortableTextInput {...props} onPaste={onPaste} />
  </div>
}
