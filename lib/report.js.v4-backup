/**
 * 报告生成器（重建版 v4 —— 旧站体验复刻）
 * 输出结构与线上样本完全一致：
 *   【五行核对清单】→【抄写用神宫位数据】→【一、盘面信息与用神】→
 *   【二、针对用户问题的定向拆解】→【三、用神落宫七步解读法】→【四、分项论断与实操建议】→免责声明
 * 用神定位与线上一致：日干宫=求测人；时干宫=事体；开门宫=丁奇宫；生门宫=丙奇宫；休门宫=乙奇宫。
 * v4 特性（对齐旧站"每测不同"体验）：
 *   - 核心判断 / 趋势判断 / 行动建议 / 总结断语：每段 4~6 种【内容不同】的写法随机组合
 *   - 七步解读：每条解读 3~4 种说法随机
 *   - 结论仍由盘面决定（生门旺就说旺、弱就说弱），不会自相矛盾
 */
'use strict';

const { GAN_WX, ZHI_WX, SHENG, KE } = require('./qimen');

const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- 主题识别 ---------- */
function detectTheme(question) {
  const q = question || '';
  if (/事业|工作|职场|创业|升职|跳槽|生意|公司|项目|官非|官运/.test(q)) return { key: 'career', name: '事业运程', yongs: ['开门', '生门'], gan: ['丁', '丙'] };
  if (/财|金钱|赚|投资|求财|收入|欠款|生意|财运/.test(q)) return { key: 'wealth', name: '财运', yongs: ['生门', '开门'], gan: ['丙', '丁'] };
  if (/感情|婚姻|爱情|姻缘|婚恋|对象|在一起|合不合|合适|复合|配对|缘分|能不能成|恋爱|男友|女友|丈夫|妻子|离婚/.test(q)) return { key: 'love', name: '感情姻缘', yongs: ['六合', '休门'], gan: ['乙', '丁'] };
  if (/健康|身体|疾病|病|失眠|体检|手术|康复/.test(q)) return { key: 'health', name: '健康', yongs: ['天芮', '死门'], gan: ['乙', '丙'] };
  if (/学业|考试|学习|考研|升学|论文|成绩|面试|读书|高考/.test(q)) return { key: 'study', name: '学业', yongs: ['天辅', '开门'], gan: ['乙', '丁'] };
  if (/合作|合伙|签约|合同|谈判|谈成|交易/.test(q)) return { key: 'coop', name: '合作', yongs: ['六合', '开门'], gan: ['乙', '丁'] };
  if (/出行|外出|远行|旅游|开车|车祸|方位/.test(q)) return { key: 'travel', name: '出行', yongs: ['休门', '开门'], gan: ['乙', '丁'] };
  if (/官司|诉讼|纠纷|仲裁|调解|被告|原告/.test(q)) return { key: 'legal', name: '官司诉讼', yongs: ['开门', '白虎'], gan: ['丁', '丙'] };
  return { key: 'general', name: '运势', yongs: ['开门', '生门'], gan: ['丁', '丙'] };
}

/* ---------- 主题词替换（让解读随所问之事变化） ---------- */
const THEME_REPLACE = {
  career: { '事业': '事业' },
  wealth: { '事业': '财运', '合作': '求财途径', '盈利': '进财', '合作方': '财源' },
  love: { '事业': '感情', '合作': '感情关系', '盈利': '发展', '合作方': '对方', '项目': '关系' },
  health: { '事业': '健康', '合作': '身体调理', '盈利': '康复', '合作方': '医者' },
  study: { '事业': '学业', '合作': '备考环境', '盈利': '成绩', '合作方': '师长' },
  coop: { '事业': '合作' },
  travel: { '事业': '出行', '合作': '行程', '盈利': '顺遂', '合作方': '同行人' },
  legal: { '事业': '诉讼', '合作': '调解', '盈利': '胜算', '合作方': '对方当事人' },
  general: { '事业': '运势' }
};
function themeText(key, s) {
  const rep = THEME_REPLACE[key];
  if (!rep) return s;
  let t = s;
  for (const [a, b] of Object.entries(rep)) t = t.split(a).join(b);
  return t;
}

