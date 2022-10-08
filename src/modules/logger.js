/**
 * Log a structured message.
 *
 * @param {string} msg - Message content.
 */
const log = (msg) => {
  const [date, timeStr] = new Date().toISOString().split('T');
  const [time] = timeStr.split('.');
  const isObject = typeof msg === 'object';
  console.log(`[${date} ${time}] ${isObject ? '' : msg}`);
  if (isObject) {
    console.log(msg);
  }
};

module.exports = { log };