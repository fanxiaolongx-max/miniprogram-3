# BobaPro API 开发指南

本文档详细说明微信小程序调用的所有 BobaPro API 接口，包括请求方式、参数说明、返回格式和示例。

## 📋 目录

- [基础配置](#基础配置)
- [通用说明](#通用说明)
- [API 接口列表](#api-接口列表)
  - [1. 常用地点导航 API](#1-常用地点导航-api)
  - [2. 菜单链接 API（寻味中国）](#2-菜单链接-api寻味中国)
  - [3. 热门打卡地 API](#3-热门打卡地-api)
  - [4. 租房信息 API](#4-租房信息-api)
  - [5. 汇率 API](#5-汇率-api)
  - [6. 出行风向标 API（天气）](#6-出行风向标-api天气)
  - [7. 热门活动 API](#7-热门活动-api)
  - [8. 问路卡片 API（中阿互译）](#8-问路卡片-api中阿互译)
  - [9. TTS 语音合成 API](#9-tts-语音合成-api)
  - [10. 话费助手 API](#10-话费助手-api)
  - [11. 尼罗河热映 API](#11-尼罗河热映-api)
  - [12. 二手集市 API](#12-二手集市-api)
  - [13. 签证攻略 API](#13-签证攻略-api)
  - [14. 小费指南 API](#14-小费指南-api)
  - [15. 防骗预警 API（黑名单）](#15-防骗预警-api黑名单)
  - [16. 反馈建议 API](#16-反馈建议-api)
  - [17. 博客管理 API（文章增删改查）](#17-博客管理-api文章增删改查)
- [HTML 内容格式说明](#html-内容格式说明)
- [图片和视频处理](#图片和视频处理)
- [错误处理](#错误处理)
- [常见问题](#常见问题)

---

## 基础配置

### API 基础域名

```
https://bobapro.life
```

### API 基础路径

```
/api/custom
```

### 完整 API 地址格式

```
https://bobapro.life/api/custom/{endpoint}
```

---

## 通用说明

### 请求方式

- **GET 请求**：用于获取数据
- **POST 请求**：用于提交数据（如反馈）

### 通用请求参数

以下参数适用于所有支持分页的 API：

| 参数名 | 类型 | 必填 | 说明 | 默认值 |
|--------|------|------|------|--------|
| `page` | Number | 是 | 页码，从 1 开始 | 1 |
| `pageSize` | Number | 是 | 每页数量 | 20 |
| `category` | String | 否 | 分类过滤（精确匹配） | - |
| `keyword` | String | 否 | 搜索关键词（全文搜索） | - |
| `format` | String | 否 | 返回格式，"array" 返回数组，默认返回对象 | - |

### 过滤逻辑说明

- `category` 和 `keyword` 是两个独立的过滤条件，可以单独使用，也可以组合使用
- 如果只传 `category`，只按分类过滤
- 如果只传 `keyword`，只按关键词全文搜索
- 如果同时传 `category` 和 `keyword`，先按分类过滤，再在结果中搜索关键词（组合过滤）
- 如果都不传，返回全部数据

### 通用返回格式

所有 API 支持多种返回格式，小程序会自动适配：

#### 格式 1：直接数组
```json
[
  { "id": 1, "name": "..." },
  { "id": 2, "name": "..." }
]
```

#### 格式 2：包装对象（推荐）
```json
{
  "data": [
    { "id": 1, "name": "..." },
    { "id": 2, "name": "..." }
  ],
  "total": 100,
  "hasMore": true
}
```

#### 格式 3：命名对象
```json
{
  "locations": [
    { "id": 1, "name": "..." }
  ]
}
```

### 统一标准字段

所有瀑布流 API 都支持以下标准字段：

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `id` | String/Number | 是 | 唯一标识 |
| `name` | String | 是 | 名称（用于卡片显示） |
| `title` | String | 否 | 标题（用于详情页标题，如果不提供则使用 name） |
| `description` | String | 否 | 描述信息（用于卡片摘要显示） |
| `image` / `imageUrl` | String | 否 | 图片 URL（用于瀑布流展示） |
| `category` | String | 否 | 分类（用于页面分类筛选） |
| `htmlContent` | String | 是 | HTML 内容（用于详情页显示） |
| `detailApi` | String | 否 | 详情 API 地址（已废弃，保留用于向后兼容） |

**注意**：
- `htmlContent` 是必填字段，应该包含完整的 HTML 字符串，用于直接显示在详情页面
- `detailApi` 已废弃，小程序不再使用，保留仅用于向后兼容
- 页面会自动从 API 返回的数据中提取所有分类，无需在代码中写死分类名称

---

## API 接口列表

### 1. 常用地点导航 API

**端点**：`/api/custom/locations`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "机场"、"商场"、"景点"、"餐厅"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**：
- `id`: 唯一标识（必填）
- `name`: 地点名称（必填）
- `address`: 地址（必填）
- `latitude`: 纬度（必填，数字）
- `longitude`: 经度（必填，数字）
- `image`: 图片 URL（可选）
- `category`: 分类（可选，如 "机场"、"商场"、"景点"、"餐厅" 等）

**请求示例**：
```
GET /api/custom/locations?page=1&pageSize=20
GET /api/custom/locations?page=1&pageSize=20&category=机场
GET /api/custom/locations?page=1&pageSize=20&keyword=开罗
GET /api/custom/locations?page=1&pageSize=20&category=机场&keyword=国际
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "开罗国际机场",
      "address": "开罗市中心",
      "latitude": 30.0444,
      "longitude": 31.2357,
      "image": "https://bobapro.life/uploads/images/airport.jpg",
      "category": "机场"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

---

### 2. 菜单链接 API（寻味中国）

**端点**：`/api/custom/menu-links`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "中餐厅"、"超市"、"奶茶店"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**：
- `id`: 唯一标识（必填）
- `name`: 菜单名称（必填，如 "🧋 Nefididi"）
- `url`: 菜单链接 URL（必填，需要 encodeURIComponent）
- `title`: 菜单标题（必填，用于 web-view 显示）
- `image`: 图片 URL（必填，用于瀑布流展示）
- `category`: 分类（可选，如 "中餐厅"、"超市"、"奶茶店" 等）

**请求示例**：
```
GET /api/custom/menu-links?page=1&pageSize=20
GET /api/custom/menu-links?page=1&pageSize=20&category=中餐厅
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "🧋 Nefididi",
      "url": "https://boda-0mqtrq.fly.dev/",
      "title": "Nefididi",
      "image": "https://bobapro.life/uploads/images/nefididi.jpg",
      "category": "奶茶店"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

### 3. 热门打卡地 API

**端点**：`/api/custom/hot-spots`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "景点"、"博物馆"、"公园"、"餐厅"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段 + 扩展字段）：
- 标准字段：`id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`
- 扩展字段：
  - `latitude`: 纬度（可选，数字，用于地图导航）
  - `longitude`: 经度（可选，数字，用于地图导航）

**请求示例**：
```
GET /api/custom/hot-spots?page=1&pageSize=20
GET /api/custom/hot-spots?page=1&pageSize=20&category=景点
GET /api/custom/hot-spots?page=1&pageSize=20&keyword=金字塔
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "金字塔",
      "title": "金字塔详情",
      "description": "世界七大奇迹之一",
      "image": "https://bobapro.life/uploads/images/pyramid.jpg",
      "latitude": 29.9792,
      "longitude": 31.1342,
      "category": "景点",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 80,
  "hasMore": true
}
```

---

### 4. 租房信息 API

**端点**：`/api/custom/rentals`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "马底"、"纳赛尔城"、"新开罗"、"开罗市中心"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段 + 扩展字段）：
- 标准字段：`id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`
- 扩展字段：
  - `address`: 地址（可选，字符串）
  - `price`: 价格（可选，字符串，如 "3500"）
  - `type`: 类型（可选，如 "整租"、"合租"）
  - `rooms`: 房间数（可选，字符串，如 "2"）
  - `area`: 面积（可选，字符串，如 "80"）
  - `contact`: 联系方式（可选，字符串）
  - `phone`: 电话号码（可选，字符串）
  - `latitude`: 纬度（可选，数字，用于地图导航）
  - `longitude`: 经度（可选，数字，用于地图导航）

**请求示例**：
```
GET /api/custom/rentals?page=1&pageSize=20
GET /api/custom/rentals?page=1&pageSize=20&category=新开罗
GET /api/custom/rentals?page=1&pageSize=20&keyword=精装
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "开罗市中心精装公寓",
      "title": "开罗市中心精装公寓",
      "description": "位于开罗市中心，交通便利，精装修",
      "address": "开罗市中心，近地铁站",
      "price": "3500",
      "type": "整租",
      "rooms": "2",
      "area": "80",
      "contact": "微信：rental001",
      "phone": "+201017739088",
      "latitude": 30.0444,
      "longitude": 31.2357,
      "image": "https://bobapro.life/uploads/images/rental1.jpg",
      "category": "开罗市中心",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 150,
  "hasMore": true
}
```

---

### 5. 汇率 API

**端点**：`/api/custom/exchange-rate`

**请求方式**：GET

**请求参数**：无

**返回格式**（支持多种格式，按优先级处理）：

#### 格式 1：多币种汇率对象（推荐）
```json
{
  "CNY": { "EGP": 6.7 },
  "USD": { "EGP": 30.5 },
  "EUR": { "EGP": 33.2 },
  "SAR": { "EGP": 8.15 },
  "GBP": { "EGP": 38.8 },
  "JPY": { "EGP": 0.21 },
  "AED": { "EGP": 8.31 },
  "updatedAt": "2024-01-01 12:00:00"
}
```

或包装格式：
```json
{
  "data": {
    "CNY": { "EGP": 6.7 },
    "USD": { "EGP": 30.5 }
  },
  "updatedAt": "2024-01-01 12:00:00"
}
```

#### 格式 2：单币种对象（兼容旧格式）
```json
{
  "rate": 6.7,
  "updatedAt": "2024-01-01 12:00:00"
}
```

或
```json
{
  "exchangeRate": 6.7,
  "updatedAt": "2024-01-01 12:00:00"
}
```

#### 格式 3：直接数字（兼容旧格式）
```json
6.7
```

**支持的货币列表**：
- 🇨🇳 CNY - 人民币
- 🇪🇬 EGP - 埃镑（埃及镑）
- 🇺🇸 USD - 美元
- 🇪🇺 EUR - 欧元
- 🇸🇦 SAR - 沙特里亚尔
- 🇬🇧 GBP - 英镑
- 🇯🇵 JPY - 日元
- 🇦🇪 AED - 阿联酋迪拉姆

**字段说明**：
- `CNY.EGP`: 人民币对埃镑汇率（1 CNY = ? EGP）
- `USD.EGP`: 美元对埃镑汇率（1 USD = ? EGP）
- 其他币种对：支持任意币种对，格式为 `{ 源币种: { 目标币种: 汇率值 } }`
- `updatedAt` / `lastUpdated` / `updateTime`: 更新时间（可选，字符串）

---

### 6. 出行风向标 API（天气）

**端点**：`/api/custom/weather`

**请求方式**：GET

**请求参数**：无

**返回格式**：
```json
{
  "globalAlert": {
    "level": "medium",
    "message": "今日开罗大部分地区有扬沙，能见度低，建议减少外出。"
  },
  "attractions": [
    {
      "id": 1,
      "name": "金字塔",
      "temperature": 36,
      "visibility": "高",
      "uvIndex": 10,
      "windSpeed": "3级",
      "suggestion": "早晨 8 点前去，带足水。"
    }
  ],
  "traffic": [
    {
      "id": 1,
      "time": "10:30",
      "type": "车祸",
      "location": "环城路 Maadi 出口方向",
      "message": "发生追尾，极度拥堵。"
    }
  ]
}
```

或包装格式：
```json
{
  "data": {
    "globalAlert": {...},
    "attractions": [...],
    "traffic": [...]
  }
}
```

**字段说明**：

**globalAlert**（全域预警）：
- `level`: 预警级别（"high" | "medium" | "low"，对应红色/橙色/黄色）
- `message`: 预警信息（字符串）

**attractions**（热门景点信息）：
- `id`: 唯一标识（必填）
- `name`: 景点名称（必填，如 "金字塔"、"卢克索神庙"、"帝王谷"、"黑白沙漠"）
- `temperature`: 温度（必填，数字，如 36）
- `visibility`: 能见度（必填，字符串，如 "高"、"中"、"低"，用于沙尘暴预警）
- `uvIndex`: 紫外线强度（必填，数字，0-11，用于暴晒预警）
- `windSpeed`: 风力（可选，字符串，如 "5级"）
- `suggestion`: 建议（可选，字符串）

**traffic**（路况广播）：
- `id`: 唯一标识（必填）
- `time`: 时间（必填，字符串，如 "10:30"）
- `type`: 类型（必填，字符串，如 "车祸"、"施工"、"天气"）
- `location`: 地点（可选，字符串）
- `message`: 消息内容（必填，字符串）

---

### 7. 热门活动 API

**端点**：`/api/custom/hot-activity`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "聚会"、"旅游"、"文化"、"体育"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**：
- `id`: 唯一标识（数组时必填）
- `title` / `name`: 活动标题（必填）
- `description` / `desc`: 活动描述（可选）
- `image`: 图片 URL（必填，用于瀑布流展示）
- `category`: 分类（可选，如 "聚会"、"旅游"、"文化"、"体育" 等）
- `htmlContent`: HTML 内容（必填，用于详情页显示）
- `latitude`: 纬度（可选，数字，用于地图导航）
- `longitude`: 经度（可选，数字，用于地图导航）
- `phone`: 电话号码（可选，字符串）

**请求示例**：
```
GET /api/custom/hot-activity?page=1&pageSize=20
GET /api/custom/hot-activity?page=1&pageSize=20&category=聚会
GET /api/custom/hot-activity?page=1&pageSize=20&keyword=春节
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "title": "开罗华人春节联欢会",
      "description": "2024年2月10日，开罗市中心举办",
      "image": "https://bobapro.life/uploads/images/spring-festival.jpg",
      "category": "聚会",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>",
      "latitude": 30.0444,
      "longitude": 31.2357,
      "phone": "+201017739088"
    }
  ],
  "total": 60,
  "hasMore": true
}
```

---

### 8. 问路卡片 API（中阿互译）

**端点**：`/api/custom/translation`

**请求方式**：GET

**请求参数**：无

**返回格式**：
- 直接数组：`[{ id, chinese, arabic, category }]`
- 包装对象：`{ data: [{ id, chinese, arabic, category }] }`
- 包装对象：`{ phrases: [{ id, chinese, arabic, category }] }`

**字段说明**：
- `id`: 唯一标识（必填）
- `chinese` / `zh` / `text`: 中文内容（必填）
- `arabic` / `ar` / `translation`: 阿拉伯文内容（必填）
- `category` / `type`: 分类（可选，如 "问候"、"问路"、"购物"）

**返回示例**：
```json
[
  {
    "id": 1,
    "chinese": "你好",
    "arabic": "مرحبا",
    "category": "问候"
  },
  {
    "id": 2,
    "chinese": "谢谢",
    "arabic": "شكرا",
    "category": "礼貌"
  },
  {
    "id": 3,
    "chinese": "请问...在哪里？",
    "arabic": "أين...؟",
    "category": "问路"
  }
]
```

---

### 9. TTS 语音合成 API

**端点**：`/api/tts`

**请求方式**：POST

**请求参数**：
```json
{
  "text": "要朗读的文本",
  "lang": "zh",
  "format": "mp3"
}
```

**参数说明**：
- `text`: 要朗读的文本（必填，字符串）
- `lang`: 语言（必填，字符串，"zh" = 中文，"ar" = 阿拉伯语）
- `format`: 音频格式（必填，字符串，"mp3" 或 "aac"，推荐 mp3，兼容性最好）

**返回格式**：
```json
{
  "audioUrl": "https://bobapro.life/uploads/tts/xxx.mp3"
}
```

**字段说明**：
- `audioUrl`: 音频文件的完整 URL（必须是可访问的 HTTPS URL，不能是 Base64）

**注意事项**：
1. 音频格式必须为 MP3 或 AAC (m4a)，不能使用 Base64 字符串
2. `audioUrl` 必须是完整的 HTTPS URL，微信小程序才能正常播放
3. 音频文件需要支持跨域访问（CORS）
4. 音频文件域名需要在微信公众平台配置 downloadFile 合法域名

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/tts',
  method: 'POST',
  data: {
    text: '你好',
    lang: 'zh',
    format: 'mp3'
  },
  success: (res) => {
    console.log('TTS 音频 URL:', res.data.audioUrl)
  }
})
```

---

### 10. 话费助手 API

**端点**：`/api/custom/phone-helper`

**请求方式**：GET

**请求参数**：无

**返回格式**：
- 直接数组：`[{ id, operator, balanceCode, rechargeCode, description }]`
- 包装对象：`{ data: [{ id, operator, balanceCode, rechargeCode, description }] }`
- 包装对象：`{ codes: [{ id, operator, balanceCode, rechargeCode, description }] }`

**字段说明**：
- `id`: 唯一标识（必填）
- `operator` / `name`: 运营商名称（必填，如 "Vodafone"、"Orange"）
- `balanceCode` / `balance`: 查余额代码（必填，如 "*888#"）
- `rechargeCode` / `recharge`: 充值代码（必填，如 "*555*金额#"）
- `description` / `desc`: 说明（可选）

**返回示例**：
```json
[
  {
    "id": 1,
    "operator": "Vodafone",
    "balanceCode": "*888#",
    "rechargeCode": "*555*金额#",
    "description": "查余额：*888#\n充值：*555*金额#"
  },
  {
    "id": 2,
    "operator": "Orange",
    "balanceCode": "*100#",
    "rechargeCode": "*555*金额#",
    "description": "查余额：*100#\n充值：*555*金额#"
  }
]
```

---

### 11. 尼罗河热映 API

**端点**：`/api/custom/nile-hot`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段）：
- `id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`

**请求示例**：
```
GET /api/custom/nile-hot?page=1&pageSize=20
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "应用名称",
      "title": "应用标题",
      "description": "应用描述",
      "image": "https://bobapro.life/uploads/images/app.jpg",
      "category": "分类",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 100,
  "hasMore": true
}
```

---

### 12. 二手集市 API

**端点**：`/api/custom/second-hand`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "交通工具"、"家具"、"电子产品"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段 + 扩展字段）：
- 标准字段：`id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`
- 扩展字段：
  - `price` / `amount`: 价格（可选，字符串，如 "2000"）
  - `contact` / `phone`: 联系方式（可选，字符串）
  - `address`: 地址（可选，字符串）
  - `latitude`: 纬度（可选，数字，用于地图导航）
  - `longitude`: 经度（可选，数字，用于地图导航）

**请求示例**：
```
GET /api/custom/second-hand?page=1&pageSize=20
GET /api/custom/second-hand?page=1&pageSize=20&category=交通工具
GET /api/custom/second-hand?page=1&pageSize=20&keyword=电动车
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "二手电动车",
      "title": "二手电动车",
      "description": "九成新，性能良好",
      "image": "https://bobapro.life/uploads/images/electric-bike.jpg",
      "category": "交通工具",
      "price": "2000",
      "contact": "微信：secondhand001",
      "phone": "+201017739088",
      "address": "开罗",
      "latitude": 30.0444,
      "longitude": 31.2357,
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 200,
  "hasMore": true
}
```

---

### 13. 签证攻略 API

**端点**：`/api/custom/visa-guide`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段）：
- `id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`

**请求示例**：
```
GET /api/custom/visa-guide?page=1&pageSize=20
GET /api/custom/visa-guide?page=1&pageSize=20&category=旅游签证
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "旅游签证攻略",
      "title": "旅游签证攻略",
      "description": "可在机场办理落地签，详细流程请咨询大使馆",
      "image": "https://bobapro.life/uploads/images/visa.jpg",
      "category": "旅游签证",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

### 14. 小费指南 API

**端点**：`/api/custom/tip-guide`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段）：
- `id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`

**请求示例**：
```
GET /api/custom/tip-guide?page=1&pageSize=20
GET /api/custom/tip-guide?page=1&pageSize=20&category=餐厅
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "餐厅小费指南",
      "title": "餐厅小费指南",
      "description": "账单的10-15%，小费是埃及文化的一部分",
      "image": "https://bobapro.life/uploads/images/tip.jpg",
      "category": "餐厅",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 30,
  "hasMore": true
}
```

---

### 15. 防骗预警 API（黑名单）

**端点**：`/api/custom/blacklist`

**请求方式**：GET

**请求参数**：
- `page`: 页码（必填，数字，从 1 开始，默认 1）
- `pageSize`: 每页数量（必填，数字，默认 20）
- `category`: 分类过滤（可选，字符串，如 "租房诈骗"、"购物诈骗"、"网络诈骗"）
- `keyword`: 搜索关键词（可选，字符串，全文搜索）
- `format`: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）

**返回字段**（标准字段 + 扩展字段）：
- 标准字段：`id`, `name`, `title`, `description`, `image`, `category`, `htmlContent`
- 扩展字段：
  - `date` / `createdAt`: 发布时间（可选，字符串，如 "2024-01-15"）

**请求示例**：
```
GET /api/custom/blacklist?page=1&pageSize=20
GET /api/custom/blacklist?page=1&pageSize=20&category=租房诈骗
GET /api/custom/blacklist?page=1&pageSize=20&keyword=虚假
```

**返回示例**：
```json
{
  "data": [
    {
      "id": 1,
      "name": "虚假租房信息",
      "title": "虚假租房信息",
      "description": "某中介发布虚假房源信息，收取定金后失联。提醒：租房时务必实地看房，不要提前支付大额定金。",
      "category": "租房诈骗",
      "date": "2024-01-15",
      "image": "https://bobapro.life/uploads/images/scam-1.jpg",
      "htmlContent": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
    }
  ],
  "total": 50,
  "hasMore": true
}
```

---

### 16. 反馈建议 API

**端点**：`/api/custom/feedback`

**请求方式**：POST

**请求参数**：
```json
{
  "content": "反馈内容",
  "category": "问路卡片",
  "userInfo": {
    "nickName": "用户昵称",
    "avatarUrl": "用户头像URL",
    "gender": 1,
    "country": "中国",
    "province": "北京",
    "city": "北京",
    "language": "zh_CN"
  }
}
```

**参数说明**：
- `content`: 反馈内容（必填，字符串）
- `category`: 功能分类（可选，字符串，如 "问路卡片"、"话费助手" 等）
- `userInfo`: 用户信息对象（自动包含）
  - `nickName`: 用户昵称
  - `avatarUrl`: 用户头像 URL
  - `gender`: 性别（0: 未知, 1: 男, 2: 女）
  - `country`: 国家
  - `province`: 省份
  - `city`: 城市
  - `language`: 语言

**返回格式**：
```json
{
  "success": true,
  "message": "提交成功"
}
```

或失败时：
```json
{
  "success": false,
  "message": "错误信息"
}
```

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/custom/feedback',
  method: 'POST',
  data: {
    content: '希望添加新功能',
    category: '问路卡片',
    userInfo: {
      nickName: '用户昵称',
      avatarUrl: 'https://...',
      gender: 1,
      country: '中国',
      province: '北京',
      city: '北京',
      language: 'zh_CN'
    }
  },
  success: (res) => {
    if (res.data.success) {
      wx.showToast({
        title: '提交成功',
        icon: 'success'
      })
    }
  }
})
```

---

### 17. 博客管理 API（文章增删改查）

博客管理API支持小程序调用，通过API Token进行认证。这些API用于管理文章、分类、标签等内容的增删改查操作。

**API基础路径**：`/api/blog-admin`

**认证方式**：API Token认证

#### 认证配置

**API Token**：`210311199405041819`

**Token使用方式**（小程序可以通过以下三种方式传递Token）：

1. **请求头 X-API-Token**（推荐）
   ```javascript
   header: {
     'X-API-Token': 'your-api-token'
   }
   ```

2. **请求头 Authorization: Bearer**
   ```javascript
   header: {
     'Authorization': 'Bearer your-api-token'
   }
   ```

3. **查询参数 token**
   ```
   /api/blog-admin/posts?token=your-api-token
   ```

#### 17.1 获取文章列表

**端点**：`GET /api/blog-admin/posts`

**请求参数**：
- `page`: 页码（可选，数字）
- `pageSize`: 每页数量（可选，数字）
- `category`: 分类过滤（可选，字符串）
- `keyword`: 搜索关键词（可选，字符串）

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/blog-admin/posts',
  method: 'GET',
  header: {
    'X-API-Token': '210311199405041819'
  },
  success: (res) => {
    console.log('文章列表', res.data);
  }
});
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "id": "6821e811-dce1-41a6-99aa-b547dfbc1594",
      "name": "文章标题",
      "title": "文章标题",
      "slug": "article-slug",
      "excerpt": "文章摘要",
      "description": "文章描述",
      "htmlContent": "<p>文章内容</p>",
      "image": "https://example.com/image.jpg",
      "category": "分类名称",
      "apiName": "二手市场 second-hand",
      "published": true,
      "views": 100,
      "createdAt": "2025-12-25T10:00:00+02:00",
      "updatedAt": "2025-12-25T10:00:00+02:00"
    }
  ],
  "total": 1
}
```

#### 17.2 获取文章详情

**端点**：`GET /api/blog-admin/posts/:id`

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/blog-admin/posts/6821e811-dce1-41a6-99aa-b547dfbc1594',
  method: 'GET',
  header: {
    'X-API-Token': '210311199405041819'
  }
});
```

#### 17.3 创建文章

**端点**：`POST /api/blog-admin/posts`

**请求参数**：
- `name` (必填) - 文章名称
- `apiName` (必填) - API名称（分类）
- `htmlContent` (可选) - HTML内容
- `slug` (可选) - URL友好的标识符
- `excerpt` (可选) - 摘要
- `description` (可选) - 描述
- `image` (可选) - 图片URL
- `category` (可选) - 分类/标签
- `published` (可选) - 是否发布（默认false）
- `price` (可选) - 价格（二手市场/租房酒店）
- `rooms` (可选) - 房间数（租房酒店）
- `area` (可选) - 面积（租房酒店）
- `phone` (可选) - 电话
- `address` (可选) - 地址
- `latitude` (可选) - 纬度
- `longitude` (可选) - 经度

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/blog-admin/posts',
  method: 'POST',
  header: {
    'Content-Type': 'application/json',
    'X-API-Token': '210311199405041819'
  },
  data: {
    name: '我的文章标题',
    apiName: '二手市场 second-hand',
    htmlContent: '<p>这是文章内容</p>',
    excerpt: '这是文章摘要',
    image: 'https://example.com/image.jpg',
    published: true,
    price: 1000
  },
  success: (res) => {
    console.log('创建成功', res.data);
  }
});
```

**响应示例**：
```json
{
  "success": true,
  "message": "文章创建成功",
  "data": {
    "id": "new-post-id",
    "name": "我的文章标题",
    "title": "我的文章标题",
    "slug": "my-article-title-new-post-id",
    ...
  }
}
```

#### 17.4 更新文章

**端点**：`PUT /api/blog-admin/posts/:id`

**请求参数**：与创建文章相同，所有字段都是可选的

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/blog-admin/posts/6821e811-dce1-41a6-99aa-b547dfbc1594',
  method: 'PUT',
  header: {
    'Content-Type': 'application/json',
    'X-API-Token': '210311199405041819'
  },
  data: {
    name: '更新后的标题',
    htmlContent: '<p>更新后的内容</p>',
    published: true
  },
  success: (res) => {
    console.log('更新成功', res.data);
  }
});
```

#### 17.5 删除文章

**端点**：`DELETE /api/blog-admin/posts/:id`

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/blog-admin/posts/6821e811-dce1-41a6-99aa-b547dfbc1594',
  method: 'DELETE',
  header: {
    'X-API-Token': '210311199405041819'
  },
  success: (res) => {
    console.log('删除成功', res.data);
  }
});
```

#### 17.6 获取API列表

**端点**：`GET /api/blog-admin/apis`

**说明**：获取所有可用的API列表（用于文章分类选择）

**请求示例**：
```javascript
wx.request({
  url: 'https://bobapro.life/api/blog-admin/apis',
  method: 'GET',
  header: {
    'X-API-Token': '210311199405041819'
  }
});
```

**响应示例**：
```json
{
  "success": true,
  "data": [
    {
      "name": "二手市场 second-hand",
      "path": "/api/custom/second-hand"
    },
    {
      "name": "租房信息 rentals",
      "path": "/api/custom/rentals"
    }
  ]
}
```

#### 错误处理

**认证失败（401）**：
```json
{
  "success": false,
  "message": "需要身份验证。请提供有效的API Token（X-API-Token头或Authorization: Bearer）或登录Session",
  "code": "UNAUTHORIZED"
}
```

**Token无效（401）**：
```json
{
  "success": false,
  "message": "API Token无效",
  "code": "UNAUTHORIZED"
}
```

**参数验证失败（400）**：
```json
{
  "success": false,
  "message": "验证失败",
  "errors": [
    {
      "msg": "文章名称不能为空",
      "param": "name",
      "location": "body"
    }
  ]
}
```

**资源不存在（404）**：
```json
{
  "success": false,
  "message": "文章不存在"
}
```

#### 小程序实现示例

小程序中已封装了博客管理API工具类 `utils/blogApi.js`，可以直接使用：

```javascript
const blogApi = require('../../utils/blogApi.js')

// 获取文章列表
blogApi.articleApi.getList({ page: 1, pageSize: 20 })
  .then(result => {
    console.log('文章列表', result.data)
  })
  .catch(error => {
    console.error('获取失败', error)
  })

// 创建文章
blogApi.articleApi.create({
  name: '文章标题',
  apiName: '二手市场 second-hand',
  htmlContent: '<p>内容</p>',
  published: true
})
  .then(result => {
    console.log('创建成功', result.data)
  })
  .catch(error => {
    console.error('创建失败', error)
  })

// 更新文章
blogApi.articleApi.update(articleId, {
  name: '新标题',
  published: true
})
  .then(result => {
    console.log('更新成功', result.data)
  })
  .catch(error => {
    console.error('更新失败', error)
  })

// 删除文章
blogApi.articleApi.delete(articleId)
  .then(result => {
    console.log('删除成功', result)
  })
  .catch(error => {
    console.error('删除失败', error)
  })
```

---

## HTML 内容格式说明

### 支持的 HTML 标签

小程序使用 `rich-text` 组件渲染 HTML 内容，支持的标签有限：

**支持的标签**：
- `<p>`, `<h1>`, `<h2>`, `<h3>`, `<h4>`, `<h5>`, `<h6>`
- `<ul>`, `<ol>`, `<li>`
- `<img>`（注意：小程序会自动处理图片宽度）
- `<a>`（链接会被提取并显示为可点击按钮）
- `<span>`, `<div>`
- `<strong>`, `<b>`, `<em>`, `<i>`
- `<br>`, `<hr>`

**不支持的标签**：
- `<video>`（会被提取并在单独区域显示）
- `<iframe>`（会被提取并在单独区域显示）
- `<script>`, `<style>`
- 其他复杂标签

### 图片处理

**图片标签格式**：
```html
<img src="https://bobapro.life/uploads/images/example.jpg" alt="描述">
```

**注意事项**：
1. 图片 URL 必须是 HTTPS
2. 图片域名需要在微信公众平台配置 downloadFile 合法域名
3. 小程序会自动处理图片宽度，使其自适应屏幕
4. 支持 `data-original` 属性（用于原图 URL）
5. 图片会被提取并在文章底部显示为缩略图网格（如果使用内联渲染，则内联显示）

**图片提取逻辑**：
- 优先提取 `data-original` 属性（原图 URL）
- 如果没有 `data-original`，则使用 `src` 属性
- 支持 `<img>` 和 `<image>` 标签

### 视频处理

**视频标签格式**：
```html
<video src="https://bobapro.life/uploads/videos/example.mp4" poster="https://bobapro.life/uploads/images/poster.jpg" controls="true">
  <source src="https://bobapro.life/uploads/videos/example.mp4" type="video/mp4"/>
</video>
```

**注意事项**：
1. 视频 URL 必须是 HTTPS
2. 视频域名需要在微信公众平台配置 downloadFile 合法域名
3. 支持的视频格式：`mp4`, `m3u8`, `flv`, `f4v`
4. `poster` 属性必须是图片 URL（不能是视频 URL）
5. 视频会被提取并在文章底部显示（如果使用内联渲染，则内联显示）
6. 支持 `<video>` 标签和 `<iframe>` 中的视频（YouTube、Bilibili 等）

**视频提取逻辑**：
- 优先从 `<video>` 标签的 `src` 属性提取
- 如果没有 `src`，则从嵌套的 `<source>` 标签提取
- 支持 `<iframe>` 中的视频平台链接（YouTube、Bilibili、Vimeo 等）
- `poster` 必须是有效的图片 URL（不能是视频 URL）

### 链接处理

**链接标签格式**：
```html
<a href="https://example.com">链接文本</a>
```

**注意事项**：
1. 链接 URL 必须是 HTTPS
2. 链接会被提取并在文章底部显示为可点击按钮（如果使用内联渲染，则内联显示）
3. 点击链接会复制到剪贴板，提示用户粘贴到浏览器打开

**链接提取逻辑**：
- 提取 `<a>` 标签的 `href` 属性和文本内容
- 只提取 HTTP/HTTPS 链接
- 自动去重

### 内联渲染（推荐）

小程序支持将 HTML 内容解析为节点数组，实现内联渲染：

**解析后的节点类型**：
- `text`: 文本节点（使用 `rich-text` 渲染）
- `image`: 图片节点（使用原生 `image` 组件，支持点击放大、长按保存）
- `video`: 视频节点（使用原生 `video` 组件，支持播放控制）
- `link`: 链接节点（使用可点击的 `view`，支持点击复制）

**优势**：
- 图片支持点击放大、长按保存
- 视频支持原生播放控制
- 链接显示为醒目的可点击按钮
- 更好的用户体验

**HTML 格式要求**：
- 视频必须使用 `<video>` 标签或 `<iframe>` 标签
- 图片必须使用 `<img>` 或 `<image>` 标签
- 链接必须使用 `<a>` 标签

---

## 图片和视频处理

### 图片 URL 格式

**支持的格式**：
- 本地路径：`/page/component/resources/pic/1.jpg`
- HTTPS 外部 URL：`https://bobapro.life/uploads/images/example.jpg`

**注意事项**：
1. 使用外部 HTTPS 图片时，需要在微信公众平台配置 downloadFile 合法域名
2. 如果出现 `ERR_BLOCKED_BY_RESPONSE` 错误，可能原因：
   - 服务器未配置正确的 CORS 响应头
   - 服务器返回的 Content-Type 不正确
   - 服务器拒绝了请求（如防盗链、权限限制等）
   - 域名未添加到 downloadFile 白名单
3. 图片加载失败时会自动使用默认占位图

### 视频 URL 格式

**支持的格式**：
- HTTPS 外部 URL：`https://bobapro.life/uploads/videos/example.mp4`

**支持的视频格式**：
- `mp4`（推荐，兼容性最好）
- `m3u8`（HLS 流媒体）
- `flv`
- `f4v`

**注意事项**：
1. 视频 URL 必须是 HTTPS
2. 视频域名需要在微信公众平台配置 downloadFile 合法域名
3. 视频文件需要支持跨域访问（CORS）
4. 如果视频加载失败，小程序会显示错误提示
5. 视频支持延迟加载（`lazy-load`），减少不必要的网络请求

### Poster（视频封面图）

**格式要求**：
- `poster` 属性必须是图片 URL（不能是视频 URL）
- 必须是有效的网络 URL（`http://`、`https://` 或 `//` 开头）
- 支持的图片格式：`.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.bmp`, `.svg`, `.ico`
- 不支持视频格式（如 `.mp4`, `.mov` 等）

**示例**：
```html
<!-- 正确 -->
<video src="https://bobapro.life/uploads/videos/video.mp4" poster="https://bobapro.life/uploads/images/poster.jpg"></video>

<!-- 错误：poster 是视频 URL -->
<video src="https://bobapro.life/uploads/videos/video.mp4" poster="https://bobapro.life/uploads/videos/poster.mp4"></video>
```

---

## 错误处理

### HTTP 状态码

- `200`: 成功
- `非 200`: 失败，显示错误提示

### 返回数据格式

**成功标识**：
- 返回数据不为空
- 如果返回对象包含 `success` 字段，`success: true` 表示成功

**失败标识**：
- 状态码非 200
- 返回对象包含 `success: false`
- 返回数据为空
- 格式不符合要求

### 错误提示

所有错误都会显示提示："获取数据失败，请稍后重试"，并提供重试功能。

### 常见错误

1. **网络错误**：
   - 检查网络连接
   - 检查 API 域名是否正确
   - 检查域名是否在微信公众平台配置

2. **CORS 错误**：
   - 检查服务器是否配置了正确的 CORS 响应头
   - 检查 `Access-Control-Allow-Origin` 是否正确

3. **图片加载失败**：
   - 检查图片 URL 是否正确
   - 检查图片域名是否在 downloadFile 白名单中
   - 检查服务器是否配置了 CORS
   - 小程序会自动使用默认占位图

4. **视频加载失败**：
   - 检查视频 URL 是否正确
   - 检查视频格式是否支持
   - 检查视频域名是否在 downloadFile 白名单中
   - 检查服务器是否配置了 CORS

---

## 常见问题

### Q1: 如何配置 API 域名？

**A**: 在微信公众平台配置：
1. 登录微信公众平台
2. 进入【开发】->【开发管理】->【开发设置】->【服务器域名】
3. 在【request 合法域名】中添加：`https://bobapro.life`
4. 在【downloadFile 合法域名】中添加：`https://bobapro.life`

### Q2: 图片加载失败怎么办？

**A**: 检查以下几点：
1. 图片 URL 是否是 HTTPS
2. 图片域名是否在 downloadFile 白名单中
3. 服务器是否配置了 CORS 响应头
4. 图片文件是否存在
5. 小程序会自动使用默认占位图

### Q3: 视频无法播放怎么办？

**A**: 检查以下几点：
1. 视频 URL 是否是 HTTPS
2. 视频格式是否支持（推荐 mp4）
3. 视频域名是否在 downloadFile 白名单中
4. 服务器是否配置了 CORS
5. `poster` 是否是图片 URL（不能是视频 URL）

### Q4: HTML 内容中的视频不显示？

**A**: 检查以下几点：
1. 视频标签格式是否正确：`<video src="...">` 或 `<video><source src="..."></video>`
2. 视频 URL 是否是有效的 HTTPS URL
3. 视频格式是否支持（推荐 mp4）
4. 如果使用内联渲染，视频会被提取并在正文中显示

### Q5: 如何实现分页加载？

**A**: 使用 `page` 和 `pageSize` 参数：
```
GET /api/custom/second-hand?page=1&pageSize=20
GET /api/custom/second-hand?page=2&pageSize=20
```

### Q6: 如何实现分类筛选？

**A**: 使用 `category` 参数：
```
GET /api/custom/second-hand?page=1&pageSize=20&category=交通工具
```

### Q7: 如何实现关键词搜索？

**A**: 使用 `keyword` 参数：
```
GET /api/custom/second-hand?page=1&pageSize=20&keyword=电动车
```

### Q8: 如何组合使用分类和关键词？

**A**: 同时传递 `category` 和 `keyword` 参数：
```
GET /api/custom/second-hand?page=1&pageSize=20&category=交通工具&keyword=电动车
```

### Q9: HTML 内容中的图片和视频如何显示？

**A**: 小程序支持两种方式：
1. **内联渲染**（推荐）：图片、视频、链接会内联显示在正文中，支持交互（点击放大、播放、复制）
2. **底部显示**（向后兼容）：图片、视频、链接会在文章底部单独显示

### Q10: 如何上传视频？

**A**: 视频上传功能在 web-view 中实现（后端管理页面），小程序只负责显示。上传视频后，后端需要返回包含 `<video>` 标签的 HTML 内容。

---

## 技术支持

如有问题或建议，请通过小程序内的"反馈建议"功能提交，或联系开发团队。

---

**最后更新**：2025-01-24

**API 版本**：v1.1

**小程序版本**：v1.1.0
