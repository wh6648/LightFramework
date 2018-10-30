/**
 * @file controller的共通类
 * @author r2space@gmail.com
 */

"use strict";

var sync      = require("async")
  , mongo     = require("mongoose")
  , _         = require("underscore")
  , Schema    = mongo.Schema
  , errors    = require("../error")
  , constant  = require("../constant")
  , model     = require("./model");

/**
 * 获取单例schema对象（mongoose要求schema只能被定义一次）
 * @type {{}}
 */
var schemas = {};
function schema(name, define) {
  if (schemas[name]) {
    return schemas[name];
  }

  schemas[name] = new Schema(define);
  return schemas[name];
};

function fields(define) {
  var result = _.keys(define);

  // remove common field
  delete result.valid;
  delete result.createAt;
  delete result.createBy;
  delete result.updateAt;
  delete result.updateBy;

  return result;
}

/**
 * 构造函数
 * @type {Controller}
 */
var Controller = module.exports = function Controller(handler, name, define) {

  this.schema   = schema(name, define);
  this.model    = new model(handler.code, name, this.schema);
  this.fields   = fields(define);
  this.handler  = handler;
  this.uid      = handler.uid;
  this.params   = handler.params;
  this.id       = handler.params.id;
};

Controller.prototype.add = function(callback) {

  var obj = _.pick(this.params.data || this.params, this.fields);
  obj.createAt = new Date();
  obj.updateAt = obj.createAt;
  if (this.uid) {
    obj.createBy = this.uid;
    obj.updateBy = this.uid
  }
  obj.valid = constant.VALID;

  this.model.add(obj, function(err, result) {
    if (err) {
      return callback(new errors.db.Add());
    }
    return callback(err, result);
  });
};

Controller.prototype.remove = function(callback) {
  this.model.remove(this.id, { updateAt: new Date(), updateBy: this.handler.uid }, function(err, result) {
    if (err) {
      return callback(new errors.db.Remove());
    }
    return callback(err, result);
  });
};

Controller.prototype.removeBy = function(callback) {
  this.model.removeBy(this.params.condition, { updateAt: new Date(), updateBy: this.handler.uid }, function(err, result) {
    if (err) {
      return callback(new errors.db.Remove());
    }
    return callback(err, result);
  });
};

Controller.prototype.update = function(callback) {

  var obj = _.pick(this.params.data || this.params, this.fields);
  obj.updateAt = new Date();
  if (this.uid) {
    obj.updateBy = this.uid
  }
  obj.valid = constant.VALID;

  this.model.update(this.id, obj, function(err, result) {
    if (err) {
      return callback(new errors.db.Update());
    }
    if (result) {
      return callback(err, result);
    } else {
      return callback(new errors.db.NotExist());
    }
  });
};

Controller.prototype.updateBy = function(callback) {

  var obj = _.pick(this.params.data || this.params, this.fields);
  obj.updateAt = new Date();
  if (this.uid) {
    obj.updateBy = this.uid
  }
  obj.valid = constant.VALID;

  this.model.updateBy(this.params.condition, obj, function(err, result) {
    if (err) {
      return callback(new errors.db.Update());
    }
    if (result) {
      return callback(err, result);
    } else {
      return callback(new errors.db.NotExist());
    }
  });
};

Controller.prototype.get = function(callback) {
  this.model.get(this.id, function (err, result) {
    if (err) {
      return callback(new errors.db.Find());
    }
    return callback(err, result);
  });
};

Controller.prototype.getOne = function(callback) {
  this.model.getOne(this.params.condition, function (err, result) {
    if (err) {
      return callback(new errors.db.Find());
    }
    return callback(err, result);
  });
};

Controller.prototype.getList = function(callback) {
  var self      = this
    //兼容早期版本代码中分页使用的skip
    , start     = this.params.start || this.params.skip
    , limit     = this.params.limit
    , condition = this.params.condition
    , order     = this.params.order
    , select    = this.params.select;

  self.model.total(condition, function (err, count) {
    if (err) {
      callback(new errors.db.Find());
      return;
    }

    self.model.getList(condition, start, limit, order, select, function (err, result) {
      if (err) {
        callback(new errors.db.Find());
      } else {
        callback(err, { totalItems: count, items: result });
      }
    });
  });
};

Controller.prototype.distinct = function(callback) {
  this.model.distinct(this.params.field, this.params.condition, function (err, result) {
    if (err) {
      return callback(new errors.db.Find());
    }
    return callback(err, result);
  });
};

Controller.prototype.total = function(callback) {
  this.model.total(this.params.condition, function (err, result) {
    if (err) {
      return callback(new errors.db.Find());
    }
    return callback(err, result);
  });
};

Controller.prototype.waterfall = function(functions, final) {
  sync.waterfall(functions, final);
};

Controller.prototype.schema = function() {
  return this.model.schema();
};

Controller.prototype.increment = function(callback) {

  this.model.increment(this.params.condition, this.params.select, function (err, result) {
    if (err) {
      return callback(new errors.db.Update());
    }
    return callback(err, result);
  });
};

Controller.prototype.search = function(callback) {
  var self      = this
    , condition = this.params.condition
    , search    = this.params.search
    , keyword   = this.params.keyword;

  if (keyword && search) {
    condition.$or = [];
    _.each(search.split(","), function(s){
      var searchCondition = {};
      searchCondition[s] = new RegExp(keyword.toLowerCase(), "i");
      condition.$or.push(searchCondition);
    });
  }

  self.getList(callback);
};