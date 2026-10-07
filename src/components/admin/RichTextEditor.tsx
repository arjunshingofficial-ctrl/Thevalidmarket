"use client";

import React, { useRef, useEffect } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link as LinkIcon, Image as ImageIcon, Heading2, Heading3, Code, Quote } from "lucide-react";

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}

export default function RichTextEditor({ name, defaultValue = "", placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editorRef.current && defaultValue) {
      editorRef.current.innerHTML = defaultValue;
    }
  }, [defaultValue]);

  const execCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    updateHiddenInput();
  };

  const updateHiddenInput = () => {
    if (hiddenInputRef.current && editorRef.current) {
      hiddenInputRef.current.value = editorRef.current.innerHTML;
    }
  };

  const handleLink = () => {
    const url = prompt("Enter link URL:");
    if (url) execCommand("createLink", url);
  };

  const handleImage = () => {
    const url = prompt("Enter image URL:");
    if (url) execCommand("insertImage", url);
  };

  return (
    <div className="border rounded-md overflow-hidden bg-white focus-within:ring-2 focus-within:ring-primary/50">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-slate-50 text-slate-600">
        <button type="button" onClick={() => execCommand("formatBlock", "H2")} className="p-1.5 hover:bg-slate-200 rounded" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCommand("formatBlock", "H3")} className="p-1.5 hover:bg-slate-200 rounded" title="Heading 3"><Heading3 className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={() => execCommand("bold")} className="p-1.5 hover:bg-slate-200 rounded" title="Bold"><Bold className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCommand("italic")} className="p-1.5 hover:bg-slate-200 rounded" title="Italic"><Italic className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCommand("underline")} className="p-1.5 hover:bg-slate-200 rounded" title="Underline"><Underline className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={() => execCommand("insertUnorderedList")} className="p-1.5 hover:bg-slate-200 rounded" title="Bullet List"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCommand("insertOrderedList")} className="p-1.5 hover:bg-slate-200 rounded" title="Numbered List"><ListOrdered className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={() => execCommand("formatBlock", "BLOCKQUOTE")} className="p-1.5 hover:bg-slate-200 rounded" title="Quote"><Quote className="w-4 h-4" /></button>
        <button type="button" onClick={() => execCommand("formatBlock", "PRE")} className="p-1.5 hover:bg-slate-200 rounded" title="Code Block"><Code className="w-4 h-4" /></button>
        <div className="w-px h-4 bg-slate-300 mx-1" />
        <button type="button" onClick={handleLink} className="p-1.5 hover:bg-slate-200 rounded" title="Link"><LinkIcon className="w-4 h-4" /></button>
        <button type="button" onClick={handleImage} className="p-1.5 hover:bg-slate-200 rounded" title="Image"><ImageIcon className="w-4 h-4" /></button>
      </div>
      <div 
        ref={editorRef}
        contentEditable
        onInput={updateHiddenInput}
        onBlur={updateHiddenInput}
        className="p-4 min-h-[300px] outline-none prose prose-sm max-w-none"
        data-placeholder={placeholder}
      />
      <input type="hidden" name={name} ref={hiddenInputRef} defaultValue={defaultValue} />
    </div>
  );
}
