// 天气服务 MCP 服务器 - 使用 MCP SDK 实现
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';

const app = express();
const port = process.env.PORT || 8001;

app.use(cors());
app.use(express.json());

// 创建 MCP 服务器实例
const server = new McpServer({
  name: 'Weather Service',
  version: '1.0.0'
});

// 模拟天气数据
const weatherData = {
  'New York': {
    temperature: '15°C',
    condition: 'Partly Cloudy',
    humidity: '65%',
    wind: '10 km/h'
  },
  'London': {
    temperature: '12°C',
    condition: 'Rainy',
    humidity: '80%',
    wind: '15 km/h'
  },
  'Tokyo': {
    temperature: '20°C',
    condition: 'Sunny',
    humidity: '50%',
    wind: '8 km/h'
  },
  'Paris': {
    temperature: '14°C',
    condition: 'Cloudy',
    humidity: '70%',
    wind: '12 km/h'
  },
  'Sydney': {
    temperature: '25°C',
    condition: 'Sunny',
    humidity: '45%',
    wind: '20 km/h'
  }
};

// 默认天气数据
const defaultWeather = {
  temperature: '18°C',
  condition: 'Clear',
  humidity: '60%',
  wind: '10 km/h'
};

// 定义 get-weather 工具
server.tool(
  'get-weather',
  { location: z.string().describe('The location to get weather for') },
  async ({ location }) => {
    console.log(`Executing get-weather tool with location: ${location}`);
    const weather = weatherData[location] || defaultWeather;

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          location,
          ...weather,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
);

// 定义 get-forecast 工具
server.tool(
  'get-forecast',
  { location: z.string().describe('The location to get forecast for') },
  async ({ location }) => {
    console.log(`Executing get-forecast tool with location: ${location}`);
    const weather = weatherData[location] || defaultWeather;

    // 生成简单的 5 天预报
    const forecast = Array.from({ length: 5 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i + 1);

      return {
        date: date.toISOString().split('T')[0],
        temperature: `${Math.round(parseInt(weather.temperature) + (Math.random() * 6 - 3))}°C`,
        condition: ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Clear'][Math.floor(Math.random() * 5)],
        humidity: `${Math.round(parseInt(weather.humidity) + (Math.random() * 10 - 5))}%`,
        wind: `${Math.round(parseInt(weather.wind) + (Math.random() * 8 - 4))} km/h`
      };
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          location,
          current: weather,
          forecast,
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }
);

// 存储活跃的 SSE 传输连接
const transports = {};

// 设置 SSE 端点
app.get('/sse', async (_, res) => {
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;

  res.on('close', () => {
    delete transports[transport.sessionId];
    console.log(`Connection closed for session ${transport.sessionId}`);
  });

  console.log(`New SSE connection established with session ID: ${transport.sessionId}`);
  await server.connect(transport);
});

// 设置消息处理端点
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];

  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Weather MCP server running at http://localhost:${port}`);
  console.log(`Connect to SSE endpoint at http://localhost:${port}/sse`);
});
