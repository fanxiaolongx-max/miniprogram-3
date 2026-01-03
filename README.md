# 埃及华人生活服务小程序

一个专为在埃及生活的华人提供实用生活服务的微信小程序，包含汇率查询、天气预警、问路卡片、话费助手、租房信息、二手集市、社区博客等多种实用功能。

## 📱 功能特性

### 主功能区

- **💱 汇率转换** - 实时查询人民币与埃镑汇率，支持快速转换计算
- **🌤️ 天气预警** - 获取开罗地区天气信息
- **🔥 热门活动** - 查看当地华人社区热门活动信息
- **🗣️ 问路卡片** - 中阿互译常用短语，支持分类筛选和复制
- **🔢 话费助手** - 查询运营商余额和充值代码，支持一键拨打
- **🍜 寻味中国** - 中餐厅和超市菜单链接
- **🚕 常用导航** - 常用地点导航（机场、商场、景点等）
- **🏘️ 租房/酒店** - 华人房源信息，支持地图导航
- **♻️ 二手集市** - 二手商品交易信息

### 实用指南

- **🚨 紧急求助** - 紧急联系电话（报警、救护车、消防、大使馆）
- **🛂 签证攻略** - 埃及签证办理指南
- **🎩 小费指南** - 埃及小费文化指南
- **📸 热门打卡** - 推荐旅游景点和打卡地

### 社区博客

- **📰 发现页** - 浏览社区文章和动态，支持分类筛选
- **✍️ 文章发布** - 发布文章，支持富文本编辑、图片上传、地址标注
- **💬 评论互动** - 支持一级评论和二级回复，点赞和收藏功能
- **🔔 消息通知** - 查看评论、点赞、收藏等互动消息
- **📊 个人中心** - 查看我的评论、点赞、收藏和发布记录

### 用户中心

- **👤 用户登录** - 支持手机号+验证码/PIN码登录
- **📝 反馈建议** - 提交功能反馈和建议，支持分类选择

## 🚀 快速开始

### 环境要求

- 微信开发者工具（最新版本）
- Node.js 12.0 及以上版本
- 微信小程序 AppID（用于真机调试）

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd miniprogram-3
```

2. **安装依赖**
```bash
# 安装根目录依赖
npm install

