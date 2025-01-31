import { useState } from 'react';
import ChatList from './components/ChatList';
import ChatWindow from './components/ChatWindow';
import Settings from './components/Settings';
import useLocalStorage from './hooks/useLocalStorage';

function App() {
  const [settings, setSettings] = useLocalStorage('settings', {
    apiEndpoint: '',
    apiKey: ''
  });
  
  const [chats, setChats] = useLocalStorage('chats', []);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="app-container">
      <div className="sidebar">
        <ChatList
          chats={chats}
          currentChat={chats.find(c => c.id === currentChatId)}
          onSelectChat={setCurrentChatId}
          onDeleteChat={deleteChat}
          onCreateNewChat={createNewChat}
        />
        <div className="settings-wrapper">
          <Settings 
            settings={settings} 
            onSave={setSettings} 
            setSettings={setSettings}
          />
        </div>
      </div>
      <div className="main-content">
        {currentChatId && (
          <ChatWindow 
            chat={chats.find(c => c.id === currentChatId)}
            settings={settings}
            onUpdateChat={(updatedChat) => {
              setChats(chats.map(c => 
                c.id === updatedChat.id ? updatedChat : c
              ));
            }}
          />
        )}
      </div>
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