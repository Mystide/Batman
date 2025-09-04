const express = require('express');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'mysecrettoken';
const STATUS_FILE = 'read-status.json';

app.use(express.json());

app.get('/read-status', async (_, res) => {
  try {
    const data = await fs.readFile(STATUS_FILE, 'utf8').catch(() => '[]');
    res.json(JSON.parse(data || '[]'));
  } catch {
    res.status(500).json({ error: 'Unable to read status file' });
  }
});

app.post('/read-status', async (req, res) => {
  const auth = req.headers['authorization'] || '';
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    await fs.writeFile(STATUS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Unable to write status file' });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
