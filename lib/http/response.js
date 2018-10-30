/**
 * @file 包装了标准的response，用于返回标准的JSON相应。
 *  - 定义异常时的JSON结构
 *  - 定义正常时的JSON结构
 *  - 判断是否有异常发生，并返回结果
 * @author r2space@gmail.com
 */

"use strict";

/**
 * 通过已有的数据生成简单的结果对象
 * @param data 数据
 * @returns {{apiVersion: string, data: *}} 结构化了的数据结果
 */
function createDataSchema(data) {
  return {
    apiVersion: "1.0"
  , data: data
  };
}

/**
 * 通过以后的数据生成错误对象
 * @param errCode 错误代码
 * @param errMessage 错误消息
 * @param errorDetail 错误详细信息
 * @returns {{apiVersion: string, error: {code: *, message: *, errors: *}}} 结构化了的错误结果
 */
function createErrorSchema(errCode, errMessage, errorDetail) {
  return {
    apiVersion: "1.0"
  , error: {
      code: errCode
    , message: errMessage
    , errors: errorDetail
    }
  };
}

/**
 * 生成标准的相应用JSON对象
 * @returns {Object} JSON对象
 */
function createFullSchema() {
  return {
    apiVersion: "1.0"
  , context: "string"
  , id: "string"
  , method: "string"
  , params: {
      id: "string"
    }
    // ---------- 响应的数据 ----------
  , data: {
      kind: "string"
    , fields: "string"
    , etag: "string"
    , id: "string"
    , lang: "string"
    , updated: "string"
    , deleted: "boolean"
      // ---------- 分页信息 ----------
    , currentItemCount: "integer"
    , itemsPerPage: "integer"
    , startIndex: "integer"
    , totalItems: "integer"
    , pageIndex: "integer"
    , totalPages: "integer"
    , pageLinkTemplate: "string"
      // ---------- 链接 ----------
    , next: {}
    , nextLink: "string"
    , previous: {}
    , previousLink: "string"
    , self: {}
    , selfLink: "string"
    , edit: {}
    , editLink: "string"
      // ---------- 表示一组数据 ----------
    , items: [{
        vals: {}
      }]
    }
    // ---------- 提供错误的详细信息 ----------
  , error: {
      code: "integer"
    , message: "string"
    , errors: [{
        domain: "string"
      , reason: "string"
      , message: "string"
      , location: "string"
      , locationType: "string"
      , extendedHelp: "string"
      , sendReport: "string"
      }]
    }
  };
}

/**
 * 设定相应信息
 * @param res
 */
function setHeaders(res) {
  res.contentType("application/json; charset=UTF-8");
}

/**
 * 发送JSON数据
 * @param res 标准相应对象
 * @param error 错误内容
 * @param data 处理结果
 * @returns {*} 无
 */
exports.send = function(res, error, data) {

  setHeaders(res);

  // 返回错误信息
  if (error) {
    var code = isNaN(error.code) ? 200 : error.code;
    return res.status(code).send(createErrorSchema(error.code, error.message));
  }

  // 返回JSON数据
  return res.send(createDataSchema(data));
};

/**
 * 发送自定义错误JSON数据
 */
exports.sendError = function(res, error) {

  setHeaders(res);

  // 返回错误信息
  return res.status(error.code).send(createErrorSchema(error.code, error.message));
};

/**
 * 发送文件
 * TODO: 添加单体测试
 * @param res 标准相应对象
 * @param error 错误内容
 * @param data 处理结果
 * @returns {*} 无
 */
exports.sendFile = function(res, error, data) {

  // 返回错误信息
  if (error) {
    return res.send(error.code, createErrorSchema(error.code, error.message));
  }

  // 返回JSON数据
  res.header("Cache-Control", "public, max-age=0");
  res.header("Content-Length", data.fileInfo.length);
  res.header("Last-Modified", data.fileInfo.updateAt);
  return res.send(data.fileData);
};

/**
 * 生成标准的结果对象
 * @returns {*}
 */
exports.getJsonFormat = function() {
  return createFullSchema();
};
