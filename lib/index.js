var MessageQueue = function () {
  this.queue = [];
  this.sending = false;
  this._pebble = {};
  this.RETRY_MAX = 5;
};

MessageQueue.prototype.sendMessage = function (data, ack, nack) {

  if (! this._isValidMessage(data)) {
    return false;
  }

  this.queue.push({
    data: data,
    ack: ack || null,
    nack: nack || null,
    attempts: 0
  });

  setTimeout(function () {
    this._sendNextMessage();
  }.bind(this), 1);

  return true;

};

MessageQueue.prototype.queueLength = function () {
  return this.queue.length;
};

MessageQueue.prototype.inject = function() {
  this._pebble.sendAppMessage = window.Pebble.sendAppMessage;
  window.Pebble.sendAppMessage = this.sendMessage.bind(this);
};

MessageQueue.prototype.cleanup = function () {
  if (! this._pebble.sendAppMessage) {
    return;
  }
  window.Pebble.sendAppMessage = this._pebble.sendAppMessage;
  delete this._pebble.sendAppMessage;
};

MessageQueue.prototype._isValidMessage = function (message) {

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


};

MessageQueue.prototype._sendNextMessage = function() {

  if (this.sending) { return; }
  var message = this.queue.shift();
  if (! message) { return; }

  message.attempts += 1;
  this.sending = true;
  if (this._pebble.sendAppMessage) {
    this._pebble.sendAppMessage.call(Pebble, message.data, ack.bind(this), nack.bind(this));
  }
  else {
    Pebble.sendAppMessage(message.data, ack.bind(this), nack.bind(this));
  }

  function ack() {
    setTimeout(function () {
      this.sending = false;
      this._sendNextMessage();
    }.bind(this), 1);
    if (message.ack) { message.ack.apply(null, arguments); }
  }

  function nack() {
    if (message.attempts < this.RETRY_MAX) {
      this.queue.unshift(message);
      setTimeout(function () {
        this.sending = false;
        this._sendNextMessage();
      }.bind(this), 1);
    }
    else {
      if (message.nack) {
        message.nack.apply(null, arguments);
      }
    }
  }

};