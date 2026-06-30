const fs = require('fs-extra');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, 'botSettings.json');
const GROUPS_PATH   = path.join(__dirname, 'groupSettings.json');
const USERS_PATH    = path.join(__dirname, 'userSettings.json');

let settings = {};
let groups   = {};
let users    = {};

function loadAll() {
  settings = fs.readJsonSync(SETTINGS_PATH, { throws: false }) || {};
  groups   = fs.readJsonSync(GROUPS_PATH,   { throws: false }) || {};
  users    = fs.readJsonSync(USERS_PATH,    { throws: false }) || {};
}

const saveSettings = () => fs.writeJsonSync(SETTINGS_PATH, settings, { spaces: 2 });
const saveGroups   = () => fs.writeJsonSync(GROUPS_PATH,   groups,   { spaces: 2 });
const saveUsers    = () => fs.writeJsonSync(USERS_PATH,    users,    { spaces: 2 });

const getSetting = (key, def) => (settings[key] !== undefined ? settings[key] : def);
const setSetting = (key, val) => { settings[key] = val; saveSettings(); };

const getGroup = (jid, key, def) => {
  if (!groups[jid]) groups[jid] = {};
  return groups[jid][key] !== undefined ? groups[jid][key] : def;
};
const setGroup = (jid, key, val) => {
  if (!groups[jid]) groups[jid] = {};
  groups[jid][key] = val;
  saveGroups();
};

const getUser = (jid, key, def) => {
  if (!users[jid]) users[jid] = {};
  return users[jid][key] !== undefined ? users[jid][key] : def;
};
const setUser = (jid, key, val) => {
  if (!users[jid]) users[jid] = {};
  users[jid][key] = val;
  saveUsers();
};

loadAll();
module.exports = { getSetting, setSetting, getGroup, setGroup, getUser, setUser };
