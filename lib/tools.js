const axios = require('axios');
const QRCode = require('qrcode');
const { convert } = require('./fonts');
const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const { exec } = require('child_process');

async function imageToSticker(buffer) {
  try {
    const sharp = require('sharp');
    return await sharp(buffer)
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp()
      .toBuffer();
  } catch {
    return buffer;
  }
}

async function videoToSticker(buffer) {
  const inPath  = path.join(os.tmpdir(), `stk_in_${Date.now()}.mp4`);
  const outPath = path.join(os.tmpdir(), `stk_out_${Date.now()}.webp`);
  await fs.writeFile(inPath, buffer);
  return new Promise((resolve, reject) => {
    exec(
      `ffmpeg -i "${inPath}" -vf "fps=10,scale=512:512:flags=lanczos" -c:v libwebp -loop 0 -preset default -an -t 6 "${outPath}" -y`,
      async err => {
        await fs.remove(inPath).catch(() => {});
        if (err) return reject(new Error('ffmpeg not found or failed. Install ffmpeg (Termux: pkg install ffmpeg)'));
        const buf = await fs.readFile(outPath);
        await fs.remove(outPath).catch(() => {});
        resolve(buf);
      }
    );
  });
}

function getQuotedMsg(msg) {
  const ctx = msg.message?.extendedTextMessage?.contextInfo;
  return ctx?.quotedMessage;
}

async function downloadMedia(sock, msg, quotedMsg) {
  const { downloadMediaMessage } = require('@whiskeysockets/baileys');
  let targetMsg = msg;
  if (quotedMsg) {
    targetMsg = { message: quotedMsg, key: { id: msg.message?.extendedTextMessage?.contextInfo?.stanzaId, remoteJid: msg.key.remoteJid } };
  }
  return downloadMediaMessage(targetMsg, 'buffer', {});
}

