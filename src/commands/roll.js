/**
 * Handle 'roll' command.
 *
 * @param {object} interaction - discord.js interaction object.
 * @returns {Promise}
 */
module.exports = (interaction) => {
  const param = interaction.options.getNumber('n');

  const max = parseInt(param, 10);
  const result = Math.round(Math.random() * max) + 1;
  return interaction.reply(`🎲 ${result}`);
};
