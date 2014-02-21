var MessageQueue = function () {
  this.queue = [];
  this.sending = false;
};

MessageQueue.prototype.sendMessage = function(data, success) {

  if (! this._isValidMessage(data)) {
    return false;
  }

  this.queue.push({ data: data, success: success || null });
  if (! this.sending) {
    setTimeout(function () {
      this._sendNextMessage();
    }.bind(this), 1);
  }

  return true;

};

MessageQueue.prototype.queueLength = function() {
  return this.queue.length;
};

MessageQueue.prototype._isValidMessage = function(message) {

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

  this.sending = true;
  Pebble.sendAppMessage(message.data, ack.bind(this), nack.bind(this));

  function ack() {
    this.sending = false;
    setTimeout(function () {
      this._sendNextMessage();
    }.bind(this), 1);
    if (message.success) { message.success(); }
  }

  function nack() {
    this.sending = false;
    this.queue.unshift(message);
    setTimeout(function () {
      this._sendNextMessage();
    }.bind(this), 1);
  }

};