/* ---------- 解读词表（每条 3~4 种说法，结论一致） ---------- */
const DI_PAN_TXT = {
  甲: ['甲木透出，主导力强但易有隐藏变数，需以静制动。', '甲木当头，气势虽盛而暗藏变数，宜稳守待机。', '甲木主威，有主导之象，惟锋芒太露易招是非。', '甲木参天，宜借势而为，不可恃强冒进。'],
  乙: ['乙木柔韧，根基有弹性，宜顺势而为、迂回推进。', '乙木善绕，弹性有余，迂回之间反得生机。', '乙木温和，以柔克刚，缓进比硬攻更有胜算。', '乙木有化，顺势而为事半功倍，逆势则费力。'],
  丙: ['丙火明朗，底层有活力，但火性浮动需防急躁。', '丙火通明，外显生机，惟火性浮跃，戒急用缓。', '丙火热烈，表里如一，但性急易灼，需留余地。', '丙火当空，光明在前，防得意忘形。'],
  丁: ['丁火内敛，根基有暗火，宜稳扎稳打积蓄能量。', '丁火藏温，暗力内蓄，宜徐图渐进。', '丁火如灯，明处不显、暗处得力，耐心即有回报。', '丁火幽微，宜沉住气深耕，莫求一夜功成。'],
  戊: ['戊土厚重，底层根基扎实，但进展偏缓需耐心。', '戊土沉稳，根基厚实，惟步调偏慢，贵在坚持。', '戊土为山，稳重可靠，然山移不易，急不得。', '戊土敦厚，守成有余，进取需借外力推动。'],
  己: ['己土滋养，事业盈利基础扎实，但进展缓慢。', '己土润物，基础平实，进展虽缓终有所成。', '己土含养，细水长流，慢工出细活。', '己土柔和，宜深耕细作，积累生变。'],
  庚: ['底层根基稳固但缺乏主动性，易陷入被动等待。', '根底虽固而主动不足，易被人事推着走，宜早作主张。', '庚金肃杀，被动则受制，主动方有转机。', '根基未摇而气机偏惰，宜主动出击打破僵局。'],
  辛: ['合作基础有潜在冲突，需注意沟通方式。', '合作根基隐有磕绊，沟通分寸需拿捏得当。', '辛金带刺，合伙之事易生龃龉，先把丑话说在前面。', '辛金锋利，协议细节务必写清，防日后扯皮。'],
  壬: ['壬水流动，局面变化多端，需灵活应对随机应变。', '壬水奔流，变数较多，以变应变方为上策。', '壬水浩荡，顺势则通，逆势则费。', '壬水无常，计划赶不上变化，多备预案。'],
  癸: ['事业本质有隐藏风险，需谨慎决策。', '表面平静下有暗流涌动，重大决策宜缓不宜急。', '癸水暗流，风险不在明处，签约决策前多核实。', '癸水至阴，暗藏隐忧，宜多看一步再落子。']
};
const MEN_TXT = {
  休门: ['当前事业处于休整期，不宜激进扩张。', '此门主休养，宜收不宜放，稳守为上。', '气机内敛，正是蓄力之时，静待时机为佳。', '休门主静，眼下以养代攻，慢即是快。'],
  生门: ['具备持续发展潜力，需耐心积累。', '生机渐旺，宜循序经营，日久自见成效。', '此门主生发，前景可期，惟需日拱一卒。', '生门主长，小步快跑，稳中自有利。'],
  伤门: ['竞争压力较大，易有损耗，需避免正面冲突。', '此门主伤损，硬碰易折，宜避其锋芒。', '对抗之象明显，退一步反而海阔天空。', '伤门主争，明争必损，换条路走更划算。'],
  杜门: ['阻力闭塞，推进受阻，需另寻突破口。', '此门主阻滞，直行不通，宜绕道而行。', '门户紧闭，强推无益，换条路子更省力。', '杜门主塞，先松口子再谋路，硬闯无益。'],
  景门: ['表面热闹实际虚浮，需防范虚名与计划外开销。', '此门主虚华，热闹背后多泡沫，宜务实。', '名声在外而实惠不足，花钱之处需多斟酌。', '景门主虚，捧场容易变现难，警惕花架子。'],
  死门: ['外部合作环境僵化，突破难度大。', '此门主僵死，旧路已封，须另起炉灶。', '局面凝滞，硬闯无益，宜先松绑再图进。', '死门主滞，旧模式走不通，当断则断。'],
  惊门: ['口舌是非较多，需谨言慎行防范变故。', '此门主惊扰，祸从口出，慎言可免无妄之灾。', '风波暗涌，谨防小人作祟，言行留三分余地。', '惊门主变，节外生枝之事多，稳住心神最要紧。'],
  开门: ['表面有开放性，但空亡状态实际效果有限。', '此门名义主开，实则助力虚浮，不可尽信。', '门虽大开而力有不逮，宜借力而不依赖。', '开门主通，眼下通达有限，莫把姿态当实力。']
};
const XING_TXT = {
  天蓬: ['事业方向多变，需警惕过度投机。', '此星主浮动，偏财之道风险高，量力而行。', '方向摇摆不定，先定心再定路。', '天蓬主险，快钱背后是深坑，戒贪为上。'],
  天芮: ['问题与隐患较多，需关注细节与潜在风险。', '此星主病患，隐患藏于细节，早查早安。', '暗疾未除，小问题不及时处理会拖成大麻烦。', '天芮主病，隐患宜早排查，莫等爆雷再补。'],
  天冲: ['事业易受突发因素影响，需灵活应对。', '此星主冲动，变数突至，临机应变方不被动。', '节奏易被打乱，预案多做一手。', '天冲主突，计划常有变，心态要稳、手要快。'],
  天辅: ['有贵人相助之象，宜借助资源与团队力量。', '此星主辅佐，贵人暗助，善借势者得利。', '人脉可用，团队合力远胜单打独斗。', '天辅主助，多请教、多借力，事半功倍。'],
  天禽: ['中正平和，宜守成积累，不宜冒进。', '此星主中正，不偏不倚，守正即吉。', '平稳是福，稳扎稳打胜过剑走偏锋。', '天禽主中，不折腾就是最好的策略。'],
  天心: ['谋划能力突出，宜长远布局，谋定后动。', '此星主智谋，深谋远虑者胜，切忌仓促。', '心有成算，宜先谋后动，布局宜远。', '天心主谋，算得清、看得远，方有大成。'],
  天柱: ['事业结构不稳定，易受外界压力影响。', '此星主支柱，根基不牢则风雨易摧，宜加固。', '外部压力偏大，先稳住基本盘再图扩张。', '天柱主撑，顶得住压力才能撑得起局面。'],
  天任: ['任重道远，宜脚踏实地，稳中求进。', '此星主担当，担子虽重，一步一个脚印最稳。', '务实为本，慢即是快。', '天任主责，扛事之人自有厚报，耐得住就有。'],
  天英: ['名气外显，但易虚火上升，需防表面繁荣。', '此星主英华，声名在外而实利有限，宜低调。', '面子好看不如里子扎实，虚名少追。', '天英主名，盛名之下其实难副，务实最稳。']
};
const SHEN_TXT = {
  值符: ['全局中枢，得正统助力，宜把握主导权。', '此神主纲领，正位得助，大方向宜亲抓。', '得主心骨之助，局面尽在掌握。', '值符坐镇，心中有主，大势不失。'],
  螣蛇: ['虚惊缠绕，易有反复，需防口舌与变卦。', '此神主虚扰，节外生枝，稳心神可解。', '疑心生暗鬼，反复处先确认再动作。', '螣蛇主幻，虚惊多真事少，稳住就是赢。'],
  太阴: ['暗中助力，宜低调行事，借力前行。', '此神主阴助，贵人暗中成全，闷声可成事。', '幕后有推手，低调做事反得庇护。', '太阴主隐，暗处有人帮，不必张扬。'],
  六合: ['人际关系和谐，易获得支持。', '此神主和合，人缘即资源，多走动有好处。', '和气生财，多方协调之事顺遂。', '六合主合，谈合作、处关系都是加分项。'],
  白虎: ['压力与冲突并存，需防是非与破耗。', '此神主凶煞，冲突难免，避其锋芒为上。', '硬碰硬两败俱伤，先化解再图进。', '白虎主煞，是非之地莫久留，破财免灾。'],
  玄武: ['易受信息干扰或隐藏对手影响。', '此神主暗昧，真假难辨，关键处多核实。', '背后有隐情，信息莫全信，眼见未必实。', '玄武主暗，防小人设局，合同与账目要清白。'],
  九地: ['稳守为吉，宜扎实积累，不宜张扬。', '此神主厚藏，低调蓄力，时机未到不露锋。', '宜藏不宜露，扎实做功课。', '九地主静，深挖护城河，厚积而薄发。'],
  九天: ['虽有高远目标，但实际落地困难。', '此神主高远，志向可嘉，落地需分步。', '眼高手低最忌，先从小处着手。', '九天主扬，志气可鼓，步子要小。']
};
const GAN_COMBO = {
  同: ['同气相连，力量叠加，方向明确但需防单一化。', '同气相求，合力较足，惟忌一条道走到黑。', '同气相应，步调一致，事半功倍。'],
  生: ['{tg}生{dg}，外部助力增强。', '{tg}生{dg}，得外力帮扶，顺势可成。', '{tg}生{dg}，有生助之缘，借力能省不少力气。'],
  克: ['{tg}{dg}相克，彼此制约，易生矛盾与消耗。', '{tg}克{dg}，相持不下，耗神费力，宜避正面。', '{tg}克{dg}，制约明显，宜用迂回策略化解。'],
  泄: ['{tg}生{dg}，天干泄气，付出较多而回报偏慢。', '{tg}生{dg}，自身被泄，先付出后见效，勿求速成。', '{tg}生{dg}，气机外散，前期投入大，回报在后头。'],
  被生: ['{dg}生{tg}，得底层滋养，根基托举有力。', '{dg}生{tg}，有底子托底，起步较稳。', '{dg}生{tg}，得人供养，根基不虚。'],
  被克: ['{dg}克{tg}，受制于人，需防被动局面。', '{dg}克{tg}，被人牵制，先解束缚再谈进取。', '{dg}克{tg}，外部压制，宜避其锋、养其气。']
};
function ganCombo(tg, dg) {
  const tw = GAN_WX[tg], dw = GAN_WX[dg];
  let t;
  if (tw === dw) t = pick(GAN_COMBO.同);
  else if (KE[tw] === dw) t = pick(GAN_COMBO.克);
  else if (KE[dw] === tw) t = pick(GAN_COMBO.被克);
  else if (SHENG[tw] === dw) t = pick(GAN_COMBO.泄);
  else t = pick(GAN_COMBO.被生);
  return t.replace('{tg}', tg).replace('{dg}', dg);
}

