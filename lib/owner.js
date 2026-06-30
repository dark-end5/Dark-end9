const { getSetting, setSetting } = require('../database/store');
const { ownerNumber } = require('../config');
const moment = require('moment');

module.exports = async (sock, msg, command, args, isOwner) => {
  const from   = msg.key.remoteJid;
  const text   = args.join(' ').trim();

  if (!isOwner && ['autobio','autotyping','autorecording','autostatus','autosee','antiviewonce',
    'addowner','removeowner','broadcast','restart','pair','aimode','botmode','block','unblock'].includes(command)) {
    await sock.sendMessage(from, { text: '🔒 This command is for the bot owner only.' }, { quoted: msg });
    return true;
  }

  const toggle = async (key, label, restart) => {
    const cur = getSetting(key, false);
    setSetting(key, !cur);
    await sock.sendMessage(from, { text: `${label} *${!cur ? 'ON ✅' : 'OFF ❌'}*${restart ? '\n\n♻️ Restart bot to apply.' : ''}` }, { quoted: msg });
  };

  if (command === 'autobio') { await toggle('autobio', '📝 Auto Bio', false); return true; }
  if (command === 'autotyping') { await toggle('autotyping', '⌨️ Auto Typing', false); return true; }
  if (command === 'autorecording') { await toggle('autorecording', '🎙️ Auto Recording', false); return true; }
  if (command === 'autostatus') { await toggle('autostatus', '📊 Auto Status', false); return true; }
  if (command === 'autosee') { await toggle('autosee', '👁️ Auto See Status', false); return true; }
  if (command === 'antiviewonce') { await toggle('antiviewonce', '👁️ Anti View Once', false); return true; }
  if (command === 'aimode') { await toggle('aimode', '🤖 AI Mode', false); return true; }

  if (command === 'botmode') {
    const mode = text.toLowerCase();
    if (!['public', 'group', 'private'].includes(mode)) {
      return sock.sendMessage(from, { text: '❌ Usage: .botmode public/group/private' }, { quoted: msg }), true;
    }
    setSetting('botmode', mode);
    await sock.sendMessage(from, { text: `🤖 Bot mode set to: *${mode.toUpperCase()}*` }, { quoted: msg });
    return true;
  }

  if (command === 'addowner') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .addowner <number>' }, { quoted: msg }), true;
    const owners = getSetting('owners', [ownerNumber]);
    const num = text.replace(/[^0-9]/g, '');
    if (!owners.includes(num)) {
      owners.push(num);
      setSetting('owners', owners);
    }
    await sock.sendMessage(from, { text: `✅ ${num} added as bot owner!` }, { quoted: msg });
    return true;
  }

  if (command === 'removeowner') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .removeowner <number>' }, { quoted: msg }), true;
    const owners = getSetting('owners', [ownerNumber]);
    const num = text.replace(/[^0-9]/g, '');
    if (num === ownerNumber) return sock.sendMessage(from, { text: '❌ Cannot remove primary owner.' }, { quoted: msg }), true;
    const filtered = owners.filter(o => o !== num);
    setSetting('owners', filtered);
    await sock.sendMessage(from, { text: `✅ ${num} removed from owners.` }, { quoted: msg });
    return true;
  }

  if (command === 'broadcast') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .broadcast <message>' }, { quoted: msg }), true;
    await sock.sendMessage(from, { text: `📢 *BROADCAST*\n\n${text}` }, { quoted: msg });
    return true;
  }

  if (command === 'pair') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .pair <number>\nExample: .pair 254712345678' }, { quoted: msg }), true;
    const num = text.replace(/[^0-9]/g, '');
    try {
      const code = await sock.requestPairingCode(num);
      await sock.sendMessage(from, {
        text: `🔗 *Pairing Code for ${num}:*\n\n*${code}*\n\n_Open WhatsApp → Linked Devices → Link with phone number_`
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Failed to generate code: ${e.message}` }, { quoted: msg });
    }
    return true;
  }

  if (command === 'block') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(from, { text: '❌ Usage: .block @user' }, { quoted: msg }), true;
    try {
      await sock.updateBlockStatus(mentioned[0], 'block');
      await sock.sendMessage(from, { text: `✅ Blocked @${mentioned[0].split('@')[0]}`, mentions: mentioned }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Block failed: ' + e.message }, { quoted: msg });
    }
    return true;
  }

  if (command === 'unblock') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(from, { text: '❌ Usage: .unblock @user' }, { quoted: msg }), true;
    try {
      await sock.updateBlockStatus(mentioned[0], 'unblock');
      await sock.sendMessage(from, { text: `✅ Unblocked @${mentioned[0].split('@')[0]}`, mentions: mentioned }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Unblock failed: ' + e.message }, { quoted: msg });
    }
    return true;
  }

  if (command === 'restart') {
    await sock.sendMessage(from, { text: '♻️ Restarting bot...' }, { quoted: msg });
    setTimeout(() => process.exit(0), 1500);
    return true;
  }

  return false;
};

module.exports.startAutobio = async (sock, cfg) => {
  const update = async () => {
    if (!getSetting('autobio', true)) return;
    const now = moment();
    const bio = `${cfg.autobioText} | ${now.format('dddd, D MMM YYYY')} | ${now.format('HH:mm:ss')} ⏰`;
    try { await sock.updateProfileStatus(bio); } catch {}
  };
  await update();
  setInterval(update, cfg.autobioInterval || 20000);
};
  
