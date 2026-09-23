/**
 * Netlify Functions 入口：用 serverless-http 包装 Express 应用
 * 配合 netlify.toml 使用（所有 /api/* 及兜底路由走本函数）
 * Blobs 持久化：先 connectLambda(event) 注入配置，再 initBlobs()
 */
'use strict';
const serverless = require('serverless-http');
const { connectLambda } = require('@netlify/blobs');
const app = require('../../app');

const base = serverless(app, { binary: ['image/*', 'application/octet-stream'] });

exports.handler = function (event, context, callback) {
  try {
    if (event && event.blobs) {
      connectLambda(event);
    }
    if (typeof app.initBlobs === 'function') {
      app.initBlobs();
    }
  } catch (e) {
    // blobs 不可用则降级内存模式，不影响业务
  }
  return base(event, context, callback);
};
