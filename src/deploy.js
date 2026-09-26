import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { definitions } from './commands.js';
if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) throw new Error('Isi DISCORD_TOKEN dan CLIENT_ID di .env');
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const route = process.env.GUILD_ID ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID) : Routes.applicationCommands(process.env.CLIENT_ID);
await rest.put(route, { body: definitions });
console.log(`${definitions.length} perintah terdaftar ${process.env.GUILD_ID ? 'di server uji' : 'secara global'}.`);
