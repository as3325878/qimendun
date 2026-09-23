/**
 * 报告生成器（重建版 v5 —— 完全复刻 qimendun.net 旧站）
 * 输出结构与旧站一致：
 *   【五行核对清单】→【一、盘面信息与用神】→
 *   【二、针对用户问题的定向拆解】→【三、用神落宫七步解读法】→【四、分项论断与实操建议】→免责声明
 * 用神匹配与旧站一致（按问题关键词自动匹配）：
 *   事业/工作/升迁 → 开门、值符、年干
 *   财运/投资/生意 → 生门、戊、天心
 *   婚姻/感情/姻缘 → 六合、休门、日干、时干
 *   健康/疾病/身体 → 天芮、死门、年命
 *   考试/学业/文书 → 天辅、景门、年命、丁
 *   合作/谈判/对方意图 → 六合、时干、日干
 *   出行/搬迁/远行 → 开门、驿马、日干
 *   官司/诉讼/纠纷 → 开门、伤门、白虎、庚
 *   整体运势/运气 → 生门、年命（多模板随机）
 * 用神定位与旧站一致：开门=八门开门宫；值符=八神值符宫；生门=八门生门宫；
 *   戊/庚/丁=天干落宫；天心/天芮/天辅=九星所在宫；六合/白虎=八神所在宫；
 *   休门/死门/伤门/景门=八门所在宫；年干=流年天干落宫；年命=年命天干落宫；驿马=驿马宫。
 * 文案风格与旧站一致：目前状态/走向判断/七步解读/趋势/建议/总结句式相同，
 *   解释内容每次随机（旧站亦如此），盘面结论由局决定。
 */
'use strict';

const { GAN_WX, ZHI_WX, SHENG, KE } = require('./qimen');

const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/* ============ 一、主题识别（与旧站一致） ============ */
function detectTheme(question) {
  const q = question || '';
  if (/事业|工作|职场|创业|升职|升迁|跳槽|前途|项目/.test(q)) return { key: 'career', tag: '事业/工作/升迁', yongs: ['开门', '值符', '年干'] };
  if (/财|金钱|赚|投资|求财|收入|生意|欠款|财运/.test(q)) return { key: 'wealth', tag: '财运/投资/生意', yongs: ['生门', '戊', '天心'] };
  if (/感情|婚姻|爱情|姻缘|婚恋|对象|在一起|合不合|合适|复合|配对|缘分|恋爱|男友|女友|丈夫|妻子|离婚/.test(q)) return { key: 'love', tag: '婚姻/感情/姻缘', yongs: ['六合', '休门', '日干', '时干'] };
  if (/健康|身体|疾病|病|失眠|体检|手术|康复/.test(q)) return { key: 'health', tag: '健康/疾病/身体', yongs: ['天芮', '死门', '年命'] };
  if (/学业|考试|学习|考研|升学|论文|成绩|面试|读书|高考|文书/.test(q)) return { key: 'study', tag: '考试/学业/文书', yongs: ['天辅', '景门', '年命', '丁'] };
  if (/合作|合伙|签约|合同|谈判|谈成|交易|对方意图/.test(q)) return { key: 'coop', tag: '合作/谈判/对方意图', yongs: ['六合', '时干', '日干'] };
  if (/出行|外出|远行|旅游|开车|车祸|方位|搬迁/.test(q)) return { key: 'travel', tag: '出行/搬迁/远行', yongs: ['开门', '驿马', '日干'] };
  if (/官司|诉讼|纠纷|仲裁|调解|被告|原告/.test(q)) return { key: 'legal', tag: '官司/诉讼/纠纷', yongs: ['开门', '伤门', '白虎', '庚'] };
  return { key: 'general', tag: '整体运势', yongs: ['生门', '年命'] };
}

/* ============ 二、用神宫位定位 ============ */
function locateBaMen(panData, men) { for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if (panData[g].baMen === men) return g; return 0; }
function locateBaShen(panData, shen) { for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if (panData[g].baShen === shen) return g; return 0; }
function locateJiuXing(panData, xing) { for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if ((panData[g].jiuXing || '').replace(/\(禽\)$/, '') === xing) return g; return 0; }
function locateGan(panData, gan) {
  for (const g of [1, 2, 3, 4, 5, 6, 7, 8, 9]) if (panData[g].tianPan === gan || panData[g].diPan === gan) return g;
  return 0;
}
function locateMa(panData) { for (const g of [1, 2, 3, 4, 6, 7, 8, 9]) if (panData[g].maXing) return g; return 0; }
function gongLabel(g) {
  const map = { 0: '无', 5: '0宫（中央·五行属土）', 1: '1宫（正北·五行属水）', 2: '2宫（西南·五行属土）', 3: '3宫（正东·五行属木）', 4: '4宫（东南·五行属木）', 6: '6宫（西北·五行属金）', 7: '7宫（正西·五行属金）', 8: '8宫（东北·五行属土）', 9: '9宫（正南·五行属火）' };
  return map[g] || (g + '宫');
}
function gongShort(g) { return g === 5 ? '0宫' : g + '宫'; }
function stateShort(d) {
  if (!d) return '';
  const arr = [];
  if (d.kongWang) arr.push('空亡');
  if (d.wangShuai) arr.push(d.wangShuai);
  if (d.menPo) arr.push('门迫');
  return arr.length ? arr.join('，') : '';
}

