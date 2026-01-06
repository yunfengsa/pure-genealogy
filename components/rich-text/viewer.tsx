"use client"

import React, { useCallback, useMemo } from 'react'
import { Editable, withReact, Slate, RenderLeafProps, RenderElementProps } from 'slate-react'
import { createEditor, Text } from 'slate'

import { cn } from "@/lib/utils"

interface RichTextViewerProps {
  value: string | null
  className?: string
}

export function RichTextViewer({ value, className }: RichTextViewerProps) {
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, [])
  const editor = useMemo(() => withReact(createEditor()), [])

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
  }, [value])

  if (!value) {
      return <span className="text-muted-foreground">-</span>
  }

  return (
    <div className={cn("prose dark:prose-invert max-w-none", className)}>
      <Slate editor={editor} initialValue={initialValue}>
        <Editable
          readOnly
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          className="outline-none"
        />
      </Slate>
    </div>
  )
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
