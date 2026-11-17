// Build accessible table containers and language-labelled code controls into HTML.
export function articleMarkup() {
  return tree => {
    function walk(parent) {
      if (!parent.children) return;
      parent.children = parent.children.map(node => {
        if (node.type === 'element' && node.tagName === 'pre') {
          node.properties = {...node.properties, tabIndex:0, role:'region', 'aria-label':'Code example'};
          const code = node.children?.find(child => child.tagName === 'code');
          const classes = code?.properties?.className || [];
          const language = node.properties['data-language'] || node.properties.dataLanguage || classes.find(value => value.startsWith('language-'))?.slice(9) || 'text';
          return {type:'element', tagName:'figure', properties:{className:['code-block']}, children:[
            {type:'element', tagName:'figcaption', properties:{}, children:[
              {type:'element', tagName:'span', properties:{}, children:[{type:'text', value:language}]},
              {type:'element', tagName:'button', properties:{type:'button', 'data-copy-code':'', hidden:true, 'aria-label':`Copy ${language} code`}, children:[{type:'text', value:'Copy code'}]},
            ]}, node,
          ]};
        }
        if (node.type === 'element' && node.tagName === 'table') {
          return {type:'element', tagName:'div', properties:{className:['article-table'], tabIndex:0, role:'region', 'aria-label':'Article table'}, children:[node]};
        }
        walk(node);
        return node;
      });
    }
    walk(tree);
  };
}
