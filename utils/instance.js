const pptr = require('puppeteer');
let instance = null;
module.exports.getBrowserInstance = async function () {
  if (!instance) {
    instance = await pptr.launch({
      // headless: false,
      defaultViewport: null,
      args: ['--no-sandbox']
    })
  }

  return instance;
}