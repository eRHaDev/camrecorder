require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');
const serveIndex = require('serve-index');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!process.env.UPLOADS_USERNAME || !process.env.UPLOADS_PASSWORD) {
  console.error('UPLOADS_USERNAME and UPLOADS_PASSWORD must be set in .env');
  process.exit(1);
}

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.static(path.join(__dirname, 'public')));

app.use('/uploads', basicAuth({
  users: { [process.env.UPLOADS_USERNAME]: process.env.UPLOADS_PASSWORD },
  challenge: true,
}));
app.use('/uploads', serveIndex(UPLOADS_DIR, { icons: true }));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use('/upload', (req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 100 * 1024 * 1024) {
    return res.status(413).send('Chunk too large');
  }
  next();
});

app.post('/upload', (req, res) => {
  const filename = req.query.filename;
  if (!filename || !/^[\w\-]+\.webm$/.test(filename)) {
    return res.status(400).send('Invalid filename');
  }
  const filepath = path.join(UPLOADS_DIR, filename);
  const writeStream = fs.createWriteStream(filepath, { flags: 'a' });
  req.pipe(writeStream);
  writeStream.on('finish', () => { if (!res.headersSent) res.sendStatus(200); });
  writeStream.on('error', () => { if (!res.headersSent) res.sendStatus(500); });
});

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
