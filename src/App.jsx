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

  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Conversation',
      messages: []
    };
    setChats([...chats, newChat]);
    setCurrentChatId(newChat.id);
  };

  const deleteChat = (chatId) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
    }
  };

  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        <div className="flex items-center">
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
        <div className={`w-sidebar border-r border-border flex flex-col transition-[width] duration-300 ease-in-out bg-background ${sidebarCollapsed ? 'w-[50px] overflow-hidden' : ''}`}>
          <div className="flex justify-between items-center py-3 px-4 border-b border-border">
            <h2 className="text-sm font-semibold text-light-text m-0">Conversations</h2>
            <button
              className="bg-transparent border-0 text-base text-lightest-text cursor-pointer flex items-center justify-center z-10 w-6 h-6 hover:text-text"
              onClick={toggleSidebar}
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
          />
        </div>

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
