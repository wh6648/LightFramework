/**
 * @file HTTP异常类。以HTTP Status Codes为基础定义类。
 *  HTTP Status Codes:
 *  200 OK
 *  304 Not Modified
 *  400 Bad Request（已定义）
 *  401 Unauthorized（已定义）
 *  402 Payment Required
 *  403 Forbidden（已定义）
 *  404 Not Found（已定义）
 *  405 Method Not Allowed
 *  406 Not Acceptable
 *  407 Proxy authentication required
 *  408 Request Timeout
 *  409 Conflict
 *  410 Gone
 *  411 Length Required
 *  412 Precondition Failed
 *  413 Request Entity Too Large
 *  414 Request-URI Too Large
 *  415 Unsupported Media Type
 *  420 Enhance Your Calm
 *  500 Internal Server Error（已定义）
 *  501 Not Implemented
 *  502 Bad Gateway
 *  503 Service Unavailable
 *  504 Gateway timeout
 *  505 HTTP Version not supported
 *
 * @author sl_say@hotmail.com
 * @module light.error.errors_http
 */


"use strict";

var util   = require("util")
  , errors = require("./errors_common");

/**
 * @desc HTTP Error
 * @param {String} msg error message
 */
var HttpError = function (msg) {

  this.code = this.code || -1;
  msg = msg || "HTTP Error";
  HttpError.super_.call(this, msg, this.constructor);
};
util.inherits(HttpError, errors.AbstractError);

/**
 * @desc BadRequestError:由于客户端的请求存在问题，导致后台无法处理而产生的错误。
 * @param {String} msg error message
 */
var BadRequestError = function (msg) {

  this.code = 400;
  msg = msg || "Bad Request";
  BadRequestError.super_.call(this, msg, this.constructor);
};
util.inherits(BadRequestError, HttpError);

/**
 * @desc UnauthorizedError:没有验证。
 * @param {String} msg error message
 */
var UnauthorizedError = function (msg) {

  this.code = 401;
  msg = msg || "Unauthorized";
  UnauthorizedError.super_.call(this, msg, this.constructor);
};
util.inherits(UnauthorizedError, HttpError);

/**
 * @desc ForbiddenError:
 * @param {String} msg error message
 */
var ForbiddenError = function (msg) {

  this.code = 403;
  msg = msg || "Forbidden";
  ForbiddenError.super_.call(this, msg, this.constructor);
};
util.inherits(ForbiddenError, HttpError);

/**
 * @desc NotFoundError:请求的资源不存在。
 * @param {String} msg error message
 */
var NotFoundError = function (msg) {

  this.code = 404;
  msg = msg || "Not Found";
  NotFoundError.super_.call(this, msg, this.constructor);
};
util.inherits(NotFoundError, HttpError);

/**
 * @desc InternalServerError:后台的内部错误。需要管理员的协助才能够解决。
 * @param {String} msg error message
 */
var InternalServerError = function (msg) {

  this.code = 500;
  msg = msg || "Internal Server Error";
  InternalServerError.super_.call(this, msg, this.constructor);
};
util.inherits(InternalServerError, HttpError);

/**
 * exports
 */
module.exports = {
    BadRequest:     BadRequestError
  , Unauthorized:   UnauthorizedError
  , NotFound:       NotFoundError
  , InternalServer: InternalServerError
  , Forbidden:      ForbiddenError
  };
