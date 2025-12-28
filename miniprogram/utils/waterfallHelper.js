/**
 * 瀑布流页面公共工具函数
 * 用于复用浏览量和发布者信息处理逻辑
 */

/**
 * 格式化浏览量
 * @param {number} views - 浏览量
 * @returns {string} 格式化后的浏览量字符串
 */
function formatViews(views) {
  if (!views || views === 0) {
    return '0'
  }
  if (views < 1000) {
    return String(views)
  } else if (views < 10000) {
    return (views / 1000).toFixed(1) + 'k'
  } else {
    return (views / 10000).toFixed(1) + 'w'
  }
}

/**
 * 从文章对象中提取发布者信息
 * @param {object} item - 文章对象
 * @returns {object|null} 发布者信息对象 {nickname, phone, deviceModel} 或 null
 */
function extractAuthorInfo(item) {
  let authorInfo = null
  
  // 优先从 custom_fields 中获取
  if (item.custom_fields) {
    try {
      const customFields = typeof item.custom_fields === 'string' 
        ? JSON.parse(item.custom_fields) 
        : item.custom_fields
      
      if (customFields && (customFields.nickname || customFields.phone || customFields.deviceModel)) {
        authorInfo = {
          nickname: customFields.nickname || null,
          phone: customFields.phone || null,
          deviceModel: customFields.deviceModel || null
        }
      }
    } catch (e) {
      console.warn('[waterfallHelper] 解析custom_fields失败:', e)
    }
  }
  
  // 如果没有从 custom_fields 获取到，尝试直接从文章对象获取（向后兼容）
  if (!authorInfo && (item.nickname || item.phone || item.deviceModel)) {
    authorInfo = {
      nickname: item.nickname || null,
      phone: item.phone || null,
      deviceModel: item.deviceModel || null
    }
  }
  
  return authorInfo
}

/**
 * 为文章对象添加浏览量和发布者信息
 * @param {object} item - 文章对象
 * @param {string} logPrefix - 日志前缀（用于调试）
 * @returns {object} 添加了 views, formattedViews, authorInfo 的文章对象
 */
function enrichItemWithMeta(item, logPrefix = 'waterfallHelper') {
  // 提取浏览量
  const views = item.views || 0
  const formattedViews = formatViews(views)
  
  // 提取发布者信息
  const authorInfo = extractAuthorInfo(item)
  
  return {
    ...item,
    views: views,
    formattedViews: formattedViews,
    authorInfo: authorInfo
  }
}

/**
 * 批量处理文章列表，为每个文章添加浏览量和发布者信息
 * @param {array} items - 文章对象数组
 * @param {string} logPrefix - 日志前缀（用于调试）
 * @returns {array} 处理后的文章对象数组
 */
function enrichItemsWithMeta(items, logPrefix = 'waterfallHelper') {
  if (!Array.isArray(items)) {
    return []
  }
  
  return items.map(item => enrichItemWithMeta(item, logPrefix))
}

module.exports = {
  formatViews,
  extractAuthorInfo,
  enrichItemWithMeta,
  enrichItemsWithMeta
}

