// MCP 服务器管理器
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVERS_DIR = path.join(__dirname, 'mcp-servers');

// 确保 MCP 服务器目录存在
if (!fs.existsSync(MCP_SERVERS_DIR)) {
  fs.mkdirSync(MCP_SERVERS_DIR, { recursive: true });
}

// 存储运行中的 MCP 服务器进程
const runningServers = new Map();

/**
 * 获取可用的内置 MCP 服务器列表
 */
export function getAvailableMcpServers() {
  try {
    // 读取 mcp-servers 目录中的所有 .js 文件
    const files = fs.readdirSync(MCP_SERVERS_DIR).filter(file => file.endsWith('.js'));
    
    return files.map(file => {
      const name = file.replace('.js', '');
      const isRunning = runningServers.has(name);
      
      return {
        id: name,
        name: formatServerName(name),
        description: `Built-in MCP server: ${formatServerName(name)}`,
        isBuiltIn: true,
        isRunning
      };
    });
  } catch (error) {
    console.error('Error getting available MCP servers:', error);
    return [];
  }
}

/**
 * 格式化服务器名称，将连字符和下划线替换为空格，并将每个单词首字母大写
 */
function formatServerName(name) {
  return name
    .replace(/[-_]/g, ' ')
    .replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

/**
 * 启动 MCP 服务器
 * @param {string} serverId - 服务器 ID
 * @returns {Promise<{success: boolean, port: number, error: string|null}>}
 */
export async function startMcpServer(serverId) {
  try {
    // 如果服务器已经在运行，返回成功
    if (runningServers.has(serverId)) {
      const serverInfo = runningServers.get(serverId);
      return { 
        success: true, 
        port: serverInfo.port,
        error: null
      };
    }
    
    // 检查服务器文件是否存在
    const serverFile = path.join(MCP_SERVERS_DIR, `${serverId}.js`);
    if (!fs.existsSync(serverFile)) {
      return { 
        success: false, 
        port: null,
        error: `Server file not found: ${serverFile}`
      };
    }
    
    // 分配一个端口（这里简单地使用 8000-8999 范围内的随机端口）
    const port = 8000 + Math.floor(Math.random() * 1000);
    
    // 启动服务器进程
    const serverProcess = spawn('node', [serverFile], {
      env: { ...process.env, PORT: port.toString() },
      detached: true
    });
    
    // 等待服务器启动
    const startPromise = new Promise((resolve, reject) => {
      let output = '';
      let errorOutput = '';
      
      serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('MCP server running')) {
          resolve();
        }
      });
      
      serverProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
        console.error(`MCP server ${serverId} error:`, data.toString());
      });
      
      serverProcess.on('error', (error) => {
        reject(new Error(`Failed to start MCP server: ${error.message}`));
      });
      
      serverProcess.on('exit', (code) => {
        if (code !== 0 && !output.includes('MCP server running')) {
          reject(new Error(`MCP server exited with code ${code}: ${errorOutput}`));
        }
      });
      
      // 设置超时
      setTimeout(() => {
        if (!output.includes('MCP server running')) {
          reject(new Error('Timeout waiting for MCP server to start'));
        }
      }, 5000);
    });
    
    try {
      await startPromise;
      
      // 存储服务器信息
      runningServers.set(serverId, {
        process: serverProcess,
        port
      });
      
      console.log(`MCP server ${serverId} started on port ${port}`);
      
      return { 
        success: true, 
        port,
        error: null
      };
    } catch (error) {
      // 如果启动失败，杀死进程
      serverProcess.kill();
      return { 
        success: false, 
        port: null,
        error: error.message
      };
    }
  } catch (error) {
    console.error(`Error starting MCP server ${serverId}:`, error);
    return { 
      success: false, 
      port: null,
      error: error.message
    };
  }
}

/**
 * 停止 MCP 服务器
 * @param {string} serverId - 服务器 ID
 * @returns {Promise<{success: boolean, error: string|null}>}
 */
export async function stopMcpServer(serverId) {
  try {
    if (!runningServers.has(serverId)) {
      return { 
        success: false, 
        error: `Server ${serverId} is not running`
      };
    }
    
    const serverInfo = runningServers.get(serverId);
    
    // 杀死进程
    serverInfo.process.kill();
    runningServers.delete(serverId);
    
    console.log(`MCP server ${serverId} stopped`);
    
    return { 
      success: true, 
      error: null
    };
  } catch (error) {
    console.error(`Error stopping MCP server ${serverId}:`, error);
    return { 
      success: false, 
      error: error.message
    };
  }
}

/**
 * 获取 MCP 服务器状态
 * @param {string} serverId - 服务器 ID
 * @returns {{isRunning: boolean, port: number|null}}
 */
export function getMcpServerStatus(serverId) {
  if (runningServers.has(serverId)) {
    const serverInfo = runningServers.get(serverId);
    return {
      isRunning: true,
      port: serverInfo.port
    };
  }
  
  return {
    isRunning: false,
    port: null
  };
}

/**
 * 停止所有运行中的 MCP 服务器
 */
export function stopAllMcpServers() {
  for (const [serverId, serverInfo] of runningServers.entries()) {
    try {
      serverInfo.process.kill();
      console.log(`MCP server ${serverId} stopped`);
    } catch (error) {
      console.error(`Error stopping MCP server ${serverId}:`, error);
    }
  }
  
  runningServers.clear();
}

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
