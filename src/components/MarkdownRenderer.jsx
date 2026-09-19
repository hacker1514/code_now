import React from "react";
import { Play, Copy, Check } from "lucide-react";
import { toast } from "sonner";

/**
 * Custom High-Performance Markdown Renderer for Code Now AI Responses
 */
export function MarkdownRenderer({ content, onApplyCode, onCopyText }) {
  if (!content) return null;

  // Split content by code blocks: ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 select-text cursor-text text-neutral-200 font-mono text-xs leading-relaxed">
      {parts.map((part, index) => {
        // Handle Fenced Code Blocks
        if (part.startsWith("```")) {
          const match = part.match(/^```(\w+)?\n?([\s\S]*?)```$/);
          const lang = match ? match[1] || "code" : "code";
          const codeText = match ? match[2].trim() : part.replace(/^```|```$/g, "").trim();

          return (
            <div
              key={index}
              className="my-2.5 rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden shadow-lg select-text"
            >
              {/* Code Block Header Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-black border-b border-neutral-900 text-[11px] font-mono select-none">
                <span className="text-purple-400 font-bold uppercase tracking-wider">
                  {lang}
                </span>
                <div className="flex items-center gap-2">
                  {onApplyCode && (
                    <button
                      type="button"
                      onClick={() => onApplyCode(codeText)}
                      className="px-2 py-0.5 text-[10px] bg-purple-900/80 hover:bg-purple-800 text-purple-200 border border-purple-700/80 rounded transition flex items-center gap-1 cursor-pointer font-sans font-bold"
                      title="Apply code directly to Monaco editor"
                    >
                      <Play size={10} className="fill-purple-200" />
                      <span>Apply to Editor</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (onCopyText) {
                        onCopyText(codeText, "Code snippet copied!");
                      } else {
                        navigator.clipboard.writeText(codeText);
                        toast.success("Code snippet copied!");
                      }
                    }}
                    className="px-2 py-0.5 text-[10px] bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 rounded transition flex items-center gap-1 cursor-pointer font-sans"
                    title="Copy code snippet"
                  >
                    <Copy size={10} />
                    <span>Copy Code</span>
                  </button>
                </div>
              </div>

              {/* Code Display Area */}
              <pre className="p-3 overflow-x-auto text-xs font-mono leading-relaxed text-slate-100 bg-black/60 hide-scrollbar select-text whitespace-pre">
                {codeText}
              </pre>
            </div>
          );
        }

        // Render standard Markdown formatted paragraphs, headers, bold & inline code
        return (
          <div key={index} className="space-y-1.5">
            {part.split("\n").map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1" />;

              // Headers (# , ## , ### )
              if (line.startsWith("#")) {
                const headerText = line.replace(/^#+\s*/, "");
                return (
                  <h4
                    key={lIdx}
                    className="text-xs font-bold text-white border-b border-neutral-900 pb-1 mt-2 mb-1 flex items-center gap-1.5 font-mono"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    {renderFormattedInline(headerText)}
                  </h4>
                );
              }

              // Bullet lists (- , * , 1. )
              if (line.match(/^[\s]*[-*•]\s+/)) {
                const bulletText = line.replace(/^[\s]*[-*•]\s+/, "");
                return (
                  <div key={lIdx} className="flex items-start gap-2 ml-2 my-0.5 text-neutral-300">
                    <span className="text-purple-400 font-bold shrink-0">›</span>
                    <div>{renderFormattedInline(bulletText)}</div>
                  </div>
                );
              }

              // Ordered list (1. 2. )
              if (line.match(/^[\s]*\d+\.\s+/)) {
                const numMatch = line.match(/^[\s]*(\d+)\.\s+(.*)/);
                if (numMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 ml-2 my-0.5 text-neutral-300">
                      <span className="text-cyan-400 font-bold shrink-0">{numMatch[1]}.</span>
                      <div>{renderFormattedInline(numMatch[2])}</div>
                    </div>
                  );
                }
              }

              // Regular line
              return (
                <p key={lIdx} className="text-neutral-300 my-0.5">
                  {renderFormattedInline(line)}
                </p>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Formats inline Markdown (**bold**, `inline code`)
 */
function renderFormattedInline(text) {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((cPart, cIdx) => {
    if (cPart.startsWith("`") && cPart.endsWith("`")) {
      const codeSnippet = cPart.slice(1, -1);
      return (
        <code
          key={cIdx}
          className="bg-neutral-900 border border-neutral-800 text-purple-300 px-1.5 py-0.5 rounded text-[11px] font-mono inline-block mx-0.5"
        >
          {codeSnippet}
        </code>
      );
    }

    // Split by bold: **bold** or __bold__
    const boldParts = cPart.split(/(\*\*[\s\S]*?\*\*|__[\s\S]*?__)/g);

    return boldParts.map((bPart, bIdx) => {
      if ((bPart.startsWith("**") && bPart.endsWith("**")) || (bPart.startsWith("__") && bPart.endsWith("__"))) {
        const boldText = bPart.slice(2, -2);
        return (
          <strong key={bIdx} className="font-bold text-white">
            {boldText}
          </strong>
        );
      }
      return bPart;
    });
  });
}
