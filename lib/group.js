const { getGroup, setGroup } = require('../database/store');
const { badWords } = require('../config');

module.exports = async (sock, msg, command, args, isGroup, isAdmin, isBotAdmin) => {
  const from  = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const text  = args.join(' ').trim();

  if (!isGroup && ['antilink','antidelete','antibadword','autoreact','welcome','goodbye',
    'setwelcome','setgoodbye','tagall','promote','demote','kick','add','mute','unmute',
    'setdesc','setname','seticon','groupinfo','linkgroup','revoke','automute'].includes(command)) {
    await sock.sendMessage(from, { text: '❌ This command is for groups only.' }, { quoted: msg });
    return true;
  }

  // ── Toggle helpers ──
  const toggle = async (key, label) => {
    const cur = getGroup(from, key, false);
    setGroup(from, key, !cur);
    await sock.sendMessage(from, { text: `${label} *${!cur ? 'ON ✅' : 'OFF ❌'}*` }, { quoted: msg });
  };

  if (command === 'antilink') { await toggle('antilink', '🔗 Antilink'); return true; }
  if (command === 'antidelete') { await toggle('antidelete', '🗑️ Antidelete'); return true; }
  if (command === 'antibadword') { await toggle('antibadword', '🤬 Antibadword'); return true; }
  if (command === 'autoreact') { await toggle('autoreact', '😀 Autoreact'); return true; }
  if (command === 'welcome') { await toggle('welcome', '👋 Welcome messages'); return true; }
  if (command === 'goodbye') { await toggle('goodbye', '👋 Goodbye messages'); return true; }
  if (command === 'automute') { await toggle('automute', '🔇 Automute'); return true; }

  if (command === 'setwelcome') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .setwelcome <message>\nUse {user} for the user mention.' }, { quoted: msg }), true;
    setGroup(from, 'welcomeMsg', text);
    await sock.sendMessage(from, { text: `✅ Welcome message set:\n\n_${text}_` }, { quoted: msg });
    return true;
  }

  if (command === 'setgoodbye') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .setgoodbye <message>\nUse {user} for the user name.' }, { quoted: msg }), true;
    setGroup(from, 'goodbyeMsg', text);
    await sock.sendMessage(from, { text: `✅ Goodbye message set:\n\n_${text}_` }, { quoted: msg });
    return true;
  }

  if (command === 'tagall') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin to tag all.' }, { quoted: msg }), true;
    try {
      const meta = await sock.groupMetadata(from);
      const members = meta.participants.map(p => p.id);
      const tagText = `📢 *${text || 'Attention everyone!'}*\n\n` + members.map(u => `@${u.split('@')[0]}`).join(' ');
      await sock.sendMessage(from, { text: tagText, mentions: members }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to tag all members.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'promote' || command === 'demote') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(from, { text: `❌ Usage: .${command} @user` }, { quoted: msg }), true;
    try {
      await sock.groupParticipantsUpdate(from, mentioned, command === 'promote' ? 'promote' : 'demote');
      const action = command === 'promote' ? '👑 Promoted' : '⬇️ Demoted';
      await sock.sendMessage(from, {
        text: `${action}: @${mentioned[0].split('@')[0]}`,
        mentions: mentioned
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Failed to ${command}.` }, { quoted: msg });
    }
    return true;
  }

  if (command === 'kick') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentioned.length) return sock.sendMessage(from, { text: '❌ Usage: .kick @user' }, { quoted: msg }), true;
    try {
      await sock.groupParticipantsUpdate(from, mentioned, 'remove');
      await sock.sendMessage(from, { text: `✅ Kicked @${mentioned[0].split('@')[0]}`, mentions: mentioned }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Could not kick user.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'add') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .add <number> (e.g. .add 254700000000)' }, { quoted: msg }), true;
    const number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    try {
      await sock.groupParticipantsUpdate(from, [number], 'add');
      await sock.sendMessage(from, { text: `✅ Added ${text} to the group!` }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Could not add ${text}. They may not be on WhatsApp or have restricted invites.` }, { quoted: msg });
    }
    return true;
  }

  if (command === 'mute') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    try {
      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: '🔇 Group muted. Only admins can send messages.' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to mute group.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'unmute') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    try {
      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: '🔊 Group unmuted. Everyone can send messages.' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to unmute group.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'setdesc') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .setdesc <description>' }, { quoted: msg }), true;
    try {
      await sock.groupUpdateDescription(from, text);
      await sock.sendMessage(from, { text: '✅ Group description updated!' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to update description.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'setname') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .setname <name>' }, { quoted: msg }), true;
    try {
      await sock.groupUpdateSubject(from, text);
      await sock.sendMessage(from, { text: `✅ Group name changed to: *${text}*` }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to update group name.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'seticon') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
    if (!imgMsg) return sock.sendMessage(from, { text: '❌ Reply to an image or send an image with .seticon caption.' }, { quoted: msg }), true;
    try {
      const { downloadMediaMessage } = require('@whiskeysockets/baileys');
      const buf = await downloadMediaMessage({ message: quoted ? { imageMessage: imgMsg } : msg.message, key: msg.key }, 'buffer', {});
      await sock.updateProfilePicture(from, buf);
      await sock.sendMessage(from, { text: '✅ Group icon updated!' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to update icon: ' + e.message }, { quoted: msg });
    }
    return true;
  }

  if (command === 'groupinfo') {
    try {
      const meta = await sock.groupMetadata(from);
      const admins = meta.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`);
      await sock.sendMessage(from, {
        text: `📊 *Group Info*\n\n👥 Name: ${meta.subject}\n📝 Desc: ${meta.desc || 'None'}\n👤 Members: ${meta.participants.length}\n👑 Admins: ${admins.join(', ')}\n📅 Created: ${new Date(meta.creation * 1000).toLocaleDateString()}`,
        mentions: meta.participants.filter(p => p.admin).map(p => p.id)
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to fetch group info.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'linkgroup') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    try {
      const link = await sock.groupInviteCode(from);
      await sock.sendMessage(from, { text: `🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${link}` }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to get group link.' }, { quoted: msg });
    }
    return true;
  }

  if (command === 'revoke') {
    if (!isBotAdmin) return sock.sendMessage(from, { text: '❌ Bot must be admin.' }, { quoted: msg }), true;
    if (!isAdmin) return sock.sendMessage(from, { text: '❌ You must be an admin.' }, { quoted: msg }), true;
    try {
      await sock.groupRevokeInvite(from);
      await sock.sendMessage(from, { text: '✅ Group invite link revoked & reset.' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed to revoke link.' }, { quoted: msg });
    }
    return true;
  }

  return false;
};

module.exports.handleGroupEvents = async (sock, msg, isGroup) => {
  if (!isGroup) return;
  const from = msg.key.remoteJid;
  const body = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';

  const antilinkOn    = getGroup(from, 'antilink', false);
  const antibadWordOn = getGroup(from, 'antibadword', false);
  const autoreactOn   = getGroup(from, 'autoreact', false);

  if (antilinkOn) {
    const linkRegex = /(https?:\/\/|www\.|chat\.whatsapp\.com|t\.me\/)/i;
    const sender = msg.key.participant || msg.key.remoteJid;
    if (linkRegex.test(body)) {
      try {
        await sock.sendMessage(from, {
          delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender }
        });
        await sock.sendMessage(from, {
          text: `🔗 *Anti-Link:* @${sender.split('@')[0]} links are not allowed!`,
          mentions: [sender]
        });
      } catch {}
    }
  }

  if (antibadWordOn) {
    const lbody = body.toLowerCase();
    const found = badWords.some(w => lbody.includes(w));
    if (found) {
      const sender = msg.key.participant || msg.key.remoteJid;
      try {
        await sock.sendMessage(from, {
          delete: { remoteJid: from, fromMe: false, id: msg.key.id, participant: sender }
        });
        await sock.sendMessage(from, {
          text: `🤬 *Anti-Badword:* @${sender.split('@')[0]} watch your language!`,
          mentions: [sender]
        });
      } catch {}
    }
  }

  if (autoreactOn) {
    const { emojis } = require('../config');
    try {
      await sock.sendMessage(from, {
        react: { text: emojis[Math.floor(Math.random() * emojis.length)], key: msg.key }
      });
    } catch {}
  }
};

module.exports.handleParticipants = async (sock, update) => {
  const { id, participants, action } = update;

  if (action === 'add') {
    const welcomeOn  = getGroup(id, 'welcome', true);
    const welcomeMsg = getGroup(id, 'welcomeMsg', 'Welcome {user} to the group! 👋🎉');
    if (!welcomeOn) return;
    for (const user of participants) {
      const name = user.split('@')[0];
      const text = welcomeMsg.replace('{user}', `@${name}`);
      try {
        await sock.sendMessage(id, { text, mentions: [user] });
      } catch {}
    }
  }

  if (action === 'remove') {
    const goodbyeOn  = getGroup(id, 'goodbye', false);
    const goodbyeMsg = getGroup(id, 'goodbyeMsg', 'Goodbye {user}! We\'ll miss you 👋');
    if (!goodbyeOn) return;
    for (const user of participants) {
      const name = user.split('@')[0];
      const text = goodbyeMsg.replace('{user}', name);
      try {
        await sock.sendMessage(id, { text });
      } catch {}
    }
  }

  if (action === 'promote') {
    for (const user of participants) {
      try {
        await sock.sendMessage(id, {
          text: `👑 @${user.split('@')[0]} has been promoted to admin! Congratulations!`,
          mentions: [user]
        });
      } catch {}
    }
  }

  if (action === 'demote') {
    for (const user of participants) {
      try {
        await sock.sendMessage(id, {
          text: `⬇️ @${user.split('@')[0]} has been demoted from admin.`,
          mentions: [user]
        });
      } catch {}
    }
  }
};
  
