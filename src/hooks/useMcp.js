import { useState, useEffect, useCallback } from 'react';

// Custom hook for managing MCP servers and tools
function useMcp(mcpServers) {
  const [serverTools, setServerTools] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Discover tools from all MCP servers
  const discoverTools = useCallback(async () => {
    console.log('Discovering MCP tools, servers:', mcpServers);
    if (!mcpServers || mcpServers.length === 0) {
      console.log('No MCP servers configured');
      setServerTools({});
      return;
    }

    setIsLoading(true);
    setError(null);

    const toolsMap = {};

    try {
      // Discover tools from each server in parallel
      const discoveryPromises = mcpServers.map(async (server) => {
        try {
          const response = await fetch('/api/mcp/discover', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ server })
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error discovering tools for server ${server.name}:`, errorText);
            return {
              serverId: server.id,
              tools: [],
              error: `Failed to discover tools: ${response.status}`
            };
          }

          return await response.json();
        } catch (error) {
          console.error(`Error discovering tools for server ${server.name}:`, error);
          return {
            serverId: server.id,
            tools: [],
            error: error.message
          };
        }
      });

      const results = await Promise.all(discoveryPromises);

      // Organize tools by server
      results.forEach(result => {
        if (result && result.serverId) {
          toolsMap[result.serverId] = {
            tools: result.tools || [],
            error: result.error || null
          };
        }
      });

      setServerTools(toolsMap);
    } catch (error) {
      console.error('Error discovering MCP tools:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [mcpServers]);

  // Execute a tool on an MCP server
  const executeTool = useCallback(async (serverId, toolName, parameters) => {
    if (!mcpServers || !serverId || !toolName) {
      throw new Error('Invalid tool execution parameters');
    }

    const server = mcpServers.find(s => s.id === serverId);
    if (!server) {
      throw new Error(`MCP server with ID ${serverId} not found`);
    }

    try {
      const response = await fetch('/api/mcp/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          server,
          tool: toolName,
          parameters
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Tool execution failed: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error executing tool ${toolName} on server ${server.name}:`, error);
      throw error;
    }
  }, [mcpServers]);

  // Discover tools when servers change
  useEffect(() => {
    console.log('MCP servers changed, discovering tools');
    discoverTools();
  }, [discoverTools]);

  // Get all available tools across all servers
  const getAllTools = useCallback(() => {
    console.log('Getting all MCP tools, serverTools:', serverTools);
    const allTools = [];

    Object.entries(serverTools).forEach(([serverId, serverData]) => {
      if (serverData.tools && serverData.tools.length > 0) {
        const server = mcpServers.find(s => s.id === serverId);
        if (server) {
          serverData.tools.forEach(tool => {
            allTools.push({
              ...tool,
              serverId,
              serverName: server.name
            });
          });
        }
      }
    });

    console.log('All MCP tools:', allTools);
    return allTools;
  }, [serverTools, mcpServers]);

  return {
    serverTools,
    isLoading,
    error,
    discoverTools,
    executeTool,
    getAllTools
  };
}

export default useMcp;
