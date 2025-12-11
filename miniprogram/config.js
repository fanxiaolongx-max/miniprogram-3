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
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "机场"、"商场"、"景点"、"餐厅"）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 name、address、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式: 
   *   - 直接数组: [{ id, name, address, latitude, longitude, image, category }]
   *   - 包装对象: { data: [{ id, name, address, latitude, longitude, image, category }] }
   *   - 包装对象: { locations: [{ id, name, address, latitude, longitude, image, category }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - name: 地点名称（必填）
   *   - address: 地址（必填）
   *   - latitude: 纬度（必填，数字）
   *   - longitude: 经度（必填，数字）
   *   - image: 图片URL（可选）
   *   - category: 分类（可选，如 "机场"、"商场"、"景点"、"餐厅" 等，用于页面分类筛选）
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
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/locations?page=1&pageSize=20
   *   2. 只按分类过滤（"机场"）:
   *      GET /api/custom/locations?page=1&pageSize=20&category=机场
   *   3. 只按关键词搜索（"开罗"）:
   *      GET /api/custom/locations?page=1&pageSize=20&keyword=开罗
   *   4. 组合过滤（分类"机场" + 关键词"国际"）:
   *      GET /api/custom/locations?page=1&pageSize=20&category=机场&keyword=国际
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/locations?page=2&pageSize=20&category=机场&keyword=国际
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "开罗国际机场",
   *         "address": "开罗市中心",
   *         "latitude": 30.0444,
   *         "longitude": 31.2357,
   *         "image": "/page/component/resources/pic/1.jpg",
   *         "category": "机场"
   *       },
   *       {
   *         "id": 2,
   *         "name": "City Stars 购物中心",
   *         "address": "开罗市中心",
   *         "latitude": 30.0444,
   *         "longitude": 31.2357,
   *         "image": "/page/component/resources/pic/2.jpg",
   *         "category": "商场"
   *       }
   *     ],
   *     "total": 100,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
   *   [
   *     {
   *       "id": 1,
   *       "name": "开罗国际机场",
   *       "address": "开罗市中心",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357,
   *       "image": "/page/component/resources/pic/1.jpg",
   *       "category": "机场"
   *     },
   *     {
   *       "id": 2,
   *       "name": "City Stars 购物中心",
   *       "address": "开罗市中心",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357,
   *       "image": "/page/component/resources/pic/2.jpg",
   *       "category": "商场"
   *     }
   *   ]
   */
  locationsApi: 'https://bobapro.life/api/custom/locations',

  /**
   * 常用菜单链接 API（寻味中国）
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "中餐厅"、"超市"、"奶茶店"）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 name、title、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, name, url, title, image, category }]
   *   - 包装对象: { data: [{ id, name, url, title, image, category }] }
   *   - 包装对象: { menuLinks: [{ id, name, url, title, image, category }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - name: 菜单名称（必填，如 "🧋 Nefididi"）
   *   - url: 菜单链接URL（必填，需要 encodeURIComponent）
   *   - title: 菜单标题（必填，用于 web-view 显示）
   *   - image: 图片URL（必填，用于瀑布流展示）
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
   *   - category: 分类（可选，如 "中餐厅"、"超市"、"奶茶店" 等，用于页面分类筛选）
   *     注意：页面会自动从API返回的数据中提取所有分类，无需在代码中写死分类名称
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/menu-links?page=1&pageSize=20
   *   2. 只按分类过滤（"中餐厅"）:
   *      GET /api/custom/menu-links?page=1&pageSize=20&category=中餐厅
   *   3. 只按关键词搜索（"川味"）:
   *      GET /api/custom/menu-links?page=1&pageSize=20&keyword=川味
   *   4. 组合过滤（分类"中餐厅" + 关键词"川味"）:
   *      GET /api/custom/menu-links?page=1&pageSize=20&category=中餐厅&keyword=川味
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/menu-links?page=2&pageSize=20&category=中餐厅&keyword=川味
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "🧋 Nefididi",
   *         "url": "https://boda-0mqtrq.fly.dev/",
   *         "title": "Nefididi",
   *         "image": "https://example.com/nefididi.jpg",
   *         "category": "奶茶店"
   *       },
   *       {
   *         "id": 2,
   *         "name": "🍜 川味餐厅",
   *         "url": "https://example.com/restaurant",
   *         "title": "川味餐厅",
   *         "image": "https://example.com/restaurant.jpg",
   *         "category": "中餐厅"
   *       }
   *     ],
   *     "total": 50,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
   *   [
   *     {
   *       "id": 1,
   *       "name": "🧋 Nefididi",
   *       "url": "https://boda-0mqtrq.fly.dev/",
   *       "title": "Nefididi",
   *       "image": "https://example.com/nefididi.jpg",
   *       "category": "奶茶店"
   *     },
   *     {
   *       "id": 2,
   *       "name": "🍜 川味餐厅",
   *       "url": "https://example.com/restaurant",
   *       "title": "川味餐厅",
   *       "image": "https://example.com/restaurant.jpg",
   *       "category": "中餐厅"
   *     }
   *   ]
   */
  menuLinksApi: 'https://bobapro.life/api/custom/menu-links',

  /**
   * 热门打卡地 API
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "景点"、"博物馆"、"公园"、"餐厅"）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 name、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, name, description, image, latitude, longitude, category, detailApi }]
   *   - 包装对象: { data: [{ id, name, description, image, latitude, longitude, category, detailApi }] }
   *   - 包装对象: { hotSpots: [{ id, name, description, image, latitude, longitude, category, detailApi }] }
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
   *   - category: 分类（可选，如 "景点"、"博物馆"、"公园"、"餐厅" 等，用于页面分类筛选）
   *     注意：页面会自动从API返回的数据中提取所有分类，无需在代码中写死分类名称
   *   - latitude: 纬度（必填，数字）
   *   - longitude: 经度（必填，数字）
   *   - detailApi/detailUrl: 详情API地址（可选，字符串）
   *     如果提供此字段，点击打卡地卡片时会调用该API获取HTML格式的文章内容并在小程序中展示
   *     如果不提供，点击后会显示弹窗，用户可选择导航到地图位置
   *     注意：detailApi应该是完整的API地址（HTTPS），返回格式请参考"详情API"说明
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/hot-spots?page=1&pageSize=20
   *   2. 只按分类过滤（"景点"）:
   *      GET /api/custom/hot-spots?page=1&pageSize=20&category=景点
   *   3. 只按关键词搜索（"金字塔"）:
   *      GET /api/custom/hot-spots?page=1&pageSize=20&keyword=金字塔
   *   4. 组合过滤（分类"景点" + 关键词"金字塔"）:
   *      GET /api/custom/hot-spots?page=1&pageSize=20&category=景点&keyword=金字塔
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/hot-spots?page=2&pageSize=20&category=景点&keyword=金字塔
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "金字塔",
   *         "description": "世界七大奇迹之一",
   *         "image": "/page/component/resources/pic/1.jpg",
   *         "latitude": 29.9792,
   *         "longitude": 31.1342,
   *         "category": "景点",
   *         "detailApi": "https://example.com/api/hot-spots/1/detail"
   *       },
   *       {
   *         "id": 2,
   *         "name": "埃及博物馆",
   *         "description": "收藏大量古埃及文物",
   *         "image": "/page/component/resources/pic/2.jpg",
   *         "latitude": 30.0444,
   *         "longitude": 31.2357,
   *         "category": "博物馆"
   *       }
   *     ],
   *     "total": 80,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
   *   [
   *     {
   *       "id": 1,
   *       "name": "金字塔",
   *       "description": "世界七大奇迹之一",
   *       "image": "/page/component/resources/pic/1.jpg",
   *       "latitude": 29.9792,
   *       "longitude": 31.1342,
   *       "category": "景点",
   *       "detailApi": "https://example.com/api/hot-spots/1/detail"
   *     },
   *     {
   *       "id": 2,
   *       "name": "埃及博物馆",
   *       "description": "收藏大量古埃及文物",
   *       "image": "/page/component/resources/pic/2.jpg",
   *       "latitude": 30.0444,
   *       "longitude": 31.2357,
   *       "category": "博物馆"
   *     }
   *   ]
   */
  hotSpotsApi: 'https://bobapro.life/api/custom/hot-spots',

  /**
   * 租房信息 API
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "马底"、"纳赛尔城"、"新开罗"、"开罗市中心"）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 title、address、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, title, address, price, type, rooms, area, contact, latitude, longitude, image, category, detailApi }]
   *   - 包装对象: { data: [{ id, title, address, price, type, rooms, area, contact, latitude, longitude, image, category, detailApi }] }
   *   - 包装对象: { rentals: [{ id, title, address, price, type, rooms, area, contact, latitude, longitude, image, category, detailApi }] }
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
   *   - category: 分类（可选，如 "马底"、"纳赛尔城"、"新开罗"、"开罗市中心" 等，用于页面分类筛选）
   *     注意：页面会自动从API返回的数据中提取所有分类，无需在代码中写死分类名称
   *   - detailApi/detailUrl: 详情API地址（可选，字符串）
   *     如果提供此字段，点击房源卡片时会调用该API获取HTML格式的文章内容并在小程序中展示
   *     如果不提供，点击后会显示弹窗，用户可选择联系房东
   *     注意：detailApi应该是完整的API地址（HTTPS），返回格式请参考"详情API"说明
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/rentals?page=1&pageSize=20
   *   2. 只按分类过滤（"新开罗"）:
   *      GET /api/custom/rentals?page=1&pageSize=20&category=新开罗
   *   3. 只按关键词搜索（"精装"）:
   *      GET /api/custom/rentals?page=1&pageSize=20&keyword=精装
   *   4. 组合过滤（分类"新开罗" + 关键词"精装"）:
   *      GET /api/custom/rentals?page=1&pageSize=20&category=新开罗&keyword=精装
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/rentals?page=2&pageSize=20&category=新开罗&keyword=精装
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
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
   *         "image": "/page/component/resources/pic/1.jpg",
   *         "category": "开罗市中心",
   *         "detailApi": "https://example.com/api/rentals/1/detail"
   *       },
   *       {
   *         "id": 2,
   *         "title": "新开罗三室一厅",
   *         "address": "新开罗区，环境优美",
   *         "price": "5000",
   *         "type": "整租",
   *         "rooms": "3",
   *         "area": "120",
   *         "contact": "微信：rental002",
   *         "latitude": 30.0131,
   *         "longitude": 31.2089,
   *         "image": "/page/component/resources/pic/2.jpg",
   *         "category": "新开罗"
   *       }
   *     ],
   *     "total": 150,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
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
   *       "image": "/page/component/resources/pic/1.jpg",
   *       "category": "开罗市中心",
   *       "detailApi": "https://example.com/api/rentals/1/detail"
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
   *       "image": "/page/component/resources/pic/2.jpg",
   *       "category": "新开罗"
   *     }
   *   ]
   */
  rentalsApi: 'https://bobapro.life/api/custom/rentals',

  /**
   * 汇率 API
   * 请求方式: GET
   * 返回格式（支持多种格式，按优先级处理）:
   *   1. 多币种汇率对象（推荐）:
   *      { CNY: { EGP: 6.7 }, USD: { EGP: 30.5 }, EUR: { EGP: 33.2 }, ... }
   *      或包装格式: { data: { CNY: { EGP: 6.7 }, ... } }
   *      或 rates 格式: { rates: { CNY: { EGP: 6.7 }, ... } }
   *   2. 单币种对象:
   *      { rate: 6.7, updatedAt: "2024-01-01 12:00:00" }
   *      或 { exchangeRate: 6.7, updatedAt: "2024-01-01 12:00:00" }
   *   3. 直接数字: 6.7
   * 字段说明:
   *   多币种格式（推荐）:
   *     - CNY.EGP: 人民币对埃镑汇率（必填，数字，1 CNY = ? EGP）
   *     - USD.EGP: 美元对埃镑汇率（可选，数字，1 USD = ? EGP）
   *     - EUR.EGP: 欧元对埃镑汇率（可选，数字，1 EUR = ? EGP）
   *     - SAR.EGP: 沙特里亚尔对埃镑汇率（可选，数字，1 SAR = ? EGP）
   *     - GBP.EGP: 英镑对埃镑汇率（可选，数字，1 GBP = ? EGP）
   *     - JPY.EGP: 日元对埃镑汇率（可选，数字，1 JPY = ? EGP）
   *     - AED.EGP: 阿联酋迪拉姆对埃镑汇率（可选，数字，1 AED = ? EGP）
   *     - 其他币种对: 支持任意币种对，格式为 { 源币种: { 目标币种: 汇率值 } }
   *   单币种格式:
   *     - rate/exchangeRate: 汇率值（必填，数字，1 CNY = ? EGP）
   *   - updatedAt/lastUpdated/updateTime: 更新时间（可选，字符串）
   * 支持的货币列表:
   *   🇨🇳 CNY - 人民币（人民币）
   *   🇪🇬 EGP - 埃镑（埃及镑）
   *   🇺🇸 USD - 美元（United States Dollar）
   *   🇪🇺 EUR - 欧元（Euro）
   *   🇸🇦 SAR - 沙特里亚尔（Saudi Riyal）
   *   🇬🇧 GBP - 英镑（British Pound）
   *   🇯🇵 JPY - 日元（Japanese Yen）
   *   🇦🇪 AED - 阿联酋迪拉姆（United Arab Emirates Dirham）
   * 返回示例:
   *   多币种格式（推荐）:
   *   {
   *     "CNY": {
   *       "EGP": 6.7
   *     },
   *     "USD": {
   *       "EGP": 30.5
   *     },
   *     "EUR": {
   *       "EGP": 33.2
   *     },
   *     "SAR": {
   *       "EGP": 8.15
   *     },
   *     "GBP": {
   *       "EGP": 38.8
   *     },
   *     "JPY": {
   *       "EGP": 0.21
   *     },
   *     "AED": {
   *       "EGP": 8.31
   *     },
   *     "updatedAt": "2024-01-01 12:00:00"
   *   }
   *   或包装格式:
   *   {
   *     "data": {
   *       "CNY": { "EGP": 6.7 },
   *       "USD": { "EGP": 30.5 },
   *       "EUR": { "EGP": 33.2 },
   *       "SAR": { "EGP": 8.15 },
   *       "GBP": { "EGP": 38.8 },
   *       "JPY": { "EGP": 0.21 },
   *       "AED": { "EGP": 8.31 }
   *     },
   *     "updatedAt": "2024-01-01 12:00:00"
   *   }
   *   或 rates 格式:
   *   {
   *     "rates": {
   *       "CNY": { "EGP": 6.7 },
   *       "USD": { "EGP": 30.5 },
   *       "EUR": { "EGP": 33.2 },
   *       "SAR": { "EGP": 8.15 },
   *       "GBP": { "EGP": 38.8 },
   *       "JPY": { "EGP": 0.21 },
   *       "AED": { "EGP": 8.31 }
   *     },
   *     "updatedAt": "2024-01-01 12:00:00"
   *   }
   *   单币种格式（兼容旧格式）:
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
   * 出行风向标 API（综合出行信息）
   * 请求方式: GET
   * 返回格式:
   *   - 对象: { globalAlert, attractions, traffic }
   *   - 包装对象: { data: { globalAlert, attractions, traffic } }
   * 字段说明:
   *   - globalAlert: 全域预警（可选，对象）
   *     - level: 预警级别（"high" | "medium" | "low"，对应红色/橙色/黄色）
   *     - message: 预警信息（字符串，如 "今日开罗大部分地区有扬沙，能见度低，建议减少外出。"）
   *   - attractions: 热门景点信息（必填，数组）
   *     每个景点对象包含：
   *     - id: 唯一标识（必填）
   *     - name: 景点名称（必填，如 "金字塔"、"卢克索神庙"、"帝王谷"、"黑白沙漠"）
   *     - temperature: 温度（必填，数字，如 36）
   *     - visibility: 能见度（必填，字符串，如 "高"、"中"、"低"，用于沙尘暴预警）
   *     - uvIndex: 紫外线强度（必填，数字，0-11，用于暴晒预警）
   *     - windSpeed: 风力（可选，字符串，如 "5级"）
   *     - suggestion: 建议（可选，字符串，如 "早晨 8 点前去，带足水。"）
   *   - traffic: 路况广播（可选，数组）
   *     每个路况对象包含：
   *     - id: 唯一标识（必填）
   *     - time: 时间（必填，字符串，如 "10:30"）
   *     - type: 类型（必填，字符串，如 "车祸"、"施工"、"天气"）
   *     - location: 地点（可选，字符串，如 "环城路 Maadi 出口方向"）
   *     - message: 消息内容（必填，字符串，如 "发生追尾，极度拥堵。"）
   * 返回示例:
   *   {
   *     "globalAlert": {
   *       "level": "medium",
   *       "message": "今日开罗大部分地区有扬沙，能见度低，建议减少外出。"
   *     },
   *     "attractions": [
   *       {
   *         "id": 1,
   *         "name": "金字塔",
   *         "temperature": 36,
   *         "visibility": "高",
   *         "uvIndex": 10,
   *         "windSpeed": "3级",
   *         "suggestion": "早晨 8 点前去，带足水。"
   *       },
   *       {
   *         "id": 2,
   *         "name": "黑白沙漠",
   *         "temperature": 10,
   *         "visibility": "中",
   *         "uvIndex": 5,
   *         "windSpeed": "5级",
   *         "suggestion": "带厚羽绒服。"
   *       },
   *       {
   *         "id": 3,
   *         "name": "卢克索神庙",
   *         "temperature": 38,
   *         "visibility": "高",
   *         "uvIndex": 11,
   *         "suggestion": "建议下午4点后参观，注意防晒。"
   *       },
   *       {
   *         "id": 4,
   *         "name": "帝王谷",
   *         "temperature": 35,
   *         "visibility": "中",
   *         "uvIndex": 9,
   *         "suggestion": "室内参观，不受天气影响。"
   *       }
   *     ],
   *     "traffic": [
   *       {
   *         "id": 1,
   *         "time": "10:30",
   *         "type": "车祸",
   *         "location": "环城路 Maadi 出口方向",
   *         "message": "发生追尾，极度拥堵。"
   *       },
   *       {
   *         "id": 2,
   *         "time": "09:00",
   *         "type": "施工",
   *         "location": "十月六日桥下桥口",
   *         "message": "施工，请绕行。"
   *       },
   *       {
   *         "id": 3,
   *         "time": "08:00",
   *         "type": "天气",
   *         "location": "赫尔格达",
   *         "message": "今日风浪大，潜水船只停运。"
   *       }
   *     ]
   *   }
   *   或
   *   {
   *     "data": {
   *       "globalAlert": {
   *         "level": "medium",
   *         "message": "今日开罗大部分地区有扬沙，能见度低，建议减少外出。"
   *       },
   *       "attractions": [...],
   *       "traffic": [...]
   *     }
   *   }
   */
  weatherApi: 'https://bobapro.life/api/custom/weather',

  /**
   * 热门活动 API
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "聚会"、"旅游"、"文化"、"体育"）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 title、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, title, description, image, category }]
   *   - 包装对象: { data: [{ id, title, description, image, category }] }
   *   - 包装对象: { activities: [{ id, title, description, image, category }] }
   *   - 单个对象: { title: "活动标题", image: "...", category: "..." }
   * 字段说明:
   *   - id: 唯一标识（数组时必填）
   *   - title/name: 活动标题（必填）
   *   - description/desc: 活动描述（可选）
   *   - image: 图片URL（必填，用于瀑布流展示）
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
   *   - category: 分类（可选，如 "聚会"、"旅游"、"文化"、"体育" 等，用于页面分类筛选）
   *     注意：页面会自动从API返回的数据中提取所有分类，无需在代码中写死分类名称
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/hot-activity?page=1&pageSize=20
   *   2. 只按分类过滤（"聚会"）:
   *      GET /api/custom/hot-activity?page=1&pageSize=20&category=聚会
   *   3. 只按关键词搜索（"春节"）:
   *      GET /api/custom/hot-activity?page=1&pageSize=20&keyword=春节
   *   4. 组合过滤（分类"聚会" + 关键词"春节"）:
   *      GET /api/custom/hot-activity?page=1&pageSize=20&category=聚会&keyword=春节
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/hot-activity?page=2&pageSize=20&category=聚会&keyword=春节
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "开罗华人春节联欢会",
   *         "description": "2024年2月10日，开罗市中心举办",
   *         "image": "https://example.com/spring-festival.jpg",
   *         "category": "聚会"
   *       },
   *       {
   *         "id": 2,
   *         "title": "埃及旅游攻略分享会",
   *         "description": "每周六下午2点，线上直播",
   *         "image": "https://example.com/travel-share.jpg",
   *         "category": "旅游"
   *       }
   *     ],
   *     "total": 60,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
   *   [
   *     {
   *       "id": 1,
   *       "title": "开罗华人春节联欢会",
   *       "description": "2024年2月10日，开罗市中心举办",
   *       "image": "https://example.com/spring-festival.jpg",
   *       "category": "聚会"
   *     },
   *     {
   *       "id": 2,
   *       "title": "埃及旅游攻略分享会",
   *       "description": "每周六下午2点，线上直播",
   *       "image": "https://example.com/travel-share.jpg",
   *       "category": "旅游"
   *     },
   *     {
   *       "id": 3,
   *       "title": "中国文化展览",
   *       "description": "展示中国传统艺术",
   *       "image": "https://example.com/culture-expo.jpg",
   *       "category": "文化"
   *     }
   *   ]
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
   * 尼罗河热映 API
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 name、title、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, name, title, description, image, category, detailApi }]
   *   - 包装对象: { data: [{ id, name, title, description, image, category, detailApi }] }
   *   - 包装对象: { items: [{ id, name, title, description, image, category, detailApi }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - name/title: 应用名称（必填）
   *   - description/desc: 应用描述（可选）
   *   - image/imageUrl: 图片URL（必填，用于瀑布流展示）
   *   - category: 分类（可选，用于页面分类筛选）
   *   - detailApi/detailUrl: 详情API地址（可选，字符串）
   *     如果提供此字段，点击应用卡片时会调用该API获取HTML格式的文章内容并在小程序中展示
   *     如果不提供，点击后会显示弹窗，展示应用描述
   *     注意：detailApi应该是完整的API地址（HTTPS），返回格式请参考"详情API"说明
   * 返回示例:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "name": "应用名称",
   *         "title": "应用标题",
   *         "description": "应用描述",
   *         "image": "https://example.com/image.jpg",
   *         "category": "分类",
   *         "detailApi": "https://example.com/api/nile-hot/1/detail"
   *       }
   *     ],
   *     "total": 100,
   *     "hasMore": true
   *   }
   */
  nileHotApi: 'https://bobapro.life/api/custom/nile-hot',

  /**
   * 二手集市 API
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "交通工具"、"家具"、"电子产品"）
   *     注意：分类过滤只针对 category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 title、description、contact 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, title, price, description, image, contact, category, detailApi }]
   *   - 包装对象: { data: [{ id, title, price, description, image, contact, category, detailApi }] }
   *   - 包装对象: { items: [{ id, title, price, description, image, contact, category, detailApi }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - title/name: 商品标题（必填）
   *   - price/amount: 价格（必填，字符串，如 "2000"）
   *   - description/desc: 商品描述（可选）
   *   - image/imageUrl: 图片URL（可选）
   *   - contact/phone: 联系方式（必填）
   *   - category/type: 商品分类（可选，如 "交通工具"、"家具"）
   *     注意：页面会自动从API返回的数据中提取所有分类，无需在代码中写死分类名称
   *   - detailApi/detailUrl: 详情API地址（可选，字符串）
   *     如果提供此字段，点击商品卡片时会调用该API获取HTML格式的文章内容并在小程序中展示
   *     如果不提供，点击后会显示弹窗，用户可选择联系卖家
   *     注意：detailApi应该是完整的API地址（HTTPS），返回格式请参考"详情API"说明
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/second-hand?page=1&pageSize=20
   *   2. 只按分类过滤（"交通工具"）:
   *      GET /api/custom/second-hand?page=1&pageSize=20&category=交通工具
   *   3. 只按关键词搜索（"电动车"）:
   *      GET /api/custom/second-hand?page=1&pageSize=20&keyword=电动车
   *   4. 组合过滤（分类"交通工具" + 关键词"电动车"）:
   *      GET /api/custom/second-hand?page=1&pageSize=20&category=交通工具&keyword=电动车
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/second-hand?page=2&pageSize=20&category=交通工具&keyword=电动车
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "二手电动车",
   *         "price": "2000",
   *         "description": "九成新，性能良好",
   *         "image": "https://example.com/electric-bike.jpg",
   *         "contact": "微信：secondhand001",
   *         "category": "交通工具",
   *         "detailApi": "https://example.com/api/second-hand/1/detail"
   *       },
   *       {
   *         "id": 2,
   *         "title": "二手家具",
   *         "price": "500",
   *         "description": "沙发、桌子等",
   *         "image": "https://example.com/furniture.jpg",
   *         "contact": "微信：secondhand002",
   *         "category": "家具"
   *       }
   *     ],
   *     "total": 200,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
   *   [
   *     {
   *       "id": 1,
   *       "title": "二手电动车",
   *       "price": "2000",
   *       "description": "九成新，性能良好",
   *       "image": "https://example.com/electric-bike.jpg",
   *       "contact": "微信：secondhand001",
   *       "category": "交通工具",
   *       "detailApi": "https://example.com/api/second-hand/1/detail"
   *     },
   *     {
   *       "id": 2,
   *       "title": "二手家具",
   *       "price": "500",
   *       "description": "沙发、桌子等",
   *       "image": "https://example.com/furniture.jpg",
   *       "contact": "微信：secondhand002",
   *       "category": "家具"
   *     },
   *     {
   *       "id": 3,
   *       "title": "iPhone 12",
   *       "price": "3000",
   *       "description": "九成新，功能正常",
   *       "image": "https://example.com/iphone.jpg",
   *       "contact": "微信：secondhand003",
   *       "category": "电子产品"
   *     }
   *   ]
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
   * 防骗预警（黑名单）API
   * 请求方式: GET
   * 请求参数（支持分页和过滤）:
   *   - page: 页码（必填，数字，从1开始，默认1）
   *   - pageSize: 每页数量（必填，数字，默认20）
   *   - category: 分类过滤（可选，字符串，如 "租房诈骗"、"购物诈骗"、"网络诈骗"）
   *     注意：分类过滤只针对 type/category 字段进行精确匹配
   *   - keyword: 搜索关键词（可选，字符串，全文搜索）
   *     注意：关键词搜索会对多个字段进行全文匹配（如 title、description 等），与 category 可以独立使用或组合使用
   *   - format: 返回格式（可选，字符串，"array" 返回数组，默认返回对象格式）
   * 过滤逻辑说明:
   *   - category 和 keyword 是两个独立的过滤条件，可以单独使用，也可以组合使用
   *   - 如果只传 category，只按分类过滤
   *   - 如果只传 keyword，只按关键词全文搜索
   *   - 如果同时传 category 和 keyword，先按分类过滤，再在结果中搜索关键词（组合过滤）
   *   - 如果都不传，返回全部数据
   * 返回格式:
   *   - 直接数组: [{ id, title, description, type, date, image, detailApi }]
   *   - 包装对象: { data: [{ id, title, description, type, date, image, detailApi }] }
   *   - 包装对象: { blacklist: [{ id, title, description, type, date, image, detailApi }] }
   * 字段说明:
   *   - id: 唯一标识（必填）
   *   - title/name: 标题（必填，如 "虚假租房信息"）
   *   - description/desc: 详细描述（必填，用于瀑布流卡片展示摘要）
   *   - type/category: 类型（可选，如 "租房诈骗"、"购物诈骗"、"网络诈骗"、"电话诈骗"、"交易诈骗"、"虚假信息" 等）
   *     注意：页面会自动从API返回的数据中提取所有分类，无需在代码中写死分类名称
   *   - date/createdAt: 发布时间（可选，字符串，如 "2024-01-15"）
   *   - image/imageUrl: 图片URL（可选，用于瀑布流展示）
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
   *     4. 如果没有提供图片，卡片将只显示文字内容
   *   - detailApi/detailUrl: 详情API地址（可选，字符串）
   *     如果提供此字段，点击卡片时会调用该API获取HTML格式的文章内容并在小程序中展示
   *     如果不提供，点击后会显示弹窗，展示详细信息
   *     注意：detailApi应该是完整的API地址（HTTPS），返回格式请参考"详情API"说明
   * 请求示例:
   *   1. 获取第1页，每页20条（无过滤）:
   *      GET /api/custom/blacklist?page=1&pageSize=20
   *   2. 只按分类过滤（"租房诈骗"）:
   *      GET /api/custom/blacklist?page=1&pageSize=20&category=租房诈骗
   *   3. 只按关键词搜索（"虚假"）:
   *      GET /api/custom/blacklist?page=1&pageSize=20&keyword=虚假
   *   4. 组合过滤（分类"租房诈骗" + 关键词"虚假"）:
   *      GET /api/custom/blacklist?page=1&pageSize=20&category=租房诈骗&keyword=虚假
   *   5. 获取第2页数据（保持当前过滤条件）:
   *      GET /api/custom/blacklist?page=2&pageSize=20&category=租房诈骗&keyword=虚假
   * 返回示例:
   *   默认格式（对象，包含分页信息）:
   *   {
   *     "data": [
   *       {
   *         "id": 1,
   *         "title": "虚假租房信息",
   *         "description": "某中介发布虚假房源信息，收取定金后失联。提醒：租房时务必实地看房，不要提前支付大额定金。",
   *         "type": "租房诈骗",
   *         "date": "2024-01-15",
   *         "image": "https://example.com/scam-1.jpg",
   *         "detailApi": "https://example.com/api/blacklist/1/detail"
   *       },
   *       {
   *         "id": 2,
   *         "title": "网络购物诈骗",
   *         "description": "虚假购物网站，收款后不发货。提醒：选择正规平台购物，注意查看商家资质。",
   *         "type": "购物诈骗",
   *         "date": "2024-01-10"
   *       }
   *     ],
   *     "total": 50,
   *     "hasMore": true
   *   }
   *   或数组格式（format=array）:
   *   [
   *     {
   *       "id": 1,
   *       "title": "虚假租房信息",
   *       "description": "某中介发布虚假房源信息，收取定金后失联。提醒：租房时务必实地看房，不要提前支付大额定金。",
   *       "type": "租房诈骗",
   *       "date": "2024-01-15",
   *       "image": "https://example.com/scam-1.jpg",
   *       "detailApi": "https://example.com/api/blacklist/1/detail"
   *     },
   *     {
   *       "id": 2,
   *       "title": "网络购物诈骗",
   *       "description": "虚假购物网站，收款后不发货。提醒：选择正规平台购物，注意查看商家资质。",
   *       "type": "购物诈骗",
   *       "date": "2024-01-10"
   *     }
   *   ]
   */
  blacklistApi: 'https://bobapro.life/api/custom/blacklist',

  /**
   * 详情API（通用）
   * 请求方式: GET
   * 说明: 此API用于获取瀑布流页面中卡片的详细内容，返回HTML格式的文章内容
   * 请求参数:
   *   - 由列表API返回的detailApi字段指定，通常包含资源ID等参数
   * 返回格式（支持多种格式，按优先级处理）:
   *   1. 对象格式（推荐）:
   *      { content: "HTML内容", title: "标题", meta: "元信息（可选）" }
   *      或 { html: "HTML内容", title: "标题", meta: "元信息（可选）" }
   *   2. 包装对象:
   *      { data: { content: "HTML内容", title: "标题", meta: "元信息（可选）" } }
   *   3. 直接字符串:
   *      "HTML内容"
   * 字段说明:
   *   - content/html: HTML格式的文章内容（必填，字符串）
   *     支持标准HTML标签，如：<p>、<h1>、<h2>、<h3>、<ul>、<ol>、<li>、<img>、<a>等
   *     注意：小程序使用rich-text组件渲染，支持的标签有限，建议使用基础HTML标签
   *   - title: 文章标题（可选，字符串）
   *     如果不提供，导航栏将使用默认标题
   *   - meta: 元信息（可选，字符串）
   *     如发布时间、作者等信息，显示在标题下方
   * 返回示例:
   *   格式1（推荐）:
   *   {
   *     "content": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p><p>更多信息请参考官方文档。</p>",
   *     "title": "文章标题",
   *     "meta": "2024-01-15"
   *   }
   *   格式2:
   *   {
   *     "html": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>",
   *     "title": "文章标题"
   *   }
   *   格式3:
   *   {
   *     "data": {
   *       "content": "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>",
   *       "title": "文章标题",
   *       "meta": "2024-01-15"
   *     }
   *   }
   *   格式4（直接字符串）:
   *   "<h2>详细说明</h2><p>这是一段详细的描述内容...</p>"
   * 注意事项:
   *   1. HTML内容中的图片URL必须是HTTPS，且需要在微信公众平台配置downloadFile合法域名
   *   2. 支持的HTML标签有限，建议使用基础标签（p、h1-h6、ul、ol、li、img、a、span、div等）
   *   3. 不支持JavaScript、iframe等标签
   *   4. 样式建议使用内联样式，小程序会自动处理部分样式
   */

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