/* 宫五行生克关系描述（宫X vs 求测人宫0/中5土） */
function gongVsRen(gongWx) {
  const ren = '土';
  if (gongWx === ren) return pick(['同属土，气机相连', '与自身同气，内外呼应', '同气相助，步调一致']);
  if (KE[gongWx] === ren) return pick([`${gongWx}克求测人土，外部环境对自身消耗较大`, `${gongWx}来克身，外压偏大，需省着用自己`, `${gongWx}克身，阻力在外，先稳住阵脚`]);
  if (KE[ren] === gongWx) return pick([`${gongWx}受求测人土所克，可被自身掌控`, `${gongWx}被己身所制，主动权在手`, `${gongWx}受制于身，进退由己`]);
  if (SHENG[gongWx] === ren) return pick([`${gongWx}生求测人土，对自身有生助之力`, `${gongWx}生身，外有滋养，可借力`, `${gongWx}来生身，外援可资`]);
  return pick([`${gongWx}受求测人土所生，需消耗自身能量滋养`, `${gongWx}泄己身之气，付出较多，宜量力而行`, `${gongWx}耗身之气，先算清投入再动手`]);
}

/* 宫位状态串 */
function stateShort(d) {
  const arr = [];
  if (d.kongWang) arr.push('空亡');
  if (d.wangShuai) arr.push(d.wangShuai);
  return arr.length ? arr.join('，') : '—';
}

