# 埃及华人生活服务小程序

一个专为在埃及生活的华人提供实用生活服务的微信小程序，包含汇率查询、天气预警、问路卡片、话费助手、租房信息、二手集市等多种实用功能。

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

### 用户中心

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

详细 API 文档请查看 `miniprogram/config.js` 中的注释说明。

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
│   │   ├── my/              # 我的页面
│   │   ├── exchange-rate/   # 汇率转换
│   │   ├── translation/     # 问路卡片
│   │   ├── phone-helper/    # 话费助手
│   │   ├── second-hand/     # 二手集市
│   │   ├── visa-guide/      # 签证攻略
│   │   ├── tip-guide/       # 小费指南
│   │   ├── hot-activity/    # 热门活动
│   │   └── weather/         # 天气预警
│   ├── util/                # 工具函数
│   └── common/              # 公共组件和样式
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

**注意**：本项目需要配置后端 API 服务才能正常使用。请确保 API 服务正常运行，并在微信公众平台配置正确的域名白名单。
