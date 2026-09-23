/**
 * 干支历法模块（重建版）：四柱、农历、节气、奇门定局
 * 历法数据来自 lunar-javascript（与线上样本 2026-09-23 11:16 对拍通过：
 *   农历=二〇二六年八月十三，八字=丙午 丁酉 庚子 壬午，秋分=2026-09-23 08:05）
 */
'use strict';

const { Solar, Lunar } = require('lunar-javascript');

const GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/* ---------- 公历转儒略日 / 日干支 ---------- */
function jdnFromYMD(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2 + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}
// 日干支序号（0=甲子）；2000-01-01 = 戊午（54）
function dayGanzhiIndex(y, m, d) {
  const jdn = jdnFromYMD(y, m, d);
  return ((jdn + 49) % 60 + 60) % 60;
}
function gzOf(index) { return GAN[index % 10] + ZHI[index % 12]; }
function gzIndex(gz) {
  const g = GAN.indexOf(gz[0]), z = ZHI.indexOf(gz[1]);
  for (let i = 0; i < 60; i++) { if (i % 10 === g && i % 12 === z) return i; }
  return -1;
}

/* 节气英文 key → 中文 */
const JQ_EN2CN = {
  'DA_XUE': '大雪', 'DONG_ZHI': '冬至', 'XIAO_HAN': '小寒', 'DA_HAN': '大寒',
  'LI_CHUN': '立春', 'YU_SHUI': '雨水', 'JING_ZHE': '惊蛰', 'CHUN_FEN': '春分',
  'QING_MING': '清明', 'GU_YU': '谷雨', 'LI_XIA': '立夏', 'XIAO_MAN': '小满',
  'MANG_ZHONG': '芒种', 'XIA_ZHI': '夏至', 'XIAO_SHU': '小暑', 'DA_SHU': '大暑',
  'LI_QIU': '立秋', 'CHU_SHU': '处暑', 'BAI_LU': '白露', 'QIU_FEN': '秋分',
  'HAN_LU': '寒露', 'SHUANG_JIANG': '霜降', 'LI_DONG': '立冬', 'XIAO_XUE': '小雪'
};

/**
 * 获取某时刻的历法信息
 * @returns {{lunarText:string, bazi:{year,month,day,hour}, jieQi:string, dayGzIdx:number, now:Date}}
 */
function getCalendar(y, m, d, h, min) {
  const solar = Solar.fromYmdHms(y, m, d, h, min, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  // 最近一个已过的节气（含时刻，北京时间）
  const jq = lunar.getJieQiTable();
  const nowMs = new Date(y, m - 1, d, h, min, 0).getTime();
  let cur = null;
  for (const k of Object.keys(jq)) {
    const t = jq[k];
    const ts = new Date(t.getYear(), t.getMonth() - 1, t.getDay(), t.getHour(), t.getMinute(), t.getSecond()).getTime();
    const name = JQ_EN2CN[k] || k;
    if (ts <= nowMs && (!cur || ts > cur.time)) cur = { name, time: ts };
  }
  return {
    lunarText: lunar.toString(),
    bazi: { year: ec.getYear(), month: ec.getMonth(), day: ec.getDay(), hour: ec.getTime() },
    jieQi: cur ? cur.name : '',
    dayGzIdx: dayGanzhiIndex(y, m, d),
    now: new Date(y, m - 1, d, h, min, 0)
  };
}

/* ---------- 定局：节气 + 符头 → 阴阳遁 + 局数 ---------- */
const DUN_TABLE = {
  '冬至': { dun: '阳', ju: [1, 7, 4] }, '小寒': { dun: '阳', ju: [2, 8, 5] }, '大寒': { dun: '阳', ju: [3, 9, 6] },
  '立春': { dun: '阳', ju: [8, 5, 2] }, '雨水': { dun: '阳', ju: [9, 6, 3] }, '惊蛰': { dun: '阳', ju: [1, 7, 4] },
  '春分': { dun: '阳', ju: [3, 9, 6] }, '清明': { dun: '阳', ju: [4, 1, 7] }, '谷雨': { dun: '阳', ju: [5, 2, 8] },
  '立夏': { dun: '阳', ju: [4, 1, 7] }, '小满': { dun: '阳', ju: [5, 2, 8] }, '芒种': { dun: '阳', ju: [6, 3, 9] },
  '夏至': { dun: '阴', ju: [9, 3, 6] }, '小暑': { dun: '阴', ju: [8, 2, 5] }, '大暑': { dun: '阴', ju: [7, 1, 4] },
  '立秋': { dun: '阴', ju: [2, 5, 8] }, '处暑': { dun: '阴', ju: [1, 4, 7] }, '白露': { dun: '阴', ju: [9, 3, 6] },
  '秋分': { dun: '阴', ju: [7, 1, 4] }, '寒露': { dun: '阴', ju: [6, 9, 3] }, '霜降': { dun: '阴', ju: [5, 8, 2] },
  '立冬': { dun: '阴', ju: [6, 9, 3] }, '小雪': { dun: '阴', ju: [5, 8, 2] }, '大雪': { dun: '阴', ju: [4, 7, 1] }
};

/**
 * 定局：返回 { jieQi, dun, ju, yuan }
 * @param {string} jieQiName 当前节气名
 * @param {number} dayGzIdx 日柱序号（0=甲子）
 */
function dingJu(jieQiName, dayGzIdx) {
  const t = DUN_TABLE[jieQiName];
  if (!t) return { jieQi: jieQiName, dun: '阴', ju: 1, yuan: 0 };
  // 符头：当前日所在旬的甲日
  const xunShouIdx = dayGzIdx - (dayGzIdx % 10);
  const fuTouZhi = ZHI[xunShouIdx % 12];
  let yuan = 0; // 0上 1中 2下
  if (['子', '午', '卯', '酉'].includes(fuTouZhi)) yuan = 0;
  else if (['寅', '申', '巳', '亥'].includes(fuTouZhi)) yuan = 1;
  else yuan = 2;
  return { jieQi: jieQiName, dun: t.dun, ju: t.ju[yuan], yuan };
}

/* 旬空（甲子旬空戌亥…）：旬首支后第10、11支 */
function xunKong(gzStr) {
  const idx = gzIndex(gzStr);
  const xunShouIdx = idx - (idx % 10);
  const z = xunShouIdx % 12;
  return [ZHI[(z + 10) % 12], ZHI[(z + 11) % 12]];
}

/* 驿马（按日支）：申子辰马在寅，寅午戌马在申，巳酉丑马在亥，亥卯未马在巳 */
function yiMa(dayZhi) {
  const map = { 申: '寅', 子: '寅', 辰: '寅', 寅: '申', 午: '申', 戌: '申', 巳: '亥', 酉: '亥', 丑: '亥', 亥: '巳', 卯: '巳', 未: '巳' };
  return map[dayZhi] || '';
}

module.exports = { GAN, ZHI, jdnFromYMD, dayGanzhiIndex, gzOf, gzIndex, getCalendar, dingJu, DUN_TABLE, xunKong, yiMa };