/* 用神宫定位：日干宫 / 时干宫 / 丁奇宫 / 丙奇宫 / 乙奇宫 */
function locateYong(panData, gan) {
  for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if (panData[g].tianPan === gan) return g;
  for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if (panData[g].diPan === gan) return g;
  return 5;
}
function gongLabel(g) {
  const map = { 5: '0宫（中央·五行属土）', 1: '1宫（正北·五行属水）', 2: '2宫（西南·五行属土）', 3: '3宫（正东·五行属木）', 4: '4宫（东南·五行属木）', 6: '6宫（西北·五行属金）', 7: '7宫（正西·五行属金）', 8: '8宫（东北·五行属土）', 9: '9宫（正南·五行属火）' };
  return map[g] || (g + '宫');
}

/**
 * 生成报告
 * @param {object} pan 排盘结果（paiPan 返回值）
 * @param {string} question 用户问题
 */
function buildReport(pan, question) {
  const { panData, panInfo, cal } = pan;
  const theme = detectTheme(question);
  const bazi = cal.bazi;
  const yearGz = bazi.year;

  const dayGong = locateYong(panData, bazi.day[0]);
  const hourGong = locateYong(panData, bazi.hour[0]);
  const dingGong = locateYong(panData, '丁');
  const bingGong = locateYong(panData, '丙');
  const yiGong = locateYong(panData, '乙');
  const maGong = (() => { for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if (panData[g].maXing) return g; return 0; })();

  const yongGongs = [dayGong, hourGong, dingGong, bingGong, maGong, yiGong].filter((v, i, a) => v && a.indexOf(v) === i);
  yongGongs.sort((a, b) => [dayGong, hourGong, dingGong, bingGong, maGong, yiGong].indexOf(a) - [dayGong, hourGong, dingGong, bingGong, maGong, yiGong].indexOf(b));

  const L = [];
  /* 五行核对清单（九宫全列，与旧站一致：0宫=中五宫寄宫，跳过数字5） */
  L.push('【五行核对清单】');
  for (const g of [5, 1, 2, 3, 4, 6, 7, 8, 9]) L.push(gongLabel(g));
  L.push('');

  /* 抄写用神宫位数据 */
  L.push('【抄写用神宫位数据】');
  const titleOf = { [dayGong]: '求测人日干宫', [hourGong]: '事体时干宫', [dingGong]: '开门宫', [bingGong]: '生门宫' };
  const seen = {};
  for (const g of [dayGong, hourGong, dingGong, bingGong]) {
    if (!g || seen[g]) continue;
    seen[g] = 1;
    const d = panData[g];
    L.push(`${g === 5 ? '0宫' : g + '宫'}（${titleOf[g]}）：地盘【${d.diPan || ' '}】，天盘【${d.tianPan || ' '}】，九星【${d.jiuXing || ' '}】，八门【${d.baMen || ' '}】，八神【${d.baShen || ' '}】。【状态：${stateShort(d)}】`);
  }
  L.push('');

  /* 一、盘面信息与用神 */
  L.push('【一、盘面信息与用神】');
  L.push(`1. 求测人（日干）：${gongLabel(dayGong)}，地盘【${panData[dayGong].diPan || ' '}】，天盘【${panData[dayGong].tianPan || ' '}】，九星【${panData[dayGong].jiuXing || ' '}】，八门【${panData[dayGong].baMen || ' '}】，八神【${panData[dayGong].baShen || ' '}】。【状态：${stateShort(panData[dayGong])}】`);
  L.push(`2. 事体与对方（时干）：${gongLabel(hourGong)}，地盘【${panData[hourGong].diPan || ' '}】，天盘【${panData[hourGong].tianPan || ' '}】，九星【${panData[hourGong].jiuXing || ' '}】，八门【${panData[hourGong].baMen || ' '}】，八神【${panData[hourGong].baShen || ' '}】。【状态：${stateShort(panData[hourGong])}】`);
  L.push(`3. 核心用神匹配（${theme.name}）：${theme.yongs.join('、')}`);
  const yongMap = { '开门': [dingGong, '开门宫'], '生门': [bingGong, '生门宫'], '休门': [yiGong, '休门宫'], '六合': [hourGong, '六合宫'], '天芮': [dayGong, '天芮宫'], '天辅': [dayGong, '天辅宫'], '死门': [dayGong, '死门宫'], '白虎': [hourGong, '白虎宫'] };
  for (const y of theme.yongs) {
    const [g, label] = yongMap[y] || [dingGong, '用神宫'];
    if (!g) continue;
    const d = panData[g];
    L.push(`   - ${label}：${g === 5 ? '0宫' : g + '宫'}（${d.direction}·五行属${d.gongWuXing}），地盘【${d.diPan || ' '}】，天盘【${d.tianPan || ' '}】，九星【${d.jiuXing || ' '}】，八门【${d.baMen || ' '}】，八神【${d.baShen || ' '}】。【状态：${stateShort(d)}】`);
  }
  L.push('');

  /* 二、针对用户问题的定向拆解 */
  L.push('【二、针对用户问题的定向拆解】');
  L.push('1. 拆解诉求：');
  for (const s of themeQuestions(theme.key)) L.push(`   - ${s}`);
  L.push('');
  L.push('2. 核心判断：');
  for (const s of coreJudgments(theme.key, panData, dayGong, hourGong, dingGong, bingGong, yearGz)) L.push(`   - ${s}`);
  L.push('');

  /* 三、用神落宫七步解读法 */
  L.push('【三、用神落宫七步解读法】');
  const stepGongs = [[dayGong, '求测人宫'], [hourGong, '事体宫'], [dingGong, '开门宫'], [bingGong, '生门宫']];
  let idx = 1;
  for (const [g, label] of stepGongs) {
    if (!g) continue;
    const d = panData[g];
    const gz = g === 5 ? '0宫' : g + '宫';
    L.push(`${idx}. ${label}（${gz}${d.gongWuXing}）：`);
    if (g === 5) {
      L.push(`   - ${themeText(theme.key, `地盘${d.diPan || '空'}：${pick(DI_PAN_TXT[d.diPan] || ['空亡状态，需主动布局。'])}`)}`);
      L.push(`   - ${themeText(theme.key, pick(['八门休门：当前事业处于休整期，不宜激进扩张。', '八门休门：气机内敛，正是蓄力之时，静待时机为佳。', '八门休门：宜收不宜放，稳守为上。', '八门休门：以养代攻，慢即是快。']))}`);
      L.push(`   - ${themeText(theme.key, pick(['九星空亡：缺乏明确的天时助力，需主动创造机会。', '九星空亡：天时未至，机会靠自己张罗。', '九星空亡：外力靠不上，内功才是本钱。']))}`);
      L.push(`   - ${themeText(theme.key, pick(['八神空亡：外缘支持不足，需依靠自身实力。', '八神空亡：外援有限，内功才是本钱。', '八神空亡：贵人未现，先把自己变强。']))}`);
      L.push(`   - ${themeText(theme.key, `天盘空地盘${d.diPan}：格局单一，缺乏变化动力。`)}`);
      L.push(`   - ${themeText(theme.key, `五行：${gz}${d.gongWuXing}，自身为${d.gongWuXing}，处于休状态，能量内收。`)}`);
      L.push(`   - ${themeText(theme.key, pick(['空亡与驿马：无驿马，行动力不足。', '空亡与驿马：驿马不动，宜先蓄势再动。']))}`);
    } else {
      L.push(`   - ${themeText(theme.key, `地盘${d.diPan || '空'}：${pick(DI_PAN_TXT[d.diPan] || ['空亡状态，需主动布局。'])}`)}`);
      L.push(`   - ${themeText(theme.key, `八门${d.baMen || '空亡'}：${pick(MEN_TXT[d.baMen] || ['八门空亡，缺乏外部助力，需主动创造机会。'])}`)}`);
      L.push(`   - ${themeText(theme.key, `九星${d.jiuXing || '空亡'}：${pick(XING_TXT[(d.jiuXing || '').replace(/\(禽\)$/, '')] || ['缺乏明确的天时助力，需主动创造机会。'])}`)}`);
      L.push(`   - ${themeText(theme.key, `八神${d.baShen || '空亡'}：${pick(SHEN_TXT[d.baShen] || ['外缘支持不足，需依靠自身实力。'])}`)}`);
      if (d.tianPan) L.push(`   - ${themeText(theme.key, `天盘${d.tianPan}加地盘${d.diPan}：${ganCombo(d.tianPan, d.diPan)}`)}`);
      else L.push(`   - ${themeText(theme.key, `天盘空地盘${d.diPan}：格局单一，缺乏变化动力。`)}`);
      L.push(`   - ${themeText(theme.key, `五行：${gz}${d.gongWuXing}，${gongVsRen(d.gongWuXing)}。`)}`);
      const kongMa = [];
      if (d.kongWang) kongMa.push(pick(['空亡，事体不稳定', '空亡，根基未实', '空亡，事未成局']));
      if (d.maXing) kongMa.push(`驿马在${panInfo.maXing || '寅'}，需关注农历正月动向`);
      if (!d.kongWang && !d.maXing) kongMa.push(d.wangShuai === '旺' ? pick(['无空亡驿马，旺状态显示资源充足', '无空亡驿马，气机正旺，顺势可为', '无空亡驿马，此时是发力好时机']) : (d.wangShuai === '囚' ? pick(['无空亡驿马，囚状态显示压力明显', '无空亡驿马，受困之象，宜先松绑', '无空亡驿马，局面受制，先解套再走']) : pick(['无空亡驿马，行动力需加强', '无空亡驿马，中气平平，宜蓄力', '无空亡驿马，平局之象，多思少动'])));
      L.push(`   - ${themeText(theme.key, `空亡与驿马：${kongMa.join('；')}。`)}`);
    }
    idx++;
  }
  L.push('');

  /* 四、分项论断与实操建议 */
  L.push('【四、分项论断与实操建议】');
  L.push('1. 趋势判断：');
  const nowYear = cal.now.getFullYear();
  for (const s of trendJudgments(theme.key, panData, dayGong, dingGong, bingGong, yearGz, panInfo, nowYear)) L.push(`   - ${s}`);
  L.push('');
  L.push('2. 行动建议：');
  for (const s of actionAdvice(theme.key, panData, dayGong, bingGong)) L.push(`   - ${s}`);
  L.push('');
  L.push('3. 总结断语：');
  L.push(`   ${summaryLine(theme.key, panData, dayGong, bingGong, yearGz, panInfo)}`);
  L.push('');
  L.push('本推演仅为传统民俗文化参考，不构成任何商业或法律建议。');

  return L.join('\n');
}

