/**
 * @file 通用工具类
 * @author r2space@gmail.com
 */

"use strict";

var fs          = require("fs")
  , ejs         = require("ejs")
  , os          = require("os")
  , xml         = require("xml2js")
  , _           = require("underscore")
  , packer      = require("zip-stream")
  , async       = require("async")
  , qr          = require("qr-image")
  , uuid        = require("uuid")
  ;

/**
 * 简单生成随机4位字符串
 */
exports.randomGUID4 = function() {
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};

/**
 * 简单生成随机8位字符串, 会有重复数据生成
 * GUID : Global Unique Identifier
 */
exports.randomGUID8 = function() {
  return exports.randomGUID4() + exports.randomGUID4();
};

exports.uuid = function() {
  return uuid.v4();
};

/**
 * 读取模板文件，带入参数，生成结果文件，如果没有指定结果文件，则返回解析后的字符串
 * @param {String} templateFile ejs模板文件
 * @param {Object} parameters 模板文件参数对象
 * @param {String} resultFile 结果文件，如果没有指定则以字符串的形式返回解析的内容
 * @returns {String}
 */
exports.ejsParser = function(templateFile, parameters, resultFile) {

  // 读取模板文件
  var template = fs.readFileSync(templateFile, "utf8");

  // 转换模板文件
  ejs.open = undefined;
  ejs.close = undefined;
  var result = ejs.render(template, parameters);

  // 没有指定输出文件，则返回字符串
  if (!resultFile) {
    return result;
  }

  // 输出文件
  fs.writeFileSync(resultFile, result);
  return undefined;
};

/**
 * 格式化EJS模板字符串
 * @param templateString
 * @param parameters
 * @returns {String}
 */
exports.ejsFormat = function(templateString, parameters) {

  // 改变模板参数标识
  ejs.open = "{{";
  ejs.close = "}}";

  var result = ejs.render(templateString, parameters);

  // 回复模板参数标识
  ejs.open = undefined;
  ejs.close = undefined;
  return result;
};

/**
 * 判断客户端是否是浏览器
 * @param {Object} req 请求
 * @returns {*}
 */
exports.isBrowser = function(req) {
  var userAgent = req.headers["user-agent"].toLowerCase();
  return userAgent.match(/mozilla.*/i);
};

/**
 * 判断请求是ajax请求
 * @param {Object} req 请求
 * @returns {*}
 */
exports.isAjax = function (req) {
  return req.headers && req.headers['x-requested-with'] && req.headers['x-requested-with'] == 'XMLHttpRequest';
};

/**
 * 返回客户端类型
 * @param {Object} req 请求
 * @returns {*} 浏览器返回‘mozilla‘，ios应用返回’app名称‘
 */
exports.clientType = function(req) {
  var userAgent = req.headers["user-agent"].toLowerCase();
  return userAgent.split("/")[0];
};

/**
 * 获取AP服务器IP地址的数组，获取的IP地址放到global对象中缓存
 * @returns 返回IP地址
 */
exports.ip = function() {

  if (global.addresses) {
    return global.addresses;
  }

  var interfaces = os.networkInterfaces()
    , addresses = [];

  _.each(interfaces, function(item) {
    _.each(item, function(address) {
      if (address.family === "IPv4" && !address.internal) {
        addresses.push(address.address);
      }
    });
  });

  global.addresses = addresses;
  return global.addresses;
};

/**
 * 获取应用程序情报
 * @returns {Object} 应用程序版本信息等
 */
exports.applicationInfo = function() {

  var app = require(process.cwd() + "/package.json");
  return {
      version: app.version
    , host: os.hostname()
    , application: app.name
    , time: new Date()
    };
};

/**
 * 判断模块是否可以加载
 *  TODO: cwd方法的目录依赖，会因为启动方式，启动目录不同而不准确
 *  TODO: 是否用代码文件存在来判断更加合理？而不是用一场捕获
 * @param module 模块名称
 * @returns {String} 路径
 */
exports.resolve = function(module) {
  try {
    return require(process.cwd() + module);
  } catch(e) {
    return undefined;
  }
};


/**
 * 加载给定的字符串，与eval类似
 * @param {String} src
 * @param {String} filename
 * @returns {Object}
 */
exports.requireFromString = function(src, filename) {
  var Module = module.constructor;
  var m = new Module();
  m._compile(src, filename);
  return m.exports;
};

