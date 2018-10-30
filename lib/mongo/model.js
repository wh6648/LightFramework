/**
 * @file 存取数据用的Mongoose模块
 * @author r2space@gmail.com
 */

"use strict";

var conn      = require("./connection")
  , constant  = require("../constant");

/**
 * 构造函数
 * @param {String} code 公司标识
 * @param {String} name collection名称
 * @param {Object} define collection定义
 */
var Model = module.exports = function Model (code, name, define) {

  this.mongo = conn.model(code, name, define);
  this.code = code;
  this.name = name;
  this.define = define;
};

/**
 * 添加数据
 * @param {Object} obj 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.add = function(obj, callback) {

  var Class = this.mongo;
  new Class(obj).save(function(err, result) {
    return callback(err, result);
  });
};

/**
 * 用ID删除数据
 * @param {String} id
 * @param {Object} obj 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.remove = function(id, obj, callback) {

  obj = obj || { };
  obj.valid = constant.INVALID;

  this.mongo.findByIdAndUpdate(id, obj, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 用给定条件删除数据
 * @param {Object} condtion 条件
 * @param {Object} obj 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.removeBy = function(condtion, obj, callback) {

  obj = obj || { };
  obj.valid = constant.INVALID;

  this.mongo.update(condtion, obj, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 用ID更新数据
 * @param {String} id
 * @param {Object} obj 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.update = function(id, obj, callback) {

  this.mongo.findByIdAndUpdate(id, obj, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 用给定条件更新
 * @param {Object} condtion 条件
 * @param {Object} obj 数据
 * @param {Function} callback 回调函数
 */
Model.prototype.updateBy = function(condtion, obj, callback) {

  this.mongo.update(condtion, obj, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 用ID获取数据
 * @param {String} id
 * @param {Function} callback 回调函数
 */
Model.prototype.get = function(id, callback) {

  this.mongo.findById(id, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 用给定条件，获取一条数据
 * @param {Object} condition 查询条件
 * @param {Function} callback 回调函数
 */
Model.prototype.getOne = function(condition, callback) {

  this.mongo.findOne(condition, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 获取数据一览
 * @param {Object} condition 查询条件
 * @param {Number} skip 跳过的文书数，默认为0
 * @param {Number} limit 返回的文书的上限数目，默认为20
 * @param {String} sort 排序
 * @param {String} select 获取的项目
 * @param {Function} callback 回调函数
 */
Model.prototype.getList = function(condition, skip, limit, sort, select, callback) {

  this.mongo.find(condition)
    .select(select)
    .skip(skip || constant.MOD_DEFAULT_START)
    .limit(limit || constant.MOD_DEFAULT_LIMIT)
    .sort(sort)
    .exec(function(err, result) {
      return callback(err, result);
    });
};

/**
 * 检索，并去掉相同的数据
 * @param {String} field
 * @param {Object} condition 条件
 * @param {Function} callback 回调函数
 */
Model.prototype.distinct = function(field, condition, callback) {

  this.mongo.distinct(field, condition, function(err, result) {
    return callback(err, result);
  });
};

/**
 * 获取总件数
 * @param {Object} condition 条件
 * @param {Function} callback 回调函数
 */
Model.prototype.total = function(condition, callback) {
  this.mongo.count(condition, function(err, count) {
    callback(err, count);
  });
};

/**
 * 获取Collection定义
 * @returns {Object}
 */
Model.prototype.schema = function() {
  return conn.schema(this.define);
};

/**
 * 累加功能
 * @param {String} type 累计的字段
 * @param {Object} condition 条件
 * @param {Function} callback 回调函数
 */
Model.prototype.increment = function(condition, field, callback) {

  var inc = {};
  inc[field] = 1;

  console.log(condition);
  console.log({ $inc: inc });
  this.mongo.findOneAndUpdate(condition, { $inc: inc }, { upsert: true }, function(err, result) {
    callback(err, result);
  });
};
