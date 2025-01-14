import fetch from 'node-fetch';
import { writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { VoiceState } from 'discord.js';
import { getVoiceAgent } from './voice';
import { elevenlabsApiKey } from '../../config.json';
import { log } from './logger';
import { ElevenLabsVoicesResponse } from '../types';

/** Adjusted for Typescript dist/ structure */
/** Speech saved dir */
export const SAVED_DIR = `${__dirname}/../../../saved`;
/** Path to speech file without extension */
export const FILE_NO_EXT = `${__dirname}/../../../sounds/speech`;

/**
 * Get voice names available.
 *
 * @returns {Promise<Array<{ name, id }>>} List of voice names and IDs.
 */
export const getVoices = async () => {
  const { voices } = await fetch('https://api.elevenlabs.io/v1/voices', {
    headers: {
      accept: 'application/json',
      'xi-api-key': elevenlabsApiKey,
    },
  }).then((r) => r.json()) as ElevenLabsVoicesResponse;

  return voices
    .filter(({ category }) => category !== 'premade')
    // eslint-disable-next-line camelcase
    .map(({ name, voice_id }) => ({ name, id: voice_id }));
};

/**
 * Generate and store speech as a file.
 *
 * @param {string} voiceName - ID of the voice to use.
 * @param {string} message - Message to generate as speech.
 * @param {number} stability - Stability score.
 * @returns {Promise<void>}
 */
export const generateSpeech = async (voiceName: string, message: string, stability?: number) => {
  // Get voice ID from name
  const voices = await getVoices();
  const found = voices.find(({ name }) => name === voiceName);
  if (!found) throw new Error(`Unknown voice name: ${voiceName}`);

  execSync(`rm -f ${FILE_NO_EXT}.*`);

  log(`Requesting speech: (voice ${found.name}) ${message}`);
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${found.id}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': elevenlabsApiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model_id: 'eleven_multilingual_v2',
      text: message,
      voice_settings: {
        stability,
        similarity_boost: 0.9,
      },
    }),
  });
  log(`Response: ${res.status}`);
  if (res.status !== 200) throw new Error(await res.text());

  const buffer = await res.buffer();
  writeFileSync(`${FILE_NO_EXT}.mpg`, buffer);
  log('Wrote speech file');

  // Copy in case it's good
  execSync(`mkdir -p ${SAVED_DIR}`);
  const filename = `${message.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-${Date.now()}`.slice(0, 128);
  execSync(`cp ${FILE_NO_EXT}.mpg ${SAVED_DIR}/${filename}.mp3`);
};

/**
 * Convert local speech file.
 */
export const convertSpeech = () => {
  execSync(`ffmpeg -i ${FILE_NO_EXT}.mpg ${FILE_NO_EXT}.opus`);
  log('Converted speech file to opus');
};

/**
 * Play stored speech.
 *
 * @param {object} voice - discord.js voice object.
 * @returns {Promise<void>}
 */
export const playSpeech = async (voice: VoiceState) => {
  const voiceAgent = getVoiceAgent(voice);
  await voiceAgent.join();
  voiceAgent.play('speech.opus');

  setTimeout(() => execSync(`rm -f ${FILE_NO_EXT}.*`), 5000);
};
