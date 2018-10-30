/**
 * @file 管理Oracle连接
 * @author r2space@gmail.com
 */

"use strict";

var generic = require("generic-pool")
  , async   = require("async")
  , _       = require("underscore")
  , conf    = require("config").oracle || {enable: false, pool: {}}
  , oracle  = undefined
  , pool    = undefined
  ;

var setting = {
  hostname: conf.host,
  port    : conf.port || 1521,
  database: conf.dbname,
  user    : conf.user,
  password: conf.pass,
  pool: {
    name  : "oracle",
    log   : false,
    max   : conf.pool || 3
  }
};

if (conf.enable) {
  oracle = require("oracle");
  pool = initConnectionPool();
}

/**
 * 初始化连接池
 * @returns {Object}
 */
function initConnectionPool() {

  console.log("Oracle code: " + setting.database);
  console.log("Oracle host: " + setting.hostname);
  console.log("Oracle port: " + setting.port);
  console.log("Oracle pool: " + setting.pool.max);
  console.log("Oracle user: " + setting.user);

  return generic.Pool({
    name: setting.pool.name,
    log: setting.pool.log,
    max: setting.pool.max,
    create: function(callback) {
      oracle.connect(setting, function(err, connection) {
        callback(err, connection);
      });
    },
    destroy: function(connection) {
      connection.close();
    }
  });
}

/**
 * 返回连接池中得数据库连接
 * @returns {Object}
 */
exports.model = function() {
  return pool;
};

/**
 * 执行查询用SQL
 * @param sql
 * @param params
 * @param callback
 */
exports.query = function(sql, params, callback) {

  callback = _.isFunction(params) ? params : callback;
  params = _.isFunction(params) ? [] : params;

  pool.acquire(function(err, connection) {
    if (err) {
      return callback(err);
    }

    connection.execute(sql, params, function(err, result) {
      pool.release(connection);
      callback(err, result);
    });
  });
};

/**
 * 插入一条
 * @param sql
 * @param params
 * @param callback
 */
exports.insert = function(sql, params, callback) {
  exports.update(sql, params, callback);
};

/**
 * 插入多条
 * @param sql
 * @param params
 * @param callback
 */
exports.inserts = function(sql, params, callback) {
  exports.updates(sql, params, callback);
};

/**
 * 更新一条
 * @param sql
 * @param params
 * @param callback
 */
exports.update = function(sql, params, callback) {

  pool.acquire(function(err, connection) {
    if (err) {
      return callback(err);
    }

    connection.execute(sql, params, function(err, result) {
      pool.release(connection);
      callback(err, result);
    });
  });
};

/**
 * 更新，删除
 * @param sql
 * @param params
 * @param callback
 */
exports.updates = function(sql, params, callback) {
  pool.acquire(function(err, connection) {
    if (err) {
      return callback(err);
    }

    var statement = connection.prepare(sql);

    async.forEachSeries(params, function(param, loop) {
      statement.execute(param, function(err) {
        loop(err);
      });
    }, function(err, result) {
      pool.release(connection);
      callback(err, result);
    });
  });
};

/**
 * 存储过程调用
 */
exports.call = function(procedure, params, callback) {
    pool.acquire(function(err, connection) {
        if (err) {
            return callback(err);
        }

        connection.execute(procedure, params, function(err, result) {
            pool.release(connection);
            callback(err, result);
        });
    });
};

/**
 * 获取输出参数实例
 * @param {Number} type 输出参数类型
 *   OCCIINT        = 0;
 *   OCCISTRING     = 1;
 *   OCCIDOUBLE     = 2;
 *   OCCIFLOAT      = 3;
 *   OCCICURSOR     = 4;
 *   OCCICLOB       = 5;
 *   OCCIDATE       = 6;
 *   OCCITIMESTAMP  = 7;
 *   OCCINUMBER     = 8;
 *   OCCIBLOB       = 9;
 * @returns {exports.OutParam} 参数实例
 */
exports.params = function(type) {
    return new oracle.OutParam(type);
};

/**
 * 游标支持
 */
exports.cursor = function() {
  // TODO:
};