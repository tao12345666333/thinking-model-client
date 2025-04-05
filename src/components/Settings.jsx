import { useState } from 'react';

function Settings({
  profiles,
  activeProfileId,
  onSaveProfiles,
  onChangeActiveProfile,
  onCloseSettings,
  onSaveSummarizationProfile,
  summarizationProfile,
  mcpServers,
  onSaveMcpServers
}) {
  const [localProfiles, setLocalProfiles] = useState(profiles);
  const [localSummarizationProfile, setLocalSummarizationProfile] = useState(summarizationProfile || {
    id: 'default-summarization-profile',
    apiEndpoint: '',
    apiKey: '',
    model: 'DeepSeek-R1'
  });
  const [localMcpServers, setLocalMcpServers] = useState(mcpServers || []);
  const [editingProfileId, setEditingProfileId] = useState(activeProfileId);
  const [editingMcpServerId, setEditingMcpServerId] = useState(null);
  const [isHintExpanded, setIsHintExpanded] = useState(false);
  const [isMcpHintExpanded, setIsMcpHintExpanded] = useState(false);

  const editingProfile = localProfiles.find(p => p.id === editingProfileId) || localProfiles[0];
  const editingMcpServer = localMcpServers.find(s => s.id === editingMcpServerId) || null;

  const handleProfileChange = (updatedProfile) => {
    setLocalProfiles(localProfiles.map(p =>
      p.id === updatedProfile.id ? updatedProfile : p
    ));
  };

  const handleSummarizationProfileChange = (updatedProfile) => {
    setLocalSummarizationProfile(updatedProfile);
  };

  const handleMcpServerChange = (updatedServer) => {
    setLocalMcpServers(localMcpServers.map(s =>
      s.id === updatedServer.id ? updatedServer : s
    ));
  };

  const handleAddProfile = () => {
    const newId = `profile-${Date.now()}`;
    const newProfile = {
      id: newId,
      name: `New Profile ${localProfiles.length + 1}`,
      apiEndpoint: '',
      apiKey: '',
      model: 'DeepSeek-R1'
    };

    const updatedProfiles = [...localProfiles, newProfile];
    setLocalProfiles(updatedProfiles);
    setEditingProfileId(newId);
  };

  const handleDeleteProfile = (profileId) => {
    if (localProfiles.length <= 1) {
      alert("Cannot delete the last profile");
      return;
    }

    const updatedProfiles = localProfiles.filter(p => p.id !== profileId);
    setLocalProfiles(updatedProfiles);

    if (editingProfileId === profileId) {
      setEditingProfileId(updatedProfiles[0].id);
    }
  };

  const handleAddMcpServer = () => {
    const newId = `mcp-server-${Date.now()}`;
    const newServer = {
      id: newId,
      name: `MCP Server ${localMcpServers.length + 1}`,
      endpoint: '',
      authToken: '',
      description: ''
    };

    const updatedServers = [...localMcpServers, newServer];
    setLocalMcpServers(updatedServers);
    setEditingMcpServerId(newId);
  };

  const handleDeleteMcpServer = (serverId) => {
    const updatedServers = localMcpServers.filter(s => s.id !== serverId);
    setLocalMcpServers(updatedServers);

    if (editingMcpServerId === serverId) {
      setEditingMcpServerId(updatedServers.length > 0 ? updatedServers[0].id : null);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfiles(localProfiles);
    onSaveSummarizationProfile(localSummarizationProfile);
    if (onSaveMcpServers) {
      onSaveMcpServers(localMcpServers);
    }
    onChangeActiveProfile(editingProfileId);
    onCloseSettings();
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>

      <div className="profiles-section">
        <div className="profiles-header">
          <h3>Chat Profiles</h3>
          <button
            type="button"
            className="add-profile-button"
            onClick={handleAddProfile}
          >
            + Add Profile
          </button>
        </div>

        <div className="profiles-list">
          {localProfiles.map(profile => (
            <div
              key={profile.id}
              className={`profile-item ${profile.id === editingProfileId ? 'active' : ''}`}
              onClick={() => setEditingProfileId(profile.id)}
            >
              <span>{profile.name}</span>
              {localProfiles.length > 1 && (
                <button
                  className="delete-profile-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProfile(profile.id);
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {editingProfile && (
          <div className="current-profile-section">
            <h3>Edit Chat Profile: {editingProfile.name}</h3>

            <div className="setting-item">
              <label>Profile Name:</label>
              <input
                type="text"
                value={editingProfile.name}
                onChange={(e) => handleProfileChange({
                  ...editingProfile,
                  name: e.target.value
                })}
                placeholder="Enter profile name"
              />
            </div>

            <div className="setting-item">
              <label>API Endpoint:</label>
              <input
                type="text"
                value={editingProfile.apiEndpoint}
                onChange={(e) => handleProfileChange({
                  ...editingProfile,
                  apiEndpoint: e.target.value
                })}
                placeholder="Enter API endpoint"
              />
              <div className="setting-hint">
                <button
                  type="button"
                  className="hint-toggle"
                  onClick={() => setIsHintExpanded(!isHintExpanded)}
                >
                  {isHintExpanded ? 'Hide' : 'Show'} API Endpoint Format Examples
                </button>
                <div className={`hint-content ${isHintExpanded ? 'expanded' : ''}`}>
                  <p>API Endpoint format examples:</p>
                  <ul>
                    <li>Ends with / → /chat/completions will be appended</li>
                    <li>Ends with # → # will be removed</li>
                    <li>Other cases → /v1/chat/completions will be appended</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="setting-item">
              <label>API Key:</label>
              <input
                type="password"
                value={editingProfile.apiKey}
                onChange={(e) => handleProfileChange({
                  ...editingProfile,
                  apiKey: e.target.value
                })}
                placeholder="Enter your API key"
              />
            </div>

            <div className="setting-item">
              <label>Model:</label>
              <input
                type="text"
                value={editingProfile.model}
                onChange={(e) => handleProfileChange({
                  ...editingProfile,
                  model: e.target.value
                })}
                placeholder="Enter model name (e.g., DeepSeek-R1)"
              />
            </div>
          </div>
        )}


      <div className="profiles-section">
        <h3>Summarization Profile</h3>
        <div className="current-profile-section">
          <div className="setting-item">
            <label>API Endpoint:</label>
            <input
              type="text"
              value={localSummarizationProfile.apiEndpoint}
              onChange={(e) => handleSummarizationProfileChange({
                ...localSummarizationProfile,
                apiEndpoint: e.target.value
              })}
              placeholder="Enter API endpoint"
            />
          </div>

          <div className="setting-item">
            <label>API Key:</label>
            <input
              type="password"
              value={localSummarizationProfile.apiKey}
              onChange={(e) => handleSummarizationProfileChange({
                ...localSummarizationProfile,
                apiKey: e.target.value
              })}
              placeholder="Enter your API key"
            />
          </div>

          <div className="setting-item">
            <label>Model:</label>
            <input
              type="text"
              value={localSummarizationProfile.model}
              onChange={(e) => handleSummarizationProfileChange({
                ...localSummarizationProfile,
                model: e.target.value
              })}
              placeholder="Enter model name (e.g., DeepSeek-R1)"
            />
          </div>
        </div>
      </div>

        {/* MCP Servers Section */}
        <div className="profiles-section">
          <div className="profiles-header">
            <h3>MCP Servers</h3>
            <button
              type="button"
              className="add-profile-button"
              onClick={handleAddMcpServer}
            >
              + Add MCP Server
            </button>
          </div>

          <div className="profiles-list">
            {localMcpServers.map(server => (
              <div
                key={server.id}
                className={`profile-item ${server.id === editingMcpServerId ? 'active' : ''}`}
                onClick={() => setEditingMcpServerId(server.id)}
              >
                <span>{server.name}</span>
                <button
                  className="delete-profile-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteMcpServer(server.id);
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            {localMcpServers.length === 0 && (
              <div className="empty-state">
                <p>No MCP servers added yet. Add a server to enable Model Context Protocol capabilities.</p>
              </div>
            )}
          </div>

          {editingMcpServer && (
            <div className="current-profile-section">
              <h3>Edit MCP Server: {editingMcpServer.name}</h3>

              <div className="setting-item">
                <label>Server Name:</label>
                <input
                  type="text"
                  value={editingMcpServer.name}
                  onChange={(e) => handleMcpServerChange({
                    ...editingMcpServer,
                    name: e.target.value
                  })}
                  placeholder="Enter server name"
                />
              </div>

              <div className="setting-item">
                <label>Endpoint URL:</label>
                <input
                  type="text"
                  value={editingMcpServer.endpoint}
                  onChange={(e) => handleMcpServerChange({
                    ...editingMcpServer,
                    endpoint: e.target.value
                  })}
                  placeholder="Enter MCP server endpoint URL"
                />
              </div>

              <div className="setting-item">
                <label>Authentication Token:</label>
                <input
                  type="password"
                  value={editingMcpServer.authToken}
                  onChange={(e) => handleMcpServerChange({
                    ...editingMcpServer,
                    authToken: e.target.value
                  })}
                  placeholder="Enter authentication token (if required)"
                />
              </div>

              <div className="setting-item">
                <label>Description:</label>
                <textarea
                  value={editingMcpServer.description}
                  onChange={(e) => handleMcpServerChange({
                    ...editingMcpServer,
                    description: e.target.value
                  })}
                  placeholder="Enter server description"
                  rows="3"
                />
              </div>

              <div className="setting-hint">
                <button
                  type="button"
                  className="hint-toggle"
                  onClick={() => setIsMcpHintExpanded(!isMcpHintExpanded)}
                >
                  {isMcpHintExpanded ? 'Hide' : 'Show'} MCP Information
                </button>
                <div className={`hint-content ${isMcpHintExpanded ? 'expanded' : ''}`}>
                  <p>Model Context Protocol (MCP) allows AI models to access external tools and data sources.</p>
                  <ul>
                    <li>MCP servers provide specialized capabilities to AI models</li>
                    <li>Each server can offer different tools like web search, data retrieval, etc.</li>
                    <li>The model will automatically use available MCP servers when needed</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="settings-actions">
          <button type="submit" className="save-button">Save Settings</button>
          <button type="button" className="cancel-button" onClick={onCloseSettings}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
