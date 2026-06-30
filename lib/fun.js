const axios = require('axios');

const jokes = [
  "😂 Why don't scientists trust atoms? Because they make up everything!",
  "😂 Why did the scarecrow win an award? He was outstanding in his field!",
  "😂 I told my wife she was drawing her eyebrows too high. She looked surprised.",
  "😂 What do you call a fake noodle? An impasta!",
  "😂 Why couldn't the bicycle stand up by itself? It was two-tired!",
  "😂 What do you call cheese that isn't yours? Nacho cheese!",
  "😂 How do you organize a space party? You planet!",
  "😂 Why did the math book look so sad? Because it had too many problems.",
];
const quotes = [
  "⚡ Stay consistent, not perfect.", "🌟 The secret of getting ahead is getting started. — Mark Twain",
  "🔥 Believe you can and you're halfway there. — Theodore Roosevelt",
  "💪 Success is not final, failure is not fatal. — Winston Churchill",
  "✨ Your limitation—it's only your imagination.",
  "🚀 Push yourself, because no one else is going to do it for you.",
  "🌈 Great things never come from comfort zones.",
];
const facts = [
  "🧠 Honey never spoils. 3000-year-old honey was found in Egyptian tombs!",
  "🐙 Octopuses have three hearts and blue blood.",
  "⚡ Lightning strikes Earth about 100 times every second.",
  "🦋 Butterflies taste with their feet.",
  "🐘 Elephants are the only animals that can't jump.",
  "🍫 Chocolate was once used as currency by the Aztecs.",
];
const eightBall = [
  "🎱 It is certain.", "🎱 Without a doubt.", "🎱 Yes, definitely.",
  "🎱 Most likely.", "🎱 Outlook good.", "🎱 Signs point to yes.",
  "🎱 Reply hazy, try again.", "🎱 Ask again later.", "🎱 Cannot predict now.",
  "🎱 Don't count on it.", "🎱 My reply is no.", "🎱 Very doubtful.",
];
const truths = [
  "What is your biggest fear?", "What's the most embarrassing thing you've done?",
  "Have you ever lied to a friend?", "What's your biggest secret?",
  "Who is your crush?", "What's the most childish thing you still do?",
  "What do you think about most often?", "What is your biggest regret?",
];
const dares = [
  "Sing the chorus of your favourite song!", "Do 20 push-ups right now!",
  "Text your crush 'I love you'!", "Change your profile picture for 1 hour!",
  "Send a voice note saying 'I am a banana'!", "Do a funny dance and record it!",
  "Post a throwback photo on your status!", "Speak in an accent for the next 5 minutes!",
];
const roasts = [
  "You're not stupid; you just have bad luck thinking.",
  "I'd agree with you, but then we'd both be wrong.",
  "You have your entire life to be an idiot. Take a day off!",
  "You're like a cloud. When you disappear, it's a beautiful day.",
  "Keep rolling your eyes. Maybe you'll find a brain back there.",
];
const compliments = [
  "You light up every room you walk into! ☀️",
  "You're more fun than bubble wrap! 🎉",
  "Your kindness is a superpower! 💪",
  "You make the world a better place just by being in it! 🌍",
  "Your smile could cure any bad day! 😊",
];
const horoscopes = {
  aries:"♈ Aries: Bold moves bring great rewards today!",
  taurus:"♉ Taurus: Focus on stability — your patience pays off.",
  gemini:"♊ Gemini: Communication is your superpower today!",
  cancer:"♋ Cancer: Nurture your relationships — they matter most.",
  leo:"♌ Leo: The spotlight is yours! Own it!",
  virgo:"♍ Virgo: Your careful eye will spot what others miss.",
  libra:"♎ Libra: Balance guides you — a compromise leads to success.",
  scorpio:"♏ Scorpio: Transformation is near. Embrace change.",
  sagittarius:"♐ Sagittarius: Adventure calls! Explore new horizons.",
  capricorn:"♑ Capricorn: Hard work is paying off — stay the course!",
  aquarius:"♒ Aquarius: Innovation leads the way. Think outside the box.",
  pisces:"♓ Pisces: Intuition guides you to something magical.",
};

