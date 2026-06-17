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

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
