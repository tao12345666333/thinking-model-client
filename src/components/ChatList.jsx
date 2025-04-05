import React from 'react';

function ChatList({ chats, currentChat, onSelectChat, onDeleteChat, onCreateNewChat, collapsed, isStreamingChat }) {
  return (
    <div className="chat-list">
      <button className="new-chat" onClick={onCreateNewChat}>
        New Chat
      </button>
      {chats.length === 0 ? (
        <div className="empty-state">No conversations yet</div>
      ) : (
        chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === currentChat?.id ? 'active' : ''} ${isStreamingChat && typeof isStreamingChat === 'function' && isStreamingChat(chat.id) ? 'streaming' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <div className="flex items-center gap-1">
              {isStreamingChat && typeof isStreamingChat === 'function' && isStreamingChat(chat.id) && (
                <span className="streaming-dot"></span>
              )}
              <span>{chat.title}</span>
            </div>
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteChat(chat.id);
              }}
            >
              Delete
            </button>
          </div>
        ))
      )}
    </div>
  );
}

export default ChatList;
