import {toHTML} from '@portabletext/to-html';
export const escapeHTML = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderBody(body) {
  return toHTML(body, {onMissingComponent: (message) => {throw new Error(message)}, components: {
    block: {
      small: ({children}) => `<p class="text-small">${children}</p>`,
      large: ({children}) => `<p class="text-large">${children}</p>`,
    },
    marks: {link: ({value, children}) => {
      const href = value.href || '';
      if (!/^(https?:\/\/|mailto:)/i.test(href)) return children;
      return `<a href="${escapeHTML(href)}" rel="noopener noreferrer">${children}</a>`;
    }},
    types: {
      code: ({value}) => {
        const lang = /^[\w#+-]+$/.test(value.language) ? value.language : 'text';
        return `<figure class="code"><figcaption>${escapeHTML(lang)}</figcaption><pre><code class="language-${escapeHTML(lang)}">${escapeHTML(value.code)}</code></pre></figure>`;
      },
      table: ({value}) => {
        const rows = value.rows || [];
        const row = (r, header) => `<tr>${r.cells.map(c => `<${header ? 'th scope="col"' : 'td'}>${renderBody(c.value)}</${header ? 'th' : 'td'}>`).join('')}</tr>`;
        const count = value.headerRows === 1 ? 1 : 0;
        return `<div class="table-scroll" tabindex="0" role="region" aria-label="Article table"><table>${count ? `<thead>${row(rows[0], true)}</thead>` : ''}<tbody>${rows.slice(count).map(r => row(r, false)).join('')}</tbody></table></div>`;
      },
    },
  }});
}
