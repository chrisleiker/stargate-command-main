'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const source = fs.readFileSync(path.join(__dirname, '..', '..', 'public', 'glyph-paths.js'), 'utf8');
const context = {};
vm.runInNewContext(source + '\nthis.paths = GLYPH_PATHS;', context);
const names = ['POINT OF ORIGIN','CRATER','VIRGO','BOOTES','CENTAURUS','LIBRA','SERPENS CAPUT','NORMA','SCORPIUS','CORONA AUSTRALIS','SCUTUM','SAGITTARIUS','AQUILA','MICROSCOPIUM','CAPRICORNUS','PISCIS AUSTRINUS','EQUULEUS','AQUARIUS','PEGASUS','SCULPTOR','PISCES','ANDROMEDA','TRIANGULUM','ARIES','PERSEUS','CETUS','TAURUS','AURIGA','ERIDANUS','ORION','CANIS MINOR','MONOCEROS','GEMINI','HYDRA','LYNX','CANCER','SEXTANS','LEO MINOR','LEO'];
const output = path.join(__dirname, '..', 'com.stargate.command.sdPlugin', 'images', 'glyphs');
fs.mkdirSync(output, { recursive: true });
for (let i = 0; i < 39; i++) {
  const contours = context.paths[i]?.c || [];
  const data = contours.map((contour) => contour.map(([x,y], n) => `${n ? 'L' : 'M'} ${(x * 100 + 100).toFixed(3)} ${(y * 100 + 100).toFixed(3)}`).join(' ') + ' Z').join(' ');
  fs.writeFileSync(path.join(output, `glyph-${String(i).padStart(2, '0')}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="24" fill="#071526"/><circle cx="100" cy="100" r="82" fill="none" stroke="#1e88e5" stroke-width="3"/><path d="${data}" fill="#7dffb2" fill-rule="evenodd"/></svg>`);
}
