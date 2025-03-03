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
    <div className="app-container">
      <div className="app-header">
        <div className="left-section">
          <h1 className="app-title">Thinking Model Client</h1>
        </div>
        <div className="right-section">
          <div className="profile-dropdown-container">
            <button 
              className="profile-dropdown-button" 
              onClick={toggleProfileDropdown}
            >
              {activeProfile.name} ▼
            </button>
            {showProfileDropdown && (
              <div className="profile-dropdown-menu">
                {profiles.map(profile => (
                  <div 
                    key={profile.id} 
                    className={`profile-option ${profile.id === activeProfileId ? 'active' : ''}`}
                    onClick={() => handleProfileSelect(profile.id)}
                  >
                    {profile.name}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            className="settings-button" 
            onClick={toggleSettings}
          >
            Settings
          </button>
        </div>
      </div>

      <div className="app-content">
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h2>Conversations</h2>
            <button 
              className="toggle-sidebar-button" 
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

        <div className="main-content">
          {currentChatId ? (
            <ChatWindow 
              chat={chats.find(c => c.id === currentChatId)}
              profile={activeProfile}
              onUpdateChat={(updatedChat) => {
                setChats(chats.map(c => 
                  c.id === updatedChat.id ? updatedChat : c
                ));
              }}
            />
          ) : (
            <div className="welcome-screen">
              <h2>Welcome to Thinking Model Client</h2>
              <p>Start a new conversation or select an existing one.</p>
              <button className="new-chat-button" onClick={createNewChat}>
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>

      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <button 
              className="close-settings-button" 
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
              onChangeActiveProfile={setActiveProfileId}
              onCloseSettings={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}
      {loading && (
        <div className="loading">
          Loading...
        </div>
      )}
    </div>
  );
}

export default App; 