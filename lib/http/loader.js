/**
 * @file Smart核心服务的初始化
 * @author r2space@gmail.com
 */

"use strict";

var path            = require("path")
  , conf            = require("config")
  , express         = require("express")
  , fs              = require("fs")
  , _               = require("underscore")
  , ejs             = require("ejs")
  , session         = require("express-session")
  , store           = require("connect-mongo")(session)
  , morgan          = require("morgan")
  , bodyparser      = require("body-parser")
  , methodoverride  = require("method-override")
  , cookieparser    = require("cookie-parser")
  , favicon         = require("serve-favicon")
  , i18n            = require("../i18n")
  , log             = require("../log")
  , error           = require("../error").system
  , constant        = require("../constant")
  , util            = require("../helper");

function initExpress(app) {

  log.debug("initialize express");
  log.debug("express port : " + conf.app.port);
  log.debug("express views : " + conf.app.views);
  log.debug("express tmp : " + conf.app.tmp);
  log.debug("express sessionTimeout : " + conf.app.sessionTimeout);

  app.set("port", process.env.PORT || conf.app.port || 3000);
  app.set("views", path.join(process.cwd(), conf.app.views));
  app.set("view engine", "html");
  app.engine("html", ejs.renderFile);

  /**
   * Middleware
   * 生成标准favicon.ico，防止favicon.ico的404错误
   */
  if(fs.existsSync("static/favicon.ico")){
    app.use(favicon("static/favicon.ico"));
  }

  /**
   * Middleware
   * 记录Access log和Error log
   */
  app.use(morgan("short", { skip: function(req) { return req.url.match(/\/static.*/i); } }));

  /**
   * Middleware
   * 压缩response data为gzip
   */
  //app.use(express.compress());

  /**
   * Middleware
   * 用于模拟DELETE and PUT方法
   * 可以在form里放在<input type="hidden" name="_method" value="put" />来模拟
   */
  app.use(methodoverride());

  /**
   * Middleware
   * 解析cookie
   */
  app.use(cookieparser(conf.app.cookieSecret));

  /**
   * Middleware
   * 提供基于cookie的session
   */
  var sessionOptions = { db: constant.SYSTEM_DB, host: conf.db.host, port: conf.db.port };
  if (conf.db.user) {
    sessionOptions.username = conf.db.user;
    sessionOptions.password = conf.db.pass;
  }
  app.use(session({
      "secret": conf.app.sessionSecret
    , "key": conf.app.sessionKey
    , "cookie": { "maxAge": conf.app.sessionTimeout * 60 * 60 * 1000 }
    , "store": new store(sessionOptions)
    , "rolling": true
    , "resave": true
    , "saveUninitialized": true
    }));

  app.use(bodyparser.json());
  app.use(bodyparser.urlencoded({extended: true}));
  app.use(express.static(path.join(process.cwd(), conf.app.public || "/")));
}

/**
 * 判断config项目是否存在
 * 含子元素的项目，用该方法来检查
 * @param {Object} item 被检测项目
 * @param {String} info log里输出的项目名称
 * @param {Function} print 打印方法
 * @param {Array} errs 错误集合
 */
function checkExist(item, info, print, errs) {

  var msg = info + " is empty!";
  if (_.isEmpty(item)) {
    errs.push(new error.ConfigError(msg));
    print(msg);
    return true;
  }

  return false;
}

/**
 * 判断config项目是否为数字
 * @param {Object} item 被检测项目
 * @param {String} info log里输出的项目名称
 * @param {Function} print 打印方法
 * @param {Array} errs 错误集合
 */
function checkNumber(item, info, print, errs) {

  if (_.isNumber(item)) {
    log.info(info + " " + item);
    return true;
  }

  var msg = info + " is not a number!";
  errs.push(new error.ConfigError(msg));
  print(msg);
  return false;
}

/**
 * 判断config项目是否为字符
 * @param {Object} item 被检测项目
 * @param {String} info log里输出的项目名称
 * @param {Function} print 打印方法
 * @param {Array} errs 错误集合
 */
function checkString(item, info, print, errs) {

  if (_.isString(item)) {
    log.info(info + " " + item);
    return true;
  }

  var msg = info + " is not a string!";
  errs.push(new error.ConfigError(msg));
  print(msg);
  return false;
}

/**
 * 校验config文件
 */
function validateConfig() {

  var errs     = [];

  // DB config
  if (!checkExist(conf.db, "config/db", log.error, errs)) {
    checkString(conf.db.host, "config/db/host", log.error, errs);
    checkNumber(conf.db.port, "config/db/port", log.error, errs);
//    checkString(conf.db.dbname, "config/db/dbname", log.error, errs);

    checkString(conf.db.prefix, "config/db/prefix", log.warn, []);
    checkNumber(conf.db.pool, "config/db/pool", log.warn, []);
    checkExist(conf.db.schema, "conf.db.schema", log.warn, []);
  }

  // APP config
  if (!checkExist(conf.app, "config/app", log.error, errs)) {

    checkNumber(conf.app.port, "config/app/port", log.warn, []);

    checkString(conf.app.views, "config/app/views", log.error, errs);
    checkString(conf.app.cookieSecret, "config/app/cookieSecret", log.error, errs);
    checkString(conf.app.sessionSecret, "config/app/sessionSecret", log.error, errs);
    checkString(conf.app.sessionKey, "config/app/sessionKey", log.error, errs);
    checkNumber(conf.app.sessionTimeout, "config/app/sessionTimeout", log.error, errs);
    checkString(conf.app.tmp, "config/app/tmp", log.error, errs);
    checkString(conf.app.hmackey, "config/app/hmackey", log.error, errs);

    if (!checkExist(conf.app.i18n, "conf.app.i18n", log.warn, [])) {
      checkString(conf.app.i18n.cache, "config/app/i18n/cache", log.warn, []);
      checkString(conf.app.i18n.lang, "config/app/i18n/lang", log.warn, []);
      checkString(conf.app.i18n.category, "config/app/i18n/category", log.warn, []);
    }
  }

  // LOG config
  if (!checkExist(conf.log, "config/log", log.warn, [])) {
    if (!checkExist(conf.log.fluent, "config/log/fluent", log.warn, [])) {
      checkString(conf.log.fluent.enable, "config/log/fluent/enable", log.warn, []);
      checkString(conf.log.fluent.tag, "config/log/fluent/tag", log.warn, []);
      checkString(conf.log.fluent.host, "config/log/fluent/host", log.warn, []);
      checkNumber(conf.log.fluent.port, "config/log/fluent/port", log.warn, []);
      checkNumber(conf.log.fluent.timeout, "config/log/fluent/timeout", log.warn, []);
    }
  }

  // 如果必须向有错误，则拒绝启动
  if (errs.length > 0) {
    process.exit(1);
  }
}

/**
 * 调用初始化函数
 */
exports.initialize = function() {

  i18n.configure({
    locales:conf.app.i18n.langs,
    defaultLocale:conf.app.i18n.defaultLang,
    directory:process.cwd() + "/locales"
  });
  // 多国语全局变量注册
  global.__ = i18n.__;

  // 注册静态资源变更标识用全局变量，详细参见middleware.js的urlstamp方法
  global.stamp = conf.app.stamp || util.randomGUID8();

  // 验证配置文件
  validateConfig();

};

/**
 * 初始化express模块
 * @param app Express实例
 */
exports.express = function(app) {
  initExpress(app);
};