module.exports = async (sock, msg, command, args) => {
  const from = msg.key.remoteJid;
  const text = args.join(' ').trim();

  // ── Sticker from image or video ──
  if (command === 'sticker' || command === 's') {
    const quoted = getQuotedMsg(msg);
    const imgMsg = quoted?.imageMessage || msg.message?.imageMessage;
    const vidMsg = quoted?.videoMessage || msg.message?.videoMessage;

    if (!imgMsg && !vidMsg) {
      await sock.sendMessage(from, { text: '❌ Reply to an image or video with .sticker' }, { quoted: msg });
      return true;
    }
    await sock.sendMessage(from, { text: '⏳ Creating sticker...' }, { quoted: msg });
    try {
      let buffer;
      if (imgMsg) {
        buffer = await downloadMedia(sock, msg, quoted);
        buffer = await imageToSticker(buffer);
      } else {
        buffer = await downloadMedia(sock, msg, quoted);
        buffer = await videoToSticker(buffer);
      }
      await sock.sendMessage(from, { sticker: buffer }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Sticker failed: ${e.message}` }, { quoted: msg });
    }
    return true;
  }

  // ── Sticker to image ──
  if (command === 'toimage') {
    const quoted = getQuotedMsg(msg);
    const stkMsg = quoted?.stickerMessage || msg.message?.stickerMessage;
    if (!stkMsg) return sock.sendMessage(from, { text: '❌ Reply to a sticker with .toimage' }, { quoted: msg }), true;
    try {
      const buffer = await downloadMedia(sock, msg, quoted);
      await sock.sendMessage(from, { image: buffer, caption: '🖼️ Here\'s your image!' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Failed: ' + e.message }, { quoted: msg });
    }
    return true;
  }

  // ── QR Code ──
  if (command === 'qr') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .qr <text>' }, { quoted: msg }), true;
    try {
      const buffer = await QRCode.toBuffer(text, { type: 'png', width: 512 });
      await sock.sendMessage(from, { image: buffer, caption: `🔳 QR Code for: _${text}_` }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ QR generation failed.' }, { quoted: msg });
    }
    return true;
  }

  // ── Text to Speech ──
  if (command === 'tts') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .tts <text>' }, { quoted: msg }), true;
    await sock.sendMessage(from, { text: '⏳ Converting to speech...' }, { quoted: msg });
    try {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=${encodeURIComponent(text)}`;
      const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
      await sock.sendMessage(from, {
        audio: Buffer.from(res.data), mimetype: 'audio/mpeg', ptt: false
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: '❌ TTS failed. Try a shorter text.' }, { quoted: msg });
    }
    return true;
  }

  // ── Emoji Mix ──
  if (command === 'emojimix') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .emojimix 😀+😂' }, { quoted: msg }), true;
    const parts = text.split(/[+\s]/);
    if (parts.length < 2) return sock.sendMessage(from, { text: '❌ Usage: .emojimix 😀+😂' }, { quoted: msg }), true;
    try {
      const e1 = [...parts[0].trim()][0];
      const e2 = [...parts[1].trim()][0];
      const cp1 = e1.codePointAt(0).toString(16);
      const cp2 = e2.codePointAt(0).toString(16);
      const dates = ['20201001', '20210218', '20210521', '20211115', '20220203', '20220406', '20220815', '20221101', '20230301', '20230803', '20231113', '20240201'];
      let found = false;
      for (const d of dates) {
        const url = `https://www.gstatic.com/android/keyboard/emojikitchen/${d}/u${cp1}/u${cp1}_u${cp2}.png`;
        try {
          const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
          await sock.sendMessage(from, { image: Buffer.from(res.data), caption: `${e1}+${e2} 🎨` }, { quoted: msg });
          found = true;
          break;
        } catch {}
      }
      if (!found) await sock.sendMessage(from, { text: '❌ No emoji mix found for that combination.' }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: '❌ Emojimix failed: ' + e.message }, { quoted: msg });
    }
    return true;
  }

  // ── Profile Picture ──
  if (command === 'pp') {
    const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const target = mentioned[0] || msg.key.remoteJid;
    try {
      const url = await sock.profilePictureUrl(target, 'image');
      const res  = await axios.get(url, { responseType: 'arraybuffer', timeout: 10000 });
      await sock.sendMessage(from, {
        image: Buffer.from(res.data),
        caption: `🖼️ Profile picture of @${target.split('@')[0]}`,
        mentions: [target]
      }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: '❌ No profile picture found or user has hidden their picture.' }, { quoted: msg });
    }
    return true;
  }

  // ── Weather ──
  if (command === 'weather') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .weather <city>' }, { quoted: msg }), true;
    try {
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=4`, { timeout: 10000 });
      await sock.sendMessage(from, { text: `🌤️ *Weather for ${text}*\n\n${res.data}` }, { quoted: msg });
    } catch {
      await sock.sendMessage(from, { text: '❌ Could not fetch weather. Check city name.' }, { quoted: msg });
    }
    return true;
  }

  // ── Truecaller lookup ──
  if (command === 'truecaller') {
    if (!text) return sock.sendMessage(from, { text: '❌ Usage: .truecaller <number>' }, { quoted: msg }), true;
    await sock.sendMessage(from, { text: '🔍 Looking up...' }, { quoted: msg });
    try {
      const num = text.replace(/[^0-9+]/g, '');
      const res = await axios.get(`https://api.popcat.xyz/truecaller?phone=${encodeURIComponent(num)}`, { timeout: 10000 });
      const d = res.data;
      if (!d || d.error) throw new Error(d?.error || 'Not found');
      await sock.sendMessage(from, {
        text: `📞 *Truecaller Result*\n\n👤 Name: ${d.name || 'Unknown'}\n📱 Number: ${d.number || num}\n📍 Location: ${d.location || 'N/A'}\n📌 Provider: ${d.provider || 'N/A'}`
      }, { quoted: msg });
    } catch (e) {
      await sock.sendMessage(from, { text: `❌ Lookup failed: ${e.message}` }, { quoted: msg });
    }
    return true;
  }

  // ── Font styles 1–15 ──
  for (let i = 1; i <= 15; i++) {
    if (command === `font${i}`) {
      if (!text) return sock.sendMessage(from, { text: `❌ Usage: .font${i} <text>` }, { quoted: msg }), true;
      const converted = convert(text, i - 1);
      await sock.sendMessage(from, { text: `🔤 *Font Style ${i}:*\n\n${converted}` }, { quoted: msg });
      return true;
    }
  }

  return false;
};
  
