/**
 * @file 异常类。
 * @author sl_say@hotmail.com
 * @module light.error.error_common
 */

"use strict";

var util   = require("util");

var AbstractError = function (msg, constr) {

  // If defined, pass the constr property to V8's
  // captureStackTrace to clean up the output
  Error.captureStackTrace(this, constr || this);

  // If defined, store a custom error message
  this.code = this.code || "E0001";
  this.message = msg || "Error";
};

// Extend our AbstractError from Error
util.inherits(AbstractError, Error);

/**
 * exports
 */
exports.AbstractError = AbstractError;
