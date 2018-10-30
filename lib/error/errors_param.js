/**
 * @file 参数异常类。
 * @author sl_say@hotmail.com
 * @module light.error.errors_param
 */

"use strict";

var util   = require("util")
  , errors = require("./errors_common");

/**
 * @desc 参数异常类
 * @param {String} msg error message
 */
var ParamError = function (msg) {
  this.code = this.code || "P0000";
  msg = msg || "Param Error";
  ParamError.super_.call(this, msg, this.constructor);
};

util.inherits(ParamError, errors.AbstractError);

/**
 * @desc 参数异常类
 * @param {String} msg error message
 */
var PasswordError = function (msg) {
  this.code = this.code || "P0001";
  msg = msg || "Password Error";
  PasswordError.super_.call(this, msg, this.constructor);
};

util.inherits(PasswordError, errors.AbstractError);

/**
 * exports
 */
exports.ParamError    = ParamError;
exports.PasswordError = PasswordError;