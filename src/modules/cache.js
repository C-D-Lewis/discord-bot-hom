const { createAudioResource, StreamType } = require('@discordjs/voice');
const fs = require('fs');
const { log } = require('./logger');
const { AUDIO_TYPE_SOUND } = require('./constants');

const soundsDir = `${__dirname}/../../sounds`;
const musicDir = `${__dirname}/../../music`;
const soundNames = [];
const musicNames = [];

/**
 * Read sounds in /sounds and music in /music and cache the names.
 */
const cacheFileNames = () => {
  fs.readdirSync(soundsDir).forEach((file) => soundNames.push(file));
  fs.readdirSync(musicDir).forEach((file) => musicNames.push(file));
  log(`Files cached: ${soundNames.length} sounds, ${musicNames.length} music`);
};

/**
 * Use the user query to find the closest sound.
 *
 * @param {string} type - Audio type (sound|music).
 * @param {string} query - Query to use.
 * @returns {Array<string>} Name of the file(s) that matched query.
 */
const getClosestFileName = (type, query) => {
  const list = type === AUDIO_TYPE_SOUND ? soundNames : musicNames;

  // Exact match
  let found = list.find((p) => p === query);
  if (found) {
    log(`Exact match ${query} -> ${found}`);
    return [found];
  }

  // Partial match
  found = list.filter((p) => p.includes(query));
  if (found.length === 1) {
    const [result] = found;
    log(`Partial single match ${query} -> ${result}`);
    return [result];
  }

  // Multiple
  return found;
};

/**
 * Get a pre-loaded sound from cache, then replace it. Ogg preferred for performance.
 *
 * @param {string} name - Audio to get.
 * @returns {object} discord.js audio object.
 */
const getAudioResource = (name) => {
  const dir = soundNames.includes(name) ? soundsDir : musicDir;
  return createAudioResource(
    fs.createReadStream(`${dir}/${name}`),
    { inputType: StreamType.OggOpus },
  );
};

/**
 * Build a readable list of sound or music options.
 *
 * @returns {string} Readable list of sounds.
 */
const buildFileList = (type) => {
  let list = type === AUDIO_TYPE_SOUND ? soundNames : musicNames;
  list = list.map((p) => p.split('.')[0]);

  // Bucket if many variants
  const buckets = { singleItems: [] };
  list.forEach((p) => {
    // Single
    if (!p.includes('_')) {
      buckets.singleItems.push(p);
      return;
    }

    // One of a set
    const [prefix] = p.split('_');
    if (!buckets[prefix]) buckets[prefix] = [];
    buckets[prefix].push(p);
  });

  // Format
  const { singleItems, ...rest } = buckets;
  let reply = `*Single:*
${singleItems.map((p) => `\`${p}\``).join(', ')}
`;
  if (Object.keys(rest).length > 0) {
    reply += `*Sets:*
${Object.entries(rest).map(([prefix, items]) => `\`${prefix}\` (🔀 ${items.length})`).join(', ')}`;
  }
  return reply;
};

module.exports = {
  cacheFileNames,
  getClosestFileName,
  buildFileList,
  getAudioResource,
};
