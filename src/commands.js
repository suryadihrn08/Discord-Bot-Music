import { SlashCommandBuilder } from 'discord.js';

const commands = [];
function add(name, description, setup) {
  const cmd = new SlashCommandBuilder().setName(name).setDescription(description);
  setup?.(cmd);
  commands.push(cmd);
}
const string = (name, description, required = true) => c => c.addStringOption(o => o.setName(name).setDescription(description).setRequired(required));
const integer = (name, description, min, max) => c => c.addIntegerOption(o => o.setName(name).setDescription(description).setRequired(true).setMinValue(min).setMaxValue(max));
for (const name of ['play', 'spotify']) add(name, 'Putar lagu atau tautan playlist', string('query', 'Judul lagu atau tautan'));
for (const [name, description] of Object.entries({ join:'Masuk kanal suara', leave:'Keluar kanal suara', pause:'Jeda musik', resume:'Lanjut musik', skip:'Lewati lagu', stop:'Hentikan dan hapus antrean', queue:'Lihat antrean', nowplaying:'Lihat lagu sekarang', shuffle:'Acak antrean', clearqueue:'Kosongkan antrean', previous:'Putar lagu sebelumnya', backward:'Mundur 10 detik', forward:'Maju 10 detik', musicpanel:'Tampilkan tombol musik', help:'Daftar perintah', about:'Tentang bot', ping:'Lihat latensi', uptime:'Lihat lama bot aktif', 'pl-list':'Daftar playlist kamu' })) add(name, description);
add('volume','Atur volume',integer('level','Persentase 0–100',0,100));
add('seek','Pindah ke detik tertentu',integer('seconds','Posisi dalam detik',0,86400));
add('skipto','Lewati ke nomor antrean',integer('number','Nomor dalam daftar antrean',1,1000));
add('remove','Hapus nomor antrean',integer('number','Nomor dalam daftar antrean',1,1000));
for (const name of ['loop','autoplay']) add(name,'Atur pengulangan atau autoplay',c => c.addStringOption(o => o.setName('mode').setDescription('Pilih mode').setRequired(true).addChoices(...(name === 'loop' ? ['off','track','queue'].map(x=>({name:x,value:x})) : ['on','off'].map(x=>({name:x,value:x}))))));
add('filter','Pilih filter audio', c => c.addStringOption(o => o.setName('preset').setDescription('Preset filter').setRequired(true).addChoices(...['bassboost','nightcore','vaporwave','8D','karaoke','lofi','pop','soft','treble','clear'].map(x=>({name:x,value:x})))));
for (const name of ['bassboost','nightcore','karaoke','pop','soft']) add(name,`Aktifkan filter ${name}`);
add('clearfilter','Hapus seluruh filter');
for (const name of ['toggledj','24-7']) add(name,'Aktif/nonaktifkan pengaturan server');
for (const name of ['adddj','removedj']) add(name,'Kelola role DJ',c=>c.addRoleOption(o=>o.setName('role').setDescription('Role DJ').setRequired(true)));
for (const name of ['pl-create','pl-delete','pl-play','pl-playshuffle','pl-info','pl-savecurrent','pl-savequeue','pl-removeduplicate']) add(name,'Kelola playlist pribadi',string('name','Nama playlist'));
add('pl-removetrack','Hapus lagu dari playlist',c=>{ string('name','Nama playlist')(c); integer('number','Nomor lagu',1,1000)(c); });
export const definitions = commands.map(c => c.toJSON());