/* ============ 三、解释词池（旧站风格，随机） ============ */
const DI_PAN_TXT = {
  甲: ['甲木透出，主导力强但易有隐藏变数，需以静制动。', '甲木主威，有主导之象，惟锋芒太露易招是非。', '甲木参天，宜借势而为，不可恃强冒进。', '甲木为阳木，根基有主导力，但易生变数，宜稳。'],
  乙: ['乙木柔韧，根基有弹性，宜顺势而为、迂回推进。', '乙木善绕，弹性有余，迂回之间反得生机。', '乙木温和，以柔克刚，缓进比硬攻更有胜算。', '乙木为阴木，根基柔顺，宜借势周旋。'],
  丙: ['丙火明朗，底层有活力，但火性浮动需防急躁。', '丙火通明，外显生机，惟火性浮跃，戒急用缓。', '丙火热烈，表里如一，但性急易灼，需留余地。', '丙火为阳火，底层根基为热情，但易冲动。'],
  丁: ['丁火内敛，根基有暗火，宜稳扎稳打积蓄能量。', '丁火藏温，暗力内蓄，宜徐图渐进。', '丁火如灯，明处不显、暗处得力，耐心即有回报。', '丁火为阴火，表面稳定，内藏波动。'],
  戊: ['戊土厚重，底层根基扎实，但进展偏缓需耐心。', '戊土沉稳，根基厚实，惟步调偏慢，贵在坚持。', '戊土为山，稳重可靠，然山移不易，急不得。', '戊土为阳土，资产根基稳固，但需防泄气。'],
  己: ['己土滋养，基础平实，进展虽缓终有所成。', '己土润物，基础平实，慢工出细活。', '己土柔和，宜深耕细作，积累生变。', '己土为阴土，基础有滋养，但进展偏慢。'],
  庚: ['庚金肃杀，被动则受制，主动方有转机。', '根基未摇而气机偏惰，宜主动出击打破僵局。', '庚金主阻隔，存在隐性竞争或制度限制。', '庚金为阳金，根基稳固但缺乏主动性。'],
  辛: ['辛金带刺，合伙之事易生龃龉，先把丑话说在前面。', '辛金锋利，协议细节务必写清，防日后扯皮。', '辛金为阴金，为错误或瑕疵，事体基础存在隐患。', '辛金主暗藏矛盾，需注意沟通方式。'],
  壬: ['壬水流动，局面变化多端，需灵活应对随机应变。', '壬水奔流，变数较多，以变应变方为上策。', '壬水无常，计划赶不上变化，多备预案。', '壬水为阳水，主流动，方向需灵活调整。'],
  癸: ['表面平静下有暗流涌动，重大决策宜缓不宜急。', '癸水暗流，风险不在明处，签约决策前多核实。', '癸水至阴，暗藏隐忧，宜多看一步再落子。', '癸水为阴水，暗藏财务隐患或资源消耗。']
};
const MEN_TXT = {
  休门: ['休门主休养生息，行动力不足，宜蓄力待机。', '休门主停滞，宜收不宜放，稳守为上。', '休门主静，眼下以养代攻，慢即是快。', '休门主休整，当前处于调整期，不宜激进。'],
  生门: ['生门主生机，具备持续发展潜力，需耐心积累。', '生门主生发，前景可期，惟需日拱一卒。', '生门主长，小步快跑，稳中自有利。', '生门主机遇，但需结合宫位状态判断助力强弱。'],
  伤门: ['伤门主伤损，硬碰易折，宜避其锋芒。', '伤门主争，明争必损，换条路走更划算。', '伤门主变动损耗，求财过程易有波折。', '伤门主冲突，竞争压力较大，需避免正面冲突。'],
  杜门: ['杜门主阻滞，直行不通，宜绕道而行。', '杜门主塞，先松口子再谋路，硬闯无益。', '杜门主封闭，资源流动性差，渠道受限。', '杜门主阻碍，推进受阻，需另寻突破口。'],
  景门: ['景门主虚华，热闹背后多泡沫，宜务实。', '景门主虚，捧场容易变现难，警惕花架子。', '景门主文书光明，但门迫则临场易有突发。', '景门主名声，表面热闹实际虚浮，需防虚名。'],
  死门: ['死门主僵死，旧路已封，须另起炉灶。', '死门主滞，旧模式走不通，当断则断。', '死门主停滞，与权威性矛盾，需谨慎。', '死门主不利，外部环境死板，缺乏活力。'],
  惊门: ['惊门主惊扰，祸从口出，慎言可免无妄之灾。', '惊门主变，节外生枝之事多，稳住心神最要紧。', '惊门主口舌是非，易有争执，需谨言慎行。', '惊门主波动，易因沟通问题引发矛盾。'],
  开门: ['开门主开拓，但门迫显示行动受阻。', '开门主通达，但结合宫位状态判断助力。', '开门主开创，虽为吉门但受制则需谨慎行动。', '开门主事业发展机会，受门迫则执行受阻。']
};
const XING_TXT = {
  天蓬: ['天蓬星主浮动，偏财之道风险高，量力而行。', '天蓬主险，快钱背后是深坑，戒贪为上。', '天蓬星主变动，市场波动大，需防风险。', '天蓬主机遇与风险并存，需主动出击但量力。'],
  天芮: ['天芮星主病患，隐患藏于细节，早查早安。', '天芮主病，隐患宜早排查，莫等爆雷再补。', '天芮星主疾病阻滞，存在内在隐患。', '天芮主纠缠，问题与隐患较多，需关注细节。'],
  天冲: ['天冲星主冲动，变数突至，临机应变方不被动。', '天冲主突，计划常有变，心态要稳、手要快。', '天冲星主变动，需通过竞争获得机会。', '天冲主竞争，冲动但易受挫，需谨慎。'],
  天辅: ['天辅星主辅佐，贵人暗助，善借势者得利。', '天辅主助，多请教、多借力，事半功倍。', '天辅星主文昌，利于学业文书，可借力。', '天辅主贵人相助，宜借助资源与团队力量。'],
  天禽: ['天禽星主中正，不偏不倚，守正即吉。', '天禽主中，不折腾就是最好的策略。', '天禽星主平稳，宜守成积累，不宜冒进。', '天禽主中正平和，稳扎稳打胜过剑走偏锋。'],
  天心: ['天心星主智谋，深谋远虑者胜，切忌仓促。', '天心主谋，算得清、看得远，方有大成。', '天心星主理性规划，但空亡则效果削弱。', '天心主谋划，宜长远布局，谋定后动。'],
  天柱: ['天柱星主支柱，根基不牢则风雨易摧，宜加固。', '天柱主撑，顶得住压力才能撑得起局面。', '天柱星主压力，与机遇冲突，需谨慎投入。', '天柱主变动压力，财运或运势波动较大。'],
  天任: ['天任星主担当，担子虽重，一步一个脚印最稳。', '天任主责，扛事之人自有厚报，耐得住就有。', '天任星主务实，稳中求进为上。', '天任主厚载，宜脚踏实地，稳中求进。'],
  天英: ['天英星主英华，声名在外而实利有限，宜低调。', '天英主名，盛名之下其实难副，务实最稳。', '天英星主光明，但囚于木宫则能量受限。', '天英主虚火，名气外显但需防表面繁荣。']
};
const SHEN_TXT = {
  值符: ['值符主领导支持，但门迫显示支持受限。', '值符主权威，代表上级关注或支持。', '值符坐镇，心中有主，大势不失。', '值符为吉神，可缓解不利影响，宜把握主导权。'],
  螣蛇: ['螣蛇主虚扰，节外生枝，稳心神可解。', '螣蛇主幻，虚惊多真事少，稳住就是赢。', '螣蛇主虚惊，易有反复，需防口舌与变卦。', '螣蛇缠绕，提示行事时可能遇到突发状况。'],
  太阴: ['太阴主阴助，贵人暗中成全，闷声可成事。', '太阴主隐，暗处有人帮，不必张扬。', '太阴主暗财或稳定收益，适合长期布局。', '太阴主隐性资源，暗中助力可挖掘。'],
  六合: ['六合主和合，人缘即资源，多走动有好处。', '六合主合，谈合作、处关系都是加分项。', '六合主合作助力，但空亡则效果有限。', '六合主协调，合作可带来助力，需筛选。'],
  白虎: ['白虎主凶煞，冲突难免，避其锋芒为上。', '白虎主煞，是非之地莫久留，破财免灾。', '白虎主竞争激烈，需防范风险或意外支出。', '白虎主压力与冲突，需防是非与破耗。'],
  玄武: ['玄武主暗昧，真假难辨，关键处多核实。', '玄武主暗，防小人设局，合同与账目要清白。', '玄武主暗藏玄机，可能存在隐瞒或不确定。', '玄武主隐藏或欺骗，信息莫全信，眼见未必实。'],
  九地: ['九地主厚藏，低调蓄力，时机未到不露锋。', '九地主静，深挖护城河，厚积而薄发。', '九地主稳重保守，缺乏突破性思维。', '九地主稳守为吉，宜扎实积累，不宜张扬。'],
  九天: ['九天主高远，志向可嘉，落地需分步。', '九天主扬，志气可鼓，步子要小。', '九天主高远目标，实际落地困难。', '九天主发展空间，但需脚踏实地。']
};
/* 天盘加地盘格局（旧站风格） */
function ganGeJu(tg, dg) {
  const key = tg + dg;
  const map = {
    '己壬': ['己土克壬水，格局为内部消耗。', '己壬为遁戊格，主隐藏实力或暗中谋划，需低调行事。', '己壬相克，内部消耗明显，宜先理顺内部。'],
    '癸丁': ['癸丁相合，表面合作但实际有隔阂。', '癸丁为丁奇入墓，主机遇与挑战并存，需谨慎把握。', '癸丁相克，内部矛盾，宜化解后再进。'],
    '乙丙': ['乙丙格局，表面合作实则暗藏竞争。', '乙木生丙火，外部助力，但空亡削弱效果。', '乙丙相生，有生助之缘，借力可成。'],
    '辛戊': ['辛戊格局，资产易被分散。', '辛金助戊土，财星力量增强，但需防分散。', '辛戊相生，财源有补充但需时间积累。'],
    '壬癸': ['壬癸格局，资金流动性强但风险高。', '壬水生癸水，外部资源可补充。', '壬癸相生，有外部助力，但空亡则效果有限。'],
    '己丁': ['己丁相生，有基础支持，可借力推进。', '己土生丁火，根基托举有力。'],
    '庚戊': ['庚戊相克，格局不利，宜用迂回策略。', '庚金克戊土，制约明显，宜避正面。'],
    '丙戊': ['丙戊相生，有生助之缘，借力能省力。', '丙火生戊土，根基得助，稳中有进。'],
    '乙丁': ['乙丁相生，有生助之力，宜顺势而为。', '乙木生丁火，外部助力增强。'],
    '丁壬': ['丁壬相合，表面和谐但需防变数。', '丁壬合化，宜以和为贵，防节外生枝。'],
    '庚丁': ['庚丁相克，制约明显，宜用迂回策略化解。', '庚金克丁火，外部压制，先解束缚再谈进取。'],
    '辛丁': ['辛丁相克，彼此制约，易生矛盾与消耗。', '辛金克丁火，受制于人，需防被动局面。'],
    '癸戊': ['癸戊相克，格局有制，宜谨慎决策。', '癸水克戊土，受制明显，先稳后进。'],
    '壬丁': ['壬丁相合，有合作之象，宜把握分寸。', '壬水与丁火，表面调和，实际需多核验。'],
    '庚乙': ['庚乙相合，有化解之象，宜以柔克刚。', '庚金乙木，刚柔相济，可化干戈为玉帛。'],
    '丙辛': ['丙辛相合，有合化之象，宜顺势而为。', '丙辛合，表面和谐，暗藏变数，需留余地。'],
    '戊乙': ['戊乙相克，制约明显，宜迂回推进。', '戊土克乙木，我克对方，消耗自身能量。'],
    '己庚': ['己庚相生，有生助之缘，宜借力。', '己土生庚金，根基托举有力。'],
    '壬戊': ['壬戊相克，格局有制，需谨慎决策。', '壬水克戊土，受制于人，宜避其锋。']
  };
  const pool = map[key] || [`${tg}${dg}格局，${ganWxText(tg, dg)}，需结合宫位状态综合判断。`, `${tg}加${dg}，格局互有生克，宜顺势而为。`, `${tg}${dg}相配，局面有变数，谋定后动。`];
  return pick(pool);
}
function ganWxText(tg, dg) {
  const tw = GAN_WX[tg], dw = GAN_WX[dg];
  if (tw === dw) return '同气相求';
  if (KE[tw] === dw) return tg + '克' + dg;
  if (KE[dw] === tw) return dg + '克' + tg;
  if (SHENG[tw] === dw) return tg + '生' + dg;
  return dg + '生' + tg;
}
/* 五行生克解读 */
const WX_INTERP = {
  '生我': ['得外部生助，可借力而为。', '有贵人助力，但需把握时机。', '外援可资，宜顺势借力。', '得底层滋养，根基托举有力。'],
  '我生': ['付出多回报少，宜量力而行。', '消耗自身能量，需控制投入。', '我生对方，需防止过度付出。', '气机外散，前期投入大，回报在后头。'],
  '克我': ['外部压力大于自身能力，需借力。', '受制于人，先解束缚再谈进取。', '外部压制，宜避其锋、养其气。', '对方克制求测人，需消耗自身资源应对。'],
  '我克': ['我克对方，能控制局面，但需防消耗。', '我克对方，主动权在手，宜把握节奏。', '克制对方，过程可控，但需防用力过猛。', '我克对方，控制力强，需注意过度消耗。'],
  '同气': ['同气相求，合力较足，惟忌单一化。', '同性帮扶，有稳定之力。', '同气相连，步调一致，事半功倍。']
};
function wxInterp(rel) { return pick(WX_INTERP[rel] || WX_INTERP['同气']); }
/* 空亡驿马解读 */
const KONG_MA = {
  kong: ['空亡，根基未实，机会不稳定，需主动寻找。', '空亡显示助力不稳定，需主动争取。', '空亡，事未成局，需等待时机。', '空亡削弱效果，实际支持不足。'],
  nokong: ['无空亡，根基稳固，可稳步推进。', '无空亡，状态明确，按部就班即可。', '无空亡，基础坚实，宜务实经营。'],
  ma: ['驿马动，有变动趋势，可主动求变。', '驿马在寅，变动性强，需抓住短期机会。', '驿马动，可通过变动激活运势。', '驿马主变动，需灵活应对。']
};

