const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

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
