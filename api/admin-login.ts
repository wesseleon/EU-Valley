import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Only allow POST requests (like your frontend sends)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  // 2. Compare the password to the Environment Variable
  // NOTE: On the backend (Vercel), we use process.env
  if (password === process.env.VITE_ADMIN_PASSWORD) {
    return res.status(200).json({ success: true });
  }

  // 3. If it doesn't match
  return res.status(401).json({ success: false, message: 'Incorrect password' });
}
