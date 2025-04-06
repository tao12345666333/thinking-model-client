// 时间服务 MCP 服务器 - 使用 MCP SDK 实现
import express from 'express';
import cors from 'cors';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';

const app = express();
const port = process.env.PORT || 8004;

app.use(cors());
app.use(express.json());

// 创建 MCP 服务器实例
const server = new McpServer({
  name: 'Time Service',
  version: '1.0.0'
});

// 时区列表
const timezones = [
  { code: 'UTC', name: 'Coordinated Universal Time', offset: 0 },
  { code: 'GMT', name: 'Greenwich Mean Time', offset: 0 },
  { code: 'EST', name: 'Eastern Standard Time', offset: -5 },
  { code: 'CST', name: 'Central Standard Time', offset: -6 },
  { code: 'MST', name: 'Mountain Standard Time', offset: -7 },
  { code: 'PST', name: 'Pacific Standard Time', offset: -8 },
  { code: 'EDT', name: 'Eastern Daylight Time', offset: -4 },
  { code: 'CDT', name: 'Central Daylight Time', offset: -5 },
  { code: 'MDT', name: 'Mountain Daylight Time', offset: -6 },
  { code: 'PDT', name: 'Pacific Daylight Time', offset: -7 },
  { code: 'CET', name: 'Central European Time', offset: 1 },
  { code: 'CEST', name: 'Central European Summer Time', offset: 2 },
  { code: 'EET', name: 'Eastern European Time', offset: 2 },
  { code: 'EEST', name: 'Eastern European Summer Time', offset: 3 },
  { code: 'JST', name: 'Japan Standard Time', offset: 9 },
  { code: 'CST-China', name: 'China Standard Time', offset: 8 },
  { code: 'IST', name: 'India Standard Time', offset: 5.5 },
  { code: 'AEST', name: 'Australian Eastern Standard Time', offset: 10 },
  { code: 'AEDT', name: 'Australian Eastern Daylight Time', offset: 11 },
  { code: 'NZST', name: 'New Zealand Standard Time', offset: 12 },
  { code: 'NZDT', name: 'New Zealand Daylight Time', offset: 13 }
];

// 根据时区代码获取时区信息
function getTimezoneByCode(code) {
  // 处理中国标准时间的特殊情况
  if (code === 'CST-China') {
    return timezones.find(tz => tz.code === 'CST-China');
  }

  return timezones.find(tz => tz.code === code);
}

// 获取当前时间
function getCurrentTime(timezone = 'UTC') {
  const now = new Date();
  const tz = getTimezoneByCode(timezone);

  if (!tz) {
    return {
      error: `Unknown timezone: ${timezone}`
    };
  }

  // 计算指定时区的时间
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const tzTime = new Date(utcTime + (3600000 * tz.offset));

  return {
    timezone: tz.code,
    timezoneName: tz.name,
    offset: tz.offset,
    time: tzTime.toISOString(),
    formattedTime: tzTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    }),
    timestamp: tzTime.getTime()
  };
}

// 转换时区
function convertTimezone(time, fromTimezone, toTimezone) {
  const fromTz = getTimezoneByCode(fromTimezone);
  const toTz = getTimezoneByCode(toTimezone);

  if (!fromTz) {
    return {
      error: `Unknown source timezone: ${fromTimezone}`
    };
  }

  if (!toTz) {
    return {
      error: `Unknown target timezone: ${toTimezone}`
    };
  }

  let dateTime;

  // 如果提供了时间，则使用它；否则使用当前时间
  if (time) {
    try {
      dateTime = new Date(time);
      if (isNaN(dateTime.getTime())) {
        // 尝试解析其他格式
        const parts = time.split(/[- :]/);
        if (parts.length >= 3) {
          // 假设格式为 YYYY-MM-DD 或 YYYY-MM-DD HH:MM:SS
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // 月份从0开始
          const day = parseInt(parts[2]);
          const hour = parts.length > 3 ? parseInt(parts[3]) : 0;
          const minute = parts.length > 4 ? parseInt(parts[4]) : 0;
          const second = parts.length > 5 ? parseInt(parts[5]) : 0;

          dateTime = new Date(Date.UTC(year, month, day, hour, minute, second));
        }

        if (isNaN(dateTime.getTime())) {
          return {
            error: `Invalid time format: ${time}. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or YYYY-MM-DD HH:MM:SS.`
          };
        }
      }
    } catch (error) {
      return {
        error: `Invalid time format: ${time}. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or YYYY-MM-DD HH:MM:SS.`
      };
    }
  } else {
    dateTime = new Date();
  }

  // 将时间转换为 UTC
  const utcTime = dateTime.getTime() - (fromTz.offset * 3600000);

  // 将 UTC 时间转换为目标时区时间
  const targetTime = new Date(utcTime + (toTz.offset * 3600000));

  return {
    originalTime: dateTime.toISOString(),
    originalTimezone: fromTz.code,
    originalTimezoneName: fromTz.name,
    targetTimezone: toTz.code,
    targetTimezoneName: toTz.name,
    targetTime: targetTime.toISOString(),
    formattedTargetTime: targetTime.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'UTC'
    }),
    timeDifference: `${toTz.offset - fromTz.offset} hours`
  };
}

