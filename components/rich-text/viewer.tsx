"use client"

import React, { useCallback, useMemo } from 'react'
import { Editable, withReact, Slate, RenderLeafProps, RenderElementProps } from 'slate-react'
import { createEditor, Text } from 'slate'

import { cn } from "@/lib/utils"

interface RichTextViewerProps {
  value: string | null
  className?: string
  animate?: boolean
}

export function RichTextViewer({ value, className, animate = false }: RichTextViewerProps) {
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, [])
  
  const renderLeaf = useCallback((props: RenderLeafProps) => (
    <Leaf {...props} animate={animate} />
  ), [animate])
  
  const editor = useMemo(() => withReact(createEditor()), [])

  const initialValue = useMemo(() => {
    let nodes = [];
    if (!value) {
      nodes = [{ type: 'paragraph', children: [{ text: '' }] }];
    } else {
      try {
        nodes = JSON.parse(value);
      } catch (e) {
        nodes = [{ type: 'paragraph', children: [{ text: value }] }];
      }
    }

    // Traverse and tag nodes with cumulative start index for animation
    let currentIndex = 0;
    const tagNodes = (nodes: any[]): any[] => {
      return nodes.map(node => {
        if (Text.isText(node)) {
           const newNode = { ...node, __startIndex: currentIndex };
           currentIndex += node.text.length;
           return newNode;
        }
        if (node.children) {
          return { ...node, children: tagNodes(node.children) };
        }
        return node;
      });
    };
    
    return tagNodes(nodes);
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

const Leaf = ({ attributes, children, leaf, animate }: RenderLeafProps & { animate: boolean }) => {
  let content = children;

  if (animate && leaf.text) {
    const startIndex = (leaf as any).__startIndex || 0;
    content = (
      <span aria-label={leaf.text}>
        {leaf.text.split('').map((char, i) => (
          <span
            key={i}
            className="animate-brush-reveal inline-block opacity-0 origin-bottom"
            style={{ 
              animationDelay: `${(startIndex + i) * 0.02}s`,
              minWidth: char === ' ' ? '0.25em' : 'auto'
            }}
          >
            {char}
          </span>
        ))}
      </span>
    );
  }

  if ((leaf as any).bold) {
    content = <strong>{content}</strong>
  }

  if ((leaf as any).italic) {
    content = <em>{content}</em>
  }

  if ((leaf as any).underline) {
    content = <u>{content}</u>
  }

  return <span {...attributes}>{content}</span>
}
