import { useState } from 'react';

function Settings({ settings, onSave, setSettings }) {
  const [formData, setFormData] = useState(settings);

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