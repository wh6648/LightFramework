/**
 * @file cron命令
 * @author r2space@gmail.com
 */

"use strict";

var exec  = require("child_process").exec;

/**
 * 设定Cron，使用salt.modules.cron
 *  salt.modules.cron.set_job(
 *    user,
 *    minute,
 *    hour,
 *    daymonth,
 *    month,
 *    dayweek,
 *    cmd,
 *    comment=None,
 *    identifier=None
 *  )
 * @param host
 * @param job
 */
exports.setJob = function(host, time, job) {

  var command = util.format("salt -L '%s' cron.set_job 'root' %s %s comment=add", host, time, job);

  exec(command, function (error, stdout) {
    callback(error, stdout);
  });
};

/**
 * 删除
 * @param host
 * @param time
 * @param job
 */
exports.removeJob = function(host, time, job) {

  var command = util.format("salt -L '%s' cron.rm_job 'root' %s", host, job);

  exec(command, function (error, stdout) {
    callback(error, stdout);
  });
};
