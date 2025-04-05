import { useState } from 'react';
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
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <div className="flex justify-between items-center px-5 h-header border-b border-border bg-background">
        <div className="flex items-center gap-2">
          <button
            className="md:hidden bg-transparent border-0 text-base text-lightest-text cursor-pointer flex items-center justify-center z-10 w-8 h-8 hover:text-text"
            onClick={toggleMobileMenu}
          >
            ☰
          </button>
          <h1 className="text-xl font-semibold text-text">Thinking Model Client</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <button
              className="py-1.5 px-3 bg-background border border-border rounded text-sm text-text cursor-pointer flex items-center gap-1.5"
              onClick={toggleProfileDropdown}
            >
              {activeProfile.name} ▼
            </button>
            {showProfileDropdown && (
              <div className="absolute top-full right-0 w-[200px] bg-background border border-border rounded shadow-md z-10 mt-1.5">
                {profiles.map(profile => (
                  <div
                    key={profile.id}
                    className={`p-3 cursor-pointer transition-colors duration-200 text-sm ${profile.id === activeProfileId ? 'bg-active font-medium' : 'hover:bg-hover'}`}
                    onClick={() => handleProfileSelect(profile.id)}
                  >
                    {profile.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            className="py-1.5 px-3 bg-background border border-border rounded text-sm text-text cursor-pointer hover:bg-hover"
            onClick={toggleSettings}
          >
            Settings
          </button>
        </div>
      </div>

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
