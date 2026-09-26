import fs from 'node:fs';
import path from 'node:path';

const file = path.resolve('data/settings.json');
let state = { guilds: {}, playlists: {} };
try { state = { ...state, ...JSON.parse(fs.readFileSync(file, 'utf8')) }; } catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
let pending;
function save() {
  clearTimeout(pending);
  pending = setTimeout(() => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const temp = `${file}.tmp`;
    fs.writeFileSync(temp, JSON.stringify(state, null, 2));
    fs.renameSync(temp, file);
  }, 200);
}
export function guild(id) { return state.guilds[id] ??= { dj: [], djOnly: false, stay: false }; }
export function playlists(id) { return state.playlists[id] ??= {}; }
export function persist() { save(); }
