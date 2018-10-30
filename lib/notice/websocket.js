/**
 * @file 推送通知
 *  使用socket.io实现推送
 * @author r2space@gmail.com
 */

"use strict";

var socket = require("socket.io-client")
  , config = require("config").notice
  , uitl   = require("util")
  , log    = require("../log")
  ;

/**
 * 给指定用户发送消息
 * @param uid
 * @param tag
 * @param msg
 * @param callback
 */
exports.push = function(uid, tag, msg, callback) {

  var uri = uitl.format("%s://%s:%s", config.protocol || "http", config.server || "127.0.0.1", config.port || 3001)
    , client = socket(uri, { query: "server=true", forceNew: true, timeout: 1000, reconnection: false });

  // 连接并发送消息
  client.on("connect", function() {
    client.emit("light.push", {uid: uid, tag: tag, message: msg});
  });

  // 连接出错
  client.on("connect_error", function(err) {
    log.error(err, uid);
    callback(err);
  });

  // 服务端接到消息以后断开，触发client的disconnect方法
  client.on("disconnect", function() {
    client.disconnect();
    callback();
  });
};