/* ---------- 主题文案（拆解诉求多组随机） ---------- */
function themeQuestions(key) {
  const pools = {
    career: [
      ['当前事业基础与状态如何？', '事业发展的核心动力与阻碍是什么？', '未来趋势是扩张还是收缩？'],
      ['事业盘面如何看？', '今年事业的转折点在哪里？', '该守还是该进？'],
      ['目前工作/生意处于什么阶段？', '晋升与突破的关键因素是什么？', '未来半年走势如何？']
    ],
    wealth: [
      ['当前财运基础如何？', '求财的渠道与助力是什么？', '近期财运趋势是进是退？'],
      ['财运旺衰如何判断？', '正财偏财哪个更有利？', '近期是否适合投资？'],
      ['求财之路顺不顺？', '财源在哪里、风险在哪里？', '未来几个月财运走向？']
    ],
    love: [
      ['当前感情状态如何？', '双方缘分深浅与主要障碍是什么？', '感情未来发展走向如何？'],
      ['这段缘分成不成？', '相处中要注意什么？', '未来关系如何发展？'],
      ['两人合不合？', '主要矛盾点在哪里？', '感情走向何方？']
    ],
    health: [
      ['当前身体状况如何？', '健康方面的主要隐患是什么？', '恢复与调理的方向如何？'],
      ['身体哪里需要留意？', '致病根源是什么？', '调理恢复要多久？'],
      ['健康状况如何评估？', '隐患在哪个环节？', '如何保养更稳妥？']
    ],
    study: [
      ['当前学业基础如何？', '学习考试的主要助力与阻碍是什么？', '考试升学结果趋势如何？'],
      ['这次考试胜算几何？', '复习重点放在哪里？', '结果大概如何？'],
      ['学业运势怎么样？', '影响成绩的关键是什么？', '能否如愿上岸？']
    ],
    coop: [
      ['当前合作基础如何？', '合作中的助力与风险是什么？', '合作结果趋势如何？'],
      ['这笔合作靠不靠谱？', '对方诚意如何？', '合作能否成局？'],
      ['合作利大于弊还是弊大于利？', '要防哪些坑？', '最终结果如何？']
    ],
    travel: [
      ['当前出行条件如何？', '行程中的助力与阻碍是什么？', '出行结果是否顺利？'],
      ['出行是否安全顺利？', '路上要注意什么？', '这趟出门值不值？'],
      ['行程吉凶如何？', '哪个环节易生变数？', '出行结果如何？']
    ],
    legal: [
      ['当前诉讼局势如何？', '诉讼中的有利因素与风险是什么？', '最终结果走向如何？'],
      ['这场官司胜算大不大？', '要防哪些不利因素？', '结果何时能见分晓？'],
      ['纠纷能否和解？', '打下去还是调解好？', '最终结果如何？']
    ],
    general: [
      ['当前整体运势如何？', '近期发展的主要助力与阻碍是什么？', '未来趋势走向如何？'],
      ['今年整体运程怎么样？', '哪些方面要特别留意？', '下半年走势如何？'],
      ['整体气运如何评估？', '顺与不顺的关键在哪里？', '未来一段时间怎么走？']
    ]
  };
  return pick(pools[key] || pools.general);
}

