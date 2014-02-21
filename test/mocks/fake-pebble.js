var FakePebble = (function () {

  var _Pebble = null;
  var eventListeners = {
    ready: [],
    appmessage: [],
    webviewclosed: []
  };
  var eventHandlers = {
    appmessage: [],
    notifications: []
  };

  return {
    addEventListener: addEventListener,
    sendAppMessage: sendAppMessage,
    showSimpleNotificationOnPebble: showSimpleNotificationOnPebble,
    getAccountToken: getAccountToken,
    openURL: openURL,

    reset: reset,
    inject: inject,
    restore: restore,
    on: on
  };

  function addEventListener(event, callback) {
    if (eventListeners[event]) {
      eventListeners[event].push(callback);
    }
  }

  function sendAppMessage(message, ack, nack) {
    var _arguments = Array.prototype.slice.call(arguments);
    eventHandlers.appmessage.forEach(function (handler) {
      handler.apply(null, _arguments);
    });
  }

  function showSimpleNotificationOnPebble(title, text) {
    var _arguments = Array.prototype.slice.call(arguments);
    eventHandlers.notifications.forEach(function (handler) {
      handler.apply(null, _arguments);
    });
  }

  function getAccountToken() {
    return '';
  }

  function openURL(url) {
  }

  function reset() {
    eventListeners.ready = [];
    eventListeners.appmessage = [];
    eventListeners.webviewclosed = [];
    eventHandlers.appmessage = [];
    eventHandlers.notifications = [];
  }

  function inject() {
    if (_Pebble !== null) {
      return;
    }
    if (typeof(Pebble) !== 'undefined') {
      _Pebble = Pebble;
    }
    Pebble = this;
  }

  function restore() {
    if (_Pebble === null) {
      return;
    }
    Pebble = _Pebble;
    _Pebble = null;
  }

  function on(event, callback) {
    eventHandlers[event].push(callback);
  }

}());