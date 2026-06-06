import { inputRules, wrappingInputRule, textblockTypeInputRule, InputRule } from 'prosemirror-inputrules'
import type { Schema } from 'prosemirror-model'

// Heading rule: # H1, ## H2, etc.
function headingRule(schema: Schema) {
  return textblockTypeInputRule(
    /^(#{1,6})\s$/,
    schema.nodes.heading,
    (match) => ({ level: match[1].length })
  )
}

// Blockquote rule: >
function blockquoteRule(schema: Schema) {
  return wrappingInputRule(
    /^\s*>\s$/,
    schema.nodes.blockquote
  )
}

// Bullet list rule: -, *, +
function bulletListRule(schema: Schema) {
  return wrappingInputRule(
    /^\s*([-*+])\s$/,
    schema.nodes.bullet_list
  )
}

// Ordered list rule: 1.
function orderedListRule(schema: Schema) {
  return wrappingInputRule(
    /^(\d+)\.\s$/,
    schema.nodes.ordered_list,
    (match) => ({ order: Number(match[1]) }),
    (match) => match[1]
  )
}

// Horizontal rule: ---
function horizontalRuleRule(schema: Schema) {
  return new InputRule(/^---$/, (state, match, start, end) => {
    const tr = state.tr
    tr.replaceRangeWith(start, end, schema.nodes.horizontal_rule.create())
    return tr
  })
}

export function buildInputRules(schema: Schema) {
  return inputRules({
    rules: [
      headingRule(schema),
      blockquoteRule(schema),
      bulletListRule(schema),
      orderedListRule(schema),
      horizontalRuleRule(schema)
    ]
  })
}
