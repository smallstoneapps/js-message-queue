module.exports = function(config) {

  config.set({
    basePath: '',
    frameworks: [ 'mocha', 'chai', 'sinon' ],
    files: [
      'lib/*.js',
      'test/*.js',
      'test/mocks/*.js'
    ],
    exclude: [ ],
    reporters: [ 'progress', 'osx' ],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: [ 'Chrome' ],
    captureTimeout: 60000,
    singleRun: false
  });

};
