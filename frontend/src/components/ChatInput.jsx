import React, { useState, useRef, useEffect } from "react";

export default function ChatInput({ onSendMessage, loading }) {
  const [input, setInput] = useState("");
  const [image, setImage] = useState(null);
  const [fileName, setFileName] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [inputMode, setInputMode] = useState("chat");
  
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const nameToUse = file.name;
      setFileName(nameToUse);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setShowMenu(false);
  };

  const handleCreateImageMode = () => {
    setInputMode("generate_image");
    setShowMenu(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() && !image || loading) return;

    if (inputMode === "generate_image") {
      const prompt = input.trim();
      setInput("");
      setInputMode("chat");
      
      const uniqueSeed = Math.floor(Math.random() * 1000000000);
      const generatedImageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${uniqueSeed}&nologo=true`;
      
      onSendMessage(prompt, { type: "ai-image", content: generatedImageUrl });
    } else {
      if (image) {
        // FIX: Check if the uploaded content is actually an image base64
        const isImgBase64 = image.startsWith("data:image/");
        const fallbackName = isImgBase64 ? "uploaded_image.png" : "Document File.docx";
        
        onSendMessage(input, { 
          type: isImgBase64 ? "local-image" : "local-file", 
          content: image, 
          fileName: fileName || fallbackName 
        });
      } else {
        onSendMessage(input, null);
      }
      setInput("");
      setImage(null);
      setFileName("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-3 sm:p-4 border-t border-gray-200 bg-white w-full flex flex-col gap-2 shrink-0">
      {image && (
        <div className="w-full max-w-3xl mx-auto relative flex items-center justify-between bg-white p-2.5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            {/\.(jpg|jpeg|png|webp|gif)$/i.test(fileName) || image.startsWith("data:image/") ? (
              <img src={image} alt="Upload preview" className="h-12 w-12 object-cover rounded-lg border border-gray-200 shrink-0" />
            ) : (
              <div className="h-12 w-12 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-xl border border-orange-100 shrink-0">
                📁
              </div>
            )}
            <div className="flex flex-col truncate">
              <span className="text-xs font-bold text-gray-800 truncate">{fileName || "Attached file"}</span>
              <span className="text-[10px] text-gray-400 font-medium">Ready to upload & analyze</span>
            </div>
          </div>
          <button 
            type="button" 
            onClick={() => { setImage(null); setFileName(""); }}
            className="bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-full p-1.5 transition-colors cursor-pointer shrink-0 ml-2"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 w-full max-w-3xl mx-auto bg-gray-50 border border-gray-300 rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all min-w-0">
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            className={`p-2 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer ${showMenu ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:text-blue-600 hover:bg-gray-200"}`}
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {showMenu && (
            <div className="absolute bottom-12 left-0 w-48 bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50 flex flex-col gap-0.5">
              <button
                type="button"
                onClick={() => { fileInputRef.current.accept = "image/*"; fileInputRef.current.click(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
              >
                📸 <span>Upload Photo</span>
              </button>
              <button
                type="button"
                onClick={() => { fileInputRef.current.accept = ".pdf,.txt,.doc,.docx,.js,.json,.html,.css,.csv"; fileInputRef.current.click(); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
              >
                📁 <span>Upload File</span>
              </button>
              <div className="h-px bg-gray-100 my-0.5 mx-1"></div>
              <button
                type="button"
                onClick={handleCreateImageMode}
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-semibold text-purple-700 hover:bg-purple-50 rounded-lg transition-all cursor-pointer"
              >
                🎨 <span>Create Image (AI)</span>
              </button>
            </div>
          )}
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
        />
        
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            loading 
              ? "Generating response..." 
              : inputMode === "generate_image"
                ? "Describe the image to generate..." 
                : image 
                  ? "Ask something about this attachment..."
                  : "Ask anything or generate art..."
          }
          className={`flex-1 min-w-0 px-1 py-1.5 bg-transparent text-sm focus:outline-none disabled:opacity-50 text-gray-800 ${inputMode === "generate_image" ? "placeholder-purple-400 font-medium" : ""}`}
          disabled={loading}
        />

        {inputMode === "generate_image" && (
          <button 
            type="button"
            onClick={() => setInputMode("chat")}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 px-1 shrink-0 cursor-pointer"
          >
            Cancel
          </button>
        )}
        
        <button
          type="submit"
          disabled={loading || (!input.trim() && !image)}
          className={`shrink-0 px-4 py-2 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed shadow-sm active:scale-95 ${inputMode === "generate_image" ? "bg-purple-600 hover:bg-purple-700 cursor-pointer" : "bg-blue-600 hover:bg-blue-700 cursor-pointer"}`}
        >
          {inputMode === "generate_image" ? "Generate" : image ? "Send" : "Send"}
        </button>
      </div>
    </form>
  );
}