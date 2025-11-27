const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../db');
require('dotenv').config();

const BUNNY_API_KEY = process.env.BUNNY_API_KEY;
const BUNNY_LIBRARY_ID = process.env.BUNNY_LIBRARY_ID;
const VIDEO_TOKEN_SECRET = process.env.VIDEO_TOKEN_SECRET || 'dev_secret';

const localVideosPath = path.join(__dirname, '..', 'data', 'videos.json');

router.get('/videos', async (req, res) => {
  if (BUNNY_API_KEY && BUNNY_LIBRARY_ID) {
    try {
      const response = await axios.get(
        `https://video.bunnycdn.com/library/${BUNNY_LIBRARY_ID}/videos`,
        { headers: { AccessKey: BUNNY_API_KEY }, timeout: 5000 }
      );
      const videos = (response.data.items || []).map((v) => ({ id: v.guid, title: v.title, previewUrl: `https://iframe.mediadelivery.net/embed/${v.guid}`, fullUrl: `https://iframe.mediadelivery.net/embed/${v.guid}` }));
      return res.json(videos);
    } catch (err) {
      console.warn('bunny failed, falling back to local videos:', err?.message || err);
    }
  }

  try {
    if (!fs.existsSync(localVideosPath)) return res.json([]);
    const raw = fs.readFileSync(localVideosPath, 'utf-8');
    return res.json(JSON.parse(raw));
  } catch (e) { return res.status(500).json({ error: 'failed to load videos' }); }
});

router.post('/videos/:id/access', (req, res) => {
  const { id } = req.params;
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ error: 'missing code' });

  const entry = db.findCode(code);
  if (!entry) return res.status(403).json({ error: 'invalid code' });

  if (!entry.activatedAt) db.activateCode(code, Date.now());
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  if (now - (entry.activatedAt || now) > oneHour) return res.status(403).json({ error: 'code expired' });

  const token = jwt.sign({ videoId: id }, VIDEO_TOKEN_SECRET, { expiresIn: '1h' });
  res.json({ accessUrl: `/api/videos/stream/${id}?token=${token}`, expiresIn: 3600 });
});

router.get('/videos/stream/:id', (req, res) => {
  const { id } = req.params;
  const token = req.query.token;
  if (!token) return res.status(401).send('missing token');
  try {
    const payload = jwt.verify(token, VIDEO_TOKEN_SECRET);
    if (payload.videoId !== id) return res.status(403).send('video mismatch');
    if (BUNNY_LIBRARY_ID && BUNNY_API_KEY) return res.redirect(`https://iframe.mediadelivery.net/embed/${id}`);
    const videos = JSON.parse(fs.readFileSync(localVideosPath, 'utf-8'));
    const v = videos.find((x) => x.id === id);
    if (!v) return res.status(404).send('not found');
    return res.redirect(v.fullUrl || v.previewUrl);
  } catch (e) { return res.status(401).send('invalid token'); }
});

module.exports = router;
