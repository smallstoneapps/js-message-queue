# JS Message Queue [![Build Status](https://travis-ci.org/smallstoneapps/js-message-queue.png?branch=master)](https://travis-ci.org/smallstoneapps/js-message-queue) ![devDependency Status](https://david-dm.org/smallstoneapps/js-message-queue/dev-status.png)

PebbleKit JS library for sending messages to your Pebble.

## Usage

1. Include [js-message-queue.min.js](https://raw.github.com/smallstoneapps/js-message-queue/master/js-message-queue.min.js) in your Pebble JS file, either by copying and pasting it into the top of pebble-js-app.js, or by adding it to your JS build script.
2. Replace all instances of `Pebble.sendAppMessage()` with `MessageQueue.sendAppMessage()`.
3. Profit!
