/**
 * @file 验证, 依赖validator模块
 * TODO:
 *  考虑到效率，添加校验出错时，停止继续处理的FLG
 *  添加rule别的allow blank的FLG
 * @author r2space@gmail.com
 */

"use strict";

var _         = require("underscore")
  , util      = require("util")
  , validator = require("validator");

/* jshint ignore:start */
var jsonpath  = require("JSONPath");
/* jshint ignore:end */

/**
 * 自定义校验方法
 * @type {{}}
 */
var custom = {};
custom.extend = function(name, fn) {
  custom[name] = function () {
    return fn.apply(custom, arguments);
  };
};

function isEmpty(val) {
  return _.isNull(val) || _.isUndefined(val) || _.isNaN(val) || _.str.isBlank(val);
}

/**
 * 检查指定的规则是否正确
 * TODO: check rule is valid
 * @param item
 * @param index
 * @returns {*}
 */
function isValidRule(item, index) {
  if (_.isUndefined(custom[item.rule[0]]) && _.isUndefined(validator[item.rule[0]])) {
    return {
      name: item.name
    , message: util.format("[%d] rule is not supported: %s.", index + 1, item.rule[0])
    };
  }
  return undefined;
}

/**
 * 扩展自定义校验方法
 */
function extendValidator() {

  // number
  exports.extend("isGt", function(val, param) {
    return val > param;
  });

  exports.extend("isGte", function(val, param) {
    return val >= param;
  });

  exports.extend("isLt", function(val, param) {
    return val < param;
  });

  exports.extend("isLte", function(val, param) {
    return val <= param;
  });

  exports.extend("isEq", function(val, param) {
    return val === param;
  });

  exports.extend("isNe", function(val, param) {
    return val !== param;
  });

  exports.extend("isIn", function(val, param) {
    return _.indexOf(param, val) >= 0;
  });

  exports.extend("isNin", function(val, param) {
    return _.indexOf(param, val) < 0;
  });

  exports.extend("isOdd", function(val) {
    return val % 2;
  });

  exports.extend("isEven", function(val) {
    return (val % 2) === 0;
  });

  // common
  exports.extend("isArray",function(val) {
    return _.isArray(val);
  });

  exports.extend("isObject",function(val) {
    return _.isObject(val);
  });

  exports.extend("isString",function(val) {
    return _.isString(val);
  });

  exports.extend("isNumber",function(val) {
    return _.isNumber(val);
  });

  exports.extend("isBoolean",function(val) {
    return _.isBoolean(val);
  });

  exports.extend("isDate",function(val) {
    return _.isDate(val);
  });

  exports.extend("isDateStr",function(val) {
    return validator.isDate(val);
  });

  exports.extend("isRequired", function(val) {
    return !isEmpty(val);
  });

  exports.extend("isEmpty", function(val) {
    return isEmpty(val);
  });

  // date
  exports.extend("isAfter",function(val, param) {
    return val - param > 0;
  });

  exports.extend("isBefore",function(val, param) {
    return val - param < 0;
  });

  exports.extend("isEqual",function(val, param) {
    return val - param === 0;
  });

  // boolean
  exports.extend("isTrue",function(val) {
    return val === true;
  });

  exports.extend("isFalse",function(val) {
    return val === false;
  });

  exports.extend("unEquals",function(val, param) {
    return !validator.equals(val,param);
  });

  // TODO: db check
  // isUniquire
  // isExist
}

/**
 * 检查是否是检查必须向
 * 为了对应指定的json中的key不存在，该方法要在其他检查之前进行
 * @param item
 * @param vals
 * @returns {*}
 */
function checkRequired(item, vals) {
  if (item.rule[0] === "isRequired" && isEmpty(vals)) {
    return {
      name: item.name
    , message: item.message
    };
  }

  return undefined;
}

/**
 * 使用validator和自定的validator执行检查
 * 自定义的检查器优先
 * @param item
 * @param val
 * @returns {*}
 */