/* ============ 四、主题文案（拆解问题池，旧站风格） ============ */
const THEME_QUESTIONS = {
  career: [['今年事业发展的整体趋势如何？', '升迁机会是否存在？需要哪些条件？', '当前状态对事业发展的阻碍是什么？'], ['当前工作状态与潜力', '未来职业发展走向', '需要关注的机遇与风险'], ['项目当前基础是否稳固？', '项目推进过程中会遇到哪些阻碍？', '最终能否达成预期目标？']],
  wealth: [['当前财运状态如何？', '投资机会与风险点在哪里？', '是否适合近期加大投资？'], ['投资机会的可行性与风险？', '财运发展潜力与阻碍是什么？', '需要采取什么策略提升财运？'], ['生意当前盈利能力如何？', '生意未来发展潜力与风险？', '当前经营状态是否稳定？']],
  love: [['这段感情婚姻的当前状态如何？', '感情的未来发展走向是顺利还是阻碍？', '是否存在潜在矛盾或阻碍？'], ['两人目前的关系状态如何？', '未来的相处趋势是和谐还是冲突？', '是否存在潜在的风险或阻碍？'], ['双方是否有重新建立关系的可能？', '当前复合的阻碍在哪里？', '需要采取什么行动来促进复合？']],
  health: [['当前身体状况如何？', '疾病发展趋势是好转还是恶化？', '需要采取哪些针对性措施？'], ['疾病当前状态如何？', '疾病何时能好转？', '需要采取什么措施加速康复？']],
  study: [['学业考试的整体状态如何？', '能否顺利通过考试或取得好成绩？', '需要重点关注哪些方面？'], ['学业考试的整体状态与能量', '考试结果的趋势判断', '关键影响因素与应对策略'], ['考试能否顺利通过', '当前备考状态与潜在风险', '是否需要调整策略或寻求外部帮助']],
  coop: [['合作谈判的当前状态与对方意图', '谈判结果的走向与可行性', '需要关注的重点与应对策略'], ['合作能否达成？', '对方真实意图如何？', '当前谈判状态与突破口？']],
  travel: [['出行搬迁的可行性如何？', '出行过程中的顺利程度与潜在风险？', '搬迁后的环境适应与发展前景？'], ['出行是否顺利', '出行过程中的状态与风险', '是否需要调整策略或注意事项']],
  legal: [['官司纠纷的当前状态与吉凶', '诉讼过程中的关键影响因素', '最终结果倾向与应对策略'], ['官司的胜负趋势如何？', '当前诉讼状态对我方有利还是不利？', '需要采取哪些策略提高胜诉概率？']],
  general: [['当前整体运势的吉凶状态如何？', '未来运势的发展趋势是上升还是下滑？', '需要重点关注哪些方面'], ['当前整体运势状态如何？', '未来运势走向是顺遂还是阻滞？', '未来一段时间运势走向是顺遂还是阻滞？']]
};

