import React from 'react';

function ChatList({ chats, currentChat, onSelectChat, onDeleteChat, onCreateNewChat }) {
  return (
    <div className="chat-list">
      <h2>Conversations</h2>
      <button className="new-chat" onClick={onCreateNewChat}>
        New Chat
      </button>
      {chats.length === 0 ? (
        <div className="empty-state">No conversations yet</div>
      ) : (
        chats.map(chat => (
          <div
            key={chat.id}
            className={`chat-item ${chat.id === currentChat?.id ? 'active' : ''}`}
            onClick={() => onSelectChat(chat.id)}
          >
            <span>{chat.title}</span>
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