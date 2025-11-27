const fs = require('fs');
const path = require('path');

const codesPath = path.join(__dirname, 'data', 'codes.json');
if (!fs.existsSync(path.dirname(codesPath))) fs.mkdirSync(path.dirname(codesPath), { recursive: true });

function readCodes() {
  try {
    if (!fs.existsSync(codesPath)) return [];
    return JSON.parse(fs.readFileSync(codesPath, 'utf-8')) || [];
  } catch (e) { return []; }
}

function writeCodes(items) {
  fs.writeFileSync(codesPath, JSON.stringify(items, null, 2));
}

module.exports = {
  getCodes() { return readCodes(); },
  findCode(code) { return readCodes().find((c) => c.code === code) || null; },
  createCodes(entries) {
    const existing = readCodes();
    const merged = existing.concat(entries.map((e) => ({ code: e.code, activatedAt: e.activatedAt || null, meta: e.meta || null })));
    writeCodes(merged);
  },
  activateCode(code, ts) {
    const items = readCodes();
    const e = items.find((c) => c.code === code);
    if (!e) return false;
    if (!e.activatedAt) { e.activatedAt = ts || Date.now(); writeCodes(items); return true; }
    return false;
  }
};