function coreJudgments(key, panData, dayGong, hourGong, dingGong, bingGong, yearGz) {
  const dd = panData[dayGong], hd = panData[hourGong], dg = panData[dingGong], bg = panData[bingGong];
  const topic = key === 'wealth' ? '财运' : key === 'love' ? '感情' : key === 'health' ? '健康' : key === 'study' ? '学业' : key === 'travel' ? '出行' : key === 'legal' ? '诉讼' : key === 'coop' ? '合作' : '事业';
  const cur = [];
  const dayState = dayGong === 5 ? '休门状态' : `${dd.wangShuai}状态`;
  const hdState = hd.kongWang ? '空亡' : hd.wangShuai;
  const dayG = dayGong === 5 ? '0宫' : dayGong + '宫';
  const hourG = hourGong === 5 ? '0宫' : hourGong + '宫';
  const stPool = [
    `目前状态：求测人（${dayG}${dd.gongWuXing}）处于${dayState}，${topic}处于休整期；事体（${hourG}${hd.gongWuXing}）${hdState}，显示方向不明确，需重新定位。`,
    `当前盘面：求测人落${dayG}${dd.gongWuXing}，${dayState}，${topic}宜守不宜攻；事体落${hourG}${hd.gongWuXing}，${hdState}，方向未定，先理清再行动。`,
    `现状来看，求测人（${dayG}${dd.gongWuXing}）气机${dd.wangShuai === '旺' || dd.wangShuai === '相' ? '偏旺' : '内收'}，${topic}${dd.wangShuai === '旺' || dd.wangShuai === '相' ? '有发力空间' : '正处蓄力期'}；事体（${hourG}${hd.gongWuXing}）${hdState}，主事未明，不宜轻举妄动。`,
    `观盘面，自身落${dayG}${dd.gongWuXing}，${dayState}，当前宜休整蓄力；事体落${hourG}${hd.gongWuXing}而${hdState}，成事条件尚不成熟，需等待时机。`,
    `综合盘面：求测人${dayG}${dd.gongWuXing}${dayState}，${topic}整体偏稳；事体${hourG}${hd.gongWuXing}${hdState}，变数未消，先稳住再谋动。`
  ];
  cur.push(themeText(key, pick(stPool)));
  const bgOk = bg.wangShuai === '旺' || bg.wangShuai === '相';
  const dgOk = dg.wangShuai === '旺' || dg.wangShuai === '相';
  const bG = bingGong === 5 ? '0宫' : bingGong + '宫';
  const dG = dingGong === 5 ? '0宫' : dingGong + '宫';
  const wPool = bgOk
    ? (dgOk
      ? [
          `走向判断：生门宫（${bG}${bg.gongWuXing}）旺相，有盈利潜力但需注意资源消耗；开门宫（${dG}${dg.gongWuXing}）有力，外部合作环境可期。`,
          `走向判断：生门落${bG}旺相，进项有望、消耗亦大；开门落${dG}状态可期，对外协作可适度推进。`,
          `趋势上看，生门得力、${topic}有生发之机；开门亦通，合作之路走得通，惟忌贪多求快。`,
          `从用神看，生门旺相为吉，${topic}前景可期；开门有力，宜借合作之势成事，注意成本控制。`,
          `判局：生门得旺，机会在稳步经营中显现；开门有力，人脉合作可成助力，稳扎稳打为上。`
        ]
      : [
          `走向判断：生门宫（${bG}${bg.gongWuXing}）旺相，有盈利潜力但需注意资源消耗；开门宫（${dG}${dg.gongWuXing}）囚死，外部合作环境受限。`,
          `走向判断：生门得旺，进项有望，惟开销同步增大；开门受制，对外协作宜多留后手。`,
          `趋势上看，生门旺相、${topic}有进益之机；然开门不旺，合作之事需谨慎把关，莫轻信口头承诺。`,
          `从用神看，生门旺相为吉，求财求事可期；开门受困，外部助力有限，凡事多靠自己。`,
          `判局：生门有力，机会在稳步经营中显现；开门偏弱，莫贪快钱，合同细节要抠。`
        ])
    : (dgOk
      ? [
          `走向判断：生门宫（${bG}${bg.gongWuXing}）偏弱，收益需耐心积累；开门宫（${dG}${dg.gongWuXing}）有力，外部合作环境可期。`,
          `走向判断：生门乏力，${topic}重在一个稳字；开门状态可期，可借合作破局，但投入要控。`,
          `趋势上看，生门偏弱、收益在后头；开门得势，合作或能带来转机，宜小步试探。`,
          `从用神看，生门不旺，进项有限，先控成本；开门有力，合作是当下的破局点。`,
          `判局：生门偏弱不宜冒进，开门可期宜善用，先稳后进方为上策。`
        ]
      : [
          `走向判断：生门宫（${bG}${bg.gongWuXing}）偏弱，收益需耐心积累；开门宫（${dG}${dg.gongWuXing}）状态一般，合作事宜需反复确认。`,
          `走向判断：生门乏力，求财重在一个稳字；开门平平，合同条款多核几遍再签。`,
          `趋势上看，生门、开门皆不旺，当下宜守不宜攻，把内功练好再说。`,
          `从用神看，生门不旺、开门不开，${topic}宜缓行，先理顺内部再谋外联。`,
          `判局：两门皆弱，稳字当头，机会未到莫强求，蓄势待时。`
        ]);
  cur.push(themeText(key, pick(wPool)));
  return cur;
}

