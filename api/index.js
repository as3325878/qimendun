/**
 * Vercel serverless 入口：导出 Express app
 * 配合 vercel.json 使用（所有请求路由到本函数）
 */
'use strict';
module.exports = require('../app');
