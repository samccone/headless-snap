var fs = require('fs');
var Chrome = require('chrome-remote-interface');
var spawn = require('child_process').spawn;

if (process.argv[2] === undefined) {
  throw Error('No headless binary path provided.');
}

var headless = spawn(process.argv[2], [
  '--remote-debugging-port=9222']);

var screenshotUrl = process.argv[3] || 'https://paulirish.com';

// Go ahead and log out a few things
headless.stdout.on('data', d => console.log(d.toString()));
headless.stderr.on('data', d => console.log(d.toString()));

// Dumb timeout for now
setTimeout(connect, 2000);

function getChromeInstance() {
  return new Promise((res, rej) => {
    Chrome(function (chromeInstance) {
      res(chromeInstance);
    }).on('error', rej);
  });
}

function takeScreenshot(instance) {
  instance.Page.captureScreenshot().then((v) => {
    let filename = `screenshot-${Date.now()}.png`

    fs.writeFileSync(filename, `data:image/png;base64,${v.data}`);
    console.log(`Image saved as ${filename}`);

    // Take it all down now.
    headless.kill();
    process.exit(0);
  });
}

function connect() {
  getChromeInstance().then(instance => {
    instance.Page.loadEventFired(takeScreenshot.bind(null, instance));
    instance.Page.enable();
    instance.once('ready', () => {
      instance.Page.navigate({url: screenshotUrl})
    });
  });
}
