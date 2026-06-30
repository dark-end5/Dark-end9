const { getUser, setUser } = require('../database/store');

const wordList = [
  { word: 'elephant',    hint: 'A large grey animal with a trunk' },
  { word: 'beautiful',  hint: 'Very attractive or pleasing' },
  { word: 'knowledge',  hint: 'Information acquired through experience' },
  { word: 'technology', hint: 'Scientific knowledge used practically' },
  { word: 'adventure',  hint: 'An exciting or unusual experience' },
  { word: 'friendship', hint: 'A close bond between people' },
  { word: 'imagination',hint: 'The ability to form mental images' },
  { word: 'mysterious', hint: 'Difficult to understand or explain' },
  { word: 'restaurant', hint: 'A place where meals are served' },
  { word: 'chocolate',  hint: 'A sweet brown food made from cacao' },
  { word: 'butterfly',  hint: 'A colourful winged insect' },
  { word: 'keyboard',   hint: 'Used to type on a computer' },
];

const abcdData = {
  A:{animals:['Ant','Alligator','Armadillo','Antelope'],names:['Alice','Alex','Amanda','Aaron'],countries:['Argentina','Australia','Angola','Austria']},
  B:{animals:['Bear','Buffalo','Baboon','Bat'],names:['Brian','Bella','Ben','Beth'],countries:['Brazil','Belgium','Bolivia','Bangladesh']},
  C:{animals:['Cat','Cobra','Cheetah','Camel'],names:['Chris','Clara','Carlos','Cindy'],countries:['Canada','China','Colombia','Chile']},
  D:{animals:['Dog','Dolphin','Deer','Duck'],names:['David','Diana','Dylan','Dana'],countries:['Denmark','Dominican Republic','Djibouti']},
  E:{animals:['Eagle','Elephant','Eel','Elk'],names:['Emma','Ethan','Eliza','Eric'],countries:['Ethiopia','Egypt','Ecuador','Estonia']},
  F:{animals:['Fox','Falcon','Flamingo','Frog'],names:['Frank','Faith','Felix','Fiona'],countries:['France','Finland','Fiji']},
  G:{animals:['Giraffe','Gorilla','Gazelle','Goat'],names:['Grace','George','Gloria','Gary'],countries:['Germany','Ghana','Greece','Guatemala']},
  H:{animals:['Horse','Hippo','Hawk','Hyena'],names:['Harry','Hannah','Henry','Holly'],countries:['Hungary','Honduras','Haiti']},
  I:{animals:['Iguana','Impala','Ibis'],names:['Ivan','Iris','Isaac','Isla'],countries:['India','Indonesia','Ireland','Italy']},
  J:{animals:['Jaguar','Jellyfish','Jackal'],names:['James','Julia','Jack','Jessica'],countries:['Japan','Jordan','Jamaica']},
  K:{animals:['Kangaroo','Koala','Kudu'],names:['Kevin','Karen','Kyle','Katie'],countries:['Kenya','Kuwait','Kazakhstan']},
  L:{animals:['Lion','Leopard','Lizard','Lynx'],names:['Liam','Lucy','Leo','Laura'],countries:['Liberia','Libya','Lebanon','Latvia']},
  M:{animals:['Monkey','Moose','Mongoose'],names:['Michael','Mia','Mark','Maya'],countries:['Mexico','Morocco','Madagascar']},
  N:{animals:['Narwhal','Newt','Nightingale'],names:['Noah','Nadia','Nathan','Nina'],countries:['Nigeria','Niger','Nepal','Norway']},
  O:{animals:['Owl','Ostrich','Otter','Orangutan'],names:['Oliver','Olivia','Oscar','Owen'],countries:['Oman']},
  P:{animals:['Parrot','Penguin','Panda','Peacock'],names:['Paul','Patricia','Peter','Priya'],countries:['Pakistan','Peru','Philippines','Poland']},
  Q:{animals:['Quail','Quokka'],names:['Quinn','Quincy'],countries:['Qatar']},
  R:{animals:['Rabbit','Rhino','Raccoon'],names:['Ryan','Rachel','Robert','Ruby'],countries:['Russia','Romania','Rwanda']},
  S:{animals:['Snake','Shark','Sparrow','Sloth'],names:['Sam','Sophia','Steve','Sara'],countries:['South Africa','Spain','Sweden','Somalia']},
  T:{animals:['Tiger','Turtle','Toucan','Toad'],names:['Tom','Tina','Tyler','Teresa'],countries:['Tanzania','Thailand','Turkey','Tunisia']},
  U:{animals:['Urial'],names:['Uma','Uriah'],countries:['Uganda','Ukraine','Uruguay','USA']},
  V:{animals:['Vulture','Viper','Vole'],names:['Victor','Vera','Vincent'],countries:['Venezuela','Vietnam']},
  W:{animals:['Wolf','Whale','Warthog','Walrus'],names:['William','Wendy','Walter','Wayne'],countries:['Zambia','Zimbabwe']},
  X:{animals:['X-ray Tetra'],names:['Xavier','Xena'],countries:[]},
  Y:{animals:['Yak'],names:['Yara','Yusuf','Yvonne'],countries:['Yemen']},
  Z:{animals:['Zebra','Zorilla'],names:['Zara','Zoe','Zachary'],countries:['Zambia','Zimbabwe']},
};

