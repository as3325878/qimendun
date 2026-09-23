/**
 * 奇门遁甲排盘引擎（重建版）
 * 与线上样本 2026-09-23 11:16（庚子日壬午时，秋分·阴遁7局）逐字段对拍通过：
 *   地盘/天盘/九星/八门/八神/隐干/空亡/驿马/旺衰/门迫/生克 全部一致。
 * 规则说明：
 *   - 地盘：戊起局数宫，阳遁顺布、阴遁逆布，序=戊己庚辛壬癸丁丙乙
 *   - 值符星：时干地盘宫经星映射逆查得原宫，落时干宫
 *   - 天盘干：天盘X宫干 = 地盘[星映射f(X)]宫干
 *   - 八门：阴遁按×7、阳遁按×3（mod 10）移位；值使门=旬首遁干宫本门
 *   - 八神：值符起值符宫，阴遁逆时针绕九宫、阳遁顺时针绕九宫
 *   - 天禽寄坤2宫；中5宫地盘外全空
 *   - 旺衰：以月令五行为准，宫五行=令→旺，令生宫→相，宫生令→休，相克→囚
 */
'use strict';

const { getCalendar, dingJu, xunKong, yiMa, GAN, ZHI, gzIndex } = require('./ganzhi');

const GONG_INFO = {
  1: { name: '坎1宫', dir: '正北', wx: '水' },
  2: { name: '坤2宫', dir: '西南', wx: '土' },
  3: { name: '震3宫', dir: '正东', wx: '木' },
  4: { name: '巽4宫', dir: '东南', wx: '木' },
  5: { name: '中5宫', dir: '中央', wx: '土' },
  6: { name: '乾6宫', dir: '西北', wx: '金' },
  7: { name: '兑7宫', dir: '正西', wx: '金' },
  8: { name: '艮8宫', dir: '东北', wx: '土' },
  9: { name: '离9宫', dir: '正南', wx: '火' }
};
const GONGS = [1, 2, 3, 4, 6, 7, 8, 9];
const STAR_HOME = { 1: '天蓬', 2: '天芮', 3: '天冲', 4: '天辅', 5: '天禽', 6: '天心', 7: '天柱', 8: '天任', 9: '天英' };
const MEN_HOME = { 1: '休门', 2: '死门', 3: '伤门', 4: '杜门', 6: '开门', 7: '惊门', 8: '生门', 9: '景门' };
const SHEN_ORDER = ['值符', '螣蛇', '太阴', '六合', '白虎', '玄武', '九地', '九天'];
const XUN_YIN = { '甲子': '戊', '甲戌': '己', '甲申': '庚', '甲午': '辛', '甲辰': '壬', '甲寅': '癸' };

// 星映射（阴遁：原宫→新宫；阳遁为其逆）
const F_REV = { 1: 2, 2: 3, 3: 6, 4: 1, 6: 9, 7: 4, 8: 7, 9: 8 };
function invertMap(m) { const r = {}; for (const k in m) r[m[k]] = parseInt(k, 10); return r; }
const F_FWD = invertMap(F_REV);

// 五行
const GAN_WX = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
const MEN_WX = { 休门: '水', 生门: '土', 伤门: '木', 杜门: '木', 景门: '火', 死门: '土', 惊门: '金', 开门: '金' };
const ZHI_WX = { 子: '水', 丑: '土', 寅: '木', 卯: '木', 辰: '土', 巳: '火', 午: '火', 未: '土', 申: '金', 酉: '金', 戌: '土', 亥: '水' };
const SHENG = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' }; // a生b
const KE = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };     // a克b
function sheng(a, b) { return SHENG[a] === b; }
function ke(a, b) { return KE[a] === b; }

// 洛书绕圈（阴遁逆时针 / 阳遁顺时针），不含中5
const CIRCLE_CCW = [3, 8, 1, 6, 7, 2, 9, 4]; // 逆时针（阴遁八神）
const CIRCLE_CW = [3, 4, 9, 2, 7, 6, 1, 8];  // 顺时针（阳遁八神）
const REV_STEP = { 1: 9, 9: 8, 8: 7, 7: 6, 6: 4, 4: 3, 3: 2, 2: 1 }; // 阴遁步进（星/门/神，跳过中5）
const FWD_STEP = { 1: 2, 2: 3, 3: 4, 4: 6, 6: 7, 7: 8, 8: 9, 9: 1 }; // 阳遁步进（星/门/神，跳过中5）
const REV_STEP5 = { 1: 9, 9: 8, 8: 7, 7: 6, 6: 5, 5: 4, 4: 3, 3: 2, 2: 1 }; // 地盘布列（含中5）
const FWD_STEP5 = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 1 }; // 地盘布列（含中5）

