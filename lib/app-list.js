'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_LIST_FILE = path.join(ROOT, 'app-list.txt');
const GLYPH_NAMES = [
  'POINT OF ORIGIN', 'CRATER', 'VIRGO', 'BOOTES', 'CENTAURUS', 'LIBRA',
  'SERPENS CAPUT', 'NORMA', 'SCORPIUS', 'CORONA AUSTRALIS', 'SCUTUM',
  'SAGITTARIUS', 'AQUILA', 'MICROSCOPIUM', 'CAPRICORNUS', 'PISCIS AUSTRINUS',
  'EQUULEUS', 'AQUARIUS', 'PEGASUS', 'SCULPTOR', 'PISCES', 'ANDROMEDA',
  'TRIANGULUM', 'ARIES', 'PERSEUS', 'CETUS', 'TAURUS', 'AURIGA', 'ERIDANUS',
  'ORION', 'CANIS MINOR', 'MONOCEROS', 'GEMINI', 'HYDRA', 'LYNX', 'CANCER',
  'SEXTANS', 'LEO MINOR', 'LEO',
];

function mulberry32(seed) {
  let value = seed >>> 0;
  return function () {
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addressFor(seedString) {
  let hash = 2166136261 >>> 0;
  const seed = String(seedString);
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  const random = mulberry32(hash);
  const pool = [];
  for (let i = 1; i < GLYPH_NAMES.length; i++) pool.push(i);
  const address = [];
  for (let i = 0; i < 6; i++) {
    address.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  }
  address.push(0);
  return address;
}

function writeAppList(apps) {
  const rows = [
    'STARGATE COMMAND APPLICATION LIST',
    'Generated: ' + new Date().toISOString(),
    '',
  ];

  for (const app of apps || []) {
    const glyphs = addressFor(app.key + '|' + app.name);
    rows.push('APPLICATION: ' + app.name);
    rows.push('KEY: ' + app.key);
    rows.push('GLYPH NUMBERS: ' + glyphs.join(' '));
    rows.push('GLYPHS: ' + glyphs.map((glyph) => GLYPH_NAMES[glyph]).join(' | '));
    rows.push('TARGET: ' + (app.target || app.launchPath || ''));
    rows.push('TYPE: ' + (app.kind || 'unknown'));
    rows.push('');
  }

  try {
    fs.writeFileSync(APP_LIST_FILE, rows.join('\n'), 'utf8');
  } catch (_) {
    /* The install directory may be read-only in a packaged build. */
  }
}

module.exports = { writeAppList };
