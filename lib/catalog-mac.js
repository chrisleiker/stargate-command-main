'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function normalizeName(name) {
  return String(name || '').toLowerCase().replace(/\.app$/i, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function scanMacApps() {
  const roots = ['/Applications', path.join(os.homedir(), 'Applications')];
  const found = [];
  const seen = new Set();
  function visit(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name.toLowerCase().endsWith('.app')) {
        const name = entry.name.replace(/\.app$/i, '');
        const key = normalizeName(name);
        if (key && !seen.has(key)) {
          seen.add(key);
          found.push({ name, key, launchPath: full, target: full, args: '', workDir: '', group: path.basename(dir), kind: 'macapp' });
        }
      } else if (entry.isDirectory()) visit(full);
    }
  }
  for (const root of roots) visit(root);
  return found;
}

function createCatalog(dataDir, options) {
  const opts = options || {};
  const cacheFile = path.join(dataDir, 'catalog.json');
  const usageFile = path.join(dataDir, 'usage.json');
  const maxAgeMs = opts.maxAgeMs || 43200000;
  let scanned = [], customList = [], apps = [], scannedAt = 0, usage = {};
  try { usage = JSON.parse(fs.readFileSync(usageFile, 'utf8')) || {}; } catch (_) {}
  function rebuild() {
    apps = [...scanned, ...customList].sort((a, b) => a.name.localeCompare(b.name));
    apps.forEach((app, index) => { app.id = index; });
  }
  function loadCache() {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (cache && Array.isArray(cache.apps) && cache.apps.length) { scanned = cache.apps; scannedAt = cache.scannedAt || 0; rebuild(); return true; }
    } catch (_) {}
    return false;
  }
  async function scan() {
    scanned = scanMacApps(); scannedAt = Date.now(); rebuild();
    try { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(cacheFile, JSON.stringify({ apps: scanned, scannedAt }), 'utf8'); } catch (_) {}
    return apps;
  }
  function setCustom(list) {
    customList = (list || []).map((entry) => ({ name: entry.name, key: normalizeName(entry.name), launchPath: entry.launchPath, target: entry.target || '', args: entry.args || '', workDir: entry.workDir || '', group: '', kind: entry.kind, custom: true, customId: entry.id }));
    rebuild(); return apps;
  }
  async function ensure(force) {
    if (force || !scanned.length || Date.now() - scannedAt > maxAgeMs) { try { await scan(); } catch (error) { if (!scanned.length) throw error; } }
    return apps;
  }
  function recordUsage(key) {
    const value = usage[key] || { count: 0, last: 0 }; value.count++; value.last = Date.now(); usage[key] = value;
    try { fs.mkdirSync(dataDir, { recursive: true }); fs.writeFileSync(usageFile, JSON.stringify(usage), 'utf8'); } catch (_) {}
  }
  function toClientList(opts) {
    const hide = (opts && opts.hidden) || new Set(); const icon = (opts && opts.icon) || (() => null); const addressOf = (opts && opts.address) || {};
    return { scannedAt, apps: apps.map((app) => ({ id: app.id, name: app.name, key: app.key, address: addressOf[app.key] || null, group: app.group, kind: app.kind, use: usage[app.key] || null, hidden: hide.has(app.key), custom: !!app.custom, icon: icon(app.key) })) };
  }
  return { scan, ensure, loadCache, setCustom, recordUsage, toClientList, get apps() { return apps; }, get scannedAt() { return scannedAt; } };
}

module.exports = { createCatalog, normalizeName, scanMacApps };