function validate(item, val) {
  var fn = item.rule[0], params = [val].concat(item.rule.slice(1));

  // 先用自定义函数检查
  if (custom[fn]) {
    if (!custom[fn].apply(custom, params)) {
      return { name: item.name, message: item.message };
    }
    return undefined;
  }

  // 用validator函数检查
  if (!validator[fn].apply(validator, params)) {
    return { name: item.name, message: item.message };
  }

  return undefined;
}

/**
 * 设定缺省的错误消息
 * @param rules
 */
function setMessageByName(rules) {
  _.each(rules, function(item, index) {
    if (_.isUndefined(item.message) || _.str.isBlank(item.message)) {
      item.message = util.format("[%d] Does not meet the conditions: %s.", index + 1, item.rule[0]);
    }
  });
}

/**
 * 判断指定的值是否是基础类型
 * @param val
 * @returns {*}
 */
function isBasicType(val) {
  return _.isString(val) || _.isNumber(val) || _.isBoolean(val) || _.isDate(val);
}

/**
 * 校验指定的值是否正确
 * @param {Object} source 检查对象，可以指定单值
 * @param {Array} rules 检查规则
 * [{
 *   name: source中的值的路径，用jsonPath指定
 *   rule: 规则，指定为数字。第一个元素为校验方法，第二个以后的参数是校验方法需要的参数
 *   message: 错误时的消息，可选
 *   sanitizer: 类型转换器，可选
 * }]
 * @returns {Array}
 */
exports.isValid = function(source, rules) {

  var result = [];
  setMessageByName(rules);

  // 如果是单个值，则转换成json
  if (isBasicType(source)) {
    source = { target: source };
    _.each(rules, function(rule) {
      rule.name = "$.target";
    });
  }

  if (_.isArray(source)) {
    source = { target: source };
    _.each(rules, function(rule) {
      rule.name = "$.target.[*]";
    });
  }

  _.each(rules, function(item, index) {

    var vals, state = isValidRule(item, index);
    if (state) {
      result.push(state);
      return;
    }

    /* jshint ignore:start */
    vals = jsonpath.eval(source, item.name);
    /* jshint ignore:end */

    // 必须指定项目
    state = checkRequired(item, vals);
    if (state) {
      result.push(state);
      return;
    }

    _.each(vals, function(val) {

      // 按指定转换器进行转换
      if (item.sanitizer) {
        val = validator[item.sanitizer](val);
      }

      // 校验值
      state = validate(item, val);
      if (state) {
        result.push(state);
      }
    });
  });

  return result;
};

/**
 * 可以追加自定义的扩展验证方法
 * @param {String} name 校验名称
 * @param {Function} fn 校验方法
 */
exports.extend = function(name, fn) {
  custom.extend(name, fn);
};

/**
 * 获取所有支持的校验方法
 * @returns {string[]}
 */
exports.functions = function() {

  var result = ["equals", "contains", "matches"];
  _.each(validator, function(fn, prop) {
    if (_.isFunction(fn) && prop.match(/^is.*$/)) {
      result.push(prop);
    }
  });

  _.each(custom, function(fn, prop) {
    if (_.isFunction(fn) && prop.match(/^is.*$/)) {
      result.push(prop);
    }
  });

  return result;
};

/**
 * 获取单个校验方法,以便单独执行判断逻辑
 * @param {String} name 校验方法名称
 * @param {Function} fn 校验方法
 */
exports.getFunc = function (name) {

  var result;
  _.each(validator, function (fn, prop) {
    if (_.isFunction(fn) && prop == name) {
      result = fn;
    }
  });
  _.each(custom, function (fn, prop) {

    if (_.isFunction(fn) && prop == name) {
      result = fn;
    }
  });

  return result;
}

/**
 * 添加执行扩展校验方法
 */
extendValidator();
