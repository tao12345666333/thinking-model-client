import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path'
import { fileURLToPath } from 'url'
import { callMcpServer, discoverMcpServerTools, executeMcpTool } from './mcp.js';

// Note: Run the mock MCP server separately with: node server/start-mock-mcp.js

const app = express();
const port = 7860;

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors());
app.use(express.json());

app.post('/api/summarize', async (req, res) => {
  const { content, apiEndpoint, apiKey, model } = req.body;

  console.log('Received summarize request with:', {
    apiEndpoint,
    model,
    contentLength: content.length
  });

  try {
    let apiUrl;
    if (apiEndpoint.endsWith('#')) {
        apiUrl = apiEndpoint.slice(0, -1);
    } else if (apiEndpoint.endsWith('/')) {
        apiUrl = `${apiEndpoint}chat/completions`;
    } else {
        apiUrl = `${apiEndpoint}/v1/chat/completions`;
    }
    console.log('Calling API endpoint:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{
          role: 'user',
          content: `Summarize this conversation in 3-5 words: ${content}`
        }],
        temperature: 0.2,
        max_tokens: 20
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API error:', {
        status: response.status,
        error: errorData
      });
      throw new Error(`API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content.trim();
    res.json({ summary });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', async (req, res) => {
  const { messages, apiEndpoint, apiKey, model } = req.body;

  console.log('Received chat request with:', {
    apiEndpoint,
    model,
    messageCount: messages.length
  });

  try {
    let apiUrl;
    if (apiEndpoint.endsWith('#')) {
        apiUrl = apiEndpoint.slice(0, -1);
    } else if (apiEndpoint.endsWith('/')) {
        apiUrl = `${apiEndpoint}chat/completions`;
    } else {
        apiUrl = `${apiEndpoint}/v1/chat/completions`;
    }
    console.log('Calling API endpoint:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        stream: true
      })
    });

    console.log('API response status:', response.status);
    console.log('API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('API error:', {
        status: response.status,
        error: errorData
      });
      throw new Error(`API error: ${response.status} - ${errorData}`);
    }

    // Set headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Pipe the API response to the client
    response.body.pipe(res).on('error', (err) => {
      console.error('Stream error:', err);
      res.status(500).end();
    }).on('end', () => {
      console.log('Stream completed successfully');
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, '../dist')))

  // Handle all other routes by serving the index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

// MCP endpoints
app.post('/api/mcp/discover', async (req, res) => {
  const { server } = req.body;

  console.log('Received MCP discovery request for server:', server);

  if (!server || !server.endpoint) {
    console.log('Invalid server configuration');
    return res.status(400).json({ error: 'Invalid server configuration' });
  }

  try {
    console.log(`Discovering tools from MCP server: ${server.name} at ${server.endpoint}`);
    const toolsInfo = await discoverMcpServerTools(server);
    console.log('Discovered tools:', toolsInfo);
    res.json(toolsInfo);
  } catch (error) {
    console.error('Error discovering MCP tools:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mcp/execute', async (req, res) => {
  const { server, tool, parameters } = req.body;

  console.log(`Received MCP tool execution request: ${tool}`);
  console.log('Server:', server);
  console.log('Parameters:', parameters);

  if (!server || !server.endpoint || !tool) {
    console.log('Invalid request parameters');
    return res.status(400).json({ error: 'Invalid request parameters' });
  }

  try {
    console.log(`Executing MCP tool ${tool} on server ${server.name}`);
    const result = await executeMcpTool(server, tool, parameters);
    console.log('Tool execution result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error executing MCP tool:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
