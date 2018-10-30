/**
 * @file 管理数据库连接
 *  默认的collection名称前面会自动添加prefix
 *  如果需要指定自定义的名称，则可以在schema里明确指出（为了对应多个应用共享一个数据库而设计）
 *  prefix与schema在config文件里定义.
 *  code是用来指定数据库实例的，当多个公司公用一个数据库是，每个公司的使用自己独立的数据库实例
 *  此时，数据库实例的名字即为coede（code是随机生成的8为数）.
 * @author r2space@gmail.com
 */

"use strict";

var _         = require("underscore")
  , mongo     = require("mongoose")
  , mongodb   = require("mongodb")
  , util      = require("util")
  , conf      = require("config").db
  , constant  = require("../constant")
  , Db        = mongodb.Db
  , Server    = mongodb.Server
  ;

/**
 * Connection map
 *  key   : code
 *  value : connection instance
 */
var connections = {};

/**
 * 创建一个新的连接
 * @param {String} code 数据库标识符
 * @returns {Object} 数据库连接对象
 */
function createConnection(code) {

  var host = conf.host
    , port = conf.port
    , pool = conf.pool
    , user = conf.user
    , pass = conf.pass
    , url = null
    , dbname = code || conf.dbname;

  console.log("Database code: " + dbname);
  console.log("Database host: " + host);
  console.log("Database port: " + port);
  console.log("Database pool: " + pool);
  console.log("Database user: " + user);

  if (user) {
    url = util.format("mongodb://%s:%s@%s:%d/%s", user, pass, host, port, dbname);
  } else {
    url = util.format("mongodb://%s:%d/%s", host, port, dbname);
  }

  connections[dbname] = mongo.createConnection(url, { server: { poolSize: pool } });
  return connections[dbname];
}

/**
 * 取得连接
 * @param {String} code 数据库标识符
 * @returns {Object} 数据库连接对象
 */
function getMongoConnection(code) {

  var dbname = code || conf.dbname
    , conn = connections[dbname];

  // 无连接
  if (!conn) {

    console.log("Create a connection.");
    return createConnection(dbname);
  }

  // 如果连接被断开, 重新建立连接
  if (conn.readyState === 0) {

    console.log("Re-new the connection.");
    return createConnection(dbname);
  }

  return conn;
}

/**
 * 获取指定collection的model
 * 如果该collection不存在，则会从新创建一个collection
 * 这时collection的名字会加前缀（前缀需在）
 * @param code 系统
 * @param name
 * @param schema
 */
exports.model = function(code, name, schema) {

  var conn = getMongoConnection(code)
    , collection = "";

  // 没有特别指定的collection名，统一添加前缀
  if (conf.schema && _.has(conf.schema, name)) {
    collection = conf.schema[name];
  } else {
    collection = (conf.prefix || "") + name;
  }

  return conn.model(collection, schema);
};

/**
 * 获取数据库实例
 * @param code
 * @returns {Object}
 */
exports.db = function(code) {
  return getMongoConnection(code);
};

/**
 * Native: 获取数据库实例
 * @param code
 * @returns {Object}
 */
exports.nativedb = function(code) {
  return new Db(code || conf.dbname, new Server(
      conf.host
    , conf.port
    , constant.MOD_DB_SERVER_OPTIONS)
    , constant.MOD_DB_OPTIONS
  );
};

/**
 * Native: 获取数据库连接。使用完DB后，需要明确的关闭数据库。
 * @param code
 * @param callback
 */
exports.nativeopen = function(code, callback) {
  var db = exports.nativedb(code);
  db.open(function (err, db) {
    if (err) {
      callback(err);
      return;
    }

    if (conf.user) {
      db.authenticate(conf.user, conf.pass, function (err) {
        if (err) {
          return callback(err);
        }
        return callback(err, db);
      });
    } else {
      return callback(undefined, db);
    }
  });
};

/**
 * 生成Mongoose的数据定义, 此方法依赖mongoose内部式样
 * @param schema
 * @returns {{}}
 */
exports.schema = function(schema) {
  var define = {};
  _.each(schema.paths, function(val, key) {
    define[key] = {
        type: val.options.type.name
      , description: val.options.description
      };
  });

  delete define._id;
  delete define.__v;
  delete define.createAt;
  delete define.createBy;
  delete define.updateAt;
  delete define.updateBy;

  return define;
};

