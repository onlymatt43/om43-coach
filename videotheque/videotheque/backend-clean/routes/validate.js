const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/validate', (req, res) => {
  const { code } = req.body || {};
  if (!code) return res.status(400).json({ valid: false });
  const entry = db.findCode(code);
  if (!entry) return res.json({ valid: false });

  if (!entry.activatedAt) { db.activateCode(code, Date.now()); return res.json({ valid: true }); }
  const oneHour = 60 * 60 * 1000;
  return res.json({ valid: Date.now() - entry.activatedAt <= oneHour });
});

module.exports = router;
