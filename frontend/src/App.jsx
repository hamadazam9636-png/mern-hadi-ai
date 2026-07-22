import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ChatInput from "./components/ChatInput";
import useGemini from "./hooks/useGemini";
import Auth from "./components/Auth";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export default function App() {
  const { 
    messages, 
    loading, 
    sendMessage, 
    startNewChat, 
    sessions, 
    activeSessionId, 
    selectSession, 
    deleteSession 
  } = useGemini();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [localMessages, setLocalMessages] = useState([]);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const loggedInUser = localStorage.getItem("hadi_ai_logged_in_user");
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
    setAuthChecked(true);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("hadi_ai_logged_in_user");
    localStorage.removeItem("hadi_ai_token");
    localStorage.removeItem("token");
    setUser(null);
  };

  const handleUpdateSessionTitle = async (sessionId, text) => {
    if (!sessionId || !text) return;
    const currentSession = sessions.find((s) => s._id === sessionId || s.id === sessionId);
    if (!currentSession || currentSession.title === "New Chat" || currentSession.title === "New Workspace Chat" || !currentSession.title) {
      try {
        const token = localStorage.getItem("hadi_ai_token") || user?.token || localStorage.getItem("token");
        const generatedTitle = text.length > 30 ? text.substring(0, 30) + "..." : text;
        
        await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ title: generatedTitle })
        });
      } catch (err) {
        console.error("Failed to update session title:", err);
      }
    }
  };

  const handleSendMessage = async (text, image, isGeneratedImage = false) => {
    if (activeSessionId && text) {
      handleUpdateSessionTitle(activeSessionId, text);
    }

    const isImagePrompt = isGeneratedImage || 
      /generate image|create image|draw|make image|build image|photo of|picture of/i.test(text || "");

    if (isImagePrompt) {
      const cleanPrompt = text
        .replace(/generate image|create image|draw|make image|build image/gi, "")
        .trim();
        
      const promptToUse = cleanPrompt || text || "creative art";

      const encodedPrompt = encodeURIComponent(promptToUse);
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000000)}&nologo=true`;
      
      const userPromptMessage = { role: "user", text: text };

      const generatedImageMessage = { 
        role: "model", 
        text: "", 
        image: imageUrl 
      };

      if (activeSessionId) {
        const savedSessions = JSON.parse(localStorage.getItem("hadi_ai_sessions") || "[]");
        const updated = savedSessions.map(s => {
          if (s.id === activeSessionId || s._id === activeSessionId) {
            return {
              ...s,
              messages: [...(s.messages || []), userPromptMessage, generatedImageMessage]
            };
          }
          return s;
        });
        localStorage.setItem("hadi_ai_sessions", JSON.stringify(updated));
      }
      
      setLocalMessages(prev => [...prev, userPromptMessage, generatedImageMessage]);
    } else {
      sendMessage(text, image);
    }
  };

  const combinedMessages = activeSessionId 
    ? [...messages, ...localMessages.filter(lm => !messages.some(m => m.text === lm.text))]
    : [...messages, ...localMessages];

  const handleStartNewChat = () => {
    setLocalMessages([]);
    startNewChat();
  };

  const handleResetChat = async () => {
    if (!activeSessionId) return;

    try {
      let token = 
        localStorage.getItem("hadi_ai_token") || 
        user?.token || 
        localStorage.getItem("token");

      if (!token) {
        alert("No token found. Please Sign Out and Sign In again.");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/chat/messages/${activeSessionId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server Error: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setLocalMessages([]);
        if (selectSession) {
          selectSession(activeSessionId);
        } else {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Failed to reset chat:", error);
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-sm font-semibold text-gray-500">
        Authenticating Workspace...
      </div>
    );
  }

  if (!user) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white font-sans antialiased text-gray-900 select-none">
      <Sidebar 
        isOpen={sidebarOpen} 
        onNewChat={handleStartNewChat} 
        toggleSidebar={toggleSidebar}
        sessions={sessions}
        activeSessionId={activeSessionId}
        selectSession={selectSession}
        deleteSession={deleteSession}
      />

      <div className="flex flex-col flex-1 h-full min-w-0 bg-gray-50 overflow-hidden relative">
        <header className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-gray-200 bg-white shadow-sm md:px-6 w-full shrink-0 min-w-0">
          <div className="flex items-center gap-1.5 md:gap-3 min-w-0">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-1 hover:bg-gray-100 rounded-xl text-gray-600 md:hidden active:scale-95 transition-all shrink-0"
            >
              ☰
            </button>
            <h1 className="font-black text-gray-900 text-base sm:text-lg tracking-tight flex items-center gap-1.5 truncate">
              Hadi-AI <span className="text-[9px] sm:text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold border border-blue-100 shrink-0">PRO</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <button 
              onClick={handleLogout}
              className="text-[10px] sm:text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-2.5 cursor-pointer border border-red-200 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Sign Out
            </button>
            <button 
              onClick={handleResetChat}
              className="text-[10px] sm:text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold py-1.5 px-2.5 cursor-pointer border border-gray-200 rounded-xl transition-all shadow-sm active:scale-95"
            >
              Reset Chat
            </button>
          </div>
        </header>

        <ChatWindow messages={combinedMessages} loading={loading} />
        <ChatInput onSendMessage={handleSendMessage} loading={loading} />
      </div>
    </div>
  );
}