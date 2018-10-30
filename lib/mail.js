/**
 * @file 邮件
 * @author r2space@gmail.com
 */

"use strict";

var nodemailer  = require("nodemailer")
  , mail        = require("config").mail
  , helper      = require("./helper")
  , transporter = nodemailer.createTransport(mail)
  ;

/**
 * 发送邮件
 * @param message
 * @param callback
 */
exports.sendMail = function(message, callback) {

  transporter.sendMail(message, function(err, info){
    if(err){
      return callback(err);
    }

    return callback(err, info);
  });
};

/**
 * 生成消息内容
 * @param from 收信人
 * @param to 发信人
 * @param subject 标题
 * @param template 内容模板（EJS格式）
 * @param values 内容值
 * @returns {{from: *, to: *, subject: *, html: String}}
 */
exports.createMessage = function(from, to, subject, template, values) {

  var content = helper.ejsParser(template, values);
  return {
      from: from
    , to: to
    , subject: subject
    , html: content
    };
};
