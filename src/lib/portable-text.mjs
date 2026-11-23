export const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const markdownText = value => String(value).replace(/([\\`*_{}\[\]<>#!|~.()+-])/g, '\\$1');
export const safeHref = value => typeof value === 'string' && /^(https?:\/\/|mailto:)/i.test(value) ? value : null;
function inline(block, html = false) {
  if (!Array.isArray(block.children)) throw Error('Article text must have children');
  const definitions = new Map((block.markDefs || []).map(mark => [mark._key, mark]));
  return block.children.map(span => {
    if (span._type !== 'span' || typeof span.text !== 'string') throw Error('Unsupported inline article content');
    let text = (html ? escapeHtml : markdownText)(span.text);
    for (const mark of span.marks || []) {
      if (mark === 'strong') text = html ? `<strong>${text}</strong>` : `**${text}**`;
      else if (mark === 'em') text = html ? `<em>${text}</em>` : `*${text}*`;
      else if (mark === 'code') {
        if (html) text = `<code>${escapeHtml(span.text)}</code>`;
        else {const fence = '`'.repeat(Math.max(0, ...(span.text.match(/`+/g) || []).map(s => s.length)) + 1); text = `${fence} ${span.text} ${fence}`;}
      } else {
        const definition = definitions.get(mark);
        if (definition?._type !== 'link') throw Error('Unsupported article text mark');
        const href = safeHref(definition.href);
        if (href) text = html ? `<a href="${escapeHtml(href)}">${text}</a>` : `[${text}](${href.replace(/[\s()<>\\]/g, c => encodeURIComponent(c))})`;
      }
    }
    return text;
  }).join('');
}
function tableHtml(value) {
  if (!Array.isArray(value.rows) || !value.rows.length) throw Error('Empty article table');
  const width = value.rows[0].cells?.length;
  if (!width || value.rows.some(r => !Array.isArray(r.cells) || r.cells.length !== width)) throw Error('Article table rows have inconsistent widths');
  const row = (r, header) => `<tr>${r.cells.map(c => {
    if (!Array.isArray(c.value) || c.value.some(b => b._type !== 'block')) throw Error('Unsupported article table cell');
    const tag = header ? 'th' : 'td';
    return `<${tag}${header ? ' scope="col"' : ''}>${c.value.map(b => inline(b, true)).join('<br>')}</${tag}>`;
  }).join('')}</tr>`;
  const head = value.headerRows === 1;
  return `<table>${head ? `<thead>${row(value.rows[0], true)}</thead>` : ''}<tbody>${value.rows.slice(head ? 1 : 0).map(r => row(r, false)).join('')}</tbody></table>`;
}
export function portableTextMarkdown(body) {
  if (!Array.isArray(body) || !body.length) throw Error('Empty article body');
  return body.map(block => {
    if (block._type === 'table') return `\n${tableHtml(block)}\n`;
    if (block._type === 'code') {
      if (typeof block.code !== 'string') throw Error('Invalid code block');
      const language = /^[a-z0-9#+-]+$/i.test(block.language || '') ? block.language : 'text';
      const fence = '`'.repeat(Math.max(2, ...(block.code.match(/`+/g) || []).map(s => s.length)) + 1);
      return `${fence}${language}\n${block.code}\n${fence}`;
    }
    if (block._type !== 'block') throw Error('Unsupported article block');
    if (block.style === 'small' || block.style === 'large') return `<p class="text-${block.style}">${inline(block, true)}</p>`;
    let prefix = block.style === 'h2' ? '## ' : block.style === 'h3' ? '### ' : '';
    if (block.style && !['normal','h2','h3'].includes(block.style)) throw Error('Unsupported article text style');
    if (block.listItem) {
      if (!['bullet','number'].includes(block.listItem) || !Number.isInteger(block.level || 1) || (block.level || 1) > 6) throw Error('Unsupported article list');
      prefix = '  '.repeat(Math.max(0, (block.level || 1) - 1)) + (block.listItem === 'bullet' ? '- ' : '1. ');
    }
    return prefix + inline(block);
  }).join('\n\n') + '\n';
}