function trendJudgments(key, panData, dayGong, dingGong, bingGong, yearGz, panInfo, nowYear) {
  const topic = key === 'wealth' ? '财运' : key === 'love' ? '感情' : key === 'health' ? '健康' : key === 'study' ? '学业' : key === 'travel' ? '出行' : key === 'legal' ? '诉讼' : key === 'coop' ? '合作' : '事业';
  const dd = panData[dayGong], dg = panData[dingGong], bg = panData[bingGong];
  const out = [];
  const ok = dd.wangShuai === '旺' || dd.wangShuai === '相';
  const open = pick(ok
    ? [
        `${nowYear}年${topic}整体态势向好，宜顺势推进。`,
        `${nowYear}年${topic}大势偏顺，可择机而动。`,
        `${nowYear}年${topic}气机偏旺，正是发力的年份，把握住上半年。`,
        `${nowYear}年${topic}总体向上，宜主动出击、扩大战果。`,
        `${nowYear}年${topic}走势看好，稳中带进，忌坐失良机。`
      ]
    : [
        `${nowYear}年${topic}整体处于休整期，不宜激进扩张，宜以稳为主。`,
        `${nowYear}年${topic}大势偏缓，先固本再求进，急躁无益。`,
        `${nowYear}年${topic}气机内收，宜休养生息，把基础打牢再谋发展。`,
        `${nowYear}年${topic}局势未明，求稳为上，宜守不宜攻。`,
        `${nowYear}年${topic}节奏宜慢不宜快，先理顺内部再谈扩张。`
      ]);
  out.push(themeText(key, open));
  if (bg.wangShuai === '旺' || bg.wangShuai === '相') out.push(themeText(key, pick([
    '生门宫旺相显示有盈利机会，但需注意资源消耗；开门宫受限，外部合作需谨慎选择。',
    '生门得旺，进项有望，惟开销同步增大；开门受制，对外协作宜多留后手。',
    '生门有力，机会在稳步经营中显现；开门偏弱，合作之事先小人后君子。',
    '生门旺相，正财可期，宜在熟悉的领域深耕；开门平平，对外合作务必逐条把关。'
  ])));
  else out.push(themeText(key, pick([
    '生门宫偏弱，收益需耐心积累；开门宫状态一般，合作事宜需反复确认。',
    '生门乏力，求财重在一个稳字；开门平平，合同条款多核几遍再签。',
    '生门不旺，进项有限，宜控制投入；开门平平，合作先小步试探。',
    '生门偏弱，眼下宜守不宜进；合作之事多观察再定，不急于落笔。'
  ])));
  const ma = panInfo.maXing;
  if (ma) out.push(`关键节点在农历${maZhiToYue(ma, nowYear)}，驿马动可能带来方向调整机会。`);
  else out.push(pick(['近期驿马不动，宜保持现有节奏，稳中求进。', '驿马未动，眼下不是大动的时机，按部就班即可。']));
  return out;
}
function maZhiToYue(z, nowYear) {
  const map = { 寅: { m: '寅月', r: `${nowYear + 1}年1月-2月` }, 申: { m: '申月', r: `${nowYear}年7月-8月` }, 巳: { m: '巳月', r: `${nowYear}年4月-5月` }, 亥: { m: '亥月', r: `${nowYear}年10月-11月` } };
  const t = map[z];
  return t ? `${t.m}（${t.r}）` : z + '月';
}