/* ============ 五、生成报告 ============ */
function buildReport(pan, question) {
  const { panData, panInfo, cal } = pan;
  const theme = detectTheme(question);
  const bazi = cal.bazi;
  const yearGz = bazi.year;
  const nowYear = cal.now.getFullYear();

  /* 用神宫位 */
  const dayGong = locateGan(panData, bazi.day[0]);
  const hourGong = locateGan(panData, bazi.hour[0]);
  const yongLoc = {
    '开门': locateBaMen(panData, '开门'),
    '生门': locateBaMen(panData, '生门'),
    '休门': locateBaMen(panData, '休门'),
    '死门': locateBaMen(panData, '死门'),
    '伤门': locateBaMen(panData, '伤门'),
    '景门': locateBaMen(panData, '景门'),
    '值符': locateBaShen(panData, '值符'),
    '六合': locateBaShen(panData, '六合'),
    '白虎': locateBaShen(panData, '白虎'),
    '天芮': locateJiuXing(panData, '天芮'),
    '天心': locateJiuXing(panData, '天心'),
    '天辅': locateJiuXing(panData, '天辅'),
    '戊': locateGan(panData, '戊'),
    '庚': locateGan(panData, '庚'),
    '丁': locateGan(panData, '丁'),
    '年干': locateGan(panData, yearGz[0]),
    '年命': locateGan(panData, (panInfo && panInfo.yearGan) || yearGz[0]),
    '日干': dayGong,
    '时干': hourGong,
    '驿马': locateMa(panData)
  };
  function resolveYong(name) {
    if (name === '日干') return dayGong;
    if (name === '时干') return hourGong;
    return yongLoc[name] || 0;
  }
  const yongGongList = theme.yongs.map(n => ({ name: n, g: resolveYong(n) })).filter(y => y.g);

  const L = [];
  /* 五行核对清单（随机含/不含中宫，与旧站一致） */
  L.push('【五行核对清单】');
  const listOrder = Math.random() < 0.5 ? [5, 4, 6, 9, 2, 3, 7, 8, 1] : [4, 9, 2, 3, 7, 8, 1, 6];
  for (const g of listOrder) L.push(gongLabel(g));
  L.push('');

  /* 一、盘面信息与用神 */
  L.push('【一、盘面信息与用神】');
  const dayD = panData[dayGong] || {};
  const hourD = panData[hourGong] || {};
  const stDay = stateShort(dayD);
  const stHour = stateShort(hourD);
  L.push(`1. 求测人（日干）：${gongLabel(dayGong)}，地盘【${dayD.diPan || ' '}】，天盘【${dayD.tianPan || ' '}】，九星【${dayD.jiuXing || ' '}】，八门【${dayD.baMen || ' '}】，八神【${dayD.baShen || ' '}】${stDay ? '。【状态：' + stDay + '】' : ''}`);
  L.push(`2. 事体与对方（时干）：${gongLabel(hourGong)}，地盘【${hourD.diPan || ' '}】，天盘【${hourD.tianPan || ' '}】，九星【${hourD.jiuXing || ' '}】，八门【${hourD.baMen || ' '}】，八神【${hourD.baShen || ' '}】${stHour ? '。【状态：' + stHour + '】' : ''}`);
  /* 用神标题（随机"问"字与格式） */
  const qMark = Math.random() < 0.6 ? '问' : '';
  const withColon = Math.random() < 0.7;
  const generalTag = theme.key === 'general' ? pick([`用户问【${theme.tag}】，取用神为【${theme.yongs[0]}】（代表整体运势的吉凶状态）`, `用户问"${theme.tag}"，属于综合运势，取用神为"${theme.yongs[0]}"和"${theme.yongs[1]}"`, `用户问【${theme.tag}】，取用神为【${theme.yongs[0]}】（代表整体运势的根基与能量）`]) : null;
  if (generalTag) {
    L.push(`3. 核心用神自动匹配：${generalTag}。`);
    for (const y of yongGongList) {
      const d = panData[y.g];
      L.push(`   - ${y.name}：${gongLabel(y.g)}，地盘【${d.diPan || ' '}】，天盘【${d.tianPan || ' '}】，九星【${d.jiuXing || ' '}】，八门【${d.baMen || ' '}】，八神【${d.baShen || ' '}】${stateShort(d) ? '。【状态：' + stateShort(d) + '】' : ''}`);
    }
  } else {
    L.push(`3. 核心用神自动匹配（${qMark}${theme.tag}）${withColon ? '：' : ''}${theme.yongs.join('、')}`);
    for (const y of yongGongList) {
      const d = panData[y.g];
      L.push(`   - ${y.name}：${gongLabel(y.g)}，地盘【${d.diPan || ' '}】，天盘【${d.tianPan || ' '}】，九星【${d.jiuXing || ' '}】，八门【${d.baMen || ' '}】，八神【${d.baShen || ' '}】${stateShort(d) ? '。【状态：' + stateShort(d) + '】' : ''}`);
    }
  }
  L.push('');

  /* 二、针对用户问题的定向拆解 */
  L.push('【二、针对用户问题的定向拆解】');
  L.push(pick(['1. 用户问题拆解：', '1. 把用户的问题拆解成2-3个具体的诉求，紧扣用户所问的核心：', '1. 用户诉求拆解：']));
  const qPool = THEME_QUESTIONS[theme.key] || THEME_QUESTIONS.general;
  for (const s of pick(qPool)) L.push(`   - ${s}`);
  L.push('');
  L.push(pick(['2. 直接回答：', '2. 结合日干宫与时干宫的五行生克和星门神象意：', '2. 结合日干宫与时干宫分析：', '2. 盘面状态分析：', '2. 状态与走向判断：', '2. 结合日干宫与时干宫的五行生克和星门神象意，直接回答用户：']));
  for (const s of directAnswers(theme, panData, dayGong, hourGong, yongGongList, panInfo, nowYear)) L.push(`   - ${s}`);
  L.push('');

  /* 三、用神落宫七步解读法 */
  L.push('【三、用神落宫七步解读法】');
  const yongs = yongGongList.length ? yongGongList : [{ name: '生门', g: resolveYong('生门') }];
  let idx = 1;
  for (const y of yongs) {
    const d = panData[y.g] || {};
    const gz = gongShort(y.g);
    L.push(`${idx}. ${y.name}（${gz}${d.gongWuXing || ''}）：`);
    if (y.g === 5) {
      L.push(`   - 地盘天干${d.diPan || '空'}：${pick(DI_PAN_TXT[d.diPan] || ['空亡状态，需主动布局。'])}`);
      L.push(`   - 八门休门：休门主休养，宜蓄力待机。`);
      L.push(`   - 九星空亡：缺乏明确的天时助力，需主动创造机会。`);
      L.push(`   - 八神空亡：外缘支持不足，需依靠自身实力。`);
      L.push(`   - 天盘空加地盘${d.diPan || '空'}：格局单一，缺乏变化动力。`);
      L.push(`   - ${gz}${d.gongWuXing || '土'} 生 0宫土 → ${wxInterp('同气')}`);
      L.push(`   - 空亡与驿马：${pick(KONG_MA.kong)}`);
    } else {
      const dp = d.diPan || '空';
      const tm = d.tianPan;
      const xName = (d.jiuXing || '').replace(/\(禽\)$/, '');
      L.push(`   - 地盘天干${dp}：${pick(DI_PAN_TXT[dp] || ['空亡状态，需主动布局。'])}`);
      L.push(`   - 八门：${pick(MEN_TXT[d.baMen] || ['八门空亡，缺乏外部助力。'])}`);
      L.push(`   - 九星：${pick(XING_TXT[xName] || ['缺乏明确的天时助力。'])}`);
      L.push(`   - 八神：${pick(SHEN_TXT[d.baShen] || ['外缘支持不足。'])}`);
      if (tm) L.push(`   - 天盘${tm}加地盘${dp}：${ganGeJu(tm, dp)}`);
      else L.push(`   - 天盘空加地盘${dp}：格局单一，缺乏变化动力。`);
      /* 五行生克：宫五行 vs 求测人宫（中宫土） */
      const gWx = d.gongWuXing || '土';
      const rel = relGong(gWx);
      L.push(`   - ${gz}${gWx} ${rel[0]} 0宫土 → ${rel[1]}`);
      /* 空亡驿马 */
      const km = [];
      if (d.kongWang) km.push(pick(KONG_MA.kong));
      else km.push(pick(KONG_MA.nokong));
      if (d.maXing) km.push(pick(KONG_MA.ma));
      L.push(`   - 空亡与驿马：${km.join('；')}`);
    }
    idx++;
  }
  L.push('');

  /* 四、分项论断与实操建议 */
  L.push('【四、分项论断与实操建议】');
  L.push('1. 趋势判断：');
  for (const s of trendJudgments(theme, panData, dayGong, yongGongList, panInfo, nowYear)) L.push(`   ${s.startsWith('-') ? s : '- ' + s}`);
  L.push('');
  L.push('2. 行动建议：');
  for (const s of actionAdvice(theme, panData, dayGong, yongGongList)) L.push(`   - ${s}`);
  L.push('');
  L.push('3. 总结断语：');
  L.push(`   ${summaryLine(theme, panData, dayGong, yongGongList, yearGz, panInfo, nowYear)}`);
  L.push('');
  L.push('本推演仅为传统民俗文化参考，不构成任何商业或法律建议。');

  return L.join('\n');
}

