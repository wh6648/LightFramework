/**
 * @file DB异常类。
 * @author sl_say@hotmail.com
 * @module light.error.errors_db
 */

"use strict";

var util   = require("util")
  , errors = require("./errors_common");

/**
 * @desc DB异常类
 * @param {String} msg error message
 */
var DBError = function (msg) {
  this.code = this.code || "D0000";
  msg = msg || "DB Error";
  DBError.super_.call(this, msg, this.constructor);
};

util.inherits(DBError, errors.AbstractError);

/**
 * @desc 添加数据时的DB错误
 * @param {String} msg error message
 */
var AddError = function (msg) {

  this.code = "D0001";
  msg = msg || "Failed to Add";
  AddError.super_.call(this, msg, this.constructor);
};
util.inherits(AddError, DBError);

/**
 * @desc 删除数据时的DB错误
 * @param {String} msg error message
 */
var RemoveError = function (msg) {

  this.code = "D0002";
  msg = msg || "Failed to Remove";
  RemoveError.super_.call(this, msg, this.constructor);
};
util.inherits(RemoveError, DBError);

/**
 * @desc 更新数据时的DB错误
 * @param {String} msg error message
 */
var UpdateError = function (msg) {

  this.code = "D0003";
  msg = msg || "Failed to Update";
  UpdateError.super_.call(this, msg, this.constructor);
};
util.inherits(UpdateError, DBError);

/**
 * @desc 检索数据时的DB错误
 * @param {String} msg error message
 */
var FindError = function (msg) {

  this.code = "D0004";
  msg = msg || "Failed to Find";
  FindError.super_.call(this, msg, this.constructor);
};
util.inherits(FindError, DBError);

/**
 * @desc 数据不存在
 * @param {String} msg error message
 */
var NotExistError = function (msg) {

  this.code = "D1004";
  msg = msg || "Not Exist";
  NotExistError.super_.call(this, msg, this.constructor);
};
util.inherits(NotExistError, DBError);

/**
 * @desc Collection被锁定
 * @param {String} msg error message
 */
var LockedError = function (msg) {

  this.code = "D1005";
  msg = msg || "Collection is locked";
  LockedError.super_.call(this, msg, this.constructor);
};
util.inherits(LockedError, DBError);

/**
 * @desc 数据不正确
 * @param {String} msg error message
 */
var NotCorrectError = function (msg) {

  this.code = "D1006";
  msg = msg || "Not Correct";
  LockedError.super_.call(this, msg, this.constructor);
};
util.inherits(NotCorrectError, DBError);

/**
 * exports
 */
module.exports = {
    Add:        AddError
  , Remove:     RemoveError
  , Update:     UpdateError
  , Find:       FindError
  , NotExist:   NotExistError
  , Locked:     LockedError
  , NotCorrect: NotCorrectError
  };