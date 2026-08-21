'use strict';

const fs = require('fs');
const path = require('path');

const profileRoot = path.join(__dirname, '..', 'profiles', 'Stargate Glyphs Full.sdProfile');
const pages = [
  '7C4D1B84-2A1E-4B4F-9A51-0E5A56A8E7A1',
  'A3E90D12-8F5D-4F1D-B7D2-3C0E8A2C4F91',
  'E6B21F73-4C8A-46D9-91B6-5A7D2F0C8E34',
  'F1C8A620-5B9D-4E72-AB34-8D0F6C2E9175',
];
const plugin = { Name: 'Stargate Command', UUID: 'com.stargate.command', Version: '1.0.0.0' };
const states = [{ FontFamily: '', FontSize: 12, FontStyle: '', FontUnderline: false, OutlineThickness: 2, ShowTitle: true, TitleAlignment: 'middle', TitleColor: '#ffffff' }];

function actionId(page, column, row) {
  return `stargate-${page}-${column}-${row}`;
}
function glyphAction(page, column, row, glyph) {
  return {
    ActionID: actionId(page, column, row),
    LinkedTitle: true,
    Name: 'Glyph',
    Plugin: plugin,
    Resources: null,
    Settings: { glyph: String(glyph) },
    State: 0,
    States: states,
    UUID: 'com.stargate.command.glyph',
  };
}
function controlAction(page, column, row, name, uuid) {
  return {
    ActionID: actionId(page, column, row),
    LinkedTitle: true,
    Name: name,
    Plugin: plugin,
    Resources: null,
    Settings: {},
    State: 0,
    States: states,
    UUID: uuid,
  };
}
function pageActions(pageIndex, startGlyph, endGlyph) {
  const actions = {};
  const reserved = new Set();
  if (pageIndex > 0) reserved.add('0,2');
  if (pageIndex < pages.length - 1) reserved.add('4,2');
  if (pageIndex === pages.length - 1) {
    reserved.add('3,2');
    reserved.add('4,2');
  }
  let glyph = startGlyph;
  for (let row = 0; row < 3; row++) {
    for (let column = 0; column < 5; column++) {
      if (glyph <= endGlyph && !reserved.has(`${column},${row}`)) {
        actions[`${column},${row}`] = glyphAction(pageIndex, column, row, glyph++);
      }
    }
  }
  if (pageIndex > 0) actions['0,2'] = controlAction(pageIndex, 0, 2, 'Previous Page', 'com.elgato.streamdeck.page.previous');
  if (pageIndex < pages.length - 1) actions['4,2'] = controlAction(pageIndex, 4, 2, 'Next Page', 'com.elgato.streamdeck.page.next');
  if (pageIndex === pages.length - 1) {
    actions['3,2'] = controlAction(pageIndex, 3, 2, 'Enter', 'com.stargate.command.enter');
    actions['4,2'] = controlAction(pageIndex, 4, 2, 'Escape', 'com.stargate.command.escape');
  }
  return actions;
}

fs.rmSync(profileRoot, { recursive: true, force: true });
fs.mkdirSync(profileRoot, { recursive: true });
fs.writeFileSync(path.join(profileRoot, 'manifest.json'), JSON.stringify({
  Device: { Model: '20GAA9902', UUID: '' },
  Name: 'Stargate Glyphs Full',
  Pages: { Current: pages[0], Default: pages[0], Pages: pages },
  Version: '3.0',
}, null, 2) + '\n');

pages.forEach((pageId, index) => {
  const pageRoot = path.join(profileRoot, 'Profiles', pageId);
  fs.mkdirSync(pageRoot, { recursive: true });
  const ranges = index === 0 ? [0, 13] : index === 1 ? [14, 26] : index === 2 ? [27, 38] : [39, 38];
  fs.writeFileSync(path.join(pageRoot, 'manifest.json'), JSON.stringify({
    Controllers: [{ Actions: pageActions(index, ranges[0], ranges[1]), Type: 'Keypad' }],
  }, null, 2) + '\n');
});
console.log(`created full glyph profile with ${pages.length} pages at ${profileRoot}`);
