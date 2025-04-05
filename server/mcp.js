// MCP (Model Context Protocol) client implementation
import fetch from 'node-fetch';

// Function to call an MCP server
export async function callMcpServer(server, request) {
  try {
    console.log(`Calling MCP server: ${server.name} at ${server.endpoint}`);

    const headers = {
      'Content-Type': 'application/json'
    };

    // Add authentication if provided
    if (server.authToken) {
      headers['Authorization'] = `Bearer ${server.authToken}`;
    }

    const response = await fetch(server.endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`MCP server error: ${response.status}`, errorText);
      throw new Error(`MCP server error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling MCP server ${server.name}:`, error);
    throw error;
  }
}

// Function to discover available tools from an MCP server
export async function discoverMcpServerTools(server) {
  try {
    console.log(`[MCP] Discovering tools from server ${server.name} at ${server.endpoint}`);
    const discoveryRequest = {
      type: 'discovery'
    };

    console.log('[MCP] Sending discovery request:', discoveryRequest);
    const response = await callMcpServer(server, discoveryRequest);
    console.log('[MCP] Discovery response:', response);

    const result = {
      serverId: server.id,
      serverName: server.name,
      tools: response.tools || []
    };
    console.log('[MCP] Processed discovery result:', result);
    return result;
  } catch (error) {
    console.error(`[MCP] Error discovering tools from MCP server ${server.name}:`, error);
    return {
      serverId: server.id,
      serverName: server.name,
      tools: [],
      error: error.message
    };
  }
}

// Function to execute a tool on an MCP server
export async function executeMcpTool(server, toolName, parameters) {
  try {
    const toolRequest = {
      type: 'tool_execution',
      tool: toolName,
      parameters
    };

    return await callMcpServer(server, toolRequest);
  } catch (error) {
    console.error(`Error executing tool ${toolName} on MCP server ${server.name}:`, error);
    throw error;
  }
}
