const libreProvider = require('./providers/loadLibre');
const ooklaProvider = require('./providers/loadOokla');
const cloudflareProvider = require('./providers/loadCloudflare');

module.exports.load = async () => {
    await libreProvider.load();
    await ooklaProvider.load();
    await cloudflareProvider.load();
}