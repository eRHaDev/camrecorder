# Video Recorder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js + Express website that lets a phone browser record video and stream it to the server in real-time, with no video stored on the device.

**Architecture:** Express serves a single HTML page and two endpoints — `POST /upload` appends incoming binary chunks to a `.webm` file in an `uploads/` directory, and `GET /videos` returns the list. The frontend uses the browser `MediaRecorder` API, sending 1-second chunks during recording.

**Tech Stack:** Node.js, Express 4, vanilla HTML/JS, no build tools

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | Project metadata and dependencies |
| `server.js` | Express server: static files, upload endpoint, video list endpoint |
| `public/index.html` | Single-page frontend: record button, video list |
| `uploads/` | Directory where `.webm` files are stored (created at runtime) |

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "video-recorder",
  "version": "1.0.0",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.2"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` generated, no errors.

- [ ] **Step 3: Commit**

```bash
git init
git add package.json package-lock.json
git commit -m "feat: init project with express dependency"
```

---

### Task 2: Server skeleton

**Files:**
- Create: `server.js`

- [ ] **Step 1: Write the server skeleton**

```js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

app.use(express.static('public'));
app.use('/uploads', express.static(UPLOADS_DIR));

app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));
```

- [ ] **Step 2: Create the public directory**

```bash
mkdir -p public
```

- [ ] **Step 3: Verify server starts**

```bash
node server.js
```

Expected output: `Listening on http://localhost:3000`

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat: add express server skeleton"
```

---

### Task 3: Upload endpoint

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add the upload endpoint to server.js**

Add this block before the `app.listen(...)` line:

```js
app.post('/upload', (req, res) => {
  const filename = req.query.filename;
  if (!filename || !/^[\w\-.]+$/.test(filename)) {
    return res.status(400).send('Invalid filename');
  }
  const filepath = path.join(UPLOADS_DIR, filename);
  const writeStream = fs.createWriteStream(filepath, { flags: 'a' });
  req.pipe(writeStream);
  writeStream.on('finish', () => res.sendStatus(200));
  writeStream.on('error', () => res.sendStatus(500));
});
```

- [ ] **Step 2: Start the server**

```bash
node server.js
```

- [ ] **Step 3: Verify the upload endpoint works**

In a second terminal:

```bash
echo "hello" | curl -s -X POST "http://localhost:3000/upload?filename=test.webm" -H "Content-Type: application/octet-stream" --data-binary @-
```

Expected: HTTP 200 response (empty body).

```bash
cat uploads/test.webm
```

Expected: `hello` printed to terminal.

```bash
rm uploads/test.webm
```

- [ ] **Step 4: Verify invalid filename is rejected**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST "http://localhost:3000/upload?filename=../evil.webm"
```

Expected: `400`

Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat: add chunked upload endpoint"
```

---

### Task 4: Videos list endpoint

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add the videos list endpoint to server.js**

Add this block before the `app.listen(...)` line (after the upload endpoint):

```js
app.get('/videos', (req, res) => {
  const files = fs.readdirSync(UPLOADS_DIR)
    .filter(f => f.endsWith('.webm'))
    .sort()
    .reverse();
  res.json(files);
});
```

- [ ] **Step 2: Start the server**

```bash
node server.js
```

- [ ] **Step 3: Verify the videos endpoint returns an empty array initially**

```bash
curl -s http://localhost:3000/videos
```

Expected: `[]`

- [ ] **Step 4: Upload a fake video and verify it appears in the list**

```bash
echo "fake" | curl -s -X POST "http://localhost:3000/upload?filename=2026-06-17T10-00-00.webm" -H "Content-Type: application/octet-stream" --data-binary @-
curl -s http://localhost:3000/videos
```

Expected: `["2026-06-17T10-00-00.webm"]`

```bash
rm uploads/2026-06-17T10-00-00.webm
```

Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat: add videos list endpoint"
```

---

### Task 5: Frontend

**Files:**
- Create: `public/index.html`

- [ ] **Step 1: Create public/index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Video Recorder</title>
  <style>
    body { font-family: sans-serif; max-width: 640px; margin: 0 auto; padding: 1rem; }
    button { padding: 1rem 2rem; font-size: 1.2rem; margin: 0.5rem 0; cursor: pointer; }
    button:disabled { opacity: 0.4; cursor: default; }
    video { width: 100%; margin: 0.5rem 0; background: #000; }
    #status { color: gray; margin: 0.5rem 0; min-height: 1.5em; }
    .recording-item { border-top: 1px solid #ddd; padding-top: 0.5rem; margin-top: 0.5rem; }
    .recording-item p { margin: 0 0 0.25rem; font-size: 0.9rem; color: #555; }
  </style>
</head>
<body>
  <h1>Video Recorder</h1>
  <div>
    <button id="startBtn">Start Recording</button>
    <button id="stopBtn" disabled>Stop Recording</button>
  </div>
  <p id="status">Ready</p>

  <h2>Recordings</h2>
  <div id="videos"></div>

  <script>
    let mediaRecorder = null;
    let currentFilename = null;

    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const statusEl = document.getElementById('status');

    async function loadVideos() {
      const res = await fetch('/videos');
      const files = await res.json();
      const container = document.getElementById('videos');
      if (files.length === 0) {
        container.innerHTML = '<p>No recordings yet.</p>';
        return;
      }
      container.innerHTML = files.map(f => `
        <div class="recording-item">
          <p>${f}</p>
          <video src="/uploads/${f}" controls></video>
        </div>
      `).join('');
    }

    startBtn.addEventListener('click', async () => {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (err) {
        statusEl.textContent = 'Camera access denied.';
        return;
      }

      currentFilename = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '') + '.webm';
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0) {
          await fetch(`/upload?filename=${currentFilename}`, {
            method: 'POST',
            body: e.data,
          });
        }
      };

      mediaRecorder.start(1000);
      startBtn.disabled = true;
      stopBtn.disabled = false;
      statusEl.textContent = 'Recording...';
    });

    stopBtn.addEventListener('click', () => {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      mediaRecorder = null;
      startBtn.disabled = false;
      stopBtn.disabled = true;
      statusEl.textContent = 'Saved!';
      setTimeout(loadVideos, 500);
    });

    loadVideos();
  </script>
</body>
</html>
```

- [ ] **Step 2: Start the server and open in a browser**

```bash
node server.js
```

Open `http://localhost:3000` in a browser. Expected: page loads with "Start Recording" button and "No recordings yet."

- [ ] **Step 3: Test a recording**

1. Click "Start Recording" — browser asks for camera permission, grant it
2. Status changes to "Recording..."
3. Wait 5 seconds
4. Click "Stop Recording"
5. Status changes to "Saved!"
6. After ~1 second, a new video appears in the recordings list
7. Click play on the video — it plays back what was just recorded

- [ ] **Step 4: Test multiple recordings**

Repeat step 3 two more times. Each recording should appear as a separate entry in the list, newest first.

Stop the server with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "feat: add video recorder frontend"
```

---

### Task 6: Add .gitignore

**Files:**
- Create: `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
node_modules/
uploads/
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add gitignore"
```

---

## Deployment Notes

To run on the VPS:

```bash
git clone <repo> video-recorder
cd video-recorder
npm install
node server.js
```

The server runs on port 3000. To access it publicly without specifying a port, configure nginx to proxy requests to `localhost:3000`. A minimal nginx config block:

```nginx
server {
    listen 80;
    server_name your-domain-or-ip;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        client_max_body_size 0;
    }
}
```

`client_max_body_size 0` disables nginx's upload size limit, which is required for video streaming.

To keep the server running after logout:

```bash
nohup node server.js &
```
