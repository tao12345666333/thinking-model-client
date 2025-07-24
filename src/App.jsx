import { useState, useMemo } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Settings from './components/Settings';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [profiles, setProfiles] = useLocalStorage('profiles', [
    {
      id: 'default',
      name: 'Default Profile',
      apiEndpoint: '',
      apiKey: '',
      model: 'DeepSeek-R1'
    }
  ]);

  const [summarizationProfile, setSummarizationProfile] = useLocalStorage('summarizationProfile', {
    id: 'default-summarization-profile',
    name: 'Summarization Profile',
    apiEndpoint: '',
    apiKey: '',
    model: 'DeepSeek-R1'
  });

  const [mcpServers, setMcpServers] = useLocalStorage('mcpServers', [], { disableCache: false });

  // 过滤出正在运行的 MCP 服务器
  const activeMcpServers = useMemo(() => {
    console.log('Filtering active MCP servers:', mcpServers);
    return mcpServers.filter(server => !server.isBuiltIn || server.isRunning);
  }, [mcpServers]);

  const [activeProfileId, setActiveProfileId] = useLocalStorage('activeProfileId', 'default');

  const [chats, setChats] = useLocalStorage('chats', []);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [streamingChats, setStreamingChats] = useState(new Set());

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const createNewChat = () => {
    // 生成一个新的聊天ID，确保它是唯一的
    const newChatId = Date.now();
    console.log(`Creating new chat with ID: ${newChatId}`);

    const newChat = {
      id: newChatId,
      title: 'New Conversation',
      messages: []
    };

    // 使用函数式更新来确保我们使用最新的聊天列表
    setChats(prevChats => {
      // 检查是否已经存在相同 ID 的聊天，避免重复
      const chatExists = prevChats.some(chat => chat.id === newChatId);
      if (chatExists) {
        console.log(`Chat with ID ${newChatId} already exists, not creating duplicate`);
        return prevChats;
      }

      console.log(`Adding new chat to chats array, current count: ${prevChats.length}, new count: ${prevChats.length + 1}`);
      return [...prevChats, newChat];
    });

    // 设置当前聊天ID
    setCurrentChatId(newChatId);
  };

  const deleteChat = (chatId) => {
    console.log(`Deleting chat with ID: ${chatId}`);

    // 使用函数式更新来确保我们使用最新的聊天列表
    setChats(prevChats => {
      const filteredChats = prevChats.filter(chat => chat.id !== chatId);
      console.log(`Removed chat, previous count: ${prevChats.length}, new count: ${filteredChats.length}`);
      return filteredChats;
    });

    // 如果删除的是当前活动的聊天，则将当前聊天ID设置为空
    if (currentChatId === chatId) {
      console.log(`Deleted chat was the current active chat, setting currentChatId to null`);
      setCurrentChatId(null);
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
    // 在移动设备上，如果侧边栏是展开的，点击收起按钮也应该关闭移动菜单
    if (window.innerWidth <= 768 && !sidebarCollapsed) {
      setMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    // 如果侧边栏是收起的，则展开它
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
    }
  };

  // 添加聊天到正在流式传输的列表
  const addStreamingChat = (chatId) => {
    setStreamingChats(prev => {
      const newSet = new Set(prev);
      newSet.add(chatId);
      return newSet;
    });
  };

  // 从正在流式传输的列表中移除聊天
  const removeStreamingChat = (chatId) => {
    setStreamingChats(prev => {
      const newSet = new Set(prev);
      newSet.delete(chatId);
      return newSet;
    });
  };

  // 检查聊天是否正在流式传输
  const isStreamingChat = (chatId) => {
    return streamingChats.has(chatId);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
  };

  const handleProfileSelect = (profileId) => {
    setActiveProfileId(profileId);
    setShowProfileDropdown(false);
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background-secondary">
      {/* Modern Enterprise Header */}
      <header className="flex justify-between items-center px-6 h-header bg-background-elevated border-b border-border shadow-sm">
        <div className="flex items-center gap-4">
          <button
            className="md:hidden bg-transparent border-0 text-lg text-muted cursor-pointer flex items-center justify-center z-10 w-10 h-10 rounded-lg hover:bg-background-secondary hover:text-primary transition-all duration-fast"
            onClick={toggleMobileMenu}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Brand Section */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent">Thinking Model Client</h1>
              <p className="text-xs text-muted hidden sm:block">Enterprise AI Assistant</p>
            </div>
          </div>
        </div>
        
        {/* Controls Section */}
        <div className="flex items-center gap-3">
          {/* Profile Selector */}
          <div className="relative">
            <button
              className="flex items-center gap-2 py-2 px-4 bg-background-secondary border border-border rounded-lg text-sm text-secondary hover:bg-background-tertiary hover:text-primary hover:border-primary transition-all duration-fast shadow-sm"
              onClick={toggleProfileDropdown}
            >
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-xs text-white font-medium">
                {activeProfile.name.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline font-medium">{activeProfile.name}</span>
              <svg className={`w-4 h-4 transition-transform duration-fast ${showProfileDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showProfileDropdown && (
              <div className="absolute top-full right-0 w-64 bg-background-elevated border border-border rounded-xl shadow-xl z-50 mt-2 animate-slide-up">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted uppercase tracking-wider border-b border-border mb-2">
                    Select Profile
                  </div>
                  {profiles.map(profile => (
                    <button
                      key={profile.id}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all duration-fast text-sm text-left ${
                        profile.id === activeProfileId 
                          ? 'bg-primary-light text-primary font-medium shadow-sm' 
                          : 'hover:bg-background-secondary text-secondary'
                      }`}
                      onClick={() => handleProfileSelect(profile.id)}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        profile.id === activeProfileId ? 'bg-primary text-white' : 'bg-background-tertiary text-muted'
                      }`}>
                        {profile.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{profile.name}</div>
                        <div className="text-xs text-muted truncate">{profile.model}</div>
                      </div>
                      {profile.id === activeProfileId && (
                        <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Settings Button */}
          <button
            className="flex items-center gap-2 py-2 px-4 bg-background-secondary border border-border rounded-lg text-sm text-secondary hover:bg-background-tertiary hover:text-primary hover:border-primary transition-all duration-fast shadow-sm"
            onClick={toggleSettings}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline font-medium">Settings</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="flex justify-between items-center py-3 px-4 border-b border-border">
            <h2 className="text-sm font-semibold text-light-text m-0">Conversations</h2>
            <button
              className="bg-transparent border-0 text-base text-lightest-text cursor-pointer flex items-center justify-center z-10 w-6 h-6 hover:text-text"
              onClick={toggleSidebar}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>
          <ChatList
            chats={chats}
            currentChat={chats.find(c => c.id === currentChatId)}
            onSelectChat={setCurrentChatId}
            onDeleteChat={deleteChat}
            onCreateNewChat={createNewChat}
            collapsed={sidebarCollapsed}
            isStreamingChat={isStreamingChat}
          />
        </div>

        {/* Floating expand button that appears when sidebar is collapsed */}
        <button
          className="expand-sidebar-button"
          onClick={toggleSidebar}
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          →
        </button>

        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          {currentChatId ? (
            <ChatWindow
              chat={chats.find(c => c.id === currentChatId)}
              profile={activeProfile}
              summarizationProfile={summarizationProfile}
              onUpdateChat={(updatedChat) => {
                setChats(chats.map(c =>
                  c.id === updatedChat.id ? updatedChat : c
                ));
              }}
              onCreateNewChat={createNewChat}
              addStreamingChat={addStreamingChat}
              removeStreamingChat={removeStreamingChat}
              isStreamingChat={isStreamingChat}
              allChats={chats}
              currentChatId={currentChatId}
              mcpServers={activeMcpServers}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-5 text-center">
              <h2 className="text-2xl font-semibold mb-2.5 text-text">Welcome to Thinking Model Client</h2>
              <p className="text-light-text mb-5 text-sm">Start a new conversation or select an existing one.</p>
              <button className="py-2.5 px-5 bg-primary text-white border-none rounded cursor-pointer text-sm transition-colors duration-200 hover:bg-primary-hover" onClick={createNewChat}>
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000]">
          <div className="bg-background rounded-lg w-[600px] max-w-[90%] max-h-[90vh] overflow-y-auto relative p-6 shadow-md">
            <button
              className="absolute top-4 right-4 bg-transparent border-none text-xl cursor-pointer text-lightest-text w-6 h-6 flex items-center justify-center rounded hover:bg-hover hover:text-text"
              onClick={toggleSettings}
            >
              ×
            </button>
              <Settings
              profiles={profiles}
              activeProfileId={activeProfileId}
              onSaveProfiles={(newProfiles) => {
                setProfiles(newProfiles);
                // Ensure the active profile still exists, otherwise select the first one
                if (!newProfiles.some(p => p.id === activeProfileId)) {
                  setActiveProfileId(newProfiles[0]?.id || null);
                }
              }}
              onSaveSummarizationProfile={setSummarizationProfile}
              summarizationProfile={summarizationProfile}
              mcpServers={mcpServers}
              onSaveMcpServers={setMcpServers}
              onChangeActiveProfile={setActiveProfileId}
              onCloseSettings={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 py-2.5 px-5 rounded text-sm shadow-md z-[1000]">
          Error: {error}
        </div>
      )}
      {loading && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-blue-50 text-blue-700 py-2.5 px-5 rounded text-sm shadow-md z-[1000]">
          Loading...
        </div>
      )}
    </div>
  );
}

export default App;
