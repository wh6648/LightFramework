/**
 * @file 参数异常类。
 * @author fyx1014@hotmail.com
 * @module light.error.errors_system
 */

"use strict";

var util   = require("util")
  , errors = require("./errors_common");

/**
 * @desc 系统异常类
 * @param {String} msg error message
 */
var SyetemError = function (msg) {
  this.code = this.code || "S0000";
  msg = msg || "System Error";
  SyetemError.super_.call(this, msg, this.constructor);
};

util.inherits(SyetemError, errors.AbstractError);

/**
 * @desc 配置文件设置错误
 * @param {String} msg error message
 */
var ConfigError = function (msg) {

  this.code = "S0001";
  msg = msg || "Config Error";
  ConfigError.super_.call(this, msg, this.constructor);
};
util.inherits(ConfigError, SyetemError);

/**
 * exports
 */
exports.SyetemError    = SyetemError;
exports.ConfigError    = ConfigError;