import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatWindow({ chat, profile, onUpdateChat }) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedThinks, setCollapsedThinks] = useState(new Set());
  const [partialResponse, setPartialResponse] = useState('');
  const [streamController, setStreamController] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, partialResponse]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Parse message to separate thinking process and content
  const parseMessage = (content) => {
    const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
    const mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    return {
      think: thinkMatch ? thinkMatch[1].trim() : null,
      content: mainContent
    };
  };

  // Toggle thinking process visibility
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
          apiKey: profile.apiKey,
          model: profile.model,
          apiEndpoint: profile.apiEndpoint,
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

  // Format the timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const handleCopyMessage = (content) => {
    navigator.clipboard.writeText(content).then(() => {
      // Show feedback by temporarily updating the copied message state
      setCopiedMessageId(content);
      setTimeout(() => setCopiedMessageId(null), 2000);
    });
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
              {message.role === 'assistant' && (
                <>
                  {parsedMessage.think && (
                    <div className="reasoning-container">
                      <div 
                        className="reasoning-header"
                        onClick={() => toggleThink(message.timestamp)}
                      >
                        <span>Reasoned for a few seconds</span>
                        <span className="toggle-icon">{collapsedThinks.has(message.timestamp) ? '▼' : '▲'}</span>
                      </div>
                      {!collapsedThinks.has(message.timestamp) && (
                        <div className="reasoning-content">
                          <ReactMarkdown>{parsedMessage.think}</ReactMarkdown>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="message-content">
                    <ReactMarkdown>{parsedMessage.content}</ReactMarkdown>
                    <button 
                      className={`copy-button ${copiedMessageId === message.content ? 'copied' : ''}`}
                      onClick={() => handleCopyMessage(message.content)}
                    >
                      {copiedMessageId === message.content ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </>
              )}
              
              {message.role === 'user' && (
                <div className="message-content">
                  <ReactMarkdown>{parsedMessage.content}</ReactMarkdown>
                  <button 
                    className={`copy-button ${copiedMessageId === message.content ? 'copied' : ''}`}
                    onClick={() => handleCopyMessage(message.content)}
                  >
                    {copiedMessageId === message.content ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
              
              {message.timestamp && (
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              )}
            </div>
          );
        })}
        
        {isLoading && (
          <div className="message assistant">
            <div className="message-content">
              <ReactMarkdown>{partialResponse}</ReactMarkdown>
              <span className="loading-cursor">|</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="chat-input">
        <textarea
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send a message..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button 
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;
