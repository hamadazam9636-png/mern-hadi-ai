import React from "react";

export default function Sidebar({ isOpen, onNewChat, toggleSidebar, sessions, activeSessionId, selectSession, deleteSession }) {
  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      <aside className={`fixed md:static inset-y-0 left-0 w-64 bg-gray-950 text-gray-200 flex flex-col h-full border-r border-gray-800 transition-transform duration-300 z-50 shrink-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}>
        <div className="p-4 flex items-center justify-between border-b border-gray-900 gap-2">
          <button
            onClick={() => { onNewChat(); toggleSidebar(); }}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 hover:bg-gray-800 py-2 px-3 cursor-pointer rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95"
          >
            <span className="text-base font-bold">+</span> New Chat
          </button>
          <button onClick={toggleSidebar} className="p-2 md:hidden hover:bg-gray-900 rounded-lg text-gray-400 shrink-0 text-sm">
            ✕
          </button>
        </div>
        
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 custom-scrollbar min-w-0">
          <p className="text-xs text-gray-500 uppercase tracking-widest font-bold px-2 mb-2">Recent Chats</p>
          
          {sessions.length === 0 ? (
            <p className="text-xs text-gray-600 px-2 italic">No history available</p>
          ) : (
            sessions.map((session) => {
              const currentId = session._id || session.id;
              
              return (
                <div
                  key={currentId}
                  onClick={() => { selectSession(currentId); toggleSidebar(); }}
                  className={`group flex items-center justify-between text-xs sm:text-sm p-2.5 rounded-xl cursor-pointer border transition-all min-w-0 ${
                    currentId === activeSessionId
                      ? "bg-blue-600/10 text-blue-400 border-blue-500/30 font-medium"
                      : "bg-transparent text-gray-400 border-transparent hover:bg-gray-900 hover:text-gray-200"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2 min-w-0">
                    <span className="shrink-0">💬</span>
                    <span className="truncate">{session.title}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteSession(currentId, e);
                    }}
                    className="text-gray-500 hover:text-red-400 opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 rounded transition-opacity text-[10px] shrink-0"
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-900 text-[10px] text-gray-600 text-center font-medium tracking-wide">
          Hadi-AI v1.0
        </div>
      </aside>
    </>
  );
}