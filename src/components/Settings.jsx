import { useState } from 'react';

function Settings({ profiles, activeProfileId, onSaveProfiles, onChangeActiveProfile, onCloseSettings }) {
  const [localProfiles, setLocalProfiles] = useState(profiles);
  const [editingProfileId, setEditingProfileId] = useState(activeProfileId);
  const [isHintExpanded, setIsHintExpanded] = useState(false);

  const editingProfile = localProfiles.find(p => p.id === editingProfileId) || localProfiles[0];

  const handleProfileChange = (updatedProfile) => {
    setLocalProfiles(localProfiles.map(p => 
      p.id === updatedProfile.id ? updatedProfile : p
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
    // Prevent deleting the last profile
    if (localProfiles.length <= 1) {
      alert("Cannot delete the last profile");
      return;
    }

    const updatedProfiles = localProfiles.filter(p => p.id !== profileId);
    setLocalProfiles(updatedProfiles);
    
    // If we're deleting the currently edited profile, switch to another one
    if (editingProfileId === profileId) {
      setEditingProfileId(updatedProfiles[0].id);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveProfiles(localProfiles);
    onChangeActiveProfile(editingProfileId);
    onCloseSettings();
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      
      <div className="profiles-section">
        <div className="profiles-header">
          <h3>Profiles</h3>
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
        <div className="current-profile-section">
          <h3>Edit Profile: {editingProfile.name}</h3>
          
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
        
        <div className="settings-actions">
          <button type="submit" className="save-button">Save Settings</button>
          <button type="button" className="cancel-button" onClick={onCloseSettings}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default Settings;
