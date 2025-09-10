const ChatbotServer = require('../server');
const server = new ChatbotServer();

module.exports = (req, res) => {
  return server.handleWebhook(req, res);
};
