'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.formatSubject = exports.normalizePort = exports.log = undefined;

var _morgan = require('morgan');

var _morgan2 = _interopRequireDefault(_morgan);

var _tracer = require('tracer');

var _tracer2 = _interopRequireDefault(_tracer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const log = exports.log = (() => {
  const logger = _tracer2.default.colorConsole();
  logger.requestLogger = (0, _morgan2.default)('dev');
  return logger;
})();

const normalizePort = exports.normalizePort = val => {
  const port = parseInt(val, 10);
  if (Number.isNaN(port)) return val;
  if (port >= 0) return port;
  return false;
};

const formatSubject = exports.formatSubject = subject => {
  return subject.replace(/\W/g, '').toLowerCase();
};