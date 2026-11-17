import {htmlToBlocks} from '@portabletext/block-tools';

// Browser-safe conversion for the Body input. No network, clipboard logging,
// document replacement or saved content: the editor inserts at its selection.
export function tablePasteResult(clipboard, schemaType, options = {}) {
  if (!clipboard || [...(clipboard.types || [])].some(type => type.includes('portable-text'))) return undefined;
  const html = clipboard.getData('text/html');
  if (!html || !schemaType.of.some(type => type.name === 'table')) return undefined;
  const parseHtml = options.parseHtml || (value => new DOMParser().parseFromString(value, 'text/html'));
  const document = parseHtml(html);
  if (!document.querySelector('table')) return undefined;
  // The schema has no representation for merged/nested cells or row headers.
  // Refuse these instead of silently flattening or changing their meaning.
  for (const table of document.querySelectorAll('table')) {
    if (table.querySelector('table')) throw new Error('Nested tables are not supported yet.');
    for (const [index, row] of [...table.rows].entries()) {
      for (const cell of row.cells) {
        if (cell.colSpan !== 1 || cell.rowSpan !== 1) throw new Error('Merged cells are not supported yet.');
      }
      const headers = [...row.cells].filter(cell => cell.tagName === 'TH').length;
      if (headers && (index !== 0 || headers !== row.cells.length)) {
        throw new Error('Only a complete first header row is supported yet.');
      }
    }
  }
  const keyGenerator = options.keyGenerator || (() => globalThis.crypto.randomUUID().replaceAll('-', ''));
  const convert = input => htmlToBlocks(input, schemaType, {
    parseHtml, keyGenerator,
    rules: [{deserialize(element, next, block) {
      if (element.nodeType !== 1) return undefined;
      if (['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'IMG'].includes(element.tagName)) return [];
      if (element.tagName !== 'TABLE') return undefined;
      return block({
        _type: 'table', _key: keyGenerator(),
        headerRows: [...element.rows[0]?.cells || []].some(cell => cell.tagName === 'TH') ? 1 : 0,
        rows: [...element.rows].map(row => ({
          _type: 'row', _key: keyGenerator(),
          cells: [...row.cells].map(cell => ({
            _type: 'cell', _key: keyGenerator(), value: convert(cell.innerHTML),
          })),
        })),
      });
    }}],
  });
  return {insert: convert(html)};
}
