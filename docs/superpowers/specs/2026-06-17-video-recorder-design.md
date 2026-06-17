# Video Recorder Website — Design Spec
Date: 2026-06-17

## Overview

A minimal self-hosted website running on a VPS that lets the user record videos from their phone browser and save them server-side. Designed for a phone with near-zero local storage — video data is streamed to the server in real-time during recording, never stored on the device.

No authentication. Anyone with the URL can record and view videos.

## Architecture

Two files total:

- `server.js` — Node.js + Express backend
- `public/index.html` — Single-page frontend, no frameworks

### Backend (`server.js`)

- Serves `public/index.html` as a static file
- `POST /upload?filename=<name>` — appends incoming binary chunk to `uploads/<name>` on disk
- `GET /videos` — returns a JSON array of filenames in the `uploads/` directory
- Videos are stored in an `uploads/` directory at the project root

### Frontend (`public/index.html`)

- Uses the browser `MediaRecorder` API to access the phone camera
- On "Start Recording": opens camera stream, creates a `MediaRecorder`, and starts sending 1-second chunks via `fetch POST /upload?filename=<timestamp>.webm`
- On "Stop Recording": stops the `MediaRecorder` and camera stream, refreshes the video list
- Below the controls: a list of all recorded videos fetched from `GET /videos`, each rendered as an HTML `<video>` element with controls

## Data Flow

1. User opens site → page loads, video list fetched and displayed
2. User taps "Start Recording" → camera permission requested → recording begins
3. Every 1 second: a chunk is POSTed to `/upload?filename=<timestamp>.webm` and appended server-side
4. User taps "Stop Recording" → stream stops, video list refreshes
5. New video appears in the list and is immediately playable

## File Naming

Each recording session uses a filename derived from the ISO timestamp at the moment recording starts, e.g. `2026-06-17T14-23-01.webm`. Colons replaced with hyphens for filesystem compatibility.

## Dependencies

- Node.js (any recent LTS version)
- `express` npm package

## Running on VPS

```bash
npm install
node server.js
```

Runs on port 3000 by default. Use nginx or a similar reverse proxy to expose it publicly if needed.

## Out of Scope

- Authentication / access control
- Video deletion from the UI
- Video compression or transcoding
- Mobile app — browser-only