/* 宫五行与求测人土的关系 */
function relGong(gWx) {
  const ren = '土';
  if (gWx === ren) return ['生', wxInterp('同气')];
  if (KE[gWx] === ren) return ['克', wxInterp('克我')];
  if (KE[ren] === gWx) return ['克', wxInterp('我克')];
  if (SHENG[gWx] === ren) return ['生', wxInterp('生我')];
  return ['生', wxInterp('我生')];
}

/* ============ 二、直接回答（旧站句式） ============ */
function directAnswers(theme, panData, dayGong, hourGong, yongGongList, panInfo, nowYear) {
  const dd = panData[dayGong] || {};
  const hd = panData[hourGong] || {};
  const dg = gongShort(dayGong), hg = gongShort(hourGong);
  const dWx = dd.gongWuXing || '土', hWx = hd.gongWuXing || '木';
  const topic = topicOf(theme.key);
  const out = [];
  /* 状态句 */
  const relDH = relPair(dWx, hWx);
  const dayStateTxt = dd.kongWang ? '空亡' : (dd.wangShuai || '休');
  const hourStateTxt = hd.kongWang ? '空亡' : (hd.wangShuai || '囚');
  const hourXing = (hd.jiuXing || '').replace(/\(禽\)$/, '');
  const hourMen = hd.baMen || '';
  const hourShen = hd.baShen || '';
  const stPools = [
    `目前处在什么状态？求测人（日干落${dg}${dWx}）与${topic}（时干落${hg}${hWx}）形成${relDH}的关系，${relDH === '木克土' ? '表明' + topic + '面临外部压力，需消耗自身资源应对' : '表明' + topic + '存在外部助力或阻力'}。${hourXing}星（${xingShort(hourXing)}）加${hourMen}${hourShen ? '，' + hourShen + '神' : ''}，显示${topic}存在潜在隐患或变数。`,
    `目前状态：求测人（日干${dg}${dWx}）处于${dayStateTxt}状态，表明当前${topic}处于调整期，行动力不足。事体（时干${hg}${hWx}）为${hourStateTxt}状态，${hourMen}主停滞，${hourShen || ''}主隐藏或不确定性，显示${topic}发展面临瓶颈。`,
    `目前状态：求测人（日干落${dg}${dWx}）${dd.kongWang ? '落空亡宫，根基不稳' : '基础稳固但缺乏主动能量'}；事体（时干落${hg}${hWx}），${hourXing}星${hourShen || ''}临门，显示${topic}处于休整期，需谨慎应对。`,
    `目前处在什么状态？求测人（${dg}${dWx}）与事体（${hg}${hWx}）形成${relDH}，代表${topic}发展面临外部压力或竞争，需消耗自身资源应对。`
  ];
  out.push(pick(stPools));
  /* 走向句 */
  const main = yongGongList[0];
  const mainD = main ? (panData[main.g] || {}) : {};
  const mainG = gongShort(main.g || 5);
  const mainWx = mainD.gongWuXing || '';
  const mainState = stateShort(mainD) || '一般';
  const relMain = mainD.gongWuXing ? relPair(mainD.gongWuXing, '土') : '';
  const wPools = [
    `事情的走向如何？${main.name}落${mainG}${mainWx}，${mainState}，${mainD.kongWang ? '显示' + topic + '机会不稳定，需等待时机' : '显示' + topic + '有推进可能，但需谨慎布局'}。${hg}${hWx}${relDH}，整体趋势${pick(['需谨慎调整策略', '需主动争取，避免坐等', '偏弱但存在转机'])}。`,
    `走向判断：${main.name}落${mainG}${mainWx}，与日干宫土形成${relMain || '生克'}关系，${mainD.wangShuai === '旺' || mainD.wangShuai === '相' ? '有' + topic + '助力' : '阻力较大'}，需通过调整策略突破。`,
    `事情的走向如何？整体趋势${pick(['偏弱，需谨慎调整策略', '不顺，需谨慎应对', '存在转机，需把握时机'])}。${main.name}（${mainG}${mainWx}）${mainD.kongWang ? '空亡' : mainD.wangShuai || ''}，${pick(['显示' + topic + '基础薄弱，投入大于产出', '显示' + topic + '需付出较多努力才能获得收益', '显示' + topic + '存在隐性阻碍，需逐一化解'])}。`,
    `事情走向：${mainD.baMen || main.name}${mainState}，${topic}整体趋势${pick(['需谨慎，短期难突破，长期有转机', '偏缓，稳扎稳打可成', '有波折，但方向可行'])}。`
  ];
  out.push(pick(wPools));
  return out;
}
function relPair(wx1, wx2) {
  if (KE[wx1] === wx2) return wx1 + '克' + wx2;
  if (KE[wx2] === wx1) return wx2 + '克' + wx1;
  if (SHENG[wx1] === wx2) return wx1 + '生' + wx2;
  if (SHENG[wx2] === wx1) return wx2 + '生' + wx1;
  return '同气';
}
function xingShort(x) {
  const map = { 天芮: '病星', 天柱: '损耗', 天蓬: '变动', 天冲: '冲动', 天英: '光明', 天辅: '文昌', 天心: '智谋', 天任: '担当', 天禽: '中正' };
  return map[x] || x;
}
function topicOf(key) {
  return key === 'wealth' ? '财运' : key === 'love' ? '感情' : key === 'health' ? '健康' : key === 'study' ? '学业' : key === 'travel' ? '出行' : key === 'legal' ? '诉讼' : key === 'coop' ? '合作' : key === 'career' ? '事业' : '整体运势';
}

