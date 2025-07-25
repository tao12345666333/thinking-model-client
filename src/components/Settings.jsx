import { useState, useEffect } from 'react';

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

  // 当 mcpServers 变化时更新本地状态
  useEffect(() => {
    console.log('mcpServers changed:', mcpServers);
    setLocalMcpServers(mcpServers || []);
  }, [mcpServers]);
  const [editingProfileId, setEditingProfileId] = useState(activeProfileId);
  const [editingMcpServerId, setEditingMcpServerId] = useState(null);
  const [isHintExpanded, setIsHintExpanded] = useState(false);
  const [isMcpHintExpanded, setIsMcpHintExpanded] = useState(false);
  const [builtInServers, setBuiltInServers] = useState([]);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [serverTestResult, setServerTestResult] = useState(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const editingProfile = localProfiles.find(p => p.id === editingProfileId) || localProfiles[0];
  const editingMcpServer = localMcpServers.find(s => s.id === editingMcpServerId) || null;

  // 获取可用的内置 MCP 服务器
  useEffect(() => {
    const fetchBuiltInServers = async () => {
      setIsLoadingServers(true);
      try {
        console.log('Fetching built-in MCP servers...');
        const response = await fetch('/api/mcp/servers/available', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Received built-in MCP servers:', data);
          setBuiltInServers(data.servers || []);
        } else {
          console.error('Failed to fetch built-in MCP servers:', response.status, response.statusText);
          // 尝试读取错误消息
          const errorText = await response.text();
          console.error('Error details:', errorText);
        }
      } catch (error) {
        console.error('Error fetching built-in MCP servers:', error);
      } finally {
        setIsLoadingServers(false);
      }
    };

    fetchBuiltInServers();

    // 每 5 秒刷新一次服务器状态
    const intervalId = setInterval(fetchBuiltInServers, 5000);

    // 清理定时器
    return () => clearInterval(intervalId);
  }, []);

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

  // 测试 MCP 服务器连接
  const testMcpServerConnection = async (endpoint, authToken) => {
    if (!endpoint) return;

    setIsTestingConnection(true);
    setServerTestResult(null);

    try {
      const response = await fetch('/api/mcp/servers/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ endpoint, authToken })
      });

      const result = await response.json();
      setServerTestResult(result);
      return result.success;
    } catch (error) {
      console.error('Error testing MCP server connection:', error);
      setServerTestResult({
        success: false,
        message: `Connection error: ${error.message}`,
        error: error.message
      });
      return false;
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 启动内置 MCP 服务器
  const startBuiltInServer = async (serverId) => {
    try {
      const response = await fetch('/api/mcp/servers/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serverId })
      });

      const result = await response.json();

      if (result.success) {
        // 检查是否已经添加了这个服务器
        const existingServer = localMcpServers.find(s =>
          s.isBuiltIn && s.builtInId === serverId
        );

        if (!existingServer) {
          // 添加到本地 MCP 服务器列表
          const builtInServer = builtInServers.find(s => s.id === serverId);
          const newServer = {
            id: `built-in-${serverId}-${Date.now()}`,
            name: builtInServer ? builtInServer.name : `Built-in Server ${serverId}`,
            endpoint: result.endpoint,
            authToken: '',
            description: builtInServer ? builtInServer.description : 'Built-in MCP server',
            isBuiltIn: true,
            builtInId: serverId,
            isRunning: true
          };

          const updatedServers = [...localMcpServers, newServer];
          setLocalMcpServers(updatedServers);
          setEditingMcpServerId(newServer.id);
        } else {
          // 更新现有服务器的端点
          const updatedServers = localMcpServers.map(s =>
            s.id === existingServer.id
              ? { ...s, endpoint: result.endpoint, isRunning: true }
              : s
          );
          setLocalMcpServers(updatedServers);
          setEditingMcpServerId(existingServer.id);
        }

        // 刷新内置服务器列表
        const response = await fetch('/api/mcp/servers/available');
        if (response.ok) {
          const data = await response.json();
          setBuiltInServers(data.servers || []);
        }

        return true;
      } else {
        console.error('Failed to start built-in MCP server:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error starting built-in MCP server:', error);
      return false;
    }
  };

  // 停止内置 MCP 服务器
  const stopBuiltInServer = async (serverId) => {
    try {
      const response = await fetch('/api/mcp/servers/stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serverId })
      });

      const result = await response.json();

      if (result.success) {
        // 更新内置服务器的状态
        const updatedServers = localMcpServers.map(s =>
          s.isBuiltIn && s.builtInId === serverId
            ? { ...s, isRunning: false }
            : s
        );
        setLocalMcpServers(updatedServers);

        // 刷新内置服务器列表
        const response = await fetch('/api/mcp/servers/available');
        if (response.ok) {
          const data = await response.json();
          setBuiltInServers(data.servers || []);
        }

        return true;
      } else {
        console.error('Failed to stop built-in MCP server:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Error stopping built-in MCP server:', error);
      return false;
    }
  };

  const handleAddMcpServer = () => {
    const newId = `mcp-server-${Date.now()}`;
    const newServer = {
      id: newId,
      name: `MCP Server ${localMcpServers.length + 1}`,
      endpoint: '',
      authToken: '',
      description: '',
      isBuiltIn: false
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

          {/* Built-in MCP Servers */}
          <div className="built-in-servers-section">
            <h4>Built-in MCP Servers</h4>
            <div className="built-in-servers-list">
              {isLoadingServers ? (
                <div className="loading-indicator">Loading built-in servers...</div>
              ) : builtInServers.length > 0 ? (
                builtInServers.map(server => {
                  // 检查这个内置服务器是否已经添加到用户的服务器列表中
                  const isAdded = localMcpServers.some(s => s.isBuiltIn && s.builtInId === server.id);

                  return (
                    <div key={server.id} className="built-in-server-item">
                      <div className="server-info">
                        <span className="server-name">{server.name}</span>
                        <span className={`server-status ${server.isRunning ? 'running' : 'stopped'}`}>
                          {server.isRunning ? 'Running' : 'Stopped'}
                        </span>
                      </div>
                      <div className="server-actions">
                        {isAdded ? (
                          <button
                            className="server-action-button"
                            onClick={() => {
                              const addedServer = localMcpServers.find(s => s.isBuiltIn && s.builtInId === server.id);
                              if (addedServer) {
                                setEditingMcpServerId(addedServer.id);
                              }
                            }}
                          >
                            View
                          </button>
                        ) : (
                          <button
                            className="server-action-button"
                            onClick={() => startBuiltInServer(server.id)}
                            disabled={server.isRunning}
                          >
                            Add & Start
                          </button>
                        )}

                        {server.isRunning ? (
                          <button
                            className="server-action-button stop"
                            onClick={() => stopBuiltInServer(server.id)}
                          >
                            Stop
                          </button>
                        ) : (
                          <button
                            className="server-action-button start"
                            onClick={() => startBuiltInServer(server.id)}
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>No built-in MCP servers available.</p>
                </div>
              )}
            </div>
          </div>

          {/* User-added MCP Servers */}
          <h4>Your MCP Servers</h4>
          <div className="profiles-list">
            {localMcpServers.map(server => (
              <div
                key={server.id}
                className={`profile-item ${server.id === editingMcpServerId ? 'active' : ''} ${server.isBuiltIn && server.isRunning ? 'running' : ''}`}
                onClick={() => setEditingMcpServerId(server.id)}
              >
                <span>{server.name}</span>
                {server.isBuiltIn && server.isRunning && (
                  <span className="server-badge running">Running</span>
                )}
                {server.isBuiltIn && !server.isRunning && (
                  <span className="server-badge stopped">Stopped</span>
                )}
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
                  disabled={editingMcpServer.isBuiltIn}
                />
              </div>

              <div className="setting-item">
                <label>Endpoint URL:</label>
                <div className="input-with-button">
                  <input
                    type="text"
                    value={editingMcpServer.endpoint}
                    onChange={(e) => handleMcpServerChange({
                      ...editingMcpServer,
                      endpoint: e.target.value
                    })}
                    placeholder="Enter MCP server endpoint URL"
                    disabled={editingMcpServer.isBuiltIn}
                  />
                  <button
                    type="button"
                    className="test-connection-button"
                    onClick={() => testMcpServerConnection(editingMcpServer.endpoint, editingMcpServer.authToken)}
                    disabled={!editingMcpServer.endpoint || isTestingConnection}
                  >
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </button>
                </div>
                {serverTestResult && (
                  <div className={`connection-test-result ${serverTestResult.success ? 'success' : 'error'}`}>
                    {serverTestResult.message}
                    {serverTestResult.success && serverTestResult.tools && (
                      <div className="available-tools">
                        <p>Available tools: {serverTestResult.tools.length}</p>
                        <ul>
                          {serverTestResult.tools.map((tool, index) => (
                            <li key={index}>{tool.name} - {tool.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
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
                  disabled={editingMcpServer.isBuiltIn}
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
                  disabled={editingMcpServer.isBuiltIn}
                />
              </div>

              {editingMcpServer.isBuiltIn && (
                <div className="built-in-server-controls">
                  <p className="built-in-server-note">
                    This is a built-in MCP server managed by the application.
                    {editingMcpServer.isRunning
                      ? ' It is currently running.'
                      : ' It is currently stopped.'}
                  </p>
                  {editingMcpServer.isRunning ? (
                    <button
                      type="button"
                      className="server-control-button stop"
                      onClick={() => stopBuiltInServer(editingMcpServer.builtInId)}
                    >
                      Stop Server
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="server-control-button start"
                      onClick={() => startBuiltInServer(editingMcpServer.builtInId)}
                    >
                      Start Server
                    </button>
                  )}
                </div>
              )}

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
