'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function tokenizeExec(value) {
  const tokens = [];
  let current = '';
  let quote = '';
  let escaped = false;

  for (const ch of String(value || '')) {
    if (escaped) {
      current += ch;
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (quote) {
      if (ch === quote) quote = '';
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += ch;
    }
  }
  if (escaped) current += '\\';
  if (current) tokens.push(current);
  return tokens;
}

function parseDesktopFile(filePath) {
  let text;
  try {
    text = fs.readFileSync(filePath, 'utf8');
  } catch (_) {
    return null;
  }

  const values = {};
  let inDesktopEntry = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line.startsWith('[')) {
      inDesktopEntry = line === '[Desktop Entry]';
      continue;
    }
    if (!inDesktopEntry || !line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator < 0) continue;
    values[line.slice(0, separator)] = line.slice(separator + 1);
  }

  if (values.Type && values.Type !== 'Application') return null;
  if (values.NoDisplay === 'true' || values.Hidden === 'true') return null;
  const name = values.Name && values.Name.trim();
  const exec = values.Exec && tokenizeExec(values.Exec);
  if (!name || !exec || !exec.length) return null;

  const args = exec.filter((token, index) => index === 0 || !/^%[fFuUdDnNickvm]$/.test(token));
  let command = args.shift();
  if (command === 'env') {
    while (args.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(args[0])) args.shift();
    command = args.shift();
  }
  if (!command) return null;

  return {
    n: name,
    p: filePath,
    t: command,
    a: args.join(' '),
    x: args,
    w: '',
    g: path.basename(path.dirname(filePath)),
    k: 'linuxapp',
  };
}

function scanLinuxApps() {
  const home = os.homedir();
  const roots = [
    path.join(home, '.local', 'share', 'applications'),
    '/usr/local/share/applications',
    '/usr/share/applications',
  ];
  const results = [];
  const seen = new Set();

  for (const root of roots) {
    let files;
    try {
      files = fs.readdirSync(root);
    } catch (_) {
      continue;
    }
    for (const file of files) {
      if (!file.endsWith('.desktop')) continue;
      const fullPath = path.join(root, file);
      const entry = parseDesktopFile(fullPath);
      if (!entry) continue;
      const key = entry.n.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      results.push(entry);
    }
  }
  return results;
}

module.exports = { scanLinuxApps };
