
var LRU       = require("lru-cache")
  , _         = require("underscore")
  , log       = require("./log")
  , conf      = require("config").cache || {}
  , spliter   = "#";

/**
 * 缓存实例
 * @type {*|exports}
 */
var cache = LRU({
    max: conf.max || 500
  , maxAge: conf.maxAge * 1000 * 60 || 1000 * 60 * 60 * 24
  });

/**
 * 获取
 * @returns {*}
 */
exports.get = function() {

  if (!conf.enable) {
    return undefined;
  }

  if (conf.type === "memcached") {
    // TODO: 大规模应用时，使用memcached进行缓存
    return undefined;
  }

  var key = params(arguments);

  log.debug("load from cache: " + key);
  return cache.get(key);
};

/**
 * 设定
 */
exports.set = function() {

  if (!conf.enable) {
    return;
  }

  if (conf.type === "memcached") {
    return;
  }

  var keys = params([].splice.call(arguments, 0, arguments.length - 1))
    , vals = arguments[arguments.length - 1];

  log.debug("save to cache: " + keys);
  cache.set(keys, vals);
};

/**
 * 合并参数成字符串
 * @param p
 * @returns {string}
 */
function params(p) {

  var result = "";
  _.each(p, function(val) {
    result =  result + spliter + val;
  });

  return result;
}
