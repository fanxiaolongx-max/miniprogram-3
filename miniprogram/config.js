/**
 * 小程序配置文件
 */

// 引入环境检测工具
const envHelper = require('./utils/envHelper.js')

// 获取API基础域名（固定使用生产环境）
const apiBaseDomain = envHelper.getApiBaseDomain()

console.log(`[config] API域名: ${apiBaseDomain}`)

const config = {
  // API基础域名（固定使用生产环境）
  apiBaseDomain: apiBaseDomain,
  
  // 测试的请求地址，用于测试会话（根据环境自动选择）
  requestUrl: apiBaseDomain,

  // ==================== API 端点配置 ====================
  // 注意：所有列表类功能已统一迁移到 /api/blog/posts API
  // 请使用 blogApi.blogPostApi.getList() 方法，通过 category 参数区分不同功能

  /**
   * 汇率转换 API（已迁移到 /api/blog/posts?category=汇率转换）
   * 请使用 blogApi.blogPostApi.getList({ category: '汇率转换' }) 替代
   * 注意：特殊数据在返回的 _specialData 字段中
   * @deprecated 此配置已废弃，保留仅用于向后兼容
   */
  exchangeRateApi: `${apiBaseDomain}/api/blog/posts?category=汇率转换`,

  /**
   * 天气路况 API（已迁移到 /api/blog/posts?category=天气路况）
   * 请使用 blogApi.blogPostApi.getList({ category: '天气路况' }) 替代
   * 注意：特殊数据在返回的 _specialData 字段中
   * @deprecated 此配置已废弃，保留仅用于向后兼容
   */
  weatherApi: `${apiBaseDomain}/api/blog/posts?category=天气路况`,

  /**
   * 翻译卡片 API（已迁移到 /api/blog/posts?category=翻译卡片）
   * 请使用 blogApi.blogPostApi.getList({ category: '翻译卡片' }) 替代
   * 注意：特殊数据在返回的 _specialData 字段中
   * @deprecated 此配置已废弃，保留仅用于向后兼容
   */
  translationApi: `${apiBaseDomain}/api/blog/posts?category=翻译卡片`,

  /**
   * TTS语音合成 API（可选）
   * 如果后端支持TTS，可以配置此API
   * 请求方式: POST
   * 请求参数: { 
   *   text: string,           // 要朗读的文本
   *   lang: 'zh' | 'ar',     // 语言：zh=中文，ar=阿拉伯语
   *   format: 'mp3' | 'aac'  // 音频格式：mp3 或 aac（推荐 mp3，兼容性最好）
   * }
   * 返回格式: { 
   *   audioUrl: string        // 音频文件的完整URL（必须是可访问的HTTPS URL，不能是Base64）
   * }
   * 注意事项:
   *   1. 音频格式必须为 MP3 或 AAC (m4a)，不能使用 Base64 字符串
   *   2. audioUrl 必须是完整的 HTTPS URL，微信小程序才能正常播放
   *   3. 音频文件需要支持跨域访问（CORS）
   *   4. 音频文件域名需要在微信公众平台配置 downloadFile 合法域名
   */
  ttsApi: `${apiBaseDomain}/api/tts`,

  /**
   * 二手市场 API（已迁移到 /api/blog/posts?category=二手市场）
   * 请使用 blogApi.blogPostApi.getList({ category: '二手市场' }) 替代
   * @deprecated 此配置已废弃，保留仅用于向后兼容
   */
  secondHandApi: `${apiBaseDomain}/api/blog/posts?category=二手市场`,

  /**
   * 反馈建议 API（已迁移到 /api/user/feedback）
   * 注意：新API需要用户认证（Session或Token）
   * 请求头需要包含：x-user-token 或使用 Cookie
   */
  feedbackApi: `${apiBaseDomain}/api/user/feedback`,

  // 云开发环境 ID
  envId: 'cloudbase-9gqw4na0bc0be7c5',
  // envId: 'test-f0b102',

  // 云开发-存储 示例文件的文件 ID
  demoImageFileId: 'cloud://release-b86096.7265-release-b86096-1258211818/demo.jpg',
  demoVideoFileId: 'cloud://release-b86096.7265-release-b86096/demo.mp4',

  // ==================== 博客管理 API 配置 ====================
  /**
   * 博客管理 API 基础路径
   * 用于文章、分类、标签的增删改查
   */
  blogAdminApiBaseUrl: `${apiBaseDomain}/api/blog-admin`,

  // 注意：已停用硬编码 token，现在统一使用 x-user-token 进行认证
  // blogAdminApiToken: '210311199405041819' // 已停用
}

module.exports = config
