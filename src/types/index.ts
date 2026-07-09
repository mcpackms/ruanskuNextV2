/** 登录请求参数 */
export interface LoginParams {
  phone: string;
  password: string;
}

/** 用户信息 */
export interface UserInfo {
  uid: string;
  nickname: string;
  mobile: string;
  level: string;
  face?: string;
  signature?: string;
  sex?: string;
  token: string;
}

/** MCP 响应格式 */
export interface MCPResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  [key: string]: unknown;
  user?: T;
}