/* ============ 四、趋势判断（旧站句式） ============ */
function trendJudgments(theme, panData, dayGong, yongGongList, panInfo, nowYear) {
  const topic = topicOf(theme.key);
  const dd = panData[dayGong] || {};
  const main = yongGongList[0];
  const mainD = main ? (panData[main.g] || {}) : {};
  const out = [];
  const ok = !dd.kongWang && (dd.wangShuai === '旺' || dd.wangShuai === '相');
  out.push(pick(ok
    ? [
        `今年${topic}整体态势向好，宜顺势推进，把握关键节点。`,
        `今年${topic}大势偏顺，${mainD.wangShuai === '旺' || mainD.wangShuai === '相' ? main.name + '得势，可择机而动' : '但' + main.name + '受制，需谨慎把握'}。`,
        `当前${topic}状态尚可，${main.name}（${gongShort(main.g)}）${stateShort(mainD) || '一般'}，短期有波动，长期向好。`
      ]
    : [
        `今年${topic}整体处于调整期，${main.name}宫与日干宫的${relPair((mainD.gongWuXing || '木'), '土')}关系显示${pick(['虽有方向但执行受阻', '阻力较大，需突破瓶颈', '存在隐性问题需解决'])}。`,
        `今年${topic}发展整体压力较大，${mainD.kongWang ? main.name + '空亡，机会不稳定' : main.name + '受' + (mainD.wangShuai || '囚') + '，需谨慎'}。`,
        `当前${topic}状态偏弱，${mainD.baMen || main.name}${mainD.kongWang ? '空亡' : (mainD.wangShuai || '')}，${pick(['需先稳固基础再求发展', '短期难有突破，宜以稳为主', '需调整策略方能改善'])}。`
      ]));
  /* 第二句：用神/贵人/节点 */
  const sub = yongGongList[1];
  const subD = sub ? (panData[sub.g] || {}) : null;
  if (subD) {
    out.push(`${sub.name}${subD.kongWang ? '空亡，助力不稳定，需主动争取' : (subD.wangShuai === '旺' || subD.wangShuai === '相' ? '得势，可借力而为' : '受制，需谨慎依赖')}，${pick(['整体需稳中求进', '关键在把握好节奏', '宜守正待时，伺机而动'])}。`);
  } else {
    out.push(pick([`${main.name}落${gongShort(main.g)}${stateShort(mainD) || ''}，${topic}走势${pick(['需结合自身状态调整', '宜以守为主，伺机而动'])}。`, `当前${topic}状态${pick(['中等，有改善空间', '偏弱，需耐心经营'])}，关键在于${pick(['把握时机、主动争取', '稳扎稳打、控制成本'])}。`]));
  }
  /* 节点句 */
  if (panInfo && panInfo.maXing) {
    out.push(`关键节点在农历${maZhiToYue(panInfo.maXing, nowYear)}，驿马动可能带来方向调整机会。`);
  } else {
    out.push(pick(['近期驿马不动，宜保持现有节奏，稳中求进。', '近期以稳为主，待时机成熟再谋变动。']));
  }
  return out;
}
function maZhiToYue(z, nowYear) {
  const map = { 寅: { m: '寅月', r: `${nowYear + 1}年1月-2月` }, 申: { m: '申月', r: `${nowYear}年7月-8月` }, 巳: { m: '巳月', r: `${nowYear}年4月-5月` }, 亥: { m: '亥月', r: `${nowYear}年10月-11月` } };
  const t = map[z];
  return t ? `${t.m}（${t.r}）` : z + '月';
}

