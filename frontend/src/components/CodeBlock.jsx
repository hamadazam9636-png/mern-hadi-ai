import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-gray-800 bg-gray-950 shadow-lg font-sans">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 text-xs text-gray-400 border-b border-gray-800/60 select-none">
        <span className="font-mono uppercase tracking-wider">{language || "text"}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-300 rounded-md transition-all active:scale-95"
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>
      <div className="overflow-x-auto text-sm leading-relaxed">
        <SyntaxHighlighter
          language={language || "text"}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem",
            background: "transparent",
            fontSize: "0.875rem",
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}