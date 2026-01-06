"use client"

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { Editable, withReact, useSlate, Slate, RenderLeafProps, RenderElementProps } from 'slate-react'
import {
  Editor,
  Transforms,
  createEditor,
  Descendant,
  Element as SlateElement,
  Text,
} from 'slate'
import { withHistory } from 'slate-history'

import { Button } from "@/components/ui/button"
import { Bold, Italic, Underline } from "lucide-react"
import { cn } from "@/lib/utils"

const HOTKEYS: Record<string, string> = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list']
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify']

interface RichTextEditorProps {
  value: string | null
  onChange: (value: string) => void
  maxLength?: number
  className?: string
}

export function RichTextEditor({ value, onChange, maxLength = 500, className }: RichTextEditorProps) {
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  const editor = useMemo(() => withHistory(withReact(createEditor())), [])

  // Parse initial state or default to empty paragraph
  const initialValue = useMemo(() => {
    if (!value) {
      return [{ type: 'paragraph', children: [{ text: '' }] }]
    }
    try {
      return JSON.parse(value)
    } catch (e) {
      // Fallback for plain text legacy data
      return [{ type: 'paragraph', children: [{ text: value }] }]
    }
  }, []) // Empty dependency array to only set initial value once

  // Keep track of internal state to update character count immediately
  const [internalValue, setInternalValue] = useState<Descendant[]>(initialValue)

  // Calculate current length
  const textContent = internalValue.map(n => Node.string(n)).join('\n')
  const currentLength = textContent.length

  const handleChange = (newValue: Descendant[]) => {
    setInternalValue(newValue)
    const newTextContent = newValue.map(n => Node.string(n)).join('\n')
    
    // Only trigger onChange if within limit or if deleting (length decreasing)
    // Actually, Slate's onChange is triggered after the change happened.
    // If we want to prevent typing, we need to handle onKeyDown.
    // Here we just serialize and pass back.
    
    onChange(JSON.stringify(newValue))
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Check limits
    if (maxLength && currentLength >= maxLength) {
        // Allow backspace, delete, arrows, etc.
        if (
            event.key !== 'Backspace' &&
            event.key !== 'Delete' &&
            !event.key.startsWith('Arrow') &&
            !event.metaKey &&
            !event.ctrlKey &&
            !event.altKey
        ) {
            event.preventDefault()
        }
    }

    for (const hotkey in HOTKEYS) {
      if (isHotkey(hotkey, event)) {
        event.preventDefault()
        const mark = HOTKEYS[hotkey]
        toggleMark(editor, mark)
      }
    }
  }

  return (
    <div className={cn("flex flex-col gap-2 rounded-md border p-2", className)}>
      <Slate editor={editor} initialValue={initialValue} onChange={handleChange}>
        <div className="flex items-center gap-1 border-b pb-2 mb-2">
          <MarkButton format="bold" icon={<Bold className="h-4 w-4" />} />
          <MarkButton format="italic" icon={<Italic className="h-4 w-4" />} />
          <MarkButton format="underline" icon={<Underline className="h-4 w-4" />} />
        </div>
        <div className="min-h-[150px]">
            <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder="请输入生平事迹..."
            spellCheck={false}
            onKeyDown={handleKeyDown}
            className="min-h-[150px] outline-none"
            />
        </div>
      </Slate>
      <div className={cn("text-xs text-right", currentLength > maxLength ? "text-red-500" : "text-muted-foreground")}>
        {currentLength} / {maxLength}
      </div>
    </div>
  )
}

const toggleMark = (editor: Editor, format: string) => {
  const isActive = isMarkActive(editor, format)

  if (isActive) {
    Editor.removeMark(editor, format)
  } else {
    Editor.addMark(editor, format, true)
  }
}

const isMarkActive = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? (marks as any)[format] === true : false
}

const Element = ({ attributes, children, element }: RenderElementProps) => {
  const style: React.CSSProperties = { textAlign: (element as any).align }
  switch ((element as any).type) {
    case 'block-quote':
      return (
        <blockquote style={style} {...attributes}>
          {children}
        </blockquote>
      )
    case 'bulleted-list':
      return (
        <ul style={style} {...attributes}>
          {children}
        </ul>
      )
    default:
      return (
        <p style={style} {...attributes}>
          {children}
        </p>
      )
  }
}

const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  if ((leaf as any).bold) {
    children = <strong>{children}</strong>
  }

  if ((leaf as any).italic) {
    children = <em>{children}</em>
  }

  if ((leaf as any).underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const MarkButton = ({ format, icon }: { format: string; icon: React.ReactNode }) => {
  const editor = useSlate()
  const active = isMarkActive(editor, format)
  
  return (
    <Button
      variant={active ? "default" : "ghost"}
      size="sm"
      className="h-8 w-8 p-0"
      onMouseDown={event => {
        event.preventDefault()
        toggleMark(editor, format)
      }}
    >
      {icon}
    </Button>
  )
}

// Utility to get plain text from nodes (simple recursive)
const Node = {
    string(node: any): string {
        if (Text.isText(node)) {
            return node.text
        }
        if (Array.isArray(node.children)) {
            return node.children.map(Node.string).join('')
        }
        return ''
    }
}
