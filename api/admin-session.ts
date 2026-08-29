import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clearSessionCookie, hasValidAdminSession } from './_auth.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: hasValidAdminSession(req) });
  }

  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  }

  res.setHeader('Allow', 'GET, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}