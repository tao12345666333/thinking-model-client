import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

function ChatWindow({
  chat,
  profile,
  summarizationProfile,
  onUpdateChat,
  onCreateNewChat,
  addStreamingChat,
  removeStreamingChat,
  isStreamingChat,
  allChats,
  currentChatId
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedThinks, setCollapsedThinks] = useState(new Set());
  const [partialResponse, setPartialResponse] = useState('');
  const [streamController, setStreamController] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chat && chat.messages) {
      scrollToBottom();
    }
  }, [chat, partialResponse]);

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
    if (!chat || !chat.messages) return; // Add safety check

    // 保存当前聊天的ID和用户输入，以便在异步操作中使用
    const currentChatID = chat.id;
    const userInput = input; // 保存用户输入，以便在流结束后仍能访问
    console.log(`Starting message send for chat ${currentChatID}`);

    // Cancel any ongoing stream for this chat
    if (streamController) {
      streamController.abort();
    }

    const newMessage = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    // 确保我们使用最新的聊天对象
    // 这是为了防止在创建新对话后立即发送消息时，使用了旧的聊天对象
    let targetChat = chat;
    if (allChats && Array.isArray(allChats)) {
      const foundChat = allChats.find(c => c && c.id === currentChatID);
      if (foundChat) {
        targetChat = foundChat;
      }
    }

    const updatedChat = {
      ...targetChat,
      messages: [...targetChat.messages, newMessage]
    };
    onUpdateChat(updatedChat);
    setInput('');
    setPartialResponse('');

    // Create new AbortController for this stream
    const controller = new AbortController();
    setStreamController(controller);

    // 标记当前聊天为正在流式传输
    if (typeof addStreamingChat === 'function') {
      console.log(`Adding chat ${currentChatID} to streaming chats`);
      addStreamingChat(currentChatID);
    }
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
          // Skip empty lines
          if (!line.trim()) continue;

          // Handle SSE format - remove 'data: ' prefix if present
          const message = line.replace(/^data: /, '');

          // Check for end of stream marker
          if (message === '[DONE]') break;

          try {
            // Try to parse the message as JSON
            let parsed;
            try {
              parsed = JSON.parse(message);
            } catch (parseError) {
              console.warn('Could not parse as JSON, trying to extract content:', message);
              // If it's not valid JSON but contains content, try to extract it
              const contentMatch = message.match(/"content":"([^"]*)"/);
              if (contentMatch && contentMatch[1]) {
                aiMessage.content += contentMatch[1];
                if (currentChatId === currentChatID) {
                  setPartialResponse(aiMessage.content);
                }
                console.log(`Extracted content from malformed JSON for chat ${currentChatID}`);
                continue;
              } else {
                // Log the error but don't throw - we want to continue processing other chunks
                console.error('Error parsing chunk:', parseError, 'Raw message:', message);
                continue;
              }
            }

            // Extract content from the parsed JSON - handle different response formats
            let content = '';
            if (parsed.choices && parsed.choices[0]) {
              if (parsed.choices[0].delta && parsed.choices[0].delta.content !== undefined) {
                // OpenAI streaming format
                content = parsed.choices[0].delta.content || '';
              } else if (parsed.choices[0].message && parsed.choices[0].message.content) {
                // Standard completion format
                content = parsed.choices[0].message.content;
              } else if (parsed.content) {
                // Simple content field
                content = parsed.content;
              }
            } else if (parsed.content) {
              // Direct content field
              content = parsed.content;
            }

            // Add the content to our message
            aiMessage.content += content;

            // 只有当前显示的聊天是正在接收消息的聊天时，才更新部分响应
            if (currentChatId === currentChatID) {
              setPartialResponse(aiMessage.content);
            }

            // 无论当前显示的是哪个聊天，都确保我们能找到正确的聊天对象
            // 这确保了即使用户切换到另一个聊天，消息仍然会被添加到正确的聊天中
            console.log(`Processing streaming response for chat ${currentChatID}`);
          } catch (error) {
            console.error('Error processing chunk:', error, 'Raw message:', message);
          }
        }
      }

      // 流结束后，找到目标聊天并更新它
      console.log(`Stream completed for chat ${currentChatID}, updating chat`);
      if (allChats && Array.isArray(allChats)) {
        // 重新获取最新的聊天列表，确保我们使用最新的数据
        const targetChat = allChats.find(c => c && c.id === currentChatID);

        // 检查目标聊天是否存在，并且有消息数组
        if (targetChat && targetChat.messages && Array.isArray(targetChat.messages) && aiMessage) {
          console.log(`Found target chat ${currentChatID}, adding AI message`);

          // 确保保留用户消息
          // 首先检查最后一条消息是否是用户消息
          const lastMessage = targetChat.messages[targetChat.messages.length - 1];
          let updatedMessages;

          if (lastMessage && lastMessage.role === 'user' && lastMessage.content === userInput) {
            // 如果最后一条是用户消息，且内容与当前用户输入匹配，保留它并添加AI回复
            updatedMessages = [...targetChat.messages, aiMessage];
          } else {
            // 如果最后一条不是用户消息或内容不匹配，先添加用户消息再添加AI回复
            // 创建与之前相同的用户消息
            const userMessage = {
              role: 'user',
              content: userInput,
              timestamp: Date.now() - 1000 // 稍早于AI消息
            };

            // 检查是否已经有相同内容的用户消息，避免重复
            const hasSameUserMessage = targetChat.messages.some(msg =>
              msg.role === 'user' && msg.content === userInput
            );

            if (hasSameUserMessage) {
              // 如果已经有相同的用户消息，只添加AI回复
              updatedMessages = [...targetChat.messages, aiMessage];
            } else {
              // 如果没有相同的用户消息，添加用户消息和AI回复
              updatedMessages = [...targetChat.messages, userMessage, aiMessage];
            }
          }

          const finalChat = {
            ...targetChat,
            messages: updatedMessages
          };

          if (typeof onUpdateChat === 'function') {
            onUpdateChat(finalChat);
          }

          // Generate summary title after first message exchange
          // 检查是否有一对用户和AI消息
          const hasUserMessage = finalChat.messages.some(msg => msg.role === 'user');
          const hasAssistantMessage = finalChat.messages.some(msg => msg.role === 'assistant');
          if (hasUserMessage && hasAssistantMessage && finalChat.title === 'New Conversation') {
            try {
              const summaryResponse = await fetch('/api/summarize', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  content: finalChat.messages.map(msg => msg.content).join('\n'),
                  apiKey: summarizationProfile?.apiKey || profile.apiKey || '',
                  model: summarizationProfile?.model || profile.model || 'gpt-3.5-turbo',
                  apiEndpoint: summarizationProfile?.apiEndpoint || profile.apiEndpoint || 'https://api.openai.com/v1'
                })
              });

              if (!summaryResponse.ok) {
                throw new Error(`Summary API error: ${summaryResponse.status}`);
              }

              const { summary } = await summaryResponse.json();
              const updatedChatWithTitle = {
                ...finalChat,
                title: summary
              };
              onUpdateChat(updatedChatWithTitle);
            } catch (error) {
              console.error('Failed to generate summary:', error);
              // Fallback to default title if summarization fails
              const updatedChatWithTitle = {
                ...finalChat,
                title: 'New Conversation'
              };
              onUpdateChat(updatedChatWithTitle);
            }
          }
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to send message:', error);
        alert(`Failed to send message: ${error.message}`);
      }
    } finally {
      // 无论成功还是失败，都从流式传输列表中移除聊天
      if (typeof removeStreamingChat === 'function') {
        console.log(`Removing chat ${currentChatID} from streaming chats`);
        removeStreamingChat(currentChatID);
      }

      // 只有当前显示的聊天是刚刚完成流式传输的聊天时，才重置加载状态和部分响应
      if (currentChatId === currentChatID) {
        console.log(`Resetting loading state for chat ${currentChatID}`);
        setIsLoading(false);
        setPartialResponse('');
      } else {
        // 如果当前显示的聊天不是刚刚完成流式传输的聊天
        // 这意味着用户已经切换到了另一个聊天
        // 我们不需要重置当前聊天的加载状态，因为它可能正在加载其他内容
        console.log(`User switched to another chat. Not resetting UI state for ${currentChatID}`);
      }

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
    <div className="chat-window relative">
      {/* Floating New Chat button */}
      <button
        onClick={() => {
          console.log('Floating new chat button clicked');
          // 在创建新聊天前添加一些日志
          if (typeof onCreateNewChat === 'function') {
            console.log('Calling onCreateNewChat function');
            onCreateNewChat();
            console.log('onCreateNewChat function called');
          } else {
            console.error('onCreateNewChat is not a function');
          }
        }}
        className="floating-new-chat"
        title="Create a new conversation"
      >
        <span className="text-xl">+</span>
      </button>
      <div className="chat-messages">
        {chat && chat.messages && chat.messages.map((message, index) => {
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

        {isLoading && chat && currentChatId === chat.id && (
          <div className="message assistant">
            <div className="message-content">
              <ReactMarkdown>{partialResponse}</ReactMarkdown>
              <span className="loading-cursor">|</span>
            </div>
          </div>
        )}

        {chat && isStreamingChat && isStreamingChat(chat.id) && !isLoading && (
          <div className="streaming-indicator">
            <span className="pulse-dot"></span>
            <span className="text-sm text-light-text ml-2">接收消息中...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="flex items-center gap-2 w-full">
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
          <div className="flex flex-col gap-2">
            <button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              className="send-button"
            >
              Send
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
