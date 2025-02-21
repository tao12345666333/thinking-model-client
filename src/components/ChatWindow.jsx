import React, { useState } from 'react';

function ChatWindow({ chat, settings, onUpdateChat }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedThinks, setCollapsedThinks] = useState(new Set());
  const [partialResponse, setPartialResponse] = useState('');
  const [streamController, setStreamController] = useState(null);

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

    // Cancel any ongoing stream
    if (streamController) {
      streamController.abort();
    }

    const newMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    const updatedChat = {
      ...chat,
      messages: [...chat.messages, newMessage]
    };
    onUpdateChat(updatedChat);
    setInput('');
    setPartialResponse('');

    // Create new AbortController for this stream
    const controller = new AbortController();
    setStreamController(controller);

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
        signal: controller.signal
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorData}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessage = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const message = line.replace(/^data: /, '');
          if (message === '[DONE]') break;

          try {
            const parsed = JSON.parse(message);
            const content = parsed.choices[0].delta.content || '';
            aiMessage.content += content;
            setPartialResponse(aiMessage.content);
          } catch (error) {
            console.error('Error parsing chunk:', error);
          }
        }
      }

      const finalChat = {
        ...updatedChat,
        messages: [...updatedChat.messages, aiMessage]
      };
      onUpdateChat(finalChat);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to send message:', error);
        alert(`Failed to send message: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
      setPartialResponse('');
      setStreamController(null);
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
              <div className="content-text">
                {partialResponse}
                <span className="loading-cursor">|</span>
              </div>
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
