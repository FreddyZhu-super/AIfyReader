import { Schema } from 'prosemirror-model'

// Define the Markdown document schema
// This mirrors CommonMark/GFM structure

const pDom = ['p', 0] as const
const liDom = ['li', 0] as const

export const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },

    paragraph: {
      content: 'inline*',
      group: 'block',
      parseDOM: [{ tag: 'p' }],
      toDOM: () => pDom
    },

    heading: {
      attrs: { level: { default: 1 }, id: { default: '' } },
      content: 'inline*',
      group: 'block',
      defining: true,
      parseDOM: [
        { tag: 'h1', attrs: { level: 1 } },
        { tag: 'h2', attrs: { level: 2 } },
        { tag: 'h3', attrs: { level: 3 } },
        { tag: 'h4', attrs: { level: 4 } },
        { tag: 'h5', attrs: { level: 5 } },
        { tag: 'h6', attrs: { level: 6 } }
      ],
      toDOM: (node) => [`h${node.attrs.level}`, { id: node.attrs.id }, 0]
    },

    blockquote: {
      content: 'block+',
      group: 'block',
      defining: true,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0]
    },

    code_block: {
      content: 'text*',
      group: 'block',
      code: true,
      defining: true,
      attrs: { language: { default: '' } },
      parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' as const }],
      toDOM: (node) => ['pre', { 'data-language': node.attrs.language }, ['code', 0]]
    },

    ordered_list: {
      content: 'list_item+',
      group: 'block',
      attrs: { order: { default: 1 } },
      parseDOM: [{ tag: 'ol' }],
      toDOM: (node) => ['ol', { start: node.attrs.order === 1 ? undefined : node.attrs.order }, 0]
    },

    bullet_list: {
      content: 'list_item+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', 0]
    },

    list_item: {
      content: 'paragraph block*',
      defining: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => liDom
    },

    horizontal_rule: {
      group: 'block',
      parseDOM: [{ tag: 'hr' }],
      toDOM: () => ['hr']
    },

    image: {
      inline: true,
      attrs: { src: {}, alt: { default: null as string | null }, title: { default: null as string | null } },
      group: 'inline',
      parseDOM: [{
        tag: 'img[src]',
        getAttrs: (dom: Element) => ({
          src: (dom as HTMLImageElement).getAttribute('src'),
          alt: (dom as HTMLImageElement).getAttribute('alt'),
          title: (dom as HTMLImageElement).getAttribute('title')
        })
      }],
      toDOM: (node) => ['img', node.attrs]
    },

    hard_break: {
      inline: true,
      group: 'inline',
      parseDOM: [{ tag: 'br' }],
      toDOM: () => ['br']
    },

    text: {
      group: 'inline'
    }
  },

  marks: {
    strong: {
      parseDOM: [{ tag: 'strong' }, { tag: 'b' }, { style: 'font-weight', getAttrs: (value: string) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null }],
      toDOM: () => ['strong', 0]
    },

    em: {
      parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
      toDOM: () => ['em', 0]
    },

    code: {
      parseDOM: [{ tag: 'code' }],
      toDOM: () => ['code', 0]
    },

    link: {
      attrs: { href: {}, title: { default: null as string | null } },
      inclusive: false,
      parseDOM: [{
        tag: 'a[href]',
        getAttrs: (dom: Element) => ({
          href: (dom as HTMLAnchorElement).getAttribute('href'),
          title: (dom as HTMLAnchorElement).getAttribute('title')
        })
      }],
      toDOM: (node) => ['a', node.attrs, 0]
    },

    strikethrough: {
      parseDOM: [{ tag: 'del' }, { tag: 's' }, { style: 'text-decoration=line-through' }],
      toDOM: () => ['del', 0]
    }
  }
})
