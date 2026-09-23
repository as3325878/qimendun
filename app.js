/**
 * 奇门遁甲·推演天机 —— Express 应用（app 构建，供本地 server.js 与 Vercel 共用）
 * 接口与线上站保持一致：
 *   GET  /api/stats            首页数据
 *   POST /api/user/init        设备指纹初始化用户
 *   GET  /api/user/profile     个人中心
 *   GET  /api/user/status      会员状态
 *   POST /api/qimen            起局（当前时间）+ 完整报告
 *   POST /api/pay/verify       卡密验证/开通会员
 *   POST /api/card/pool-claim  付费领取卡密
 *   POST /api/message          用户留言
 *   GET  /api/qrcode           二维码生成
 * 数据：
 *   - 本地/服务器（默认）：文件持久化 data/db.json、data/cards.json
 *   - Vercel（process.env.VERCEL）：serverless 无持久磁盘，用进程内存（测试期使用）
 */
'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const qrcode = require('qrcode');
const { paiPan } = require('./lib/qimen');
const { buildReport } = require('./lib/report');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const CARDS_FILE = path.join(DATA_DIR, 'cards.json');
let USE_MEMORY = !!(process.env.VERCEL || process.env.NETLIFY);
/* 自动探测：文件系统可写则用文件模式，只读（如 Netlify Functions）则内存模式 */
if (!USE_MEMORY) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); }
  catch (e) { USE_MEMORY = true; }
}

/* 内置卡密：随部署打包，供 Netlify/Serverless 内存模式下使用（本地文件模式不使用） */
let BUILTIN_CARDS = null;
try {
  const _raw = require('./data/cards.json');
  if (_raw && Array.isArray(_raw.cards) && _raw.cards.length) {
    BUILTIN_CARDS = { cards: _raw.cards.filter(function (c) { return c.status === 'active'; }) };
  }
} catch (e) { BUILTIN_CARDS = null; }

