// One article type only. No image/file fields: dataset asset CDN URLs are public.
export const textBlock = {
  type: 'block',
  styles: [
    {title: 'Normal', value: 'normal'}, {title: 'Heading 2', value: 'h2'},
    {title: 'Heading 3', value: 'h3'}, {title: 'Small text (14px)', value: 'small'},
    {title: 'Large text (24px)', value: 'large'},
  ],
  marks: {
    decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}, {title: 'Inline code', value: 'code'}],
    annotations: [{name: 'link', type: 'object', fields: [
      {name: 'href', type: 'url', validation: rule => rule.uri({scheme: ['https', 'http', 'mailto']})},
    ]}],
  },
};
export const table = {
  name: 'table', type: 'object', fields: [
    {name: 'headerRows', type: 'number', initialValue: 1, validation: r => r.min(0).max(1).integer()},
    {name: 'rows', type: 'array', of: [{name: 'row', type: 'object', fields: [
      {name: 'cells', type: 'array', of: [{name: 'cell', type: 'object', fields: [
        {name: 'value', type: 'array', of: [textBlock]},
      ]}]},
    ]}]},
  ],
};
export const article = {
  name: 'article', title: 'Article', type: 'document', fields: [
    {name: 'title', type: 'string', validation: r => r.required()},
    {name: 'slug', type: 'slug', options: {source: 'title'}, validation: r => r.required()},
    {name: 'summary', type: 'text', validation: r => r.required()},
    {name: 'topic', type: 'string', validation: r => r.required()},
    {name: 'body', type: 'array', of: [textBlock, {type: 'table'}, {type: 'code'}], validation: r => r.required()},
  ],
};
