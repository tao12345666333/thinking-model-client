import { useState } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Settings from './components/Settings';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [settings, setSettings] = useLocalStorage('settings', {
    apiEndpoint: '',
    apiKey: '',
    model: 'DeepSeek-R1'
  });
  
  const [chats, setChats] = useLocalStorage('chats', []);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  return (
    <div className="app-container">
      <div className="app-header">
        <h1 className="app-title">Thinking Model Client</h1>
        <button 
          className="settings-button" 
          onClick={toggleSettings}
        >
          Settings
        </button>
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
              settings={settings}
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
              settings={settings} 
              onSave={(newSettings) => {
                setSettings(newSettings);
                setShowSettings(false);
              }} 
              setSettings={setSettings}
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