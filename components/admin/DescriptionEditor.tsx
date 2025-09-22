import dynamic from "next/dynamic";
import type { DescriptionEditorProps } from "./DescriptionEditor.client";

// SSR-safe dynamic import for the client editor
const DynamicEditor = dynamic(() => import("./DescriptionEditor.client"), {
  ssr: false,
});

export default function DescriptionEditor(props: DescriptionEditorProps) {
  return <DynamicEditor {...props} />;
}

