# 奇门遁甲·推演天机（重建版）

原站 qimendun.net 的完整可部署源码重建版。前端 4 页面、历法/排盘/报告引擎、后端 API、卡密会员体系，均已实现并通过与线上站的逐字段对拍验证。

## 目录结构

```
qimendun/
├── server.js              # 后端服务（9 个 API + 静态托管）
├── package.json           # 依赖：express / qrcode / lunar-javascript
├── lib/
│   ├── ganzhi.js          # 历法模块（农历/八字/节气/旬空/驿马，基于 lunar-javascript）
│   ├── qimen.js           # 奇门排盘引擎（地盘/天盘/九星/八门/八神/隐干/旺衰/门迫）
│   └── report.js          # 报告生成器（六段结构 + 主题识别）
├── public/                # 前端静态资源
│   ├── index.html         # 首页（玄女封面 + 数据统计）
│   ├── qimen.html         # 起局页（八字卡片/九宫盘/报告预览/付费解锁）
│   ├── profile.html       # 个人中心（会员状态/卡密兑换）
│   ├── poster.html        # 海报分享页
│   ├── manifest.json      # PWA 清单
│   ├── share-cover.jpg    # 封面图
│   ├── icon-192/512/1024.png、apple-touch-icon.png
│   └── wechat_pay.jpg     # 收款码【占位图，部署前请替换为您的微信收款码】
├── scripts/
│   └── gen-cards.js       # 卡密生成器
└── data/                  # 运行时自动生成（db.json 用户/留言/计数、cards.json 卡密池）
```

## 快速启动

```bash
npm install        # 安装依赖（express、qrcode、lunar-javascript）
npm start          # 或 node server.js
# 访问 http://localhost:3000
```

- 端口可用环境变量 `PORT` 覆盖，默认 3000。
- 数据无需数据库，首次启动自动创建 `data/db.json`（用户、留言、统计）与 `data/cards.json`（卡密池）。

## Netlify 免费部署（测试期推荐，无需银行卡/手机验证）

项目已内置 Netlify 适配（`netlify.toml` + `netlify/functions/server.js`，用 serverless-http 包装 Express，数据自动切内存模式）。

1. 打开 netlify.com → 用 GitHub 登录（Sign up with GitHub）→ 授权
2. 控制台点「Add new site → Import an existing project」→ GitHub → 选 `qimendun` 仓库
3. 构建配置自动读取 `netlify.toml`（Build `npm install`、Publish `public`、函数目录已配），直接点 **Deploy site**
4. 等 1~2 分钟，获得 `https://xxx.netlify.app` 网址

> ⚠️ **数据说明**：Netlify Functions 无持久磁盘，数据存进程内存，重新部署会重置（适合功能测试）。
> 正式运营请部署到云服务器（`node server.js`，数据落盘 `data/`），或后续把数据层换成云数据库。

## 接口清单

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/stats` | 首页统计（起局次数/展示数/用户数） |
| POST | `/api/user/init` | 设备指纹初始化用户（body: `deviceId, ref`） |
| GET | `/api/user/profile?userId=` | 个人中心信息 |
| GET | `/api/user/status?userId=` | 会员状态（`isVip, vipExpire`） |
| POST | `/api/qimen` | 起局+完整报告（body: `question, birthYear, userId`，用服务器当前时间） |
| POST | `/api/pay/verify` | 卡密解锁（body: `cardKey, userId`） |
| POST | `/api/card/pool-claim` | 付费后领取体验卡（body: `userId`） |
| POST | `/api/message` | 留言（body: `userId, contact, content`） |
| GET | `/api/qrcode?text=` | 二维码 PNG |

## 卡密生成（会员开通）

```bash
npm run gen-cards 50 30    # 生成 50 张 30 天卡
npm run gen-cards 10 365   # 生成 10 张年卡
```

卡密写入 `data/cards.json`，发放给用户后在其个人中心输入即可开通会员。

## 部署前必做

1. **收款码**：`public/wechat_pay.jpg` 已内置您的微信收款码；如需更换，用同名图片覆盖即可（页面按原比例显示，不会变形）。
2. **微信内付款提示**：`qimen.html` 会根据 UA 显示"长按识别/截图扫一扫"等提示，无需改动。
3. **PWA/海报依赖外网**：`poster.html` 通过 bootcdn 加载 html2canvas（海外/内网部署时需可访问该 CDN，或改为本地引入）。
4. **HTTPS**：PWA 与微信分享需要 HTTPS 域名，建议用 Nginx/Caddy 反代（配置示例见下）。
5. **公众号/分享卡片**：首页 `og:image` 指向 `https://www.qimendun.net/share-cover.jpg`，部署后请改成您的域名。

### Nginx 反代示例

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    ssl_certificate     /path/fullchain.pem;
    ssl_certificate_key /path/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 排盘正确性验证

项目自带对拍脚本，可将本地输出与线上样本逐字段比对：

```bash
node test_lunar.js    # 历法：农历/八字/节气 对拍
node test_paipan.js   # 排盘：九宫 15 字段对拍
node test_e2e.js      # 端到端：全 142 项对拍（需先启动 server）
```

> 本程序为传统民俗文化工具，仅供娱乐参考，不构成任何决策建议。
