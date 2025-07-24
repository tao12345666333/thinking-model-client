import express from 'express';
import cors from 'cors';
import path from 'path'
import { fileURLToPath } from 'url'
import { streamText } from '@xsai/stream-text';
import { generateText } from '@xsai/generate-text';
import { extractReasoningStream } from '@xsai/utils-reasoning';

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
    let baseURL;
    if (apiEndpoint.endsWith('#')) {
        baseURL = apiEndpoint.slice(0, -1);
    } else if (apiEndpoint.endsWith('/')) {
        baseURL = `${apiEndpoint}v1`;
    } else {
        baseURL = `${apiEndpoint}/v1`;
    }
    console.log('Calling API baseURL:', baseURL);
    
    const { text } = await generateText({
      apiKey: apiKey,
      baseURL: baseURL,
      model: model,
      messages: [{
        role: 'user',
        content: `Summarize this conversation in 3-5 words: ${content}`
      }],
      temperature: 0.2,
      max_tokens: 20
    });

    const summary = text.trim();
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
    let baseURL;
    if (apiEndpoint.endsWith('#')) {
        baseURL = apiEndpoint.slice(0, -1);
    } else if (apiEndpoint.endsWith('/')) {
        baseURL = `${apiEndpoint}v1`;
    } else {
        baseURL = `${apiEndpoint}/v1`;
    }
    console.log('Calling API baseURL:', baseURL);
    
    // Use xsai to stream text from the AI model
    const { textStream } = await streamText({
      apiKey: apiKey,
      baseURL: baseURL,
      model: model,
      messages: messages
    });

    // Extract reasoning and content streams
    const { reasoningStream, textStream: contentStream } = extractReasoningStream(textStream);

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

    let reasoningText = '';
    let contentText = '';
    let isReasoningComplete = false;

    // Handle client disconnect
    req.on('close', () => {
      console.log('Client disconnected');
    });

    try {
      // First, collect all reasoning
      console.log('Collecting reasoning...');
      for await (const chunk of reasoningStream) {
        reasoningText += chunk;
      }
      isReasoningComplete = true;
      console.log('Reasoning collection complete');

      // If we have reasoning, send it first wrapped in think tags
      if (reasoningText.trim()) {
        const thinkingChunk = {
          choices: [{
            delta: {
              content: `<think>${reasoningText}</think>`
            }
          }]
        };
        res.write(`data: ${JSON.stringify(thinkingChunk)}\n\n`);
      }

      // Then stream the content
      console.log('Starting content stream...');
      for await (const chunk of contentStream) {
        if (res.destroyed) break;
        
        const responseChunk = {
          choices: [{
            delta: {
              content: chunk
            }
          }]
        };
        
        res.write(`data: ${JSON.stringify(responseChunk)}\n\n`);
        contentText += chunk;
      }

      // Send completion marker
      res.write('data: [DONE]\n\n');
      res.end();
      console.log('Stream completed successfully');
      
    } catch (streamError) {
      console.error('Streaming error:', streamError);
      if (!res.destroyed) {
        res.write(`data: ${JSON.stringify({ error: streamError.message })}\n\n`);
        res.end();
      }
    }

  } catch (error) {
    console.error('Error:', error);
    if (!res.destroyed) {
      res.status(500).json({ error: error.message });
    }
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
