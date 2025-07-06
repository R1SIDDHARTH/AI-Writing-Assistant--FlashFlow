"use client"

import type { Editor } from "@tiptap/react";
import {
  Bold, Italic, Underline, Strikethrough, Link,
  AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Palette, Indent, Outdent, ChevronDown, Highlighter
} from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import React from "react";

type ToolbarProps = {
  editor: Editor | null;
};

const fontFamilies = [
    { name: 'Inter', value: 'Inter, sans-serif' },
    { name: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
];

const fontSizes = ['12', '14', '16', '18', '24', '30', '36'];

export function TiptapToolbar({ editor }: ToolbarProps) {
  if (!editor) {
    return null;
  }

  const setLink = React.useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);
  
  const FONT_COLOR = "#000000";

  const colorInputRef = React.useRef<HTMLInputElement>(null);
  const highlightInputRef = React.useRef<HTMLInputElement>(null);
  const activeFontFamily = editor.getAttributes('textStyle').fontFamily?.split(',')[0].replace(/"/g, '') || 'Inter';

  return (
    <div className="border-input bg-transparent rounded-md p-1 flex items-center gap-1 flex-wrap">
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-[120px] justify-between">
                   <span className="truncate">{activeFontFamily}</span>
                   <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {fontFamilies.map(font => (
                    <DropdownMenuItem 
                        key={font.value} 
                        onClick={() => editor.chain().focus().setFontFamily(font.value).run()}
                        className={editor.isActive('textStyle', { fontFamily: font.value }) ? 'is-active' : ''}
                    >
                       {font.name}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-[70px] justify-between">
                   <span className="truncate">{editor.getAttributes('textStyle').fontSize?.replace('px','') || '16'}</span>
                   <ChevronDown className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {fontSizes.map(size => (
                    <DropdownMenuItem 
                        key={size} 
                        onClick={() => {
                            if (!editor.isActive('textStyle', { fontSize: `${size}px` })) {
                                editor.chain().focus().setFontSize(`${size}px`).run();
                            } else {
                                editor.chain().focus().unsetFontSize().run();
                            }
                        }}
                        className={editor.isActive('textStyle', { fontSize: `${size}px` }) ? 'is-active' : ''}
                    >
                       {size}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>

      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
       <Separator orientation="vertical" className="h-8 w-[1px] mx-1" />
       
        <input
            type="color"
            className="w-0 h-0 p-0 border-0 overflow-hidden absolute -z-10"
            ref={colorInputRef}
            onInput={(e) => editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()}
            defaultValue={FONT_COLOR}
        />
        <Toggle
            size="sm"
            pressed={editor.isActive('textStyle')}
            onClick={() => colorInputRef.current?.click()}
            title="Text Color"
        >
            <Palette className="h-4 w-4" />
        </Toggle>

        <input
            type="color"
            className="w-0 h-0 p-0 border-0 overflow-hidden absolute -z-10"
            ref={highlightInputRef}
            onInput={(e) => editor.chain().focus().toggleHighlight({ color: (e.target as HTMLInputElement).value }).run()}
        />
        <Toggle
            size="sm"
            pressed={editor.isActive('highlight')}
            onClick={() => highlightInputRef.current?.click()}
            title="Highlight Color"
        >
            <Highlighter className="h-4 w-4" />
        </Toggle>
       
       <Toggle
        size="sm"
        pressed={editor.isActive('link')}
        onPressedChange={setLink}
      >
        <Link className="h-4 w-4" />
      </Toggle>
       <Separator orientation="vertical" className="h-8 w-[1px] mx-1" />
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'left' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'center' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: 'right' })}
        onPressedChange={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Separator orientation="vertical" className="h-8 w-[1px] mx-1" />
       <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().sinkListItem('listItem').run()}
        disabled={!editor.can().sinkListItem('listItem')}
        >
          <Indent className="h-4 w-4"/>
      </Toggle>
       <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().liftListItem('listItem').run()}
        disabled={!editor.can().liftListItem('listItem')}
        >
          <Outdent className="h-4 w-4"/>
      </Toggle>
    </div>
  )
}
