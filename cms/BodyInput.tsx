import {useCallback, useState} from 'react'
import {PortableTextInput, type PortableTextInputProps} from 'sanity'
import {tablePasteResult} from './lib/table-paste.mjs'

export function BodyInput(props: PortableTextInputProps) {
  const [error, setError] = useState<string | null>(null)
  const onPaste = useCallback<NonNullable<PortableTextInputProps['onPaste']>>(data => {
    setError(null)
    try {
      const result = tablePasteResult(data.event.clipboardData, props.schemaType)
      if (result) return Promise.resolve(result)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Table conversion failed.')
      return Promise.reject(new Error('Unsupported table paste cancelled.'))
    }
    return props.onPaste?.(data)
  }, [props.onPaste, props.schemaType])
  return <div>
    <p style={{fontSize: 14}}>Use headings, lists, tables and language-labelled code. Small and Large are consistent site styles; arbitrary Word fonts and merged tables are not supported.</p>
    {error && <p role="alert">{error}</p>}
    <PortableTextInput {...props} onPaste={onPaste} />
  </div>
}
