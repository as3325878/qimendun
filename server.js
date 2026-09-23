/**
 * 奇门遁甲·推演天机 —— 本地/服务器启动入口
 * 启动：node server.js（默认端口 3000，可用环境变量 PORT 覆盖）
 */
'use strict';
const app = require('./app');
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`奇门遁甲·推演天机 已启动: http://localhost:${PORT}`);
});