/* ============ 行动建议（旧站句式） ============ */
function actionAdvice(theme, panData, dayGong, yongGongList) {
  const topic = topicOf(theme.key);
  const pool = [
    `优先处理现有${topic}中的压力与隐患，避免问题扩大。`,
    `寻求稳定${topic}路径，避免高风险投入，稳字当头。`,
    `与合作伙伴明确权责，${pick(['避免信息不对称导致的损失', '合作条款需逐条把关', '多走动多联络，机会藏在关系里'])}。`,
    `关注变动或异地机会，${pick(['可通过跨区域合作激活运势', '驿马动处藏转机，宜主动求变', '把握短期机会，勿坐等'])}。`,
    `${pick(['控制成本支出，避免过度投入', '调整心态，减少冲动决策', '重大决策多方求证后再定'])}，${pick(['开源更要节流', '留足缓冲余地', '谋定而后动'])}。`,
    `把握${mainYongName(yongGongList)}的时机，${pick(['在熟悉的领域深耕', '借合作之势成事', '稳扎稳打自有回报'])}。`,
    `重要决策多问几个人再定，忌一个人拍板，兼听则明。`,
    `把精力放在能沉淀的事上，少追风口，长期主义最稳。`,
    `对外的承诺先兑现再说，信誉是最好的本钱。`,
    `${pick(['先理顺内部再谋外联', '把内功练好再谈扩张', '现阶段以积累为主'])}。`
  ];
  const out = shuffle(pool).slice(0, 5);
  return out.map(s => themeText(theme.key, s));
}
function mainYongName(yongGongList) { return yongGongList[0] ? yongGongList[0].name : '关键用神'; }

