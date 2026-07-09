/**
 * RTK 论坛 API 层（直接调用，无需 MCP 服务器）
 *
 * 将 Node.js MCP Server 的加密、签名、HTTP 请求完整移植到 RN 端
 */

import CryptoJS from 'crypto-js';
import type {LoginParams, UserInfo} from '../types';

// ========== 常量 ==========
const SIGN_CONST = 'P.8CGq@Wr~Vs]!4!';
const ENC_KEY_STR = 'P.8CGq@Wr~Vs]!4!';

// ========== 加密工具 ==========

/** MD5 摘要 */
function md5(str: string): string {
  return CryptoJS.MD5(str).toString(CryptoJS.enc.Hex);
}

/** 生成随机设备 ID（16 位十六进制） */
function generateDeviceId(): string {
  // 使用随机数模拟 crypto.randomBytes
  const hex = '0123456789abcdef';
  let id = '';
  for (let i = 0; i < 16; i++) {
    id += hex[Math.floor(Math.random() * 16)];
  }
  return id;
}

/** Unicode 转义解码（\\uXXXX → 中文） */
function decodeUnicode(str: string): string {
  if (!str) return '';
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
}

/** AES-128-CBC 解密（零填充，去尾零） */
function decryptResponse(base64Data: string): {success: true; data: string} | {success: false; error: string} {
  try {
    const key = CryptoJS.enc.Utf8.parse(ENC_KEY_STR);
    const iv = CryptoJS.enc.Utf8.parse(ENC_KEY_STR);
    const ciphertext = CryptoJS.enc.Base64.parse(base64Data);

    const decrypted = CryptoJS.AES.decrypt(
      {ciphertext} as CryptoJS.lib.CipherParams,
      key,
      {iv, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.NoPadding},
    );

    // 手动去除尾部零字节
    const unpadded = zeroUnpadWordArray(decrypted);
    const text = CryptoJS.enc.Utf8.stringify(unpadded);
    return {success: true, data: text};
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {success: false, error: message};
  }
}

/* eslint-disable no-bitwise */
/** 去除 WordArray 末尾的零字节 */
function zeroUnpadWordArray(wordArray: CryptoJS.lib.WordArray): CryptoJS.lib.WordArray {
  const {words, sigBytes} = wordArray;
  if (sigBytes <= 0) {
    return CryptoJS.lib.WordArray.create([], 0);
  }

  let end = sigBytes;
  while (end > 0) {
    const byteIndex = end - 1;
    const wordIndex = byteIndex >>> 2;
    const shift = (3 - (byteIndex % 4)) * 8;
    if (((words[wordIndex] >>> shift) & 0xff) !== 0) {
      break;
    }
    end--;
  }

  if (end === sigBytes) {
    return wordArray;
  }
  const newWords = words.slice(0, Math.ceil(end / 4));
  return CryptoJS.lib.WordArray.create(newWords, end);
}
/* eslint-enable no-bitwise */

// ========== 签名 ==========

interface Params {
  [key: string]: string | number | undefined;
}

/** 生成请求签名 */
function generateSignature(params: Params, signatureKeys: string[]): string {
  const signParams: Params = {};
  for (const k of signatureKeys) {
    if (params[k] !== undefined) {
      signParams[k] = params[k];
    }
  }

  const pairs = Object.entries(signParams)
    .map(([k, v]) => `${k}=${v}`)
    .sort((a, b) => a.localeCompare(b));

  const joined = pairs.length ? '&' + pairs.join('&') : '';
  const signStr = SIGN_CONST + joined;
  return md5(signStr);
}

// ========== HTTP 请求 ==========

/** UTF-8 字符串 → base64（使用 crypto-js，兼容 Hermes） */
function utf8ToBase64(str: string): string {
  const words = CryptoJS.enc.Utf8.parse(str);
  return CryptoJS.enc.Base64.stringify(words);
}

/** 通用 fetch 封装 */
async function request(
  baseUrl: string,
  path: string,
  method: 'GET' | 'POST' = 'GET',
  body?: string,
): Promise<string> {
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Accept-Encoding': 'gzip',
  };

  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  const response = await fetch(url, {
    method,
    headers,
    body,
  });

  // React Native 原生 HTTP 层已自动解压 gzip
  const text = await response.text();
  return text;
}

// ========== API 调用函数 ==========

/**
 * 登录
 */
async function loginRequest(phone: string, password: string): Promise<string> {
  const passwordMd5 = md5(password);

  const params: Params = {
    channel: 'rtk',
    version: '8740',
    api_level: '36',
    phone_model: '\\u0048\\u004f\\u004e\\u004f\\u0052\\u005f\\u004a\\u004c\\u0048\\u002d\\u0041\\u004e\\u0030\\u0030',
    uname: phone,
    upsw: passwordMd5,
    device_id: generateDeviceId(),
    device_name: 'rtk-mcp',
    os_info: 'LLM',
    client_id: '1',
  };

  const key = generateSignature(params, [
    'channel',
    'version',
    'api_level',
    'phone_model',
    'uname',
    'upsw',
    'device_id',
    'device_name',
  ]);
  params.key = key;

  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  return request('http://rtkapi.ruansky.net:80', `/member/loginVerify?${query}`);
}

