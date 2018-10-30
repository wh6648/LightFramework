/**
 * @file 异常类。
 * @author sl_say@hotmail.com
 * @module light.error
 */

"use strict";

exports.http          = require("./errors_http");
exports.db            = require("./errors_db");
exports.parameter     = require("./errors_param");
exports.system        = require("./errors_system");