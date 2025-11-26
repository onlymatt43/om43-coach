const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MERCHANT_KEY = process.env.MERCHANT_API_KEY || 'dev_merchant_key_change_me';
const codesFile = path.join(__dirname, '../data/codes.json');

function verifyMerchant(req, res, next) {
  const key = req.header('x-merchant-key') || req.query.merchantKey || req.body.merchantKey;
  if (!key || key !== MERCHANT_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}

function generateCode(prefix = '', length = 10) {
  const raw = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').toUpperCase();
  const code = (prefix ? `${prefix}-` : '') + raw.slice(0, length);
  return code;
}

// POST /webhook/giftcard
// example body: { quantity: 1, prefix: 'GFT', customerRef: 'order-123' }
router.post('/webhook/giftcard', verifyMerchant, (req, res) => {
  const { quantity = 1, prefix = '', customerRef } = req.body || {};
  const q = Math.min(Math.max(parseInt(quantity, 10) || 1, 1), 1000);

  let codes = [];
  try { if (fs.existsSync(codesFile)) codes = JSON.parse(fs.readFileSync(codesFile, 'utf-8')); } catch (e) { codes = []; }

  const created = [];
  for (let i = 0; i < q; i++) {
    const c = generateCode(prefix, 10);
    const entry = { code: c, activatedAt: null, meta: { customerRef: customerRef || null } };
    codes.push(entry);
    created.push(entry);
  }

  try { fs.writeFileSync(codesFile, JSON.stringify(codes, null, 2)); } catch (err) {
    console.error('webhook save error', err?.message || err);
    return res.status(500).json({ error: 'failed to create codes' });
  }

  // Reply with created codes so merchant can print / deliver
  res.json({ created, count: created.length });
});

module.exports = router;