// 计算两个日期之间的差异
function calculateDateDifference(startDate, endDate) {
  let start, end;

  try {
    start = new Date(startDate);
    if (isNaN(start.getTime())) {
      return {
        error: `Invalid start date format: ${startDate}. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or YYYY-MM-DD.`
      };
    }
  } catch (error) {
    return {
      error: `Invalid start date format: ${startDate}. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or YYYY-MM-DD.`
    };
  }

  try {
    end = endDate ? new Date(endDate) : new Date();
    if (isNaN(end.getTime())) {
      return {
        error: `Invalid end date format: ${endDate}. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or YYYY-MM-DD.`
      };
    }
  } catch (error) {
    return {
      error: `Invalid end date format: ${endDate}. Please use ISO format (YYYY-MM-DDTHH:MM:SS) or YYYY-MM-DD.`
    };
  }

  // 计算差异（毫秒）
  const diffMs = Math.abs(end - start);

  // 转换为天、小时、分钟和秒
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  // 计算年和月（近似值）
  const diffYears = Math.floor(diffDays / 365);
  const diffMonths = Math.floor((diffDays % 365) / 30);

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    difference: {
      milliseconds: diffMs,
      seconds: Math.floor(diffMs / 1000),
      minutes: Math.floor(diffMs / (1000 * 60)),
      hours: Math.floor(diffMs / (1000 * 60 * 60)),
      days: diffDays,
      months: diffYears * 12 + diffMonths,
      years: diffYears
    },
    formatted: `${diffYears > 0 ? diffYears + ' years, ' : ''}${diffMonths > 0 ? diffMonths + ' months, ' : ''}${diffDays % 30 > 0 ? (diffDays % 30) + ' days, ' : ''}${diffHours > 0 ? diffHours + ' hours, ' : ''}${diffMinutes > 0 ? diffMinutes + ' minutes, ' : ''}${diffSeconds > 0 ? diffSeconds + ' seconds' : ''}`
  };
}

// 定义 get-current-time 工具
server.tool(
  'get-current-time',
  { timezone: z.string().optional().describe('The timezone code (e.g., UTC, GMT, EST, CST, PST, JST, etc.)') },
  async ({ timezone = 'UTC' }) => {
    console.log(`Executing get-current-time tool with timezone: ${timezone}`);
    const result = getCurrentTime(timezone);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 定义 convert-timezone 工具
server.tool(
  'convert-timezone',
  {
    time: z.string().optional().describe('The time to convert (ISO format or YYYY-MM-DD HH:MM:SS). If not provided, current time will be used.'),
    fromTimezone: z.string().describe('The source timezone code'),
    toTimezone: z.string().describe('The target timezone code')
  },
  async ({ time, fromTimezone, toTimezone }) => {
    console.log(`Executing convert-timezone tool with parameters:`, { time, fromTimezone, toTimezone });

    if (!fromTimezone || !toTimezone) {
      throw new Error('Both fromTimezone and toTimezone are required');
    }

    const result = convertTimezone(time, fromTimezone, toTimezone);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 定义 calculate-date-difference 工具
server.tool(
  'calculate-date-difference',
  {
    startDate: z.string().describe('The start date (ISO format or YYYY-MM-DD)'),
    endDate: z.string().optional().describe('The end date (ISO format or YYYY-MM-DD). If not provided, current date will be used.')
  },
  async ({ startDate, endDate }) => {
    console.log(`Executing calculate-date-difference tool with parameters:`, { startDate, endDate });

    if (!startDate) {
      throw new Error('startDate is required');
    }

    const result = calculateDateDifference(startDate, endDate);

    if (result.error) {
      throw new Error(result.error);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2)
      }]
    };
  }
);

// 定义 list-timezones 工具
server.tool(
  'list-timezones',
  {},
  async () => {
    console.log('Executing list-timezones tool');

    const tzList = timezones.map(tz => ({
      code: tz.code,
      name: tz.name,
      offset: tz.offset
    }));

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ timezones: tzList }, null, 2)
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
  console.log(`Time MCP server running at http://localhost:${port}`);
  console.log(`Connect to SSE endpoint at http://localhost:${port}/sse`);
});
