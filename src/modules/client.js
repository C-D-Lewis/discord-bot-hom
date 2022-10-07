// Require the necessary discord.js classes
const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('../../config.json');

let client;

/**
 * Initialise discord.js client.
 *
 * @param {object} opts - Function opts.
 * @param {Function} opts.onCommand - Callback on slash command received.
 * @param {Function} opts.onMessage - Callback on message received.
 * @returns {Promise}
 */
const initClient = async ({ onCommand, onMessage }) => new Promise((resolve) => {
  // Create a new client instance
  const newClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });

  // When ready
  newClient.once('ready', () => {
    client = newClient;
    console.log('Client ready');
    resolve();
  });

  // When a command received
  newClient.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;
    console.log(`onCommand (${commandName})`);
    await onCommand(commandName, interaction);
  });

  // Server general message
  newClient.on('messageCreate', async (event) => {
    console.log(`onMessage (${event.author.username}) (${event.content})`);
    await onMessage(event);
  });

  // Log in
  newClient.login(token);
});

/**
 * Get the client object.
 *
 * @returns {object} discord.js Client.
 */
const getClient = () => {
  if (!client) throw new Error('Client was not ready');

  return client;
};

module.exports = {
  initClient,
  getClient,
};
