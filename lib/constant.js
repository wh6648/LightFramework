/**
 * @file 常量定义类
 * @author r2space@gmail.com
 */

"use strict";

exports.VALID = 1;
exports.INVALID = 0;

/** LOG的输出级别 */
exports.LOG_LEVEL_DEBUG       = "debug";
exports.LOG_LEVEL_INFO        = "info";
exports.LOG_LEVEL_WARN        = "warn";
exports.LOG_LEVEL_ERROR       = "error";

/** LOG的种类 */
exports.LOG_TYPE_APPLICATION  = "application";
exports.LOG_TYPE_AUDIT        = "audit";
exports.LOG_TYPE_OPERATION    = "operation";

exports.PATH_ROUTE            = "/routes/";
exports.PATH_CONTROLLER       = "/controllers/";
exports.PATH_MODULES          = "/modules/";
exports.FILE_CONF_ROUTE       = "/config/routes.json";
exports.FILE_CONF_ROUTE_YAML  = "/config/routes.yaml";

// number of connections in the connection pool, set to 5 as default.
exports.MOD_DB_SERVER_OPTIONS = { poolSize: 2 };

exports.MOD_DB_OPTIONS        = { w: 1 };

exports.SYSTEM_DB             = "LightDB";
