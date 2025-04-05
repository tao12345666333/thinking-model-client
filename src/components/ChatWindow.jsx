import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import useMcp from '../hooks/useMcp';

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
  currentChatId,
  mcpServers
}) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collapsedThinks, setCollapsedThinks] = useState(new Set());
  const [partialResponse, setPartialResponse] = useState('');
  const [streamController, setStreamController] = useState(null);
  const [copiedMessageId, setCopiedMessageId] = useState(null);
  const [showMcpTools, setShowMcpTools] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize MCP hook
  const { getAllTools, executeTool } = useMcp(mcpServers);

  // 检测是否需要使用MCP工具来回答用户的问题
  const shouldUseMcpTool = (userInput) => {
    // 如果没有可用的MCP工具，则不使用
    const availableTools = getAllTools();
    if (!availableTools || availableTools.length === 0) {
      return false;
    }

    // 定义可能需要使用MCP工具的问题类型
    const informationQuestions = [
      'what is', 'who is', 'tell me about', 'how to', 'where is',
      'when was', 'why is', 'how does', 'what are', 'can you explain',
      'information about', 'details on', 'facts about', 'history of',
      'latest news', 'current events', 'recent developments'
    ];

    const weatherQuestions = [
      'weather', 'temperature', 'forecast', 'how hot', 'how cold',
      'is it raining', 'is it sunny', 'will it rain', 'climate'
    ];

    const calculationQuestions = [
      'calculate', 'compute', 'solve', 'what is', 'evaluate',
      'plus', 'minus', 'times', 'divided by', 'square root',
      'percentage', 'factorial', 'exponent', 'logarithm'
    ];

    // 检查用户输入是否包含这些问题类型的关键词
    const input = userInput.toLowerCase();

    // 检查是否是信息查询类型的问题
    const isInformationQuestion = informationQuestions.some(keyword => input.includes(keyword.toLowerCase()));

    // 检查是否是天气查询类型的问题
    const isWeatherQuestion = weatherQuestions.some(keyword => input.includes(keyword.toLowerCase()));

    // 检查是否是计算类型的问题
    const isCalculationQuestion = calculationQuestions.some(keyword => input.includes(keyword.toLowerCase()));

    // 如果是任何一种类型的问题，则可能需要使用MCP工具
    return isInformationQuestion || isWeatherQuestion || isCalculationQuestion;
  };

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

  // Handle MCP tool execution
  const handleExecuteMcpTool = async (serverId, toolName, parameters) => {
    try {
      setIsLoading(true);
      const result = await executeTool(serverId, toolName, parameters);

      // Add the tool execution and result to the chat
      const toolMessage = {
        role: 'user',
        content: `Executing MCP tool: ${toolName}`,
        timestamp: Date.now(),
        mcpTool: {
          serverId,
          toolName,
          parameters
        }
      };

      const resultMessage = {
        role: 'assistant',
        content: JSON.stringify(result, null, 2),
        timestamp: Date.now(),
        mcpResult: true
      };

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, toolMessage, resultMessage]
      };

      onUpdateChat(updatedChat);
      setShowMcpTools(false);
    } catch (error) {
      console.error('Error executing MCP tool:', error);

      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: `Error executing MCP tool: ${error.message}`,
        timestamp: Date.now(),
        error: true
      };

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, errorMessage]
      };

      onUpdateChat(updatedChat);
    } finally {
      setIsLoading(false);
    }
  };

  // 检测用户输入是否需要使用MCP工具
  const detectMcpToolRequest = (userInput) => {
    console.log('Detecting MCP tool request for:', userInput);
    // 获取所有可用的MCP工具
    const availableTools = getAllTools();
    if (!availableTools || availableTools.length === 0) {
      return null;
    }

    // 定义工具的意图模式和关键词
    const toolPatterns = {
      'web-search': {
        intents: ['search', 'find', 'look up', 'google', 'information about', 'tell me about', 'what is', 'who is'],
        paramExtractor: (input) => {
          // 尝试不同的模式来提取查询
          const patterns = [
            /search\s+for\s+([\w\s\d\-\.,?!]+)/i,
            /search\s+([\w\s\d\-\.,?!]+)/i,
            /find\s+([\w\s\d\-\.,?!]+)/i,
            /look\s+up\s+([\w\s\d\-\.,?!]+)/i,
            /information\s+about\s+([\w\s\d\-\.,?!]+)/i,
            /tell\s+me\s+about\s+([\w\s\d\-\.,?!]+)/i,
            /what\s+is\s+([\w\s\d\-\.,?!]+)/i,
            /who\s+is\s+([\w\s\d\-\.,?!]+)/i
          ];

          for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
              return { query: match[1].trim() };
            }
          }

          // 如果没有匹配到特定模式，使用整个输入作为查询
          return { query: input.trim() };
        }
      },
      'weather': {
        intents: ['weather', 'temperature', 'forecast', 'how hot', 'how cold', 'raining', 'sunny'],
        paramExtractor: (input) => {
          // 尝试不同的模式来提取位置
          const patterns = [
            /weather\s+in\s+([\w\s\d\-\.,]+)/i,
            /temperature\s+in\s+([\w\s\d\-\.,]+)/i,
            /forecast\s+for\s+([\w\s\d\-\.,]+)/i,
            /how\s+(?:hot|cold)\s+is\s+it\s+in\s+([\w\s\d\-\.,]+)/i,
            /is\s+it\s+(?:raining|sunny)\s+in\s+([\w\s\d\-\.,]+)/i
          ];

          for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
              return { location: match[1].trim() };
            }
          }

          // 如果没有指定位置，使用默认位置
          return { location: 'current location' };
        }
      },
      'calculator': {
        intents: ['calculate', 'compute', 'math', 'solve', 'what is', 'evaluate'],
        paramExtractor: (input) => {
          // 尝试不同的模式来提取表达式
          const patterns = [
            /calculate\s+([\d\+\-\*\/\(\)\s\.]+)/i,
            /compute\s+([\d\+\-\*\/\(\)\s\.]+)/i,
            /solve\s+([\d\+\-\*\/\(\)\s\.]+)/i,
            /what\s+is\s+([\d\+\-\*\/\(\)\s\.]+)/i,
            /evaluate\s+([\d\+\-\*\/\(\)\s\.]+)/i
          ];

          for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match && match[1]) {
              return { expression: match[1].trim() };
            }
          }

          // 如果没有匹配到特定模式，尝试提取数学表达式
          const mathExpressionMatch = input.match(/([\d\+\-\*\/\(\)\s\.]+)/i);
          if (mathExpressionMatch && mathExpressionMatch[1]) {
            return { expression: mathExpressionMatch[1].trim() };
          }

          return { expression: '' };
        }
      }
    };

    // 检查每个工具
    for (const tool of availableTools) {
      const toolPattern = toolPatterns[tool.name];

      // 如果有这个工具的模式定义
      if (toolPattern) {
        // 检查是否匹配任何意图
        const matchesIntent = toolPattern.intents.some(intent =>
          userInput.toLowerCase().includes(intent.toLowerCase())
        );

        if (matchesIntent) {
          // 提取参数
          const parameters = toolPattern.paramExtractor(userInput);

          return {
            tool,
            parameters
          };
        }
      } else {
        // 如果没有定义特定模式，使用简单的关键词匹配
        if (userInput.toLowerCase().includes(tool.name.toLowerCase())) {
          return {
            tool,
            parameters: {}
          };
        }
      }
    }

    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    if (!chat || !chat.messages) return; // Add safety check

    // 保存当前聊天的ID和用户输入，以便在异步操作中使用
    const currentChatID = chat.id;
    const userInput = input; // 保存用户输入，以便在流结束后仍能访问
    console.log(`Starting message send for chat ${currentChatID}`);

    // 检测是否需要使用MCP工具
    let toolRequest = detectMcpToolRequest(userInput);

    // 如果没有直接检测到工具请求，但问题类型可能需要使用MCP工具
    if (!toolRequest && shouldUseMcpTool(userInput)) {
      console.log('Question might benefit from MCP tools, trying to find a suitable tool...');

      // 获取所有可用的工具
      const availableTools = getAllTools();

      // 尝试找到最适合的工具
      if (userInput.toLowerCase().includes('weather') ||
          userInput.toLowerCase().includes('temperature') ||
          userInput.toLowerCase().includes('forecast')) {
        // 天气相关问题
        const weatherTool = availableTools.find(tool => tool.name === 'weather');
        if (weatherTool) {
          // 提取位置
          const locationMatch = userInput.match(/(?:in|at|for)\s+([\w\s,]+)(?:\?|\.|$)/i);
          const location = locationMatch ? locationMatch[1].trim() : 'current location';

          toolRequest = {
            tool: weatherTool,
            parameters: { location }
          };
        }
      } else if (userInput.match(/[\d\+\-\*\/\(\)]/)) {
        // 包含数学表达式
        const calculatorTool = availableTools.find(tool => tool.name === 'calculator');
        if (calculatorTool) {
          const expressionMatch = userInput.match(/([\d\+\-\*\/\(\)\s\.]+)/i);
          const expression = expressionMatch ? expressionMatch[1].trim() : '';

          toolRequest = {
            tool: calculatorTool,
            parameters: { expression }
          };
        }
      } else {
        // 其他信息查询问题
        const searchTool = availableTools.find(tool => tool.name === 'web-search');
        if (searchTool) {
          toolRequest = {
            tool: searchTool,
            parameters: { query: userInput }
          };
        }
      }
    }

    // 如果检测到工具请求，自动使用相应的工具
    if (toolRequest) {
      console.log(`Detected MCP tool request: ${toolRequest.tool.name}`);
      console.log(`Parameters: `, toolRequest.parameters);

      // 添加用户消息
      const newMessage = {
        role: 'user',
        content: userInput,
        timestamp: Date.now()
      };

      const updatedChat = {
        ...chat,
        messages: [...chat.messages, newMessage]
      };
      onUpdateChat(updatedChat);
      setInput('');

      // 执行工具
      try {
        setIsLoading(true);
        const result = await executeTool(toolRequest.tool.serverId, toolRequest.tool.name, toolRequest.parameters);

        // 添加工具执行结果消息
        let formattedResult = '';

        // 根据工具类型格式化结果
        if (toolRequest.tool.name === 'web-search') {
          formattedResult = `**Search Results:**\n\n`;
          if (result.links && Array.isArray(result.links)) {
            result.links.forEach((link, index) => {
              formattedResult += `${index + 1}. [${link.title}](${link.url})\n`;
            });
          } else {
            formattedResult += result.result || JSON.stringify(result, null, 2);
          }
        } else if (toolRequest.tool.name === 'weather') {
          formattedResult = `**Weather in ${result.location || 'the requested location'}:**\n\n`;
          formattedResult += `- Temperature: ${result.temperature || 'N/A'}\n`;
          formattedResult += `- Condition: ${result.condition || 'N/A'}\n`;
          formattedResult += `- Humidity: ${result.humidity || 'N/A'}\n`;
        } else if (toolRequest.tool.name === 'calculator') {
          formattedResult = `**Calculation Result:**\n\n`;
          formattedResult += `Expression: ${result.expression || toolRequest.parameters.expression}\n`;
          formattedResult += `Result: ${result.result !== undefined ? result.result : 'Error in calculation'}\n`;
        } else {
          // 其他工具类型的默认格式
          formattedResult = JSON.stringify(result, null, 2);
        }

        const toolMessage = {
          role: 'assistant',
          content: `I used the ${toolRequest.tool.name} tool to help answer your question.\n\n${formattedResult}`,
          timestamp: Date.now(),
          mcpResult: true
        };

        const finalChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, toolMessage]
        };

        onUpdateChat(finalChat);
      } catch (error) {
        console.error('Error executing MCP tool:', error);

        // 添加错误消息
        const errorMessage = {
          role: 'assistant',
          content: `I tried to use the ${toolRequest.tool.name} tool, but encountered an error: ${error.message}`,
          timestamp: Date.now(),
          error: true
        };

        const errorChat = {
          ...updatedChat,
          messages: [...updatedChat.messages, errorMessage]
        };

        onUpdateChat(errorChat);
      } finally {
        setIsLoading(false);
      }

      return;
    }

    // 如果不是工具请求，正常发送消息
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

  // Get all available MCP tools
  const mcpTools = getAllTools();

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
          {mcpTools.length > 0 && (
            <button
              className="mcp-tools-button"
              onClick={() => setShowMcpTools(!showMcpTools)}
              title="MCP Tools"
            >
              🧰
            </button>
          )}

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

        {showMcpTools && (
          <div className="mcp-tools-panel">
            <h3>Available MCP Tools</h3>
            <div className="mcp-tools-list">
              {mcpTools.map((tool, index) => (
                <div key={`${tool.serverId}-${tool.name}-${index}`} className="mcp-tool-item">
                  <div className="mcp-tool-header">
                    <strong>{tool.name}</strong>
                    <span className="mcp-server-name">({tool.serverName})</span>
                  </div>
                  <p className="mcp-tool-description">{tool.description}</p>
                  <button
                    className="mcp-tool-execute-button"
                    onClick={() => {
                      // For simplicity, we're not implementing parameter input UI
                      // In a real implementation, you would show a form for parameters
                      const parameters = {};
                      handleExecuteMcpTool(tool.serverId, tool.name, parameters);
                    }}
                  >
                    Execute
                  </button>
                </div>
              ))}
              {mcpTools.length === 0 && (
                <p className="no-tools-message">No MCP tools available. Add MCP servers in settings.</p>
              )}
            </div>
            <button
              className="close-mcp-tools-button"
              onClick={() => setShowMcpTools(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatWindow;
