describe('MessageQueue', function () {

  before(function (done) {
    FakePebble.inject();
    done();
  });

  beforeEach(function (done) {
    FakePebble.reset();
    MessageQueue.reset();
    done();
  });

  describe('#size', function () {

    it('should return 0 when no messages have been sent', function (done) {
      expect(MessageQueue.size()).to.equal(0);
      done();
    });

    it('should return 1 when one message has been sent', function (done) {
      var message = randomMessage();
      MessageQueue.sendAppMessage(message);
      expect(MessageQueue.size()).to.equal(1);
      setTimeout(function () {
        done();
      }, 10);
    });

    it('should return 0 when all messages have been send', function (done) {
      var message = randomMessage();
      Pebble.on('appmessage', function (payload, ack) {
        expect(identicalMessage(payload, message)).to.equal(true);
        ack();
        setTimeout(function () {
          expect(MessageQueue.size()).to.equal(0);
          done();
        }, 10);
      });
      MessageQueue.sendAppMessage(message);
    });

  });

  describe('#sendAppMessage', function () {

    it('should accept a valid appmessage object as the only argument', function (done) {
      var success = MessageQueue.sendAppMessage({ key1: 0, key2: 'this is a valid value', key3: [] });
      expect(success).to.equal(true);
      setTimeout(function () {
        done();
      }, 10);
    });

    it('should reject anything other than a valid appmessage object as the first argument', function (done) {
      expect(MessageQueue.sendAppMessage(5)).to.equal(false);
      expect(MessageQueue.sendAppMessage()).to.equal(false);
      expect(MessageQueue.sendAppMessage('')).to.equal(false);
      expect(MessageQueue.sendAppMessage([])).to.equal(false);
      expect(MessageQueue.sendAppMessage(null)).to.equal(false);
      expect(MessageQueue.sendAppMessage({ key1: {} })).to.equal(false);
      expect(MessageQueue.sendAppMessage({ key1: null })).to.equal(false);
      setTimeout(function () {
        done();
      }, 500);
    });

    it('sending a message should not break the tests', function (done) {
      var message = randomMessage();
      MessageQueue.sendAppMessage(message);
      setTimeout(function () {
        done();
      }, 10);
    });

    it('sending a message should send a single message to Pebble', function (done) {
      var message = randomMessage();
      Pebble.on('appmessage', function (payload) {
        expect(identicalMessage(payload, message)).to.equal(true);
        done();
      });
      MessageQueue.sendAppMessage(message);
    });

    it('calls success callback when message is acked', function (done) {
      var message = randomMessage();
      Pebble.on('appmessage', function (payload, success) {
        expect(payload).to.equal(message);
        success();
      });
      MessageQueue.sendAppMessage(message, function () {
        done();
      });
    });

    it('a message responding with nack should be resent', function (done) {
      var message = randomMessage();
      var nacked = false;
      Pebble.on('appmessage', function (payload, ack, nack) {
        expect(identicalMessage(payload, message)).to.equal(true);
        if (nacked) {
          return done();
        }
        nacked = true;
        nack();
      });
      MessageQueue.sendAppMessage(message);
    });

    it('sending two messages should send in order after acks', function (done) {
      var messages = [
        randomMessage(),
        randomMessage()
      ];
      var messageIndex = 0;
      var nacked = false;
      Pebble.on('appmessage', function (payload, ack, nack) {
        if (! nacked) {
          nacked = true;
          return nack();
        }
        expect(identicalMessage(payload, messages[messageIndex])).to.equal(true)
        messageIndex += 1;
        ack();
        if (messageIndex >= 2) {
          done();
        }
      });
      MessageQueue.sendAppMessage(messages[0]);
      MessageQueue.sendAppMessage(messages[1]);
    });

    it('sending two messages should send in order even with nacks', function (done) {
      var messages = [
        randomMessage(),
        randomMessage()
      ];
      var messageIndex = 0;
      Pebble.on('appmessage', function (payload, ack, nack) {
        expect(identicalMessage(payload, messages[messageIndex])).to.equal(true)
        messageIndex += 1;
        ack();
        if (messageIndex >= 2) {
          done();
        }
      });
      MessageQueue.sendAppMessage(messages[0]);
      MessageQueue.sendAppMessage(messages[1]);
    });

    it('will nack after repeated fails', function (done) {
      var message = randomMessage();
      Pebble.on('appmessage', function (payload, ack, nack) {
        expect(identicalMessage(payload, message)).to.equal(true);
        nack();
      });
      MessageQueue.sendAppMessage(message, null, function () {
        done();
      });
    });

  });

  describe('#inject', function () {

    beforeEach(function () {
      MessageQueue.inject();
    });

    afterEach(function () {
      MessageQueue.cleanup();
    });

    it('should replace Pebble.sendAppMessage', function (done) {
      var message = randomMessage();
      Pebble.on('appmessage', function (payload) {
        expect(identicalMessage(payload, message)).to.equal(true);
        done();
      });
      Pebble.sendAppMessage(message);
      expect(MessageQueue.size()).to.equal(1);
    });

  });

  describe('#cleanup', function () {

    it('does not throw an error if called without injecting', function (done) {
      MessageQueue.cleanup();
      done();
    });

  });

});

function identicalMessage(m1, m2) {
  return JSON.stringify(m1) === JSON.stringify(m2);
}

function randomMessage() {
  var message = {};
  var keyCount = Math.ceil(10 * Math.random());
  for (var k = 0; k < keyCount; k += 1) {
    message['key' + k] = Math.ceil(1000 * Math.random());
  }
  return message;
}