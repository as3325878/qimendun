/**
 * Cloudflare Workers 入口（官方 Express 适配）
 * 静态资源由 Workers Static Assets 提供（public 目录），/api/* 动态请求由 Express 处理
 */
import { httpServerHandler } from "cloudflare:node";
import express from "express";
import app from "./app.js";

app.listen(3000);

export default httpServerHandler({ port: 3000 });
