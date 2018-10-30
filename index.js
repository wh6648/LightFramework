/**
 * @file 对外接口定义
 * @author r2space@gmail.com
 */

"use strict";

var _ = require("underscore");

module.exports = {

  /**
   * nodejs语言级别可用的模块
   */
  lang: {
    "fs":         require("fs"),
    "http":       require("http"),            // Stability: 3 - Stable
    "util":       require("util"),            // Stability: 4 - API Frozen
    "path":       require("path"),            // Stability: 3 - Stable
    "domain":     require("domain"),          // Stability: 2 - Unstable
    "os":         require("os"),              // Stability: 4 - API Frozen
    "event":      require("events"),          // Stability: 4 - API Frozen
    "childproc":  require("child_process")    // Stability: 3 - Stable
  },

  /**
   * 第三方模块
   */
  util: {
    "async":      require("async"),
    "ejs":        require("ejs"),
    "jsyaml":     require("js-yaml"),
    "log4js":     require("log4js"),
    "mongodb":    require("mongodb"),
    "moment":     require("moment"),
    "numeral":    require("numeral"),
    "underscore": require("underscore"),
    "i18n":       require("i18n"),
    "socket":     require("socket.io"),
    "xml2js":     require("xml2js"),
    "request":    require("request"),

    /* 废弃或移出预定 */
    "mongoose":   require("mongoose"),
    "config":     require("config"),
    "express":    require("express")

  },

  /**
   * 工具模块
   */
  framework: {
    "crypto":     require("./lib/crypto"),
    "error":      require("./lib/error"),
    "log":        require("./lib/log"),
    "helper":     require("./lib/helper"),
    "validator":  require("./lib/validator"),
    "command":    require("./lib/command"),
    "cache":      require("./lib/cache"),

    "mongo":      require("./lib/mongo/model"),
    "mongoctrl":  require("./lib/mongo/controller"),
    "mongoconn":  require("./lib/mongo/connection"),

    "oracleconn": require("./lib/oracle/connection"),

    "context":    require("./lib/http/context"),
    "route":      require("./lib/http/route"),
    "loader":     require("./lib/http/loader"),
    "middleware": require("./lib/http/middleware"),
    "response":   require("./lib/http/response"),
    "mail" :      require("./lib/mail"),

    "notice":     require("./lib/notice"),
    "sqlbuilder": require("./lib/sqlbuilder")
  }
};

/**
 * 整合underscore.string
 */
function initialize() {
  _.str = require("underscore.string");
  _.mixin(_.str.exports());
}
initialize();