const axios = require('axios');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

function hasYtdlp() {
  return new Promise(resolve => exec('yt-dlp --version', err => resolve(!err)));
}

async function ytSearch(query) {
  try {
    const res = await axios.get(
      `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D`,
      { timeout: 10000 }
    );
    const match = res.data.match(/"videoId":"([^"]+)"/);
    return match ? `https://www.youtube.com/watch?v=${match[1]}` : null;
  } catch { return null; }
}

async function downloadWithYtdlp(url, format, outPath) {
  return new Promise((resolve, reject) => {
    const cmd = format === 'mp3'
      ? `yt-dlp -x --audio-format mp3 -o "${outPath}" "${url}"`
      : `yt-dlp -f "best[ext=mp4]/best" -o "${outPath}" "${url}"`;
    exec(cmd, { timeout: 120000 }, err => err ? reject(err) : resolve(outPath));
  });
}

async function downloadWithYtdlCore(url, format) {
  let ytdl;
  try { ytdl = require('ytdl-core'); } catch { return null; }
  const info  = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, '').trim().slice(0, 40);
  const ext   = format === 'mp3' ? 'mp3' : 'mp4';
  const tmp   = path.join(os.tmpdir(), `${Date.now()}_lesta.${ext}`);
  return new Promise((resolve, reject) => {
    const stream = format === 'mp3'
      ? ytdl(url, { filter: 'audioonly', quality: 'highestaudio' })
      : ytdl(url, { filter: 'videoandaudio', quality: 'highest' });
    const file = fs.createWriteStream(tmp);
    stream.pipe(file);
    file.on('finish', () => resolve({ path: tmp, title }));
    file.on('error', reject);
    stream.on('error', reject);
  });
}

module.exports = async (sock, msg, command, args) => {
  const from = msg.key.remoteJid;
  const text = args.join(' ').trim();
  if (!['play', 'ytmp3', 'ytmp4', 'tiktok', 'igdl'].includes(command)) return false;

  if (!text) {
    await sock.sendMessage(from, { text: `❌ Usage: .${command} <url or query>` }, { quoted: msg });
    return true;
  }

  await sock.sendMessage(from, { text: '⏳ Processing download...' }, { quoted: msg });

  try {
    if (command === 'play' || command === 'ytmp3') {
      let url = text;
      if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
        await sock.sendMessage(from, { text: '🔍 Searching YouTube...' }, { quoted: msg });
        url = await ytSearch(text);
        if (!url) throw new Error('No results found');
      }
      const useYtdlp = await hasYtdlp();
      const tmpPath  = path.join(os.tmpdir(), `${Date.now()}_lesta.mp3`);
      let result;
      if (useYtdlp) {
        await downloadWithYtdlp(url, 'mp3', tmpPath);
        result = { path: tmpPath, title: 'Audio' };
      } else {
        result = await downloadWithYtdlCore(url, 'mp3');
        if (!result) throw new Error('Install yt-dlp: pip install yt-dlp');
      }
      const buffer = await fs.readFile(result.path);
      await sock.sendMessage(from, {
        audio: buffer, mimetype: 'audio/mpeg',
        fileName: `${result.title || 'audio'}.mp3`, ptt: false
      }, { quoted: msg });
      await fs.remove(result.path).catch(() => {});

    } else if (command === 'ytmp4') {
      const useYtdlp = await hasYtdlp();
      const tmpPath  = path.join(os.tmpdir(), `${Date.now()}_lesta.mp4`);
      let result;
      if (useYtdlp) {
        await downloadWithYtdlp(text, 'mp4', tmpPath);
        result = { path: tmpPath, title: 'Video' };
      } else {
        result = await downloadWithYtdlCore(text, 'mp4');
        if (!result) throw new Error('Install yt-dlp: pip install yt-dlp');
      }
      const buffer = await fs.readFile(result.path);
      await sock.sendMessage(from, { video: buffer, caption: `🎬 ${result.title || 'Video'}` }, { quoted: msg });
      await fs.remove(result.path).catch(() => {});

    } else if (command === 'tiktok') {
      const res = await axios.get(`https://api.popcat.xyz/tiktok?url=${encodeURIComponent(text)}`, { timeout: 20000 });
      if (!res.data?.video) throw new Error('No video found');
      const vid = await axios.get(res.data.video, { responseType: 'arraybuffer', timeout: 30000 });
      await sock.sendMessage(from, {
        video: Buffer.from(vid.data), caption: `🎵 ${res.data.title || 'TikTok'}`
      }, { quoted: msg });

    } else if (command === 'igdl') {
      const res  = await axios.get(`https://api.popcat.xyz/instagram?url=${encodeURIComponent(text)}`, { timeout: 20000 });
      const item = res.data?.results?.[0];
      if (!item) throw new Error('No media found');
      const media = await axios.get(item.url, { responseType: 'arraybuffer', timeout: 30000 });
      const buf   = Buffer.from(media.data);
      const isVid = item.type === 'video' || item.url.includes('.mp4');
      if (isVid) {
        await sock.sendMessage(from, { video: buf, caption: '📸 Instagram Video' }, { quoted: msg });
      } else {
        await sock.sendMessage(from, { image: buf, caption: '📸 Instagram Image' }, { quoted: msg });
      }
    }
  } catch (err) {
    await sock.sendMessage(from, {
      text: `❌ Download failed: ${err.message}\n\n💡 Termux tip: _pip install yt-dlp_`
    }, { quoted: msg });
  }
  return true;
};
