/**
 * @file 应用程序上下文，主要负责异常处理和参数传递。
 * 异常处理思路：
 *  1. API层，生成Handler实例，并向后续函数传递
 *  2. 通常的程序捕获的异常，通过Handler明确的emit出去，然后由API层捕获并返回
 *  3. 没有捕获的非异步异常，会由Express的错误处理函数捕获，并返回
 *  4. 异步异常，或有可能产生异步异常的地方，要用domain捕获，捕获之后返回并杀掉当前进程
 *  5. node进程的重启依靠forever的重启功能，NGINX配置成不能访问时，对其他的AP做请求
 * @author r2space@gmail.com
 */

"use strict";

var _             = require("underscore")
  , util          = require("util")
  , domain        = require("domain")
  , emitter       = require("events").EventEmitter
  , response      = require("./response")
  , log           = require("../log")
  , constant      = require("../constant");

/**
 * Context实例，为了能通过该类发送异常，所以继承EventEmitter
 * @type {Function}
 */
var Handler = module.exports = function() {
  emitter.call(this);
};
util.inherits(Handler, emitter);

/**
 * 使用req与res对context进行初始化
 * @param req 请求
 * @param res 响应
 * @returns {*} context实例
 */
Handler.prototype.bind = function(req, res) {

  this.req = req;
  this.res = res;
  this.attributes = {};

  // 缓存参数
  var self = this;

  // 获取URL参数
  _.each(this.req.query, function(val, key) {
    self.attributes[key] = val;
  });

  // 获取body参数
  _.each(this.req.body, function(val, key) {
    self.attributes[key] = val;
  });

  // 获取路径上的参数
  if (this.req.params) {
    for (var key in this.req.params) {
      if (self.req.params.hasOwnProperty(key)) {
        self.attributes[key] = this.req.params[key];
      }
    }
  }

  // 转换文件参数
  if(this.req.files){
    self.addParams("files", this.req.files);
  }

//  _.each(this.req.files, function(files) {
//    if (files) {
//      if (files instanceof Array) {
//        self.addParams("files", files);
//      } else {
//        self.addParams("files", [files]);
//      }
//    }
//  });

  // 将异常转换为响应，并通过res送出
  this.on("error", function(error){
    response.sendError(res, error);
  });

  return this;
};

/**
 * 生成一个空得Handler
 * TODO: 添加单元测试代码
 * @param {String} uid 用户对象的_id
 * @param {String} code DB名称
 * @param {String} lang 语言
 * @returns {Handler} Handler对象
 */
Handler.prototype.create = function(uid, code, lang) {
  this.bind({ session: { user: { _id: uid , lang: lang }, code: code } }, {});
  this._code = code;
  return this;
};

/**
 * 复制一个新的Handler
 * TODO: 添加单元测试代码
 * @param {Handler对象} 要被复制的handler
 * @returns {Handler} 复制后的Handler对象
 */
Handler.prototype.copy = function(attachParams) {
  var self = this;
  var newHandler = new Handler().bind({
    session:{ user:{ _id: self.uid, lang: self.lang } , code: self.code }
  }, {});
  newHandler.code = self.code;
  newHandler.uid = self.uid;

  if(attachParams){
    _.each(attachParams, function(val, key) {
      newHandler.addParams(key, val);
    });
  }

  return newHandler;
};

/**
 * 输出参数情报
 * TODO: 添加单元测试代码
 * @param {Function} printer log输出方法
 */
Handler.prototype.print = function(printer) {

  _.each(this.params, function(val, key) {

    // TODO: 感觉写法有点诡异
    var line = "";
    if (_.isNumber(val)) {
      line = util.format("context.params - %s: %d", key, val);
    } else if (_.isObject(val)) {
      line = util.format("context.params - %s: %f", key, val);
    } else {
      line = util.format("context.params - %s: %s", key, val);
    }

    printer(line);
  });
};

/**
 * 抛出异常，使用事件机制发送异常
 * @param error 异常
 */
Handler.prototype.pitch = function(error) {
  this.emit("error", error);
};

/**
 * 添加附加属性
 * @param key 附加属性的名称
 * @param val 保存的值
 */
Handler.prototype.addParams = function(key, val) {
  this.attributes[key] = val;
};

/**
 * 删除附加属性
 * @param key 附加属性的名称
 */
Handler.prototype.removeParams = function(key) {
  delete this.attributes[key];
};

/**
 * 扩展附加属性
 * @param {Object} obj
 */
Handler.prototype.extendParams = function(obj) {
  _.extend(this.attributes, obj);
};

/**
 * 客户端请求参数
 * 合并了GET，POST方法的请求参数
 */
Object.defineProperty(Handler.prototype, "params", {
  get: function () {
    return this.attributes;
  }
});

/**
 * 用户ID
 */
Object.defineProperty(Handler.prototype, "uid", {
  enumerable: true, get: function () {

    if (this._uid) {
      return this._uid;
    }

    if (this.req && this.req.session && this.req.session.user) {
      return this.req.session.user._id;
    }

    return undefined;
  }, set: function (uid) {

    this._uid = uid;
  }
});

/**
 * 公司代码
 */
Object.defineProperty(Handler.prototype, "code", {
    enumerable: true
  , get: function () {

      // 如果有明确的设定值，则返回该code
      if (this._code) {
        return this._code;
      }

      // 否则，从用户的session里取code
      if (this.req && this.req.session) {
        return this.req.session.code;
      }

      return undefined;
    }
  , set: function (code) {

      // set方法在，需要对明确指定的code进行数据操作时使用。如超级管理员操作等。
      this._code = code;
    }
  });

/**
 * 用户信息
 */
Object.defineProperty(Handler.prototype, "user", {
  get: function () {
    if (this.req && this.req.session) {
      return this.req.session.user;
    }

    return undefined;
  }
});

/**
 * 语言信息
 * TODO: 添加单元测试代码
 */
Object.defineProperty(Handler.prototype, "lang", {
  get: function () {
    if (this.req && this.req.session && this.req.session.user && this.req.session.user.lang) {
      return this.req.session.user.lang;
    }

    return constant.DEFAULT_I18N_LANG;
  }
});

/**
 * 异步操作里，有可能产生异常时，使用该domain执行对象代码
 * 注意！当异步函数产生异常时，会结束进程
 */
Object.defineProperty(Handler.prototype, "domain", {
  get: function () {
    var self = this;

    if (!self._domain) {
      self._domain = domain.create();
      self._domain.on("error", function(e) {

        log.error("debug", e);
        process.exit(1);
      });
    }

    return self._domain;
  }
});