/* ---------- 数据层（文件 / 内存双模式） ---------- */
let MEM_DB = null;
let MEM_CARDS = null;
function baseDb() {
  return { users: [], messages: [], stats: { totalQimen: 87, displayPerson: 1038, displayEvent: 2120, totalUsers: 31 }, cardSeq: 1000 };
}
function ensureData() {
  if (USE_MEMORY) {
    if (!MEM_DB) { MEM_DB = baseDb(); MEM_CARDS = BUILTIN_CARDS && BUILTIN_CARDS.cards.length ? BUILTIN_CARDS : { cards: [] }; }
    return;
  }
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify(baseDb(), null, 2), 'utf8');
  if (!fs.existsSync(CARDS_FILE)) fs.writeFileSync(CARDS_FILE, JSON.stringify({ cards: [] }, null, 2), 'utf8');
}
function readDb() {
  if (USE_MEMORY) return MEM_DB;
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDb(db) {
  if (USE_MEMORY) { MEM_DB = db; return; }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}
function readCards() {
  if (USE_MEMORY) return MEM_CARDS;
  return JSON.parse(fs.readFileSync(CARDS_FILE, 'utf8'));
}
function writeCards(c) {
  if (USE_MEMORY) { MEM_CARDS = c; return; }
  fs.writeFileSync(CARDS_FILE, JSON.stringify(c, null, 2), 'utf8');
}

/* 工具 */
function nowStr() { const d = new Date(); return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`; }
function randCode(len) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}
function makeCardKey(seq) { return `QM${nowStr()}${String(seq).padStart(6, '0')}${randCode(4)}`; }
function findUser(db, deviceId) { return db.users.find(u => u.deviceId === deviceId); }
function getUser(db, userId) { return db.users.find(u => u.userId === Number(userId) || u.userId === userId); }

/* 初始化用户（与线上一致：userCode=JT+日期+序号，inviteCode=QM+6位） */
function initUser(db, deviceId, ref) {
  let user = findUser(db, deviceId);
  if (!user) {
    db.cardSeq += 1;
    user = {
      userId: db.cardSeq,
      userCode: 'JT' + nowStr() + String(db.cardSeq).padStart(4, '0'),
      deviceId,
      ref: ref || '',
      vipExpire: 0,
      isVip: false,
      inviteCode: 'QM' + randCode(6),
      balance: 0,
      createdAt: Date.now()
    };
    db.users.push(user);
    db.stats.totalUsers = db.users.length;
    writeDb(db);
  }
  return user;
}

function vipStatus(user) {
  const isVip = user.vipExpire > Date.now();
  return { isVip, vipExpire: user.vipExpire };
}

/* ---------- 应用 ---------- */
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* 首页数据 */
app.get('/api/stats', (req, res) => {
  const db = readDb();
  res.json({ code: 200, data: db.stats });
});

/* 用户初始化 */
app.post('/api/user/init', (req, res) => {
  const db = readDb();
  const deviceId = String(req.body.deviceId || '').trim();
  if (!deviceId) return res.json({ code: 400, msg: '缺少设备标识' });
  const user = initUser(db, deviceId, req.body.ref || '');
  res.json({
    code: 200,
    data: {
      userId: user.userId,
      userCode: user.userCode,
      deviceId: user.deviceId,
      vipExpire: user.vipExpire,
      isVip: vipStatus(user).isVip,
      inviteCode: user.inviteCode,
      balance: user.balance
    }
  });
});

/* 个人中心 */
app.get('/api/user/profile', (req, res) => {
  const db = readDb();
  const user = getUser(db, req.query.userId);
  if (!user) return res.json({ code: 404, msg: '用户不存在' });
  res.json({
    code: 200,
    data: {
      userId: user.userId,
      userCode: user.userCode,
      inviteCode: user.inviteCode,
      vipExpire: user.vipExpire,
      isVip: vipStatus(user).isVip,
      balance: user.balance,
      ref: user.ref || ''
    }
  });
});

/* 会员状态 */
app.get('/api/user/status', (req, res) => {
  const db = readDb();
  const user = getUser(db, req.query.userId);
  if (!user) return res.json({ code: 404, msg: '用户不存在' });
  res.json({ code: 200, data: vipStatus(user) });
});

/* 起局（固定用服务器当前时间，与线上行为一致） */
app.post('/api/qimen', (req, res) => {
  const db = readDb();
  const question = String(req.body.question || '').trim();
  const birthYear = req.body.birthYear ? Number(req.body.birthYear) : undefined;
  if (!question || question.length < 2) return res.json({ code: 400, msg: '问题太短' });

  const now = new Date();
  const y = now.getFullYear(), mo = now.getMonth() + 1, d = now.getDate(), h = now.getHours(), mi = now.getMinutes();

  const pan = paiPan(y, mo, d, h, mi, birthYear);
  const report = buildReport(pan, question);

  // 计数
  db.stats.totalQimen = (db.stats.totalQimen || 0) + 1;
  writeDb(db);

  res.json({
    code: 200,
    msg: 'success',
    data: {
      year: y, month: mo, day: d, hour: h, minute: mi,
      question,
      lunarDate: pan.cal.lunarText,
      bazi: pan.cal.bazi,
      report,
      panInfo: pan.panInfo,
      panData: pan.panData
    }
  });
});

/* 卡密验证 / 开通会员 */
app.post('/api/pay/verify', (req, res) => {
  const db = readDb();
  const cards = readCards();
  const cardKey = String(req.body.cardKey || '').trim();
  const user = getUser(db, req.body.userId);
  if (!user) return res.json({ code: 404, msg: '用户不存在' });
  const card = cards.cards.find(c => c.key === cardKey);
  if (!card) return res.json({ code: 400, msg: '卡密无效' });
  if (card.status === 'used') return res.json({ code: 400, msg: '该卡密已被使用' });

  const base = Math.max(Date.now(), user.vipExpire || 0);
  user.vipExpire = base + card.days * 24 * 60 * 60 * 1000;
  user.isVip = true;
  card.status = 'used';
  card.usedBy = user.userId;
  card.usedAt = Date.now();
  writeDb(db);
  writeCards(cards);

  res.json({ code: 200, data: { message: `开通成功，会员已延长 ${card.days} 天` } });
});

/* 付费领取卡密（体验卡：1天，防滥用限制） */
app.post('/api/card/pool-claim', (req, res) => {
  const db = readDb();
  const cards = readCards();
  const user = getUser(db, req.body.userId);
  if (!user) return res.json({ code: 404, msg: '用户不存在' });
  const claimed = cards.cards.find(c => c.owner === user.userId && c.status === 'active' && c.from === 'claim');
  if (claimed) return res.json({ code: 400, msg: '您已领取过体验卡，请直接使用卡密' });

  db.cardSeq += 1;
  const key = makeCardKey(db.cardSeq);
  cards.cards.push({ key, days: 1, status: 'active', owner: user.userId, from: 'claim', createdAt: Date.now() });
  writeDb(db);
  writeCards(cards);
  res.json({ code: 200, data: { cardKey: key } });
});

/* 留言 */
app.post('/api/message', (req, res) => {
  const db = readDb();
  const { userId, contact, content } = req.body || {};
  if (!content || !String(content).trim()) return res.json({ code: 400, msg: '内容不能为空' });
  db.messages.push({ id: Date.now() + Math.floor(Math.random() * 1000), userId: userId || 0, contact: contact || '', content: String(content).trim(), createdAt: Date.now() });
  writeDb(db);
  res.json({ code: 200, msg: 'success' });
});

/* 二维码 */
app.get('/api/qrcode', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const text = String(req.query.text || 'https://qimendun.netlify.app/');
  qrcode.toBuffer(text, { width: 300, margin: 1, errorCorrectionLevel: 'M' })
    .then(buf => { res.set('Content-Type', 'image/png'); res.send(buf); })
    .catch(() => res.status(500).json({ code: 500, msg: '二维码生成失败' }));
});

/* 兜底：前端路由 */
app.get(/^\/(index|qimen|profile|poster)(\.html)?$/, (req, res) => res.sendFile(path.join(__dirname, 'public', req.params[0] + '.html')));
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

ensureData();
module.exports = app;
