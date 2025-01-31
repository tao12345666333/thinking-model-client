import React, { useState } from 'react';

function ChatWindow({ chat, settings, onUpdateChat }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedThinks, setCollapsedThinks] = useState(new Set());

  // 添加解析消息的函数
  const parseMessage = (content) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return {
      think: thinkMatch ? thinkMatch[1].trim() : null,
      content: mainContent
    };
  };

  // 添加切换折叠状态的函数
  const toggleThink = (timestamp) => {
    const newCollapsed = new Set(collapsedThinks);
    if (newCollapsed.has(timestamp)) {
      newCollapsed.delete(timestamp);
    } else {
      newCollapsed.add(timestamp);
    }
    setCollapsedThinks(newCollapsed);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()  // 确保添加时间戳
    };

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, newMessage]
    };
    onUpdateChat(updatedChat);
    setInput('');

    // 发送API请求
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...updatedChat.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))],
          apiKey: settings.apiKey,
          model: settings.model,
          apiEndpoint: settings.apiEndpoint,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const data = await response.json();
      
      // 添加AI回复
      const aiMessage = {
        role: 'assistant',
        content: data.choices[0].message.content,
        timestamp: Date.now()
      };

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage]
      };
      onUpdateChat(finalChat);
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {chat.messages.map((message, index) => {
          const parsedMessage = message.role === 'assistant' 
            ? parseMessage(message.content)
            : { content: message.content, think: null };

          return (
            <div key={index} className={`message ${message.role}`}>
              <div className="message-content">
                {message.role === 'assistant' && parsedMessage.think && (
                  <div className="think-block">
                    <div 
                      className="think-header"
                      onClick={() => toggleThink(message.timestamp)}
                    >
                      Thinking Process {collapsedThinks.has(message.timestamp) ? '▼' : '▲'}
                    </div>
                    {!collapsedThinks.has(message.timestamp) && (
                      <div className="think-content">
                        {parsedMessage.think}
                      </div>
                    )}
                  </div>
                )}
                <div className="content-text">
                  {parsedMessage.content}
                </div>
              </div>
              {message.timestamp && (
                <div className="message-time">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <div className="loading-indicator">Thinking...</div>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <textarea
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
}

export default ChatWindow; 