const quizBank = [
  {q:'What is the capital of Kenya?',a:'nairobi'},
  {q:'How many days in a leap year?',a:'366'},
  {q:'What planet is closest to the Sun?',a:'mercury'},
  {q:'What is 12 × 12?',a:'144'},
  {q:'Who wrote Romeo and Juliet?',a:'shakespeare'},
  {q:'What is the largest ocean?',a:'pacific'},
  {q:'How many sides does a hexagon have?',a:'6'},
  {q:'What gas do plants absorb?',a:'carbon dioxide'},
  {q:'What is the fastest land animal?',a:'cheetah'},
  {q:'How many continents are there?',a:'7'},
];

const riddles = [
  {q:"I have hands but can't clap. What am I?",a:'clock'},
  {q:"The more you take, the more you leave behind. What am I?",a:'footsteps'},
  {q:"I speak without a mouth and hear without ears. What am I?",a:'echo'},
  {q:"I have cities but no houses. What am I?",a:'map'},
  {q:"What has keys but no locks, space but no room?",a:'keyboard'},
  {q:"I fly without wings and cry without eyes. What am I?",a:'cloud'},
];

const gameState = new Map();

module.exports = async (sock, msg, command, args) => {
  const from   = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const text   = args.join(' ').trim().toLowerCase();
  const key    = `${from}_${sender}`;

  if (command === 'spell') {
    const item = wordList[Math.floor(Math.random() * wordList.length)];
    const scrambled = item.word.split('').sort(() => Math.random() - 0.5).join('');
    gameState.set(key, { type: 'spell', answer: item.word });
    await sock.sendMessage(from, {
      text: `🔤 *SPELLING GAME*\n\nHint: _${item.hint}_\nScrambled: *${scrambled.toUpperCase()}*\n\nType the correct spelling!`
    }, { quoted: msg });
    setTimeout(() => { if (gameState.get(key)?.type === 'spell') { gameState.delete(key); sock.sendMessage(from, { text: `⏰ Time's up! Answer: *${item.word}*` }); } }, 60000);
    return true;
  }

  if (command === 'quiz' || command === 'trivia') {
    const item = quizBank[Math.floor(Math.random() * quizBank.length)];
    gameState.set(key, { type: 'quiz', answer: item.a });
    await sock.sendMessage(from, { text: `🧠 *${command === 'trivia' ? 'TRIVIA' : 'QUIZ'}*\n\n${item.q}\n\nType your answer!` }, { quoted: msg });
    setTimeout(() => { if (gameState.get(key)?.type === 'quiz') { gameState.delete(key); sock.sendMessage(from, { text: `⏰ Time's up! Answer: *${item.a}*` }); } }, 60000);
    return true;
  }

  if (command === 'riddle') {
    const item = riddles[Math.floor(Math.random() * riddles.length)];
    gameState.set(key, { type: 'riddle', answer: item.a });
    await sock.sendMessage(from, { text: `🤔 *RIDDLE*\n\n${item.q}\n\nType your answer!` }, { quoted: msg });
    setTimeout(() => { if (gameState.get(key)?.type === 'riddle') { gameState.delete(key); sock.sendMessage(from, { text: `⏰ Time's up! Answer: *${item.a}*` }); } }, 60000);
    return true;
  }

  if (command === 'abcd') {
    const letter = text.charAt(0).toUpperCase();
    const data   = abcdData[letter];
    if (!data) return sock.sendMessage(from, { text: '❌ Usage: .abcd A (any letter A-Z)' }, { quoted: msg }), true;
    await sock.sendMessage(from, {
      text: `🔤 *ABCD — Letter ${letter}*\n\n🐾 Animals: ${data.animals.join(', ')}\n👤 Names: ${data.names.join(', ')}\n🌍 Countries: ${data.countries.join(', ') || 'None listed'}`
    }, { quoted: msg });
    return true;
  }

  return false;
};

module.exports.checkGameAnswer = async (sock, msg, body) => {
  const from   = msg.key.remoteJid;
  const sender = msg.key.participant || msg.key.remoteJid;
  const key    = `${from}_${sender}`;
  const game   = gameState.get(key);
  if (!game) return false;
  if (body.toLowerCase().includes(game.answer.toLowerCase())) {
    gameState.delete(key);
    await sock.sendMessage(from, { text: `✅ *Correct!* The answer was *${game.answer}*! 🎉` }, { quoted: msg });
    return true;
  }
  return false;
};
