import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path'
import { fileURLToPath } from 'url'

const app = express();
const port = 7860;

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use(cors());
app.use(express.json());

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
