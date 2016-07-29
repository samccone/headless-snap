/*
 Copyright 2016 Google Inc. All Rights Reserved.
 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
     http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
*/

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
    let filename = `screenshot-${Date.now()}.png`;

    fs.writeFileSync(filename, v.data, 'base64');
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
