'use strict';

const fs = require('fs');
const { spawn } = require('child_process');

function spawnOpen(args, how, app, say) {
  return new Promise((resolve, reject) => {
    const child = spawn('open', args, { detached: true, stdio: 'ignore' });
    let settled = false;
    child.on('error', (error) => { if (!settled) { settled = true; say(`launch FAILED  ${app.name} (${how}): ${error.message}`, true); reject(error); } });
    setTimeout(() => { if (!settled) { settled = true; child.unref(); say(`launch  ${app.name}  [${how}, pid ${child.pid}]`); resolve({ how, pid: child.pid }); } }, 350);
  });
}

async function launchApp(app, opts) {
  const options = opts || {}; const say = options.log || (() => {});
  if (app.kind === 'url') {
    if (!options.openExternal) throw new Error('cannot open links here');
    await options.openExternal(app.launchPath); say(`launch  ${app.name}  [url]`); return { how: 'url' };
  }
  if (!app.launchPath || !fs.existsSync(app.launchPath)) throw new Error(app.custom ? 'target no longer exists' : 'target no longer exists — rescan required');
  if (app.kind === 'macapp') return spawnOpen(['-n', '-a', app.launchPath], 'macapp', app, say);
  return spawnOpen([app.launchPath], 'open', app, say);
}

module.exports = { launchApp };
