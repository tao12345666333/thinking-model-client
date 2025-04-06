import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path'
import { fileURLToPath } from 'url'
import { callMcpServer, discoverMcpServerTools, executeMcpTool } from './mcp.js';
import {
  getAvailableMcpServers,
  startMcpServer,
  stopMcpServer,
  getMcpServerStatus,
  stopAllMcpServers
} from './mcp-manager.js';

const app = express();
const port = process.env.PORT || 7860;

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

// MCP 服务器管理端点
app.get('/api/mcp/servers/available', (req, res) => {
  console.log('Received request for available MCP servers');
  try {
    const servers = getAvailableMcpServers();
    console.log('Available MCP servers:', servers);
    res.json({ servers });
  } catch (error) {
    console.error('Error getting available MCP servers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mcp/servers/start', async (req, res) => {
  const { serverId } = req.body;

  if (!serverId) {
    return res.status(400).json({ error: 'Server ID is required' });
  }

  try {
    const result = await startMcpServer(serverId);

    if (result.success) {
      res.json({
        success: true,
        serverId,
        port: result.port,
        endpoint: `http://localhost:${result.port}`
      });
    } else {
      res.status(500).json({
        success: false,
        serverId,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error starting MCP server ${serverId}:`, error);
    res.status(500).json({
      success: false,
      serverId,
      error: error.message
    });
  }
});

app.post('/api/mcp/servers/stop', async (req, res) => {
  const { serverId } = req.body;

  if (!serverId) {
    return res.status(400).json({ error: 'Server ID is required' });
  }

  try {
    const result = await stopMcpServer(serverId);

    if (result.success) {
      res.json({
        success: true,
        serverId
      });
    } else {
      res.status(500).json({
        success: false,
        serverId,
        error: result.error
      });
    }
  } catch (error) {
    console.error(`Error stopping MCP server ${serverId}:`, error);
    res.status(500).json({
      success: false,
      serverId,
      error: error.message
    });
  }
});

app.get('/api/mcp/servers/status/:serverId', (req, res) => {
  const { serverId } = req.params;

  try {
    const status = getMcpServerStatus(serverId);
    res.json({
      serverId,
      ...status,
      endpoint: status.isRunning ? `http://localhost:${status.port}` : null
    });
  } catch (error) {
    console.error(`Error getting MCP server status for ${serverId}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 测试 MCP 服务器连接
app.post('/api/mcp/servers/test-connection', async (req, res) => {
  const { endpoint, authToken } = req.body;

  if (!endpoint) {
    return res.status(400).json({ error: 'Endpoint is required' });
  }

  try {
    // 创建一个临时服务器对象
    const server = {
      id: 'test-connection',
      name: 'Test Connection',
      endpoint,
      authToken
    };

    // 尝试发现工具
    const toolsInfo = await discoverMcpServerTools(server);

    res.json({
      success: true,
      tools: toolsInfo.tools || [],
      message: `Successfully connected to MCP server at ${endpoint}`
    });
  } catch (error) {
    console.error(`Error testing connection to MCP server at ${endpoint}:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: `Failed to connect to MCP server at ${endpoint}: ${error.message}`
    });
  }
});

console.log('Starting server...');
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
console.log('Server started!');

// 确保在进程退出时停止所有 MCP 服务器
process.on('exit', () => {
  stopAllMcpServers();
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  stopAllMcpServers();
  process.exit(1);
});

// 处理未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});
