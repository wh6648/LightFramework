/**
 * @file 输出Log
 * @author r2space@gmail.com
 */

"use strict";

var util        = require("util")
  , log4js      = require("log4js")
  , constant    = require("./constant")
  , helper      = require("./helper");

/**
 * Log type: To define the type of log
 */
var operation   = log4js.getLogger(constant.LOG_TYPE_OPERATION)
  , application = log4js.getLogger(constant.LOG_TYPE_APPLICATION)
  , audit       = log4js.getLogger(constant.LOG_TYPE_AUDIT);

/**
 * Stack info.
 * @param {Function} self this function.
 * @returns {Object} current method stack.
 */
function stack(self) {

  var orig = Error.prepareStackTrace;
  Error.prepareStackTrace = function(_, stack) {
    return stack;
  };

  var err = new Error();
  Error.captureStackTrace(err, self);

  var result = err.stack;
  Error.prepareStackTrace = orig;

  return result;
}

/**
 * LineNo,
 *  Defines the number of lines of parent source code.
 * @returns {String} line number.
 */
function lineNo() {
  return stack(stack)[3].getLineNumber();
}

/**
 * FileName,
 *  Defines the name of the parent file.
 * @returns {String} file name.
 */
function fileName() {
  return stack(stack)[3].getFileName();
}

/**
 * Function name
 * @returns {String} function name
 */
function functionName() {
  return stack(stack)[3].getFunctionName();
}

/**
 * Config:
 *  Reads the configuration file, and initializes the log.
 */
function initLog4js() {

  // 环境变量里没有定义配置文件的路径，使用应用根目录下的配置文件
  log4js.configure(process.env.LOG4JS_CONFIG || process.cwd() + "/config/log4js.json");
}

/**
 * 为了输出文件日志，对log对象进行格式化
 * @param {String} body 消息
 * @returns 格式化之后的消息字符串
 */
function formatFileLog(body) {
  return util.format("%s %s %s %s %s", body.message, body.user, body.host, body.file, body.line);
}

/**
 * 生成json格式的log对象
 * @param {String} logtype log的类别
 * @param {String} loglevel log的级别
 * @param {String} content 输出的log详细
 * @param {String} userid 操作者
 * @returns log对象
 */
function toJson(logtype, loglevel, content, userid) {

  return {
      sec: new Date().getTime()
    , type: logtype
    , level: loglevel
    , message: content
    , user: userid ? userid : "-"
    , host: helper.ip()
    , code: ""
    , category: ""
    , file: fileName()
    , line: lineNo()
    , function: functionName()
    };
}

/**
 * debug log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.debug = function(message, user) {
  var body = toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_DEBUG, message, user);
  application.debug(formatFileLog(body));
};

/**
 * info log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.info = function(message, user) {
  var body = toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_INFO, message, user);
  application.info(formatFileLog(body));
};

/**
 * warning log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.warn = function(message, user) {
  var body = toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_WARN, message, user);
  application.warn(formatFileLog(body));
};

/**
 * error log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.error = function(message, user) {
  var body = toJson(constant.LOG_TYPE_APPLICATION, constant.LOG_LEVEL_ERROR, message, user);
  application.error(formatFileLog(body));
};

/**
 * audit log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.audit = function(message, user) {
  var body = toJson(constant.LOG_TYPE_AUDIT, constant.LOG_LEVEL_INFO, message, user);
  audit.info(formatFileLog(body));
};

/**
 * operation log
 * @param {String} message log内容
 * @param {String} user 用户信息
 */
exports.operation = function(message, user) {
  var body = toJson(constant.LOG_TYPE_OPERATION, constant.LOG_LEVEL_INFO, message, user);
  operation.info(formatFileLog(body));
};

/**
 * 初始化log4js
 */
initLog4js();
