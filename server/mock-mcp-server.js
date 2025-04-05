// Mock MCP server for testing
import express from 'express';
import cors from 'cors';

const app = express();
const port = 7861;

app.use(cors());
app.use(express.json());

// Mock MCP tools
const mockTools = [
  {
    name: 'web-search',
    description: 'Search the web for information',
    parameters: {
      query: {
        type: 'string',
        description: 'The search query'
      }
    }
  },
  {
    name: 'weather',
    description: 'Get current weather information',
    parameters: {
      location: {
        type: 'string',
        description: 'The location to get weather for'
      }
    }
  },
  {
    name: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: {
      expression: {
        type: 'string',
        description: 'The mathematical expression to evaluate'
      }
    }
  }
];

// MCP discovery endpoint
app.post('/', (req, res) => {
  const { type } = req.body;

  if (type === 'discovery') {
    console.log('Received discovery request');
    res.json({
      tools: mockTools
    });
  } else if (type === 'tool_execution') {
    const { tool, parameters } = req.body;
    console.log(`Executing tool: ${tool} with parameters:`, parameters);

    // Mock responses for different tools
    if (tool === 'web-search') {
      res.json({
        result: `Search results for: ${parameters.query || 'unknown query'}`,
        links: [
          { title: 'Example result 1', url: 'https://example.com/1' },
          { title: 'Example result 2', url: 'https://example.com/2' }
        ]
      });
    } else if (tool === 'weather') {
      res.json({
        location: parameters.location || 'unknown location',
        temperature: '22°C',
        condition: 'Sunny',
        humidity: '45%'
      });
    } else if (tool === 'calculator') {
      let result;
      try {
        // Simple evaluation (not secure for production)
        result = eval(parameters.expression);
      } catch (error) {
        result = 'Error evaluating expression';
      }

      res.json({
        expression: parameters.expression,
        result: result
      });
    } else {
      res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
  } else {
    res.status(400).json({ error: 'Invalid request type' });
  }
});

const server = app.listen(port, () => {
  console.log(`Mock MCP server running at http://localhost:${port}`);
});

export default { app, server };
