/**
 * 小程序配置文件
 */

const config = {
  // 测试的请求地址，用于测试会话
  requestUrl: 'https://bobapro.life',

  // ==================== API 端点配置 ====================
  apiBaseUrl: 'https://bobapro.life/api/custom',

  /**
   * 常用地点导航 API
   * 请求方式: GET
   * 返回格式: 
   *   - 直接数组: [{ id, name, address, latitude, longitude, image }]
   *   - 包装对象: { data: [{ id, name, address, latitude, longitude, image }] }
   *   - 包装对象: { locations: [{ id, name, address, latitude, longitude, image }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - name: 地点名称（必填）
   *   - address: 地址（必填）
   *   - latitude: 纬度（必填，数字）
   *   - longitude: 经度（必填，数字）
   *   - image: 图片URL（可选）
   *     支持格式：
   *     - 本地路径：如 "/page/component/resources/pic/1.jpg"
   *     - HTTPS外部URL：如 "https://example.com/image.jpg"
   *     注意事项：
   *     1. 使用外部HTTPS图片时，需要在微信公众平台配置 downloadFile 合法域名
   *     2. 如果出现 ERR_BLOCKED_BY_RESPONSE 错误，可能原因：
   *        - 服务器未配置正确的 CORS 响应头
   *        - 服务器返回的 Content-Type 不正确
   *        - 服务器拒绝了请求（如防盗链、权限限制等）
   *        - 域名未添加到 downloadFile 白名单
   *     3. 图片加载失败时会自动使用默认占位图
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "name": "Nefididi 奶茶店",
   *       "address": "开罗市中心",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357,
   *       "image": "/page/component/resources/pic/1.jpg"
   *     },
   *     {
   *       "id": 2,
   *       "name": "MingTea 奶茶店",
   *       "address": "开罗市中心",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357,
   *       "image": "/page/component/resources/pic/2.jpg"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "Nefididi 奶茶店",
   *         "address": "开罗市中心",
   *         "latitude": 30.0444,
   *         "longitude": 31.2357,
   *         "image": "/page/component/resources/pic/1.jpg"
   *       }
   *     ]
   *   }
   */
  locationsApi: 'https://bobapro.life/api/custom/locations',

  /**
   * 常用菜单链接 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, name, url, title }]
   *   - 包装对象: { data: [{ id, name, url, title }] }
   *   - 包装对象: { menuLinks: [{ id, name, url, title }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - name: 菜单名称（必填，如 "🧋 Nefididi"）
   *   - url: 菜单链接URL（必填，需要 encodeURIComponent）
   *   - title: 菜单标题（必填，用于 web-view 显示）
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "name": "🧋 Nefididi",
   *       "url": "https://boda-0mqtrq.fly.dev/",
   *       "title": "Nefididi"
   *     },
   *     {
   *       "id": 2,
   *       "name": "🧋 茗茶",
   *       "url": "https://boda-t0amgq.fly.dev/",
   *       "title": "茗茶"
   *     },
   *     {
   *       "id": 3,
   *       "name": "🛒 线上中超",
   *       "url": "https://boda-3xyulq.fly.dev/",
   *       "title": "线上中超"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "🧋 Nefididi",
   *         "url": "https://boda-0mqtrq.fly.dev/",
   *         "title": "Nefididi"
   *       }
   *     ]
   *   }
   */
  menuLinksApi: 'https://bobapro.life/api/custom/menu-links',

  /**
   * 热门打卡地 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, name, description, image, latitude, longitude }]
   *   - 包装对象: { data: [{ id, name, description, image, latitude, longitude }] }
   *   - 包装对象: { hotSpots: [{ id, name, description, image, latitude, longitude }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - name: 打卡地名称（必填）
   *   - description: 描述信息（可选）
   *   - image: 图片URL（可选）
   *     支持格式：
   *     - 本地路径：如 "/page/component/resources/pic/1.jpg"
   *     - HTTPS外部URL：如 "https://example.com/image.jpg"
   *     注意事项：
   *     1. 使用外部HTTPS图片时，需要在微信公众平台配置 downloadFile 合法域名
   *     2. 如果出现 ERR_BLOCKED_BY_RESPONSE 错误，可能原因：
   *        - 服务器未配置正确的 CORS 响应头
   *        - 服务器返回的 Content-Type 不正确
   *        - 服务器拒绝了请求（如防盗链、权限限制等）
   *        - 域名未添加到 downloadFile 白名单
   *     3. 图片加载失败时会自动使用默认占位图
   *   - latitude: 纬度（必填，数字）
   *   - longitude: 经度（必填，数字）
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "name": "金字塔",
   *       "description": "世界七大奇迹之一",
   *       "image": "/page/component/resources/pic/1.jpg",
   *       "latitude": 29.9792,
   *       "longitude": 31.1342
   *     },
   *     {
   *       "id": 2,
   *       "name": "尼罗河",
   *       "description": "埃及的母亲河",
   *       "image": "/page/component/resources/pic/2.jpg",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "金字塔",
   *         "description": "世界七大奇迹之一",
   *         "image": "/page/component/resources/pic/1.jpg",
   *         "latitude": 29.9792,
   *         "longitude": 31.1342
   *       }
   *     ]
   *   }
   */
  hotSpotsApi: 'https://bobapro.life/api/custom/hot-spots',

  /**
   * 租房信息 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, title, address, price, type, rooms, area, contact, latitude, longitude, image }]
   *   - 包装对象: { data: [{ id, title, address, price, type, rooms, area, contact, latitude, longitude, image }] }
   *   - 包装对象: { rentals: [{ id, title, address, price, type, rooms, area, contact, latitude, longitude, image }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - title: 房源标题（必填）
   *   - address: 地址（必填）
   *   - price: 价格（必填，字符串，如 "3500"）
   *   - type: 类型（可选，如 "整租"、"合租"）
   *   - rooms: 房间数（可选，字符串，如 "2"）
   *   - area: 面积（可选，字符串，如 "80"）
   *   - contact: 联系方式（必填）
   *   - latitude: 纬度（必填，数字）
   *   - longitude: 经度（必填，数字）
   *   - image: 图片URL（可选）
   *     支持格式：
   *     - 本地路径：如 "/page/component/resources/pic/1.jpg"
   *     - HTTPS外部URL：如 "https://example.com/image.jpg"
   *     注意事项：
   *     1. 使用外部HTTPS图片时，需要在微信公众平台配置 downloadFile 合法域名
   *     2. 如果出现 ERR_BLOCKED_BY_RESPONSE 错误，可能原因：
   *        - 服务器未配置正确的 CORS 响应头
   *        - 服务器返回的 Content-Type 不正确
   *        - 服务器拒绝了请求（如防盗链、权限限制等）
   *        - 域名未添加到 downloadFile 白名单
   *     3. 图片加载失败时会自动使用默认占位图
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "title": "开罗市中心精装公寓",
   *       "address": "开罗市中心，近地铁站",
   *       "price": "3500",
   *       "type": "整租",
   *       "rooms": "2",
   *       "area": "80",
   *       "contact": "微信：rental001",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357,
   *       "image": "/page/component/resources/pic/1.jpg"
   *     },
   *     {
   *       "id": 2,
   *       "title": "新开罗三室一厅",
   *       "address": "新开罗区，环境优美",
   *       "price": "5000",
   *       "type": "整租",
   *       "rooms": "3",
   *       "area": "120",
   *       "contact": "微信：rental002",
   *       "latitude": 30.0131,
   *       "longitude": 31.2089,
   *       "image": "/page/component/resources/pic/2.jpg"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "开罗市中心精装公寓",
   *         "address": "开罗市中心，近地铁站",
   *         "price": "3500",
   *         "type": "整租",
   *         "rooms": "2",
   *         "area": "80",
   *         "contact": "微信：rental001",
   *         "latitude": 30.0444,
   *         "longitude": 31.2357,
   *         "image": "/page/component/resources/pic/1.jpg"
   *       }
   *     ]
   *   }
   */
  rentalsApi: 'https://bobapro.life/api/custom/rentals',

  /**
   * 汇率 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数字: 6.7
   *   - 对象: { rate: 6.7, updatedAt: "2024-01-01 12:00:00" }
   *   - 对象: { exchangeRate: 6.7, updatedAt: "2024-01-01 12:00:00" }
   * 字段说明:
   *   - rate/exchangeRate: 汇率值（必填，数字，1 CNY = ? EGP）
   *   - updatedAt: 更新时间（可选，字符串）
   * 返回示例:
   *   6.7
   *   或
   *   {
   *     "rate": 6.7,
   *     "updatedAt": "2024-01-01 12:00:00"
   *   }
   *   或
   *   {
   *     "exchangeRate": 6.7,
   *     "updatedAt": "2024-01-01 12:00:00"
   *   }
   */
  exchangeRateApi: 'https://bobapro.life/api/custom/exchange-rate',

  /**
   * 天气预警 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接字符串: "晴朗 28°C"
   *   - 对象: { weather: "晴朗 28°C" }
   *   - 对象: { condition: "晴朗", temperature: "28", weather: "晴朗 28°C" }
   *   - 包装对象: { data: { weather: "晴朗 28°C" } }
   * 字段说明:
   *   - weather: 完整天气信息（优先使用，如 "晴朗 28°C"）
   *   - condition: 天气状况（可选，如 "晴朗"、"多云"）
   *   - temperature: 温度（可选，字符串或数字，如 "28" 或 28）
   * 返回示例:
   *   "晴朗 28°C"
   *   或
   *   {
   *     "weather": "晴朗 28°C"
   *   }
   *   或
   *   {
   *     "condition": "晴朗",
   *     "temperature": "28",
   *     "weather": "晴朗 28°C"
   *   }
   *   或
   *   {
   *     "data": {
   *       "weather": "晴朗 28°C"
   *     }
   *   }
   */
  weatherApi: 'https://bobapro.life/api/custom/weather',

  /**
   * 热门活动 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, title, description }]
   *   - 包装对象: { data: [{ id, title, description }] }
   *   - 包装对象: { activities: [{ id, title, description }] }
   *   - 单个对象: { title: "活动标题" }
   * 字段说明:
   *   - id: 唯一标识（数组时必填）
   *   - title/name: 活动标题（必填）
   *   - description/desc: 活动描述（可选）
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "title": "开罗华人春节联欢会",
   *       "description": "2024年2月10日，开罗市中心举办"
   *     },
   *     {
   *       "id": 2,
   *       "title": "埃及旅游攻略分享会",
   *       "description": "每周六下午2点，线上直播"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "开罗华人春节联欢会",
   *         "description": "2024年2月10日，开罗市中心举办"
   *       }
   *     ]
   *   }
   *   或
   *   {
   *     "title": "开罗华人春节联欢会"
   *   }
   */
  hotActivityApi: 'https://bobapro.life/api/custom/hot-activity',

  /**
   * 问路卡片（中阿互译）API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, chinese, arabic, category }]
   *   - 包装对象: { data: [{ id, chinese, arabic, category }] }
   *   - 包装对象: { phrases: [{ id, chinese, arabic, category }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - chinese/zh/text: 中文内容（必填）
   *   - arabic/ar/translation: 阿拉伯文内容（必填）
   *   - category/type: 分类（可选，如 "问候"、"问路"、"购物"）
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "chinese": "你好",
   *       "arabic": "مرحبا",
   *       "category": "问候"
   *     },
   *     {
   *       "id": 2,
   *       "chinese": "谢谢",
   *       "arabic": "شكرا",
   *       "category": "礼貌"
   *     },
   *     {
   *       "id": 3,
   *       "chinese": "请问...在哪里？",
   *       "arabic": "أين...؟",
   *       "category": "问路"
   *     },
   *     {
   *       "id": 4,
   *       "chinese": "多少钱？",
   *       "arabic": "كم السعر؟",
   *       "category": "购物"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "chinese": "你好",
   *         "arabic": "مرحبا",
   *         "category": "问候"
   *       }
   *     ]
   *   }
   */
  translationApi: 'https://bobapro.life/api/custom/translation',

  /**
   * 话费助手 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, operator, balanceCode, rechargeCode, description }]
   *   - 包装对象: { data: [{ id, operator, balanceCode, rechargeCode, description }] }
   *   - 包装对象: { codes: [{ id, operator, balanceCode, rechargeCode, description }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - operator/name: 运营商名称（必填，如 "Vodafone"、"Orange"）
   *   - balanceCode/balance: 查余额代码（必填，如 "*888#"）
   *   - rechargeCode/recharge: 充值代码（必填，如 "*555*金额#"）
   *   - description/desc: 说明（可选）
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "operator": "Vodafone",
   *       "balanceCode": "*888#",
   *       "rechargeCode": "*555*金额#",
   *       "description": "查余额：*888#\n充值：*555*金额#"
   *     },
   *     {
   *       "id": 2,
   *       "operator": "Orange",
   *       "balanceCode": "*100#",
   *       "rechargeCode": "*555*金额#",
   *       "description": "查余额：*100#\n充值：*555*金额#"
   *     },
   *     {
   *       "id": 3,
   *       "operator": "Etisalat",
   *       "balanceCode": "*100#",
   *       "rechargeCode": "*555*金额#",
   *       "description": "查余额：*100#\n充值：*555*金额#"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "operator": "Vodafone",
   *         "balanceCode": "*888#",
   *         "rechargeCode": "*555*金额#",
   *         "description": "查余额：*888#\n充值：*555*金额#"
   *       }
   *     ]
   *   }
   */
    phoneHelperApi: 'https://bobapro.life/api/custom/phone-helper',

  /**
   * 二手集市 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接数组: [{ id, title, price, description, image, contact, category }]
   *   - 包装对象: { data: [{ id, title, price, description, image, contact, category }] }
   *   - 包装对象: { items: [{ id, title, price, description, image, contact, category }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - title/name: 商品标题（必填）
   *   - price/amount: 价格（必填，字符串，如 "2000"）
   *   - description/desc: 商品描述（可选）
   *   - image/imageUrl: 图片URL（可选）
   *   - contact/phone: 联系方式（必填）
   *   - category/type: 商品分类（可选，如 "交通工具"、"家具"）
   * 返回示例:
   *   [
   *     {
   *       "id": 1,
   *       "title": "二手电动车",
   *       "price": "2000",
   *       "description": "九成新，性能良好",
   *       "image": "/page/component/resources/pic/1.jpg",
   *       "contact": "微信：secondhand001",
   *       "category": "交通工具"
   *     },
   *     {
   *       "id": 2,
   *       "title": "二手家具",
   *       "price": "500",
   *       "description": "沙发、桌子等",
   *       "image": "/page/component/resources/pic/2.jpg",
   *       "contact": "微信：secondhand002",
   *       "category": "家具"
   *     }
   *   ]
   *   或
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "二手电动车",
   *         "price": "2000",
   *         "description": "九成新，性能良好",
   *         "image": "/page/component/resources/pic/1.jpg",
   *         "contact": "微信：secondhand001",
   *         "category": "交通工具"
   *       }
   *     ]
   *   }
   */
  secondHandApi: 'https://bobapro.life/api/custom/second-hand',

  /**
   * 签证攻略 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接字符串: "签证攻略内容..."
   *   - 对象: { title: "标题", content: "内容" }
   *   - 对象: { title: "标题", text: "内容" }
   *   - 包装对象: { data: { title: "标题", content: "内容" } }
   * 字段说明:
   *   - title: 攻略标题（可选）
   *   - content/text: 攻略内容（必填，字符串）
   * 返回示例:
   *   "1. 旅游签证：可在机场办理落地签\n2. 工作签证：需提前申请\n3. 学生签证：需提供学校证明\n\n详细流程请咨询大使馆。"
   *   或
   *   {
   *     "title": "埃及签证攻略",
   *     "content": "1. 旅游签证：可在机场办理落地签\n2. 工作签证：需提前申请\n3. 学生签证：需提供学校证明\n\n详细流程请咨询大使馆。"
   *   }
   *   或
   *   {
   *     "title": "埃及签证攻略",
   *     "text": "1. 旅游签证：可在机场办理落地签\n2. 工作签证：需提前申请\n3. 学生签证：需提供学校证明\n\n详细流程请咨询大使馆。"
   *   }
   *   或
   *   {
   *     "data": {
   *       "title": "埃及签证攻略",
   *       "content": "1. 旅游签证：可在机场办理落地签\n2. 工作签证：需提前申请\n3. 学生签证：需提供学校证明\n\n详细流程请咨询大使馆。"
   *     }
   *   }
   */
  visaGuideApi: 'https://bobapro.life/api/custom/visa-guide',

  /**
   * 小费指南 API
   * 请求方式: GET
   * 返回格式:
   *   - 直接字符串: "小费指南内容..."
   *   - 对象: { title: "标题", content: "内容" }
   *   - 对象: { title: "标题", text: "内容" }
   *   - 包装对象: { data: { title: "标题", content: "内容" } }
   * 字段说明:
   *   - title: 指南标题（可选）
   *   - content/text: 指南内容（必填，字符串）
   * 返回示例:
   *   "餐厅：账单的10-15%\n酒店：每件行李5-10 EGP\n导游：每天20-50 EGP\n出租车：通常不需要，但可以给零钱\n\n小费是埃及文化的一部分，建议准备零钱。"
   *   或
   *   {
   *     "title": "埃及小费指南",
   *     "content": "餐厅：账单的10-15%\n酒店：每件行李5-10 EGP\n导游：每天20-50 EGP\n出租车：通常不需要，但可以给零钱\n\n小费是埃及文化的一部分，建议准备零钱。"
   *   }
   *   或
   *   {
   *     "title": "埃及小费指南",
   *     "text": "餐厅：账单的10-15%\n酒店：每件行李5-10 EGP\n导游：每天20-50 EGP\n出租车：通常不需要，但可以给零钱\n\n小费是埃及文化的一部分，建议准备零钱。"
   *   }
   *   或
   *   {
   *     "data": {
   *       "title": "埃及小费指南",
   *       "content": "餐厅：账单的10-15%\n酒店：每件行李5-10 EGP\n导游：每天20-50 EGP\n出租车：通常不需要，但可以给零钱\n\n小费是埃及文化的一部分，建议准备零钱。"
   *     }
   *   }
   */
  tipGuideApi: 'https://bobapro.life/api/custom/tip-guide',

  /**
   * 反馈建议 API
   * 请求方式: POST
   * 请求参数:
   *   - content: 反馈内容（必填，字符串）
   *   - category: 功能分类（可选，字符串，如 "问路卡片"、"话费助手" 等）
   *   - userInfo: 用户信息对象（自动包含）
   *     - nickName: 用户昵称
   *     - avatarUrl: 用户头像URL
   *     - gender: 性别（0: 未知, 1: 男, 2: 女）
   *     - country: 国家
   *     - province: 省份
   *     - city: 城市
   *     - language: 语言
   * 返回格式:
   *   - 成功: { success: true, message: "提交成功" }
   *   - 失败: { success: false, message: "错误信息" }
   */
  feedbackApi: 'https://bobapro.life/api/custom/feedback',

  // 云开发环境 ID
  envId: 'cloudbase-9gqw4na0bc0be7c5',
  // envId: 'test-f0b102',

  // 云开发-存储 示例文件的文件 ID
  demoImageFileId: 'cloud://release-b86096.7265-release-b86096-1258211818/demo.jpg',
  demoVideoFileId: 'cloud://release-b86096.7265-release-b86096/demo.mp4',
}

module.exports = config
