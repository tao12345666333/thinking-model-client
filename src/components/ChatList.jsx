import React, { useState } from 'react';

function ChatList({ chats, currentChat, onSelectChat, onDeleteChat, onCreateNewChat, collapsed, isStreamingChat }) {
  const [hoveredChat, setHoveredChat] = useState(null);
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };
  
  const truncateTitle = (title, maxLength = 25) => {
    if (title.length <= maxLength) return title;
    return title.substring(0, maxLength) + '...';
  };

  return (
    <div className="flex flex-col h-full bg-background-elevated">
      {/* New Chat Button */}
      <div className="p-3 border-b border-border">
        <button 
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary hover:bg-primary-hover text-white border-none rounded-xl cursor-pointer text-sm font-medium transition-all duration-fast shadow-sm hover:shadow-md active:scale-[0.98]"
          onClick={onCreateNewChat}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Conversation</span>
        </button>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-2">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-background-secondary rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-secondary mb-2">No conversations yet</h3>
            <p className="text-xs text-muted">Start a new conversation to get started</p>
          </div>
        ) : (
          <div className="space-y-1">
            {chats.map(chat => {
              const isActive = chat.id === currentChat?.id;
              const isStreaming = isStreamingChat && typeof isStreamingChat === 'function' && isStreamingChat(chat.id);
              const isHovered = hoveredChat === chat.id;
              
              return (
                <div
                  key={chat.id}
                  className={`group relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-fast ${
                    isActive 
                      ? 'bg-primary-light border border-primary/20 shadow-sm' 
                      : 'hover:bg-background-secondary border border-transparent'
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                  onMouseEnter={() => setHoveredChat(chat.id)}
                  onMouseLeave={() => setHoveredChat(null)}
                >
                  {/* Streaming indicator */}
                  {isStreaming && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-info to-primary rounded-r-full animate-pulse" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Chat icon */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive ? 'bg-primary text-white' : 'bg-background-tertiary text-muted'
                      }`}>
                        {isStreaming ? (
                          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Chat title */}
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium truncate ${
                          isActive ? 'text-primary' : 'text-secondary'
                        }`}>
                          {truncateTitle(chat.title)}
                        </h4>
                        
                        {/* Message count and date */}
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted">
                            {chat.messages?.length || 0} messages
                          </span>
                          {chat.messages?.length > 0 && (
                            <span className="text-xs text-muted">
                              {formatDate(chat.messages[chat.messages.length - 1]?.timestamp || Date.now())}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete button */}
                  <button
                    className={`flex-shrink-0 ml-2 p-1.5 rounded-md transition-all duration-fast ${
                      isHovered || isActive 
                        ? 'opacity-100 hover:bg-error-light hover:text-error' 
                        : 'opacity-0 group-hover:opacity-100'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this conversation?')) {
                        onDeleteChat(chat.id);
                      }
                    }}
                    title="Delete conversation"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div className="text-xs text-muted text-center">
          {chats.length} conversation{chats.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

export default ChatList;
