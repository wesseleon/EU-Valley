import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSessionToken, safeEqual, setSessionCookie } from './_auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const validUsername = process.env.ADMIN_USERNAME;
  const validPassword = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;

  if (!validUsername || !validPassword || !sessionSecret) {
    return res.status(503).json({ success: false, message: 'Admin access is not configured' });
  }

  const username = typeof req.body?.username === 'string' ? req.body.username.trim() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (safeEqual(username, validUsername) && safeEqual(password, validPassword)) {
    setSessionCookie(res, createSessionToken(username, sessionSecret));
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ 
    success: false, 
    message: 'Incorrect username or password' 
  });
}