const rand = arr => arr[Math.floor(Math.random() * arr.length)];
const pickMentioned = msg => {
  const m = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  return m[0] ? '@' + m[0].split('@')[0] : null;
};

module.exports = async (sock, msg, command, args) => {
  const from = msg.key.remoteJid;
  const text = args.join(' ').trim();

  if (command === 'joke') {
    try {
      const r = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single', { timeout: 5000 });
      await sock.sendMessage(from, { text: `😂 ${r.data.joke}` }, { quoted: msg });
    } catch { await sock.sendMessage(from, { text: rand(jokes) }, { quoted: msg }); }
    return true;
  }
  if (command === 'quote') { await sock.sendMessage(from, { text: rand(quotes) }, { quoted: msg }); return true; }
  if (command === 'fact')  { await sock.sendMessage(from, { text: rand(facts) },  { quoted: msg }); return true; }
  if (command === '8ball') {
    if (!text) return sock.sendMessage(from, { text: '❓ Usage: .8ball <question>' }, { quoted: msg }), true;
    await sock.sendMessage(from, { text: `🎱 *${text}*\n\n${rand(eightBall)}` }, { quoted: msg });
    return true;
  }
  if (command === 'coinflip') {
    await sock.sendMessage(from, { text: `🪙 *${Math.random() > 0.5 ? 'HEADS' : 'TAILS'}!*` }, { quoted: msg });
    return true;
  }
  if (command === 'dice') {
    await sock.sendMessage(from, { text: `🎲 You rolled: *${Math.floor(Math.random() * 6) + 1}*` }, { quoted: msg });
    return true;
  }
  if (command === 'love') {
    const target = pickMentioned(msg) || text || 'you';
    const pct = Math.floor(Math.random() * 101);
    const bar = '❤️'.repeat(Math.floor(pct/10)) + '🤍'.repeat(10 - Math.floor(pct/10));
    await sock.sendMessage(from, { text: `💕 *Love for ${target}*\n${bar}\n*${pct}%*` }, { quoted: msg });
    return true;
  }
  if (command === 'rate') {
    const target = pickMentioned(msg) || text || 'you';
    const rate = Math.floor(Math.random() * 101);
    await sock.sendMessage(from, { text: `⭐ *Rating for ${target}:* ${rate}/100\n${'⭐'.repeat(Math.round(rate/20))}` }, { quoted: msg });
    return true;
  }
  if (command === 'ship') {
    const parts = text.split(/\s+/);
    if (parts.length < 2) return sock.sendMessage(from, { text: '💞 Usage: .ship <name1> <name2>' }, { quoted: msg }), true;
    const pct  = Math.floor(Math.random() * 101);
    const ship = parts[0].slice(0, Math.ceil(parts[0].length/2)) + parts[1].slice(Math.floor(parts[1].length/2));
    await sock.sendMessage(from, { text: `💞 *Ship:* ${ship}\n⚡ *Compatibility:* ${pct}%` }, { quoted: msg });
    return true;
  }
  if (command === 'roast') {
    const target = pickMentioned(msg) || text || 'you';
    await sock.sendMessage(from, { text: `🔥 *Roasting ${target}:*\n\n${rand(roasts)}` }, { quoted: msg });
    return true;
  }
  if (command === 'compliment') {
    const target = pickMentioned(msg) || text || 'you';
    await sock.sendMessage(from, { text: `💐 *To ${target}:*\n\n${rand(compliments)}` }, { quoted: msg });
    return true;
  }
  if (command === 'horoscope') {
    const sign = text.toLowerCase();
    const result = horoscopes[sign];
    if (!result) {
      await sock.sendMessage(from, { text: `🔮 Signs: ${Object.keys(horoscopes).join(', ')}` }, { quoted: msg });
    } else {
      await sock.sendMessage(from, { text: result }, { quoted: msg });
    }
    return true;
  }
  if (command === 'truth') { await sock.sendMessage(from, { text: `😳 *TRUTH:*\n\n${rand(truths)}` }, { quoted: msg }); return true; }
  if (command === 'dare')  { await sock.sendMessage(from, { text: `😈 *DARE:*\n\n${rand(dares)}`  }, { quoted: msg }); return true; }

  return false;
};