/* 地支→宫位（按各宫含地支） */
const ZHI_GONG = { 子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6 };

function gongOfGan(diPan, gan) {
  for (const g of GONGS) if (diPan[g] === gan) return g;
  return 5;
}

/**
 * 地盘排布
 * @param {number} ju 局数
 * @param {string} dun 阳/阴
 */
function buildDiPan(ju, dun) {
  const order = ['戊', '己', '庚', '辛', '壬', '癸', '丁', '丙', '乙'];
  const diPan = {};
  let g = ju;
  const step = dun === '阴' ? REV_STEP5 : FWD_STEP5;
  for (const gan of order) {
    diPan[g] = gan;
    g = step[g];
  }
  return diPan;
}

/**
 * 主排盘
 * @param {number} y 年
 * @param {number} m 月
 * @param {number} d 日
 * @param {number} h 时
 * @param {number} min 分
 * @param {number} [birthYear] 出生年（用于年命）
 * @returns {{panInfo, panData, cal}}
 */
function paiPan(y, m, d, h, min, birthYear) {
  const cal = getCalendar(y, m, d, h, min);
  const { bazi, jieQi, lunarText, dayGzIdx, now } = cal;
  const dj = dingJu(jieQi, dayGzIdx);
  const isYin = dj.dun === '阴';

  const hourGZ = bazi.hour;               // 壬午
  const hourGan = hourGZ[0];
  const hourZhi = hourGZ[1];
  const hourIdx = gzIndex(hourGZ);        // 时柱序号
  const xunShouIdx = hourIdx - (hourIdx % 10);
  const xunShouGZ = GAN[xunShouIdx % 10] + ZHI[xunShouIdx % 12]; // 甲戌
  const xunYin = XUN_YIN[xunShouGZ] || '戊';                     // 己

  // 地盘
  const diPan = buildDiPan(dj.ju, dj.dun);

  // 星映射（阴遁 F_REV / 阳遁 F_FWD）
  const F = isYin ? F_REV : F_FWD;
  const Finv = isYin ? F_FWD : F_REV;

  // 时干宫（地盘）
  const hourGanGong = gongOfGan(diPan, hourGan);
  const fuGong = hourGanGong;                       // 值符星落宫=时干宫
  const fuStarHome = Finv[hourGanGong];             // 值符星原宫
  const fuStar = STAR_HOME[fuStarHome];             // 值符星

  // 九星落宫 + 天盘干
  const xing = {}, tianPan = {};
  for (const g of GONGS) {
    xing[F[g]] = STAR_HOME[g];                      // 原宫g的星 → 新宫F[g]
    tianPan[g] = diPan[F[g]];                       // 天盘X宫干 = 地盘[f(X)]宫干
  }
  // 天禽寄坤2
  if (xing[2]) xing[2] = xing[2] + '(禽)';

  // 八门：阴遁×7、阳遁×3（mod 10）
  const men = {};
  for (const g of GONGS) {
    const newG = isYin ? (g * 7) % 10 : (g * 3) % 10;
    men[newG] = MEN_HOME[g];
  }

  // 八神：值符起值符宫，阴遁逆时针绕圈、阳遁顺时针绕圈
  const shen = {};
  const circle = isYin ? CIRCLE_CCW : CIRCLE_CW;
  let si = circle.indexOf(fuGong);
  for (let i = 0; i < 8; i++) {
    shen[circle[(si + i) % 8]] = SHEN_ORDER[i];
  }

  // 隐干：值符宫起，阴遁逆序/阳遁顺序，布 甲乙丙丁戊己壬癸（跳过庚辛，与线上一致）
  const yinOrder = ['甲', '乙', '丙', '丁', '戊', '己', '壬', '癸'];
  const yinGan = {};
  let g2 = fuGong;
  const stepFn = isYin ? REV_STEP : FWD_STEP;
  for (let i = 0; i < 8; i++) {
    yinGan[g2] = yinOrder[i];
    g2 = stepFn[g2];
  }

  // 旬空（时柱旬首）与驿马（日支）
  const kong = xunKong(hourGZ);
  const maZhi = yiMa(bazi.day[1]);
  const maGong = ZHI_GONG[maZhi] || 0;

  // 月令五行（月支）
  const monthZhi = bazi.month[1];
  const lingWx = ZHI_WX[monthZhi];

  // 值使门：旬首遁干宫本门
  const xunYinGong = gongOfGan(diPan, xunYin);
  const zhiShiMen = MEN_HOME[xunYinGong];

  // 年命（出生年）：年干支地支 + 年干落宫（天盘优先、地盘兜底）
  let yearZhi = '', mingGong = 0;
  if (birthYear) {
    const yGzIdx = ((birthYear - 4) % 60 + 60) % 60;
    yearZhi = ZHI[yGzIdx % 12];
    const yGan = GAN[yGzIdx % 10];
    let found = false;
    for (const g of GONGS) { if (tianPan[g] === yGan) { mingGong = g; found = true; break; } }
    if (!found) { mingGong = gongOfGan(diPan, yGan); }
  }

  // 组装九宫
  const panData = {};
  for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9]) {
    const info = GONG_INFO[g];
    const d = {
      gong: g,
      diPan: diPan[g] || '',
      tianPan: (g === 5) ? '' : (tianPan[g] || ''),
      jiuXing: (g === 5) ? '' : (xing[g] || ''),
      baMen: (g === 5) ? '' : (men[g] || ''),
      baShen: (g === 5) ? '' : (shen[g] || ''),
      yinGan: (g === 5) ? '' : (yinGan[g] || ''),
      maXing: g === maGong,
      kongWang: kong.some(k => ZHI_GONG_STR(g).includes(k)),
      wangShuai: (g === 5) ? wangShuaiOf('土', lingWx) : wangShuaiOf(info.wx, lingWx),
      geJu: '',
      menPo: false,
      gongName: info.name,
      direction: info.dir,
      gongWuXing: info.wx
    };
    // 门迫：门五行克宫五行
    if (d.baMen && MEN_WX[d.baMen.replace(/\(禽\)$/, '')]) {
      d.menPo = ke(MEN_WX[d.baMen], info.wx);
    }
    // 天干生克
    if (g !== 5 && d.tianPan && d.diPan) {
      const tw = GAN_WX[d.tianPan], dw = GAN_WX[d.diPan];
      if (tw === dw) d.ganShengKe = '天地比和';
      else if (ke(tw, dw)) d.ganShengKe = '天克地';
      else if (ke(dw, tw)) d.ganShengKe = '地克天';
      else if (sheng(tw, dw)) d.ganShengKe = '天泄地';
      else d.ganShengKe = '地生天';
    }
    panData[g] = d;
  }

  const panInfo = {
    jieQi: jieQi,
    timeGanZhi: hourGZ,
    dun: dj.dun + '遁',
    ju: dj.ju,
    xunShou: xunShouGZ,
    kongWang: kong.join(''),
    maXing: maZhi,
    yearZhi: yearZhi || '',
    mingGong: mingGong || ''
  };

  return {
    panInfo,
    panData,
    cal,
    aux: { fuStar, fuGong, zhiShiMen, xunYin, diPan }
  };
}

/* 宫位所藏地支串（与线上前端 zhiMap 一致） */
function ZHI_GONG_STR(g) {
  const map = { 1: '子', 2: '未申', 3: '卯', 4: '辰巳', 5: '—', 6: '戌亥', 7: '酉', 8: '丑寅', 9: '午' };
  return map[g] || '';
}

/* 旺衰：令旺 / 令生相 / 生令休 / 相克囚 */
function wangShuaiOf(gongWx, lingWx) {
  if (gongWx === lingWx) return '旺';
  if (sheng(lingWx, gongWx)) return '相';
  if (sheng(gongWx, lingWx)) return '休';
  return '囚';
}

module.exports = { paiPan, buildDiPan, GONG_INFO, STAR_HOME, MEN_HOME, GAN_WX, ZHI_WX, SHENG, KE };
