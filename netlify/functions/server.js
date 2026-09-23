/**
 * Netlify Functions 入口：用 serverless-http 包装 Express 应用
 * 配合 netlify.toml 使用（所有 /api/* 及兜底路由走本函数）
 */
'use strict';
const serverless = require('serverless-http');
const app = require('../../app');

exports.handler = serverless(app, { binary: ['image/*', 'application/octet-stream'] });
