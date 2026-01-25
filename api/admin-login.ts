import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // Set this in Vercel

  if (req.method === 'POST') {
    if (password === ADMIN_PASSWORD) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
