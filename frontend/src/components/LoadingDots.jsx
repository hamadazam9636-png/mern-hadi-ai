import React from "react";

export default function LoadingDots() {
  return (
    <div className="flex space-x-1.5 items-center px-4 py-3 bg-white border border-gray-200 rounded-2xl max-w-24 shadow-sm">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
    </div>
  );
}