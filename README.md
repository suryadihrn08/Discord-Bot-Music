# Discord Music Bot
11111
Bot musik dengan slash commands, panel tombol, playlist pribadi, DJ role, filter, autoplay, dan mode 24/7. Menerima kata kunci serta tautan YouTube, Spotify, Apple Music, dan SoundCloud sesuai dukungan extractor dan ketersediaan sumber audio.
iya kaya gitu aja sih oke
## Persyaratan

- Node.js 20.11 atau lebih baru
- FFmpeg terpasang dan bisa dipanggil dari terminal (`ffmpeg -version`)
- Aplikasi bot Discord dengan izin **Connect**, **Speak**, **Send Messages**, **Use Application Commands** dan **Embed Links**

## Menjalankan

1. `npm install`
2. Salin `.env.example` menjadi `.env`, lalu isi `DISCORD_TOKEN`, `CLIENT_ID`, dan `GUILD_ID` (ID server uji).
3. Jalankan `npm run deploy` untuk mendaftarkan slash commands.
4. Jalankan `npm start`.
5. Di voice channel, coba `/play query:judul lagu` atau `/play query:tautan`.

`GUILD_ID` membuat perintah cepat muncul di server tersebut. Kosongkan bila ingin mendaftarkan perintah secara global; penyebarannya dapat memakan waktu. Bila `npm start` berhasil tetapi `npm run deploy` memberi 401, cek `DISCORD_TOKEN` di `.env` dan pastikan itu **Bot Token**, bukan Client Secret atau Public Key. Jangan bagikan token atau commit berkas `.env`.

## Perintah

- Musik: `/play`, `/spotify`, `/join`, `/leave`, `/pause`, `/resume`, `/skip`, `/stop`, `/queue`, `/nowplaying`, `/volume`, `/seek`, `/forward`, `/backward`, `/previous`, `/shuffle`, `/clearqueue`, `/remove`, `/skipto`, `/loop`, `/autoplay`.
- Filter: `/filter`, `/bassboost`, `/nightcore`, `/karaoke`, `/pop`, `/soft`, `/clearfilter`.
- Playlist pribadi: `/pl-create`, `/pl-delete`, `/pl-list`, `/pl-info`, `/pl-play`, `/pl-playshuffle`, `/pl-savecurrent`, `/pl-savequeue`, `/pl-removetrack`, `/pl-removeduplicate`.
- Server dan informasi: `/24-7`, `/adddj`, `/removedj`, `/toggledj`, `/musicpanel`, `/help`, `/about`, `/ping`, `/uptime`.

Mode 24/7 menjaga koneksi setelah antrean selesai, tetapi bot tetap keluar jika kanal kosong. Agar tetap online, jalankan proses Node.js pada host yang selalu menyala. Playlist dan pengaturan tersimpan di `data/settings.json` (tidak diikutkan ke repo).

## Catatan sumber audio

Spotify dan Apple Music dipakai untuk menemukan lagu; audio dicari melalui sumber lain. Hasil pencocokan bisa berbeda atau gagal, terutama untuk lagu terbatas wilayah atau tidak tersedia. Pemutaran YouTube dapat berubah mengikuti perubahan layanan dan extractor. Gunakan audio yang memang boleh kamu putar.

Fitur premium, voting, redeem, sponsor, lirik, prefix command, dan integrasi akun Spotify tidak termasuk karena memerlukan layanan, data, atau kredensial tambahan.