function actionAdvice(key, panData, dayGong, bingGong) {
  const topic = key === 'wealth' ? '求财' : key === 'love' ? '感情' : key === 'health' ? '健康' : key === 'study' ? '学业' : key === 'travel' ? '出行' : key === 'legal' ? '诉讼' : key === 'coop' ? '合作' : '事业';
  const bg = panData[bingGong];
  const pool = [
    `优先处理内部事务，优化现有${topic}结构，避免盲目扩张。`,
    `先把眼前的${topic}事务理清楚，稳住基本盘，再谈下一步。`,
    '资金使用上宜留足缓冲，别把预算一次打满，留有余地方能应变。',
    '与合作伙伴签订合同时需仔细审核条款，避免因信息不对称导致损失。',
    '人脉是重要助力，多走动多联络，机会往往藏在关系里。',
    '重要决策多问几个人再定，忌一个人拍板，兼听则明。',
    '控制成本支出，避免过度投入导致资源紧张，开源更要节流。',
    '把精力放在能沉淀的事上，少追风口，长期主义最稳。',
    '遇事先谋后动，定好预案再出手，不打无准备之仗。',
    '对外的承诺先兑现再说，信誉是最好的本钱。'
  ];
  const extra = [];
  if (panData[dayGong].kongWang) extra.push('日干宫空亡，当前决策需多方求证，不宜独断。');
  if (bg.wangShuai === '旺' || bg.wangShuai === '相') extra.push('生门旺相，可在熟悉的领域适当加码，但投入要算清回报。');
  // 随机洗牌取 5 条
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const out = pool.slice(0, 4);
  if (extra.length) out.push(pick(extra));
  else out.push(pool[4]);
  return out.map(s => themeText(key, s));
}

function summaryLine(key, panData, dayGong, bingGong, yearGz, panInfo) {
  const dd = panData[dayGong], bg = panData[bingGong];
  const topic = key === 'wealth' ? '财运' : key === 'love' ? '感情' : key === 'health' ? '健康' : key === 'study' ? '学业' : key === 'travel' ? '出行' : key === 'legal' ? '诉讼' : key === 'coop' ? '合作' : '事业';
  const rootState = dd.kongWang ? '尚可但方向待明' : (dd.wangShuai === '旺' || dd.wangShuai === '相' ? '稳固' : '偏弱');
  const bgOk = bg.wangShuai === '旺' || bg.wangShuai === '相';
  const ma = panInfo.maXing;
  const pool = [
    `${yearGz}年${topic}根基${rootState}，需以守为攻，${ma ? `${ma}月驿马动或为转机，` : ''}生门宫${bgOk ? '旺相显示潜力可期' : '偏弱需耐心积累'}，但需警惕资源消耗。`,
    `综合来看，${yearGz}年${topic}宜稳不宜急，${ma ? `待到${ma}月驿马发动，` : ''}方是转机之时；生门${bgOk ? '有潜力' : '力有未逮'}，守住节奏、控住开销，自可徐徐图之。`,
    `${yearGz}年${topic}大势偏缓，先守成再图进；${ma ? `${ma}月或有变动之机，届时顺势而为，` : '近期按部就班，'}生门${bgOk ? '旺相可期' : '偏弱需蓄力'}，惟忌贪多求快。`,
    `今年${topic}以稳为主，切莫冒进；${ma ? `${ma}月驿马动，出行变动中藏机会；` : '眼下动静不宜过大；'}生门${bgOk ? '得力，稳扎稳打自有回报' : '平平，耐心经营以待时机'}。`,
    `${yearGz}年${topic}根基${rootState}，宜蓄力待时；${ma ? `待到${ma}月，驿马一动，局面自开；` : '时机未到，先练内功；'}生门${bgOk ? '旺相，前景可期' : '偏弱，不宜加码'}，注意开源节流。`,
    `综合盘面，今年${topic}宜守不宜攻，先把内功练好；${ma ? `${ma}月是关键节点，或有转机；` : '时机未到莫强求；'}生门${bgOk ? '有潜力，耐心经营必有所得' : '力有未逮，稳住即是赢'}。`
  ];
  return pick(pool);
}

module.exports = { buildReport, detectTheme };
