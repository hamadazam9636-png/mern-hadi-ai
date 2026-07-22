import { useState, useEffect } from "react";
import API from "../api";

export default function useGemini() {
  const [messages, setMessages] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await API.get("/chat/sessions");
      if (res.data.success) {
        setSessions(res.data.sessions);
        if (res.data.sessions.length > 0 && !activeSessionId) {
          selectSession(res.data.sessions[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load sessions:", err);
    }
  };

  const selectSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const res = await API.get(`/chat/messages/${sessionId}`);
      if (res.data.success) {
        setMessages(res.data.messages);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const startNewChat = async () => {
    try {
      const res = await API.post("/chat/sessions", { title: "New Workspace Chat" });
      if (res.data.success) {
        const newSession = { _id: res.data.sessionId, title: res.data.title };
        setSessions((prev) => [newSession, ...prev]);
        setActiveSessionId(res.data.sessionId);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to create new session:", err);
    }
  };

  const deleteSession = async (sessionId, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  const sendMessage = async (text, imagePayload) => {
    let currentSessionId = activeSessionId;

    if (!currentSessionId) {
      try {
        const titleText = text ? text.slice(0, 24) + "..." : "Image Upload Chat";
        const res = await API.post("/chat/sessions", { title: titleText });
        currentSessionId = res.data.sessionId;
        setActiveSessionId(currentSessionId);
        setSessions((prev) => [{ _id: currentSessionId, title: titleText }, ...prev]);
      } catch (err) {
        console.error("Session creation error:", err);
        return;
      }
    }

    setLoading(true);

    if (imagePayload && imagePayload.type === "ai-image") {
      const imageUrl = imagePayload.content;

      const userMsg = {
        _id: Date.now().toString() + "-u",
        sessionId: currentSessionId,
        role: "user",
        text: text,
        image: null,
      };

      const aiMsg = {
        _id: Date.now().toString() + "-ai",
        sessionId: currentSessionId,
        role: "model",
        text: imageUrl, 
        image: imageUrl,
      };

      setMessages((prev) => [...prev, userMsg, aiMsg]);

      try {
        await API.post("/chat/messages/save-direct", {
          sessionId: currentSessionId,
          userMsg,
          aiMsg,
        });
      } catch (err) {
        console.log("Direct save skipped/failed, keeping local state.");
      } finally {
        setLoading(false);
      }
      return;
    }

    let uploadedImageUrl = null;

    if (imagePayload && imagePayload.type === "local-image") {
      try {
        const response = await fetch(imagePayload.content);
        const blob = await response.blob();
        const formData = new FormData();
        
        // Use real filename passed from input component
        const isImage = blob.type.startsWith("image/");
        const originalName = imagePayload.fileName || (isImage ? "upload.jpg" : "document.txt");
        formData.append("image", blob, originalName);

        const uploadRes = await API.post("/chat/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (uploadRes.data.success) {
          uploadedImageUrl = uploadRes.data.url;
        }
      } catch (err) {
        console.error("File upload failed:", err);
      }
    }

    try {
      const res = await API.post("/chat/messages", {
        sessionId: currentSessionId,
        role: "user",
        text,
        image: uploadedImageUrl,
        type: "chat",
      });

      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.userMessage, res.data.aiMessage]);

        if (res.data.title && currentSessionId) {
          setSessions((prevSessions) =>
            prevSessions.map((s) =>
              s._id === currentSessionId ? { ...s, title: res.data.title } : s
            )
          );
        }
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    messages,
    loading,
    sendMessage,
    startNewChat,
    sessions,
    activeSessionId,
    selectSession,
    deleteSession,
  };
}