const { botName } = require('../config');

module.exports = async (sock, from, prefix) => {
  const menu = `
╔══════════════════════════╗
║   ${botName}   ║
╠══════════════════════════╣

👑 *OWNER COMMANDS*
├ ${prefix}autobio on/off
├ ${prefix}autotyping on/off
├ ${prefix}autorecording on/off
├ ${prefix}autostatus on/off
├ ${prefix}autosee on/off
├ ${prefix}antiviewonce on/off
├ ${prefix}aimode on/off
├ ${prefix}botmode public/group/private
├ ${prefix}addowner <number>
├ ${prefix}removeowner <number>
├ ${prefix}broadcast <msg>
├ ${prefix}pair <number>
├ ${prefix}block @user
├ ${prefix}unblock @user
└ ${prefix}restart

👥 *GROUP COMMANDS*
├ ${prefix}antilink on/off
├ ${prefix}antidelete on/off
├ ${prefix}antibadword on/off
├ ${prefix}autoreact on/off
├ ${prefix}welcome on/off
├ ${prefix}goodbye on/off
├ ${prefix}setwelcome <msg>
├ ${prefix}setgoodbye <msg>
├ ${prefix}tagall <msg>
├ ${prefix}promote @user
├ ${prefix}demote @user
├ ${prefix}kick @user
├ ${prefix}add <number>
├ ${prefix}mute / ${prefix}unmute
├ ${prefix}setdesc <desc>
├ ${prefix}setname <name>
├ ${prefix}seticon (with image)
├ ${prefix}groupinfo
├ ${prefix}linkgroup
└ ${prefix}revoke

📥 *DOWNLOAD COMMANDS*
├ ${prefix}play <query>
├ ${prefix}ytmp3 <url>
├ ${prefix}ytmp4 <url>
├ ${prefix}tiktok <url>
└ ${prefix}igdl <url>

🧰 *TOOLS*
├ ${prefix}sticker (reply image/video)
├ ${prefix}toimage (reply sticker)
├ ${prefix}qr <text>
├ ${prefix}tts <text>
├ ${prefix}emojimix <e1+e2>
├ ${prefix}pp @user
├ ${prefix}weather <city>
├ ${prefix}truecaller <number>
└ ${prefix}font1 to ${prefix}font15 <text>

🎮 *GAMES*
├ ${prefix}spell
├ ${prefix}abcd <letter>
├ ${prefix}quiz
├ ${prefix}riddle
├ ${prefix}trivia
├ ${prefix}truth
└ ${prefix}dare

🎲 *FUN*
├ ${prefix}joke
├ ${prefix}quote
├ ${prefix}fact
├ ${prefix}8ball <question>
├ ${prefix}coinflip
├ ${prefix}dice
├ ${prefix}love @user
├ ${prefix}rate @user
├ ${prefix}ship <n1> <n2>
├ ${prefix}roast @user
├ ${prefix}compliment @user
└ ${prefix}horoscope <sign>

> Prefix: *${prefix}* | Lesta Bot v2 🇰🇪
╚══════════════════════════╝`.trim();

  await sock.sendMessage(from, { text: menu });
};
