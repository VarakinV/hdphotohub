"use client";

import { useState } from "react";
import Editor, {
  Toolbar,
  BtnBold,
  BtnItalic,
  BtnBulletList,
  BtnNumberedList,
  createDropdown,
} from "react-simple-wysiwyg";

// Minimal headings dropdown: Paragraph, H1, H2, H3
const HeadingDropdown = createDropdown("Text", [
  ["Paragraph", "formatBlock", "P"],
  ["H1", "formatBlock", "H1"],
  ["H2", "formatBlock", "H2"],
  ["H3", "formatBlock", "H3"],
]);

export interface DescriptionEditorProps {
  name: string;
  value?: string; // controlled
  defaultValue?: string; // uncontrolled
  onChange?: (html: string) => void;
  placeholder?: string;
}

export default function DescriptionEditorClient({
  name,
  value,
  defaultValue = "",
  onChange,
  placeholder,
}: DescriptionEditorProps) {
  const isControlled = typeof value === "string";
  const [internal, setInternal] = useState<string>(defaultValue || "");
  const html = isControlled ? (value as string) : internal;

  function handleChange(e: any) {
    const next = e?.target?.value ?? "";
    if (!isControlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <div className="border rounded-md">
      {/* Keep list bullets visible even if a global reset removes them */}
      <style jsx global>{`
        .rsw-ce ul { list-style: disc; padding-left: 1.5rem; }
        .rsw-ce ol { list-style: decimal; padding-left: 1.5rem; }
      `}</style>

      {/* Hidden input so plain HTML forms (edit page) can submit the value */}
      <input type="hidden" name={name} value={html} />

      <Editor
        value={html}
        onChange={handleChange}
        placeholder={placeholder}
        containerProps={{ className: "rounded-md overflow-hidden" }}
      >
        <Toolbar>
          <HeadingDropdown />
          <BtnBold />
          <BtnItalic />
          <BtnBulletList />
          <BtnNumberedList />
        </Toolbar>
      </Editor>
    </div>
  );
}

