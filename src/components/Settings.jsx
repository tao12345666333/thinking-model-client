import { useState } from 'react';

function Settings({ settings, onSave, setSettings }) {
  const [formData, setFormData] = useState(settings);
  const [isHintExpanded, setIsHintExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="settings-panel">
      <h2>Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="setting-item">
          <label>API Endpoint:</label>
          <input
            type="text"
            value={formData.apiEndpoint}
            onChange={(e) => setFormData({
              ...formData,
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
            value={formData.apiKey}
            onChange={(e) => setFormData({
              ...formData,
              apiKey: e.target.value
            })}
            placeholder="Enter your API key"
          />
        </div>
        <div className="setting-item">
          <label>Model:</label>
          <input
            type="text"
            value={formData.model}
            onChange={(e) => setFormData({
              ...formData,
              model: e.target.value
            })}
            placeholder="Enter model name (e.g., gpt-3.5-turbo)"
          />
        </div>
        <button type="submit" className="save-button">Save Settings</button>
      </form>
    </div>
  );
}

export default Settings;
