import { keymap } from 'prosemirror-keymap'
import { undo, redo } from 'prosemirror-history'
import {
  chainCommands,
  exitCode,
  joinDown,
  joinUp,
  lift,
  selectAll,
  selectNodeBackward,
  selectNodeForward,
  splitBlock,
  toggleMark,
  wrapIn
} from 'prosemirror-commands'
import { undoInputRule } from 'prosemirror-inputrules'
import type { Schema } from 'prosemirror-model'

export function buildKeymap(schema: Schema) {
  const keys: Record<string, (state: import('prosemirror-state').EditorState, dispatch?: import('prosemirror-model').Node) => boolean> = {}
  const bind = (key: string, cmd: (state: import('prosemirror-state').EditorState, dispatch?: import('prosemirror-model').Node) => boolean) => {
    keys[key] = cmd
  }

  // Basic formatting
  bind('Mod-z', undo)
  bind('Mod-Shift-z', redo)
  bind('Mod-y', redo)
  bind('Mod-b', toggleMark(schema.marks.strong))
  bind('Mod-i', toggleMark(schema.marks.em))
  bind('Mod-`', toggleMark(schema.marks.code))
  bind('Mod-k', toggleMark(schema.marks.link))

  // Undo input rule
  bind('Backspace', undoInputRule)

  // Selection
  bind('Mod-a', selectAll)

  // Block operations
  bind('Enter', splitBlock)
  bind('Mod-Enter', exitCode)
  bind('Shift-Enter', chainCommands(exitCode, (state, dispatch) => {
    if (dispatch) {
      dispatch(state.tr.replaceSelectionWith(schema.nodes.hard_break.create()).scrollIntoView())
    }
    return true
  }))

  // List handling
  bind('Tab', (state, dispatch) => {
    // Indent list item
    return false // TODO: implement indent
  })

  bind('Shift-Tab', (state, dispatch) => {
    // Dedent list item
    return false // TODO: implement dedent
  })

  return keymap(keys)
}
