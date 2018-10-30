/**
 * @file 应用程序过滤器，在处理响应之前做一些处理（如校验是否登录，设定csrftoken等）
 * @author r2space@gmail.com
 */

"use strict";

var _           = require("underscore")
  , conf        = require("config").app
  , csrf        = require("csurf")()
  , multiparty  = require("multiparty")
  , errors      = require("../error").http
  , i18n        = require("../i18n")
  , log         = require("../log")
  , helper      = require("../helper")
//  , multiTenant = require("./company/multiTenant")
  ;

/**
 * 判断是否是Multipart上传
 * @param req
 * @returns {boolean}
 */
function isMultipart(req) {

  if (!req || !req.headers) {
    return false;
  }

  var contentType = req.headers["content-type"];
  if (!contentType) {
    return false;
  }

  return /^multipart\/(?:form-data|related)(?:;|$)/i.exec(contentType);
}

/**
 * 注册ejs用全局国际化函数
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.lang = function(req, res, next) {

  // 如果已经登陆，则使用用户session中得语言
  if (req.session && req.session.user) {
    i18n.setLocale(req.session.user.lang);
  }

  // 向画面设定词条（javascript用等）
  res.locals.catalog = i18n.getCatalog(i18n.getLocale() || conf.i18n.defaultLang);

  // 设定全局国际化函数
  res.locals.i = i18n.__;
  next();
};

/**
 * Authenticate:
 *  Check the approval status.
 *  The configure of app.js, the handle has been registered.
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 * @returns {*} 无
 */
exports.authenticate = function(req, res, next) {

  log.debug("middleware : authenticate");

  var safety = false;

  // URL是否与不需要认证的路径匹配（配置文件中定义）
  _.each(conf.ignoreAuth, function(path) {
    var regexPath = new RegExp(path, "i");
    safety = safety || !_.isNull(req.url.match(regexPath));
  });

  // 不做检测的URL
  if (safety) {
    return next();
  }

  // 确认Session里是否有用户情报
  if (req.session.user) {
    return next();
  }

  // 401 Unauthorized
  throw new errors.Unauthorized("Not logged in");
};

/**
 * Csrftoken:
 *  To implant csrf token in the Request.
 *  The configure of app.js, the handle has been registered.
 */
exports.csrftoken = function(req, res, next) {

  log.debug("middleware : csrftoken");

  // 设定token的全局变量
  if (req.csrfToken) {
    res.setHeader("csrftoken", req.csrfToken());
    res.locals.csrftoken = req.csrfToken();
  }
  next();
};

/**
 * 设定客户端请求超时
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.timeout = function(req, res, next) {

  var ignoreTimeout = false;

  // 判断URL是否属于非超时范围
  _.each(conf.ignoreTimeout, function(path) {
    var regexPath = new RegExp(path, "i");
    ignoreTimeout = ignoreTimeout || !_.isNull(req.url.match(regexPath));
  });

  if (!ignoreTimeout) {
    req.connection.setTimeout(conf.timeout * 1000);
  }

  next();
};

/**
 * 生成URL变更标识用的字符串
 * 注意，URL不能使用相对路径
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.urlstamp = function(req, res, next) {

  // 注册一个stamp值
  res.locals.stamp = global.stamp;

  // 注册一个变换为动态URL的函数，可以在view里使用
  res.locals.dynamic = function(url) {

    // 添加静态资源前缀
    url = conf.static + url;

    // 添加stamp
    return (_.include(url, "?") ? url + "&stamp=" + global.stamp : url + "?stamp=" + global.stamp);
  };

  next();
};

/**
 * @desc 进行CSFR校验，如果在配置文件里定义了除外对象，则不进行校验
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
exports.csrfcheck = function(req, res, next) {

  var safety = false;
  _.each(conf.ignoreCSRF, function(path) {
    var regexPath = new RegExp(path, "i");
    safety = safety || !_.isNull(req.url.match(regexPath));
  });

  if (safety) {
    next();
  } else {
    csrf(req, res, next);
  }

};

/**
 * @desc 多客户对应，如果在配置文件里定义了多客户，通过domain获取客户信息
 * @param {Object} req 请求
 * @param {Object} res 响应
 * @param {Function} next 是否执行后续操作的回调方法
 */
//exports.loadCompany = function(req, res, next) {
//
//  var domain = conf.domain;
//  if (domain.multiTenant === "on") {
//    multiTenant.init(req, function(){
//      next();
//    });
//  } else {
//    next();
//  }
//};

/**
 * Multipart对应
 * @param req
 * @param res
 * @param next
 */
exports.multipart = function (req, res, next) {
  if (isMultipart(req)) {
    new multiparty.Form({ uploadDir: conf.tmp }).parse(req, function (err, fields, files) {

      _.each(fields, function (val, key) {
        if (_.isArray(val) && val.length === 1) {
          req.body[key] = val[0];
        } else {
          req.body[key] = val;
        }
      });

      var result = [];
      _.each(_.values(files), function (field) {
        _.each(field,function(file){
          if (!_.isEmpty(file.originalFilename) && file.size > 0) {
            result.push(file);
          }
        });
      });
      req.files = result;

      next();
    });
  } else {
    next();
  }
};

/**
 * 修改移动端Session有效时间（与Web页面取不同值时，使用）
 * @param req
 * @param res
 * @param next
 */
exports.mobileexpire = function (req, res, next) {

  if (_.isUndefined(conf.sessionTimeoutMobile) || helper.isBrowser(req)) {
    return next();
  }

  req.session.cookie.maxAge = conf.sessionTimeoutMobile * 1000 * 10;
  next();
};