/**
 * 获取帖子列表
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getPostsList(
  token: string,
  uid: string | number,
  page = 1,
  limit = 20,
): Promise<string> {
  const params: Params = {
    channel: 'rtk',
    version: '8740',
    api_level: '36',
    phone_model: '\\u0048\\u004f\\u004e\\u004f\\u0052\\u005f\\u004a\\u004c\\u0048\\u002d\\u0041\\u004e\\u0030\\u0030',
    os_info: 'V1__MagicOS__MagicUI_6.1.0',
    uid: String(uid),
    token,
    mid: '10',
    type: 'reply',
    tags: '0',
    page: String(page),
    limit: String(limit),
  };

  const key = generateSignature(params, ['channel', 'version', 'api_level', 'phone_model']);
  params.key = key;

  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  return request('http://rtkapi.ruansky.net:80', `/members/postsList?${query}`);
}

/**
 * 发表评论
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function postComment(
  token: string,
  uid: string | number,
  pid: string | number,
  content: string,
  toUser = '0',
): Promise<string> {
  const contentB64 = utf8ToBase64(content);

  const params: Params = {
    api_level: '36',
    display_mode: '2',
    channel: 'rtk',
    pid: String(pid),
    version: '8740',
    phone_model: '\\u0048\\u004f\\u004e\\u004f\\u0052\\u005f\\u004a\\u004c\\u0048\\u002d\\u0041\\u004e\\u0030\\u0030',
    token,
    uid: String(uid),
    os_version: 'iOS 26',
    mid: '10',
    content: contentB64,
    toUser,
    device_name: '',
    os_info: 'LLM',
    root_cmt_id: '0',
    reply_cmt_id: '0',
  };

  const key = generateSignature(params, [
    'api_level',
    'display_mode',
    'channel',
    'pid',
    'version',
    'phone_model',
    'token',
    'uid',
  ]);
  params.key = key;

  // 按固定顺序构造 body
  const order = [
    'api_level',
    'display_mode',
    'os_version',
    'channel',
    'mid',
    'pid',
    'version',
    'content',
    'phone_model',
    'token',
    'toUser',
    'uid',
    'device_name',
    'os_info',
    'root_cmt_id',
    'key',
    'reply_cmt_id',
  ];

  let body = '';
  for (const k of order) {
    if (params[k] !== undefined) {
      body += `${k}=${encodeURIComponent(String(params[k]))}&`;
    }
  }

  return request('https://rtkapi2.ruansky.net:443', '/bbs/posts/comment', 'POST', body);
}

/**
 * 帖子详情
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function getPostDetailAPI(
  token: string,
  uid: string | number,
  pid: string | number,
  di: string,
): Promise<string> {
  const params: Params = {
    api_level: '31',
    di,
    channel: 'rtk',
    pid: String(pid),
    version: '8730',
    phone_model: '\\u0048\\u004f\\u004e\\u004f\\u0052\\u005f\\u004a\\u004c\\u0048\\u002d\\u0041\\u004e\\u0030\\u0030',
    uid: String(uid),
    os_info: 'V1__MagicOS__MagicUI_6.1.0',
    token,
  };

  const key = generateSignature(params, ['api_level', 'di', 'channel', 'pid', 'version', 'phone_model']);
  params.key = key;

  const query = Object.entries(params)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

  return request('https://rtkapi2.ruansky.net:443', `/bbs/detail?${query}`);
}

// ========== 响应解析 ==========

/** 解析帖子列表响应 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parsePosts(rawData: string): Post[] {
  try {
    const response = JSON.parse(rawData);
    if (!response.data) {
      return [];
    }
    const decrypted = decryptResponse(response.data);
    if (!decrypted.success) {
      return [];
    }
    const postsData = JSON.parse(decrypted.data);
    if (postsData.code !== 0) {
      return [];
    }
    return postsData.data.map((post: Record<string, unknown>) => ({
      id: post.pid as string,
      title: post.title as string,
      content: ((post.content || post.oldContent || '') as string).replace(
        /\[img\][^[]*\[\/img\]/g,
        '[图片]',
      ),
      authorUid: post.uid as string,
      commentCount: parseInt(post.commentNum as string, 10) || 0,
      likeCount: parseInt(post.likeNum as string, 10) || 0,
      time: post.before as string,
    }));
  } catch {
    return [];
  }
}

/** 帖子简要信息 */
interface Post {
  id: string;
  title: string;
  content: string;
  authorUid: string;
  commentCount: number;
  likeCount: number;
  time: string;
}

// ========== 导出函数（供页面使用） ==========

export interface LoginResult {
  success: boolean;
  user?: UserInfo;
  error?: string;
}

/**
 * 登录
 */
export async function login(params: LoginParams): Promise<LoginResult> {
  try {
    const response = await loginRequest(params.phone, params.password);
    const json = JSON.parse(response);

    if (json.data) {
      const decrypted = decryptResponse(json.data);
      if (decrypted.success) {
        const result = JSON.parse(decrypted.data);
        if (result.code === 0) {
          const userData = result.data;
          const uid = String(userData.uid);
          const token = userData.token;

          const userInfo: UserInfo = {
            uid,
            mobile: userData.mobile,
            nickname: decodeUnicode(userData.nickname),
            level: userData.level,
            face: userData.face,
            signature: decodeUnicode(userData.signature),
            sex: userData.sex,
            token,
          };

          return {success: true, user: userInfo};
        }
        return {success: false, error: result.msg || '登录失败'};
      }
    }
    return {success: false, error: '登录失败'};
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {success: false, error: message};
  }
}

/**
 * 获取当前登录状态（本地检查，无网络请求）
 */
export async function getStatus(): Promise<{logged_in: boolean; user?: UserInfo}> {
  return {logged_in: false};
}

/**
 * 退出登录（本地操作，无网络请求）
 */
export async function logout(): Promise<void> {
  // 什么都不做，由页面层清除状态
}