# 安装小程序依赖
cd miniprogram
npm install
```

3. **构建 npm 包**
   - 使用微信开发者工具打开项目
   - 点击【工具】->【构建 npm】
   - 等待构建完成

4. **配置 API 地址**
   - 编辑 `miniprogram/config.js`
   - 修改 `apiBaseUrl` 为你的后端 API 地址
   - 或直接修改各个 API 端点地址

5. **运行项目**
   - 在微信开发者工具中点击【编译】
   - 或使用快捷键 `Ctrl/Cmd + B`

## ⚙️ 配置说明

### API 配置

所有 API 配置都在 `miniprogram/config.js` 文件中：

```javascript
const config = {
  // API 基础地址
  apiBaseUrl: 'https://bobapro.life/api/custom',
  
  // 各个功能 API 端点
  locationsApi: 'https://bobapro.life/api/custom/locations',
  menuLinksApi: 'https://bobapro.life/api/custom/menu-links',
  hotSpotsApi: 'https://bobapro.life/api/custom/hot-spots',
  rentalsApi: 'https://bobapro.life/api/custom/rentals',
  exchangeRateApi: 'https://bobapro.life/api/custom/exchange-rate',
  weatherApi: 'https://bobapro.life/api/custom/weather',
  hotActivityApi: 'https://bobapro.life/api/custom/hot-activity',
  translationApi: 'https://bobapro.life/api/custom/translation',
  phoneHelperApi: 'https://bobapro.life/api/custom/phone-helper',
  secondHandApi: 'https://bobapro.life/api/custom/second-hand',
  visaGuideApi: 'https://bobapro.life/api/custom/visa-guide',
  tipGuideApi: 'https://bobapro.life/api/custom/tip-guide',
  feedbackApi: 'https://bobapro.life/api/custom/feedback',
}
```

### 域名配置

在微信公众平台配置以下域名：

1. **request 合法域名** - 用于 API 请求
2. **downloadFile 合法域名** - 用于下载外部图片

配置路径：微信公众平台 -> 开发 -> 开发管理 -> 开发设置 -> 服务器域名

## 📋 API 接口说明

### 通用返回格式

所有 API 支持多种返回格式，代码会自动适配：

- **直接数据**：`[{...}]` 或 `"字符串"`
- **包装对象**：`{ data: [...] }`
- **命名对象**：`{ locations: [...] }`

### 错误处理

- 状态码非 200 视为失败
- `success: false` 视为失败
- 返回数据为空视为失败
- 格式不符合要求视为失败

所有错误都会显示提示："获取数据失败，请稍后重试"，并提供重试功能。

### 主要 API 端点

#### 1. 常用地点导航
- **端点**：`/api/custom/locations`
- **方法**：GET
- **返回**：地点列表（包含 id, name, address, latitude, longitude, image）

#### 2. 菜单链接
- **端点**：`/api/custom/menu-links`
- **方法**：GET
- **返回**：菜单链接列表（包含 id, name, url, title）

#### 3. 汇率查询
- **端点**：`/api/custom/exchange-rate`
- **方法**：GET
- **返回**：汇率数值或对象（包含 rate, updatedAt）

#### 4. 天气信息
- **端点**：`/api/custom/weather`
- **方法**：GET
- **返回**：天气字符串或对象（包含 weather, condition, temperature）

#### 5. 反馈提交
- **端点**：`/api/custom/feedback`
- **方法**：POST
- **参数**：
  - `content`: 反馈内容（必填）
  - `category`: 功能分类（可选）
  - `userInfo`: 用户信息对象（自动包含）
    - `nickName`: 用户昵称
    - `avatarUrl`: 用户头像
    - `gender`: 性别
    - `country`, `province`, `city`: 地区信息

### 博客/社区 API

#### 1. 用户认证
- **登录**：`/api/auth/user/login` 或 `/api/auth/user/login-with-code`
- **获取当前用户**：`/api/auth/user/me`
- **登出**：`/api/auth/user/logout`
- **认证方式**：Token（`Authorization` 头或 `x-user-token` 头）

#### 2. 文章管理
- **获取文章列表**：`/api/blog-admin/posts`
- **获取文章详情**：`/api/blog-admin/posts/:id`
- **创建/更新文章**：`/api/blog-admin/posts` (POST/PUT)
- **删除文章**：`/api/blog-admin/posts/:id` (DELETE)

#### 3. 评论系统
- **创建评论**：`/api/blog-admin/posts/:postId/comments` (POST)
  - 一级评论：`parentId` 为 `null`
  - 二级评论：`parentId` 为一级评论ID
  - 评论者信息通过 Token 自动识别
- **点赞/取消点赞评论**：`/api/blog-admin/comments/:commentId/like` (POST/DELETE)
- **删除评论**：`/api/blog-admin/posts/:postId/comments/:commentId` (DELETE)

#### 4. 消息通知
- **获取我的消息**：`/api/blog-admin/my-posts-interactions`
  - 支持新结构：`{ data: { items: [...], pagination: {...}, notifications: {...} } }`
  - 兼容旧结构：`{ data: { comments: [...], likes: [...], favorites: [...] } }`
  - 每个消息项包含 `type` 字段（`comment`/`like`/`favorite`）
- **标记消息已读**：`/api/blog-admin/my-posts-interactions/mark-as-read`

详细 API 文档请查看 `miniprogram/config.js` 和 `miniprogram/utils/blogApi.js` 中的注释说明。

## 📁 项目结构

```
miniprogram-3/
├── miniprogram/              # 小程序主目录
│   ├── app.js               # 小程序入口文件
│   ├── app.json             # 小程序全局配置
│   ├── app.wxss             # 小程序全局样式
│   ├── config.js            # API 配置文件
│   ├── page/                # 页面目录
│   │   ├── component/       # 首页
│   │   ├── discover/        # 发现页（文章列表）
│   │   ├── my/              # 我的页面
│   │   ├── article-detail/  # 文章详情页
│   │   ├── article-admin/   # 文章管理页
│   │   ├── article-edit/   # 文章编辑页
│   │   ├── my-comments/     # 我的评论
│   │   ├── my-messages/     # 我的消息
│   │   ├── my-likes/        # 我的点赞
│   │   ├── my-favorites/    # 我的收藏
│   │   ├── exchange-rate/   # 汇率转换
│   │   ├── translation/     # 问路卡片
│   │   ├── phone-helper/    # 话费助手
│   │   ├── second-hand/     # 二手集市
│   │   ├── visa-guide/      # 签证攻略
│   │   ├── tip-guide/       # 小费指南
│   │   ├── hot-activity/    # 热门活动
│   │   └── weather/         # 天气预警
│   ├── utils/               # 工具函数目录
│   │   ├── blogApi.js       # 博客API封装
│   │   ├── authApi.js       # 认证API封装
│   │   ├── authHelper.js    # 认证辅助函数
│   │   └── ...              # 其他工具函数
│   ├── components/          # 公共组件
│   │   ├── article-meta/    # 文章元信息组件
│   │   ├── rich-text-editor/ # 富文本编辑器
│   │   └── number-keyboard/  # 数字键盘组件
│   └── common/              # 公共样式和模板
├── cloudfunctions/           # 云函数目录
├── project.config.json       # 项目配置
└── package.json             # 项目依赖
```

## 🎨 功能特点

- ✅ **统一错误处理** - 所有 API 调用都有完善的错误处理和重试机制
- ✅ **深色模式支持** - 自动适配系统深色模式
- ✅ **响应式设计** - 适配不同屏幕尺寸
- ✅ **图片错误处理** - 自动使用占位图
- ✅ **数据格式兼容** - 支持多种 API 返回格式
- ✅ **用户认证** - 支持手机号+验证码/PIN码登录，Token自动管理
- ✅ **评论系统** - 支持一级评论和二级回复，评论者信息自动识别
- ✅ **消息通知** - 支持评论、点赞、收藏等消息通知，未读数量提醒
- ✅ **富文本编辑** - 支持文章富文本编辑，图片上传，地址标注
- ✅ **用户反馈** - 支持分类反馈和建议提交

## 🔧 开发说明

### 添加新功能

1. 在 `miniprogram/page/` 下创建新页面
2. 在 `app.json` 的 `pages` 数组中注册页面
3. 在 `config.js` 中添加 API 配置
4. 实现页面逻辑和 UI

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循微信小程序开发规范
- 统一使用中文注释

### 调试

- 开发环境：在微信开发者工具中调试
- 真机调试：使用微信开发者工具的【预览】或【真机调试】功能
- 日志查看：使用 `console.log` 输出日志，在开发者工具的控制台查看

## 📝 更新日志

### v2.0.0
- ✅ 新增社区博客功能
- ✅ 实现用户认证系统（手机号+验证码/PIN码登录）
- ✅ 添加文章发布、编辑、管理功能
- ✅ 实现评论系统（支持一级评论和二级回复）
- ✅ 添加消息通知功能（评论、点赞、收藏）
- ✅ 支持富文本编辑和图片上传
- ✅ 实现点赞、收藏、评论等互动功能
- ✅ 优化消息数据结构兼容性（支持新/旧格式）

### v1.0.0
- ✅ 完成所有核心功能开发
- ✅ 实现统一的错误处理机制
- ✅ 支持深色模式
- ✅ 添加用户反馈功能
- ✅ 完善 API 文档

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请通过小程序内的"反馈建议"功能提交。

---

**注意**：
- 本项目需要配置后端 API 服务才能正常使用。请确保 API 服务正常运行，并在微信公众平台配置正确的域名白名单。
- 博客/社区功能需要后端支持用户认证、文章管理、评论系统等 API。
- 消息通知 API 支持两种数据结构格式，代码会自动适配：
  - 新格式：`{ data: { items: [...], pagination: {...}, notifications: {...} } }`
  - 旧格式：`{ data: { comments: [...], likes: [...], favorites: [...] } }`