/* ============ 总结断语 ============ */
function summaryLine(theme, panData, dayGong, yongGongList, yearGz, panInfo, nowYear) {
  const topic = topicOf(theme.key);
  const dd = panData[dayGong] || {};
  const main = yongGongList[0];
  const mainD = main ? (panData[main.g] || {}) : {};
  const mainOk = mainD.wangShuai === '旺' || mainD.wangShuai === '相';
  const ma = panInfo && panInfo.maXing;
  const rootState = dd.kongWang ? '尚可但方向待明' : (dd.wangShuai === '旺' || dd.wangShuai === '相' ? '稳固' : '偏弱');
  const pool = [
    `${yearGz}年${topic}根基${rootState}，需以守为攻，${ma ? `${maZhiToYue(ma, nowYear)}驿马动或为转机，` : ''}${main.name}宫${mainOk ? '旺相显示潜力可期' : '偏弱需耐心积累'}，但需警惕资源消耗。`,
    `综合来看，${yearGz}年${topic}宜稳不宜急，${ma ? `待到${maZhiToYue(ma, nowYear)}驿马发动，` : ''}方是转机之时；${main.name}${mainOk ? '有潜力' : '力有未逮'}，守住节奏、控住开销，自可徐徐图之。`,
    `${yearGz}年${topic}大势偏缓，先守成再图进；${ma ? `${maZhiToYue(ma, nowYear)}或有变动之机，届时顺势而为，` : '近期按部就班，'}${main.name}${mainOk ? '旺相可期' : '偏弱需蓄力'}，惟忌贪多求快。`,
    `今年${topic}以稳为主，切莫冒进；${main.name}${mainOk ? '得力，稳扎稳打自有回报' : '平平，耐心经营以待时机'}，${pick(['注意开源节流', '把握节奏，伺机而动', '防耗损，重积累'])}。`,
    `${yearGz}年${topic}关键词为"稳中求进"，${ma ? `${maZhiToYue(ma, nowYear)}驿马动或带来转机，` : ''}${main.name}${mainOk ? '得势可期' : '受制需蓄力'}，宜低调谋划，谨慎把握机遇。`
  ];
  return pick(pool);
}

/* 主题词替换（让解读随所问之事变化） */
const THEME_REPLACE = {
  career: { '事业': '事业', '财运': '事业', '合作': '项目', '感情': '事业' },
  wealth: { '事业': '财运', '合作': '求财途径', '盈利': '进财', '合作方': '财源', '项目': '生意' },
  love: { '事业': '感情', '合作': '感情关系', '盈利': '发展', '合作方': '对方', '项目': '关系' },
  health: { '事业': '健康', '合作': '身体调理', '盈利': '康复', '合作方': '医者' },
  study: { '事业': '学业', '合作': '备考环境', '盈利': '成绩', '合作方': '师长' },
  coop: { '事业': '合作', '项目': '合作项目' },
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

module.exports = { buildReport, detectTheme };
