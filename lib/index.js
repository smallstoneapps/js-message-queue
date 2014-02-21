var MessageQueue = (function () {

  var RETRY_MAX = 5;

  var queue = [];
  var sending = false;
  var _pebble = {};

  return {
    reset: reset,
    sendAppMessage: sendAppMessage,
    inject: inject,
    cleanup: cleanup,
    size: size
  };

  function reset() {
    queue = [];
    sending = false;
  }

  function sendAppMessage(message, ack, nack) {

    if (! isValidMessage(message)) {
      return false;
    }

    queue.push({
      message: message,
      ack: ack || null,
      nack: nack || null,
      attempts: 0
    });

    setTimeout(function () {
      sendNextMessage();
    }, 1);

    return true;
  }

  function inject() {
    _pebble.sendAppMessage = window.Pebble.sendAppMessage;
    window.Pebble.sendAppMessage = sendAppMessage;
  }

  function cleanup() {
    if (! _pebble.sendAppMessage) {
      return;
    }
    window.Pebble.sendAppMessage = _pebble.sendAppMessage;
    delete _pebble.sendAppMessage;
  }

  function size() {
    return queue.length;
  }

  function isValidMessage(message) {
    // A message must be an object.
    if (message !== Object(message)) {
      return false;
    }
    var keys = Object.keys(message);
    // A message must have at least one key.
    if (! keys.length) {
      return false;
    }
    for (var k = 0; k < keys.length; k += 1) {
      var validKey = /^[0-9a-zA-Z-_]*$/.test(keys[k]);
      if (! validKey) {
        return false;
      }
      var value = message[keys[k]];
      if (! validValue(value)) {
        return false;
      }
    }

    return true;

    function validValue(value) {
      switch (typeof(value)) {
        case 'string':
          return true;
        case 'number':
          return true;
        case 'object':
          if (toString.call(value) == '[object Array]') {
            return true;
          }
      }
      return false;
    }
  }

  function sendNextMessage() {

    if (sending) { return; }
    var message = queue.shift();
    if (! message) { return; }

    message.attempts += 1;
    sending = true;
    if (_pebble.sendAppMessage) {
      _pebble.sendAppMessage.call(Pebble, message.message, ack, nack);
    }
    else {
      Pebble.sendAppMessage(message.message, ack, nack);
    }

    function ack() {
      setTimeout(function () {
        sending = false;
        sendNextMessage();
      }, 1);
      if (message.ack) {
        message.ack.apply(null, arguments);
      }
    }

    function nack() {
      if (message.attempts < RETRY_MAX) {
        queue.unshift(message);
        setTimeout(function () {
          sending = false;
          sendNextMessage();
        }, 100 * message.attempts);
      }
      else {
        if (message.nack) {
          message.nack.apply(null, arguments);
        }
      }
    }
  }

}());