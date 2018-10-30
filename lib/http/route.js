/**
 * @file
 * @desc 路由, 对象的key如果以 / 开头，说明是自定的全路径，则按照全路径去检索类文件。
 *   否则，会在controllers目录下检索该文件。
 * @author r2space@gmail.com
 */

"use strict";

var fs        = require("fs")
  , _         = require("underscore")
  , conf      = require("config")
  , util      = require("util")
  , yaml      = require("js-yaml")
  , helper    = require("../helper")
  , log       = require("../log")
  , constant  = require("../constant")
  , context   = require("./context")
  , response  = require("./response")
  ;

/**
 * @desc 校验json api的route是否正确
 * @param items
 * @param key
 * @returns {boolean}
 */
function isValidApi(items, key) {

  var isValid = true;
  _.each(items, function(r) {
    if (_.isUndefined(r.url) || (_.isUndefined(r.action) && _.isUndefined(r.custom))) {
      log.warn(util.format("invalid routes: %s, %s, %s", key, r.url, r.action), null);
      isValid = false;
    }
  });

  return isValid;
}

/**
 * @desc 校验route是否正确
 * @param items
 * @param key
 * @returns {boolean}
 */
function isValidWebsite(items, key) {

  var isValid = true;
  _.each(items, function(r) {
    if (_.isUndefined(r.url) || _.isUndefined(r.template)) {
      log.warn(util.format("invalid routes: %s, %s, %s", key, r.url, r.template), null);
      isValid = false;
    }
  });

  return isValid;
}

/**
 * @desc 校验Redirect是否正确
 * @param route
 * @returns {boolean}
 */
function isValidRedirect(route) {

  var isValid = true;
  if (_.isUndefined(route.url) || _.isUndefined(route.target)) {
    log.warn(util.format("invalid redirect: %s, %s, %s", route.url, route.target), null);
    isValid = false;
  }

  return isValid;
}

/**
 * @desc 调用controllers的方法
 * @param ctx app
 * @param req 请求
 * @param res 响应
 * @param action
 * @param inject 接收处理的对象
 * @param func 接收处理的方法
 */
function callController(ctx, req, res, action, inject, func) {

  var handler = new context().bind(req, res);
  log.operation(util.format("begin: %s#%s.", inject, func), handler.uid);

  action.call(ctx, handler, function(err, result) {
    log.operation(util.format("finish: %s#%s.", inject, func), handler.uid);
    return response.send(res, err, result);
  });
}

/**
 * @desc 获取URL部分
 * @param route
 * @returns {String}
 */
function httpApiUrl(route) {
  var target = route.url.split(/[ #,]/);
  return (conf.app.restapiprefix || "") + target[1];
}

/**
 * @desc 获取URL部分
 * @param route
 * @returns {String}
 */
function httpWebUrl(route) {
  var target = route.url.split(/[ #,]/);
  return (conf.app.websiteprefix || "") + target[1];
}

/**
 * @desc 获取Method部分
 * @param route
 * @returns {String}
 */
function httpMethod(route) {
  var target = route.url.split(/[ #,]/);
  return target[0].toLowerCase();
}

/**
 * @desc 获取模块路径
 * @param key
 * @returns {String}
 */
function sourcePath(key) {
  return /^\/.*/.test(key) ? key : constant.PATH_CONTROLLER + key;
}

/**
 * 加载配置文件, 优先YAML文件，如果没有, 读取json文件
 * @returns {Object}
 */
function loadConfig() {
  var path = process.env.SMART_ROUTE_CONFIG || process.cwd() + constant.FILE_CONF_ROUTE_YAML;
  if (fs.existsSync(path)) {
    return yaml.safeLoad(fs.readFileSync(path, "utf8"));
  }

  return require(process.env.SMART_ROUTE_CONFIG || process.cwd() + constant.FILE_CONF_ROUTE);
}

/**
 * @desc 路由API
 * @param app
 */
exports.api = function(app) {

  _.each(loadConfig().api, function(items, key) {
    if (!isValidApi(items, key)) {
      return;
    }

    var patch = sourcePath(key), inject = helper.resolve(patch);
    if (!inject) {
      log.warn(util.format("invalid block: %s", patch), null);
      return;
    }

    _.each(items, function(route) {
      var method = httpMethod(route)
        , url = httpApiUrl(route)
        , custom = inject[route.custom];
      if (custom) {
        app[method].call(app, url, custom);
        log.debug(util.format("route api: %s %s", method, url), null);
        return;
      }

      var action = inject[route.action];
      if (action) {
        app[method].call(app, url, function(req, res) {
          callController(this, req, res, action, patch, route.action);
        });
        log.debug(util.format("route api: %s %s", method, url), null);
      }
    });
  });

};

/**
 * @desc 路由website
 * @param app
 */
exports.website = function(app) {

  _.each(loadConfig().website, function(items, key) {
    if (!isValidWebsite(items, key)) {
      return;
    }

    var patch = sourcePath(key), inject = helper.resolve(patch);
    _.each(items, function(route) {
      var method = httpMethod(route), url = httpWebUrl(route);
      if (inject) {
        var custom = inject[route.custom];
        if (custom) {
          app[method].call(app, url, custom);
          log.debug(util.format("route website: %s %s", method, url), null);
          return;
        }
      }

      app[method].call(app, url, function(req, res) {
        var handler = new context().bind(req, res);
        var param = {
          req: req
        , res: res
        , handler: handler
        , user: handler.user
        , info: helper.applicationInfo()
        , conf: conf
        };
        res.render(route.template, _.extend(param, route.parameter));
      });
      log.debug(util.format("route website: %s %s", method, url), null);
    });
  });

};

/**
 * @desc 处理从定向
 * @param app
 */
exports.redirect = function(app) {

  _.each(loadConfig().redirect, function(route) {
    if (!isValidRedirect(route)) {
      return;
    }

    var method = httpMethod(route), url = httpWebUrl(route);
    app[method].call(app, url, function(req, res) {
      res.redirect(route.target);
    });
    log.debug(util.format("route redirect: %s %s", method, url), null);
  });

};
