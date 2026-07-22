import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock";

function CopyableLink({ url }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-2 max-w-full my-0.5 bg-gray-50 border border-gray-200 pl-3 pr-2 py-1 rounded-xl shadow-sm hover:border-blue-300 transition-all group">
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer" 
        className="text-blue-600 underline font-mono font-medium text-xs break-all hover:text-blue-800"
      >
        {url}
      </a>
      <button
        onClick={handleCopy}
        className="px-2 py-1 bg-white border border-gray-200 text-[10px] font-bold text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-800 transition-all select-none active:scale-90 cursor-pointer w-max shrink-0"
      >
        {copied ? "✓" : "📋 Copy"}
      </button>
    </span>
  );
}

function AIImageCard({ targetImageUrl }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="relative group overflow-hidden rounded-2xl border border-purple-200 shadow-md bg-purple-50/20 w-full min-h-65 flex items-center justify-center">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-linear-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse flex flex-col items-center justify-center gap-2 z-10">
          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-gray-500">Generating image...</span>
        </div>
      )}

      <img 
        src={targetImageUrl} 
        alt="AI Generated Output" 
        className={`w-full h-auto object-cover transition-opacity duration-500 ${
          imageLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setImageLoaded(true)}
      />
      {imageLoaded && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <a 
            href={targetImageUrl} 
            download="hadi-ai-art.jpg"
            target="_blank"
            rel="noreferrer"
            className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold shadow-lg hover:scale-105 transition-all cursor-pointer"
          >
            📥 Download High-Res
          </a>
        </div>
      )}
    </div>
  ); 
}

export default function ChatMessage({ message }) {
  const [showModal, setShowModal] = useState(false);
  const isUser = message.role === "user";

  const renderSmartContent = (rawText, imageUrl) => {
    const isPollinationsImg = rawText && typeof rawText === "string" && rawText.trim().startsWith("https://image.pollinations.ai/");
    const targetImageUrl = imageUrl || (isPollinationsImg ? rawText.trim() : null);

    if (targetImageUrl) {
      return (
        <div className="space-y-3 my-2 max-w-sm w-full">
          <AIImageCard targetImageUrl={targetImageUrl} />

          <span className="text-[11px] text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded-md border border-purple-100 block w-max">
            ✨ AI Generated Art
          </span>
          {rawText && !isPollinationsImg && (
            <p className="text-gray-700 text-sm mt-2 whitespace-pre-wrap">{rawText}</p>
          )}
        </div>
      );
    }

    if (!rawText) return null;

    const segments = rawText.split(/(https?:\/\/[^\s]+)/g);

    return (
      <div className="space-y-4 text-gray-800 leading-relaxed text-sm select-text w-full overflow-hidden wrap-break-words">
        {segments.map((segment, index) => {
          if (segment.startsWith("http://") || segment.startsWith("https://")) {
            let cleanUrl = segment;
            const lastChar = segment.slice(-1);
            if ([".", ",", ";", ")", "}"].includes(lastChar)) {
              cleanUrl = segment.slice(0, -1);
            }
            return <CopyableLink key={index} url={cleanUrl} />;
          }

          const formattedSegment = segment
            .replace(/(API Link:|Documentation:)/gi, "\n\n**$1**\n")
            .replace(/(([A-Za-z0-9\s\-\(\)]+)(API|Library|Resources):)/g, "\n\n### ⚙️ $1\n");

          return (
            <div key={index} className="prose prose-sm max-w-none text-gray-800 prose-strong:font-black prose-strong:text-gray-950 prose-strong:text-sm w-full wrap-break-words overflow-x-auto">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return !inline && match ? (
                      <CodeBlock
                        language={match[1]}
                        value={String(children).replace(/\n$/, "")}
                        {...props}
                      />
                    ) : (
                      <code className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded-md font-mono text-xs font-semibold break-all" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {formattedSegment}
              </ReactMarkdown>
            </div>
          );
        })}
      </div>
    );
  };

  const displayName = message.fileName || "Attached file";
  const isImageFile = /\.(jpg|jpeg|png|webp|gif)$/i.test(displayName) || (message.image && message.image.startsWith("data:image/"));

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-4 animate-fadeIn px-1 min-w-0`}>
      <div className={`max-w-[92%] sm:max-w-[85%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed min-w-0 ${
        isUser
          ? "bg-blue-600 text-white rounded-tr-none shadow-md shadow-blue-600/10 select-text"
          : "bg-white text-gray-800 rounded-tl-none border border-gray-200/80 shadow-sm select-text w-full"
      }`}>
        <div className={`font-bold text-xs mb-1.5 tracking-wide select-none ${isUser ? "text-blue-200" : "text-blue-600"}`}>
          {isUser ? "You" : "Hadi-AI"}
        </div>
        
        {isUser ? (
          <div className="space-y-2 w-full wrap-break-words overflow-hidden">
            {message.image && message.type !== "ai-image" && (
              <div className="mb-2">
                {isImageFile ? (
                  <img 
                    src={message.image} 
                    alt="Uploaded asset" 
                    onClick={() => setShowModal(true)}
                    className="max-w-full sm:max-w-xs max-h-48 object-cover rounded-xl border border-blue-400/40 shadow-sm mb-2 cursor-pointer hover:opacity-95 transition-all"
                  />
                ) : (
                  <div 
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-3 bg-white border border-gray-200 p-2.5 rounded-2xl text-gray-900 w-full max-w-xs shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                      📁
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="font-bold text-xs truncate text-gray-900 group-hover:text-blue-600 transition-colors">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-gray-500 font-medium">
                        Click to read or download
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
            {message.text && <p className="whitespace-pre-wrap wrap-break-words">{message.text}</p>}
          </div>
        ) : (
          renderSmartContent(message.text, message.image)
        )}
      </div>

      {/* Choice Modal (Read / Preview or Download) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 flex flex-col gap-4 text-gray-800">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-3 truncate">
                <span className="text-2xl">📁</span>
                <span className="font-bold text-sm text-gray-900 truncate">{displayName}</span>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-gray-500 font-bold transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              What You want Read File Or Download?
                </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  window.open(message.image, "_blank");
                  setShowModal(false);
                }}
                className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span className="text-lg">👁️</span>
                <span>Read / Preview</span>
              </button>

              <a
                href={message.image}
                download={displayName}
                target="_blank"
                rel="noreferrer"
                onClick={() => setShowModal(false)}
                className="flex flex-col items-center justify-center gap-1.5 p-3.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-2xl font-bold text-xs transition-all cursor-pointer shadow-xs"
              >
                <span className="text-lg">📥</span>
                <span>Download File</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}