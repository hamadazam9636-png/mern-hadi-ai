import React, { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import LoadingDots from "./LoadingDots";

export default function ChatWindow({ messages, loading }) {
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div className="flex-1 p-3 sm:p-6 overflow-y-auto overflow-x-hidden bg-gray-50 flex flex-col selection:bg-blue-100 w-full min-w-0">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col h-full min-w-0">
        {messages.length === 0 && !loading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-4 border border-blue-100 animate-pulse">
              🤖
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-800 tracking-tight">Welcome to Workspace</h2>
            <p className="text-xs sm:text-sm text-gray-500 max-w-sm mt-2 leading-relaxed">
              I am your <span className="font-semibold text-blue-600">Hadi-AI</span> Assistant. Ask me anything, process information, or build automated media content.
            </p>
          </div>
        ) : (
          <div className="flex-1 w-full min-w-0">
            {messages.map((msg, index) => (
              <ChatMessage key={index} message={msg} />
            ))}
            
            {loading && (
              <div className="flex justify-start mb-4 pl-1">
                <LoadingDots />
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}