/**
 * 搜索JSON，获取指定路径的值
 * @param {Object} json JSON对象
 * var sample1 = {
 *  a: "a1",
 *  b: {bb: "bb1"},
 *  c: {cc: "cc1", cc1: "cc2"},
 *  d: ["dd1"],
 *  e: ["ee1", "ee2"],
 *  f: [{f1: "f11"}, {f1:"f12"}, {f2:"f13"}]
 * };
 * var sample2 = [
 *  {a: 1},
 *  {a: 2},
 *  {a: {b: 4}},
 *  {a: {b: 5}},
 *  {a: [{b: 6}, {b: 7}]},
 *  {a: [{b: 8}, {c: {d: 9}}]},
 *  {a: [{b: 8}, {c: {d: {e:[{f:10}, {f:11}]}}}]}
 * ];
 * @param {String} keys 路径
 * sample1:
 * "a"           -> a1
 * "b.bb"        -> bb1
 * "c.cc1"       -> cc2
 * "e"           -> ee1,ee2
 * "e.$"         -> ee1,ee2
 * "f.$"         -> [ { f1: 'f11' }, { f1: 'f12' }, { f2: 'f13' } ]
 * "f.$.f1"      -> f11,f12
 * "f.$.f2"      -> f13
 * sample2:
 * "a.$.b"       -> 4,5,6,7,8,8
 * "a.c.d.e.f"   -> 10,11
 * @returns {*}
 */
exports.lookup = function(json, keys) {

  var document = json;
  keys = keys.split(".");
  while(keys && keys.length > 0) {

    var key = keys.shift()
      , isLast = (keys.length <= 0);

    // 最后一个key，获取结果值
    if (isLast) {

      // 是通配符，则返回所有结果
      if (key == "$") { return _.isArray(document) ? document : [document]; }

      // 如果不是数组，则取项目值返回
      if (!_.isArray(document)) { return [document[key]]; }

      // 搜索的数组内的值，返回元素key能够配上的
      var result = [];
      _.each(document, function(doc) {

        if (_.isArray(doc)) {
          _.each(doc, function(d) {
            if (d[key]) result.push(d[key]);
          });
        } else {
          if (doc[key]) result.push(doc[key]);
        }
      });
      return result;
    }

    // 设定document中下一个元素
    if (key != "$") {

      // 如果是数组，则获取元素key能够配上的
      if (_.isArray(document)) {
        var temp = [];
        _.each(document, function(doc) {

          if (_.isArray(doc)) {
            _.each(doc, function(d) {
              if (d[key]) temp.push(d[key]);
            });
          } else {
            if (doc[key]) temp.push(doc[key]);
          }
        });
        document = temp;
      } else {

        // 不是数组
        document = document[key] ? [document[key]] : undefined;
      }
    }

    if (_.isUndefined(document)) return undefined;
  }
}

/**
 * XML解析器
 * @param file
 * @param callback
 */
exports.xmlParser = function(file, callback) {
  var path = process.cwd() + file;

  if (fs.existsSync(path)) {
    var data = fs.readFileSync(path);
    new xml.Parser().parseString(data, function(err, result) {
      callback(err, result);
    });
    return;
  }

  callback(undefined, {});
};

/**
 * 压缩指定的文件列表
 * @param list
 * @param out
 */
exports.zipFiles = function(list, out, callback) {

  var archive = new packer()
    , result = []
    , output = _.isString(out) ? fs.createWriteStream(out) : out; // 输出文件名或输出流

  if (list && list.length > 0) {
    async.eachSeries(list, function(file, next) {
      archive.entry(fs.createReadStream(file), {name: file}, function(err, entry) {
        result.push(entry);
        next(err, entry);
      });
    }, function(err) {
      archive.finish();
      if (callback) {
        callback(err, result);
      }
    });
  } else {

    // 生成一个空文件，标识没有内容
    archive.entry("No file.", {name: "NoFile"}, function(err, entry) {
      archive.finish();
      if (callback) {
        callback(err, result);
      }
    });
  }

  archive.pipe(output);
};

/**
 * 生成QRcode
 * @param message
 * @param out
 * @param callback
 */
exports.qrcode = function(message, out, callback) {

  var png = qr.image(message, { type: "png", ec_level: "L", margin: 1 })
    , stream = _.isString(out) ? fs.createWriteStream(out) : out;

  stream.on("close", function() {
    callback();
  });
  png.pipe(stream);
};
