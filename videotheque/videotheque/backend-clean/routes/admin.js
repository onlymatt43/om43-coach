const express = require('express');
const router = express.Router();
const db = require('../db');
require('dotenv').config();

const ADMIN_KEY = process.env.ADMIN_API_KEY || 'dev_admin_key';

function requireAdmin(req, res, next) {
  const key = req.header('x-api-key') || req.header('x-admin-key') || req.query.adminKey || req.body?.adminKey;
  if (!key || key !== ADMIN_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

router.get('/admin/codes', requireAdmin, (req, res) => {
  return res.json(db.getCodes());
});

router.post('/admin/codes', requireAdmin, (req, res) => {
  const { count = 1, prefix = '', length = 10 } = req.body || {};
  const created = [];
  for (let i = 0; i < Math.max(1, Math.min(parseInt(count, 10) || 1, 1000)); i++) {
    const code = (prefix ? prefix + '-' : '') + Math.random().toString(36).slice(2, 2 + Math.max(6, Math.min(length, 32))).toUpperCase();
    created.push({ code, activatedAt: null, meta: null });
  }
  db.createCodes(created);
  res.json({ created });
});

module.exports = router;
