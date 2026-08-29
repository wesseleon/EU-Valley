import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'eu_valley_admin';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

const encode = (value: string) => Buffer.from(value).toString('base64url');

const sign = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('base64url');

export const safeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
};

export const createSessionToken = (username: string, secret: string) => {
  const payload = encode(JSON.stringify({ username, expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000 }));
  return `${payload}.${sign(payload, secret)}`;
};

const readCookie = (req: VercelRequest) => {
  const cookies = req.headers.cookie?.split(';') ?? [];
  const match = cookies.find((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`));
  return match?.trim().slice(COOKIE_NAME.length + 1);
};

export const hasValidAdminSession = (req: VercelRequest) => {
  const secret = process.env.ADMIN_SESSION_SECRET;
  const token = readCookie(req);
  if (!secret || !token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload, secret))) return false;

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { expiresAt?: number };
    return typeof session.expiresAt === 'number' && session.expiresAt > Date.now();
  } catch {
    return false;
  }
};

export const setSessionCookie = (res: VercelResponse, token: string) => {
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`,
  );
};

export const clearSessionCookie = (res: VercelResponse) => {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
};

export const isSameOriginRequest = (req: VercelRequest) => {
  const origin = req.headers.origin;
  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
};