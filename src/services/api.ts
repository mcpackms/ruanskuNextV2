/**
 * RTK MCP Server API 服务层
 * 通过本地的 MCP HTTP 接口调用论坛 API
 */

import type {LoginParams, MCPResponse, UserInfo} from '../types';

// MCP Server 地址（本地运行）
const MCP_BASE_URL = 'http://localhost:3456';

/**
 * 调用 MCP 工具的通用方法
 */
async function callTool<T = unknown>(
  name: string,
  args: Record<string, unknown>,
): Promise<MCPResponse<T>> {
  const response = await fetch(`${MCP_BASE_URL}/messages`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name,
        arguments: args,
      },
    }),
  });

  const json = await response.json();

  if (json.error) {
    throw new Error(json.error.message || 'RPC 调用失败');
  }

  const content = json.result?.content?.[0]?.text;
  if (!content) {
    throw new Error('响应格式异常');
  }

  return JSON.parse(content);
}

/**
 * 登录
 */
export async function login(params: LoginParams): Promise<{
  success: boolean;
  user?: UserInfo;
  error?: string;
}> {
  const result = await callTool<UserInfo>('login', {
    phone: params.phone,
    password: params.password,
  });

  return {
    success: result.success,
    user: result.user as UserInfo | undefined,
    error: result.error,
  };
}

/**
 * 获取当前登录状态
 */
export async function getStatus(): Promise<{
  logged_in: boolean;
  user?: UserInfo;
}> {
  const result = await callTool('status', {});
  return {
    logged_in: result.logged_in as boolean,
    user: result.user as UserInfo | undefined,
  };
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  await callTool('logout', {});
}