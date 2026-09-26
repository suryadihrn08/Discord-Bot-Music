import 'dotenv/config';
import { Client, GatewayIntentBits, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Player, QueueRepeatMode } from 'discord-player';
import { definitions } from './commands.js';
import { guild, playlists, persist } from './store.js';

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN belum diisi di .env');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const player = new Player(client);
await player.extractors.loadDefault();
const settings = id => guild(id);
const current = i => player.nodes.get(i.guildId);
const title = t => `[${String(t.title).replaceAll(']', '')}](${t.url})`;
const voice = async i => {
  const member = await i.guild.members.fetch(i.user.id);
  const channel = member.voice.channel;
  if (!channel) throw new Error('Masuk ke voice channel dahulu.');
  const botChannel = i.guild.members.me?.voice.channel;
  if (botChannel && botChannel.id !== channel.id) throw new Error('Masuk ke voice channel bot dahulu.');
  if (!botChannel && !channel.permissionsFor(i.guild.members.me).has([PermissionFlagsBits.Connect, PermissionFlagsBits.Speak])) throw new Error('Bot perlu izin Connect dan Speak.');
  return channel;
};
const dj = async i => {
  const s = settings(i.guildId);
  if (!s.djOnly) return;
  const member = await i.guild.members.fetch(i.user.id);
  if (member.permissions.has(PermissionFlagsBits.ManageGuild) || s.dj.some(id => member.roles.cache.has(id))) return;
  throw new Error('Perintah ini memerlukan role DJ atau izin Manage Server.');
};
const admin = i => { if (!i.memberPermissions.has(PermissionFlagsBits.ManageGuild)) throw new Error('Perlu izin Manage Server.'); };
const active = i => { const q = current(i); if (!q?.currentTrack) throw new Error('Belum ada lagu yang diputar.'); return q; };
const list = q => q.tracks.toArray();
const playlist = (i, name) => { const p = playlists(i.user.id)[name.toLowerCase()]; if (!p) throw new Error('Playlist tidak ditemukan.'); return p; };
const panel = () => new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('music:pause').setLabel('⏯ Jeda/Lanjut').setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId('music:skip').setLabel('⏭ Lewati').setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId('music:stop').setLabel('⏹ Hentikan').setStyle(ButtonStyle.Danger)
);
const play = async (i, query) => {
  const channel = await voice(i);
  const { track, searchResult } = await player.play(channel, query, { requestedBy: i.user, nodeOptions: {
    metadata: { channel: i.channel }, leaveOnEnd: !settings(i.guildId).stay,
    leaveOnStop: !settings(i.guildId).stay, leaveOnEmpty: true, leaveOnEmptyCooldown: 300000,
    selfDeaf: true, volume: 70
  }});
  return searchResult.playlist ? `Playlist **${searchResult.playlist.title}** ditambahkan (${searchResult.tracks.length} lagu).` : `Ditambahkan: ${title(track)}`;
};
player.events.on('playerStart', (q, track) => q.metadata?.channel?.send({ content: `🎵 Sekarang: ${title(track)}`, components: [panel()] }).catch(console.error));
player.events.on('error', (q, error) => console.error('Kesalahan antrean:', error));
player.events.on('playerError', (q, error) => console.error('Gagal memutar:', error));
client.once('ready', () => console.log(`Online sebagai ${client.user.tag} (${definitions.length} perintah)`));
client.on('interactionCreate', async i => {
  if (!i.inGuild() || (!i.isChatInputCommand() && !i.isButton())) return;
  try {
    if (i.isButton()) {
      if (!i.customId.startsWith('music:')) return;
      await voice(i); await dj(i);
      const q = active(i);
      const action = i.customId.split(':')[1];
      if (action === 'pause') q.node.isPaused() ? q.node.resume() : q.node.pause();
      if (action === 'skip') q.node.skip();
      if (action === 'stop') q.delete();
      return i.reply({ content: `Kontrol ${action} dijalankan.`, ephemeral: true });
    }
    const name = i.commandName;
    await i.deferReply();
    let message;
    if (['play','spotify'].includes(name)) { await dj(i); message = await play(i, i.options.getString('query')); }
    else if (name === 'join') { const ch = await voice(i); const q = player.nodes.create(i.guild, { metadata: { channel: i.channel }, leaveOnEnd: !settings(i.guildId).stay, leaveOnStop: !settings(i.guildId).stay, selfDeaf: true }); await q.connect(ch); message = `Masuk ke **${ch.name}**.`; }
    else if (name === 'help') message = '🎵 `/play`, `/spotify`, `/queue`, `/nowplaying`, `/pause`, `/resume`, `/skip`, `/stop`, `/volume`, `/seek`, `/loop`, `/autoplay`, `/filter`\n📂 `/pl-create`, `/pl-savecurrent`, `/pl-savequeue`, `/pl-list`, `/pl-play`, `/pl-delete`\n⚙️ `/adddj`, `/removedj`, `/toggledj`, `/24-7`, `/musicpanel`';
    else if (name === 'about') message = 'Bot musik Discord berbasis discord.js dan Discord Player.';
    else if (name === 'ping') message = `Gateway: ${client.ws.ping} ms`;
    else if (name === 'uptime') message = `Aktif ${Math.floor(process.uptime() / 60)} menit.`;
    else if (name === 'toggledj' || name === '24-7') { admin(i); const s = settings(i.guildId); const field = name === 'toggledj' ? 'djOnly' : 'stay'; s[field] = !s[field]; persist(); message = `${name}: ${s[field] ? 'aktif' : 'nonaktif'}.`; }
    else if (['adddj','removedj'].includes(name)) { admin(i); const s = settings(i.guildId); const role = i.options.getRole('role'); s.dj = name === 'adddj' ? [...new Set([...s.dj, role.id])] : s.dj.filter(x => x !== role.id); persist(); message = `Role ${role} ${name === 'adddj' ? 'ditambahkan' : 'dihapus'} sebagai DJ.`; }
    else if (name === 'pl-create') { const key = i.options.getString('name').toLowerCase(); const all = playlists(i.user.id); if (all[key]) throw new Error('Playlist sudah ada.'); if (Object.keys(all).length >= 30) throw new Error('Batas 30 playlist.'); all[key] = { name: i.options.getString('name'), tracks: [] }; persist(); message = `Playlist **${all[key].name}** dibuat.`; }
    else if (name === 'pl-list') { const all = Object.values(playlists(i.user.id)); message = all.length ? all.map(p => `• ${p.name} (${p.tracks.length} lagu)`).join('\n') : 'Belum punya playlist.'; }
    else if (name.startsWith('pl-')) {
      const key = i.options.getString('name').toLowerCase(); const p = playlist(i, key);
      if (name === 'pl-delete') { delete playlists(i.user.id)[key]; persist(); message = 'Playlist dihapus.'; }
      else if (name === 'pl-info') message = `**${p.name}** (${p.tracks.length} lagu)\n${p.tracks.slice(0,20).map((t,n)=>`${n+1}. ${t.title}`).join('\n') || 'Kosong'}`;
      else if (name === 'pl-savecurrent' || name === 'pl-savequeue') { const q = active(i); const tracks = name === 'pl-savecurrent' ? [q.currentTrack] : [q.currentTrack, ...list(q)]; if (p.tracks.length + tracks.length > 200) throw new Error('Batas 200 lagu per playlist.'); p.tracks.push(...tracks.map(t=>({ title:t.title, url:t.url }))); persist(); message = `${tracks.length} lagu disimpan ke **${p.name}**.`; }
      else if (name === 'pl-removetrack') { const n = i.options.getInteger('number') - 1; if (!p.tracks[n]) throw new Error('Nomor lagu tidak ada.'); p.tracks.splice(n,1); persist(); message = 'Lagu dihapus dari playlist.'; }
      else if (name === 'pl-removeduplicate') { const before = p.tracks.length; p.tracks = p.tracks.filter((t,n,a)=>a.findIndex(x=>x.url===t.url)===n); persist(); message = `${before - p.tracks.length} duplikat dihapus.`; }
      else if (['pl-play','pl-playshuffle'].includes(name)) { await dj(i); if (!p.tracks.length) throw new Error('Playlist kosong.'); let tracks = [...p.tracks]; if (name === 'pl-playshuffle') for (let n = tracks.length - 1; n > 0; n--) { const j = Math.floor(Math.random() * (n + 1)); [tracks[n], tracks[j]] = [tracks[j], tracks[n]]; } await voice(i); let added = 0; for (const track of tracks) { try { await play(i, track.url); added++; } catch (e) { console.error('Lagu playlist gagal:', track.url, e); } } message = `${added}/${tracks.length} lagu dari **${p.name}** ditambahkan.`; }
    }
    else {
      await voice(i); await dj(i);
      const q = active(i);
      if (name === 'pause') { q.node.pause(); message = 'Dijeda.'; }
      else if (name === 'resume') { q.node.resume(); message = 'Dilanjutkan.'; }
      else if (name === 'skip') { q.node.skip(); message = 'Lagu dilewati.'; }
      else if (name === 'stop' || name === 'leave') { q.delete(); message = 'Berhenti dan keluar.'; }
      else if (name === 'nowplaying') message = `🎵 ${title(q.currentTrack)} • ${q.node.getTimestamp()?.current?.label ?? '00:00'} / ${q.currentTrack.duration}`;
      else if (name === 'queue') message = `🎵 ${q.currentTrack.title}\n${list(q).slice(0,15).map((t,n)=>`${n+1}. ${t.title}`).join('\n') || 'Antrean kosong.'}`;
      else if (name === 'musicpanel') return i.editReply({ content: `🎵 ${title(q.currentTrack)}`, components: [panel()] });
      else if (name === 'volume') { const v = i.options.getInteger('level'); q.node.setVolume(v); message = `Volume ${v}%.`; }
      else if (name === 'seek' || name === 'forward' || name === 'backward') { const ms = name === 'seek' ? i.options.getInteger('seconds')*1000 : Math.max(0, q.node.getTimestamp().current.value + (name==='forward'?10000:-10000)); await q.node.seek(ms); message = `Posisi ${Math.floor(ms/1000)} detik.`; }
      else if (name === 'shuffle') { q.tracks.shuffle(); message = 'Antrean diacak.'; }
      else if (name === 'clearqueue') { q.tracks.clear(); message = 'Antrean dikosongkan.'; }
      else if (name === 'remove') { const t = q.tracks.remove(i.options.getInteger('number') - 1); if (!t) throw new Error('Nomor antrean tidak ada.'); message = `${t.title} dihapus.`; }
      else if (name === 'skipto') { const n = i.options.getInteger('number'); if (n > list(q).length) throw new Error('Nomor antrean tidak ada.'); for (let x=1;x<n;x++) q.tracks.remove(0); q.node.skip(); message = `Lewati ke nomor ${n}.`; }
      else if (name === 'previous') { await q.history.previous(); message = 'Memutar lagu sebelumnya.'; }
      else if (name === 'loop' || name === 'autoplay') { const mode = i.options.getString('mode'); q.setRepeatMode(name === 'autoplay' ? (mode === 'on' ? QueueRepeatMode.AUTOPLAY : QueueRepeatMode.OFF) : ({off:QueueRepeatMode.OFF,track:QueueRepeatMode.TRACK,queue:QueueRepeatMode.QUEUE})[mode]); message = `${name}: ${mode}.`; }
      else if (name === 'clearfilter') { await q.filters.ffmpeg.setFilters([]); message = 'Filter dihapus.'; }
      else if (name === 'filter' || ['bassboost','nightcore','karaoke','pop','soft'].includes(name)) { const preset = name === 'filter' ? i.options.getString('preset') : name; if (preset === 'clear') { await q.filters.ffmpeg.setFilters([]); } else await q.filters.ffmpeg.toggle(preset); message = `Filter ${preset} diubah.`; }
    }
    await i.editReply(message || 'Selesai.');
  } catch (error) {
    console.error(error);
    const response = `⚠️ ${error.message?.slice(0, 180) || 'Terjadi kesalahan.'}`;
    if (i.deferred || i.replied) await i.editReply(response).catch(console.error);
    else await i.reply({ content: response, ephemeral: true }).catch(console.error);
  }
});
await client.login(process.env.DISCORD_TOKEN);
