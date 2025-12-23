/**
 * API响应数据处理工具
 * 用于处理API返回数据中的URL，确保使用正确的生产环境域名
 */

/**
 * 获取API基础域名
 * @returns {string} 返回 'https://bobapro.life'
 */
function getApiBaseDomain() {
  return 'https://bobapro.life'
}

/**
 * 替换URL中的域名（将 boba.app 替换为 bobapro.life）
 * @param {string} url - 原始URL
 * @returns {string} 替换后的URL
 */
function replaceUrlDomain(url) {
  if (!url || typeof url !== 'string') {
    return url
  }
  
  // 将 boba.app 替换为 bobapro.life
    if (url.includes('https://boba.app')) {
      const replaced = url.replace(/https:\/\/boba\.app/g, 'https://bobapro.life')
    console.log(`[envHelper] URL替换: ${url} -> ${replaced}`)
      return replaced
  }
  
  return url
}

/**
 * 递归替换对象/数组中的所有URL字符串
 * @param {any} data - 要处理的数据（可以是对象、数组、字符串等）
 * @param {number} depth - 递归深度（防止无限递归）
 * @returns {any} 处理后的数据
 */
function replaceUrlsInData(data, depth = 0) {
  // 防止无限递归
  if (depth > 10) {
    console.warn('[envHelper] 递归深度超过10层，停止处理')
    return data
  }
  
  // null 或 undefined
  if (data == null) {
    return data
  }
  
  // 字符串：直接替换
  if (typeof data === 'string') {
    return replaceUrlDomain(data)
  }
  
  // 数组：递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => replaceUrlsInData(item, depth + 1))
  }
  
  // 对象：递归处理每个属性
  if (typeof data === 'object') {
    const result = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = replaceUrlsInData(data[key], depth + 1)
      }
    }
    return result
  }
  
  // 其他类型（数字、布尔值等）：直接返回
  return data
}

/**
 * 处理API响应数据，自动替换其中的URL（将 boba.app 替换为 bobapro.life）
 * @param {any} responseData - API返回的数据
 * @returns {any} 处理后的数据
 */
function processApiResponse(responseData) {
  const processed = replaceUrlsInData(responseData)
    
    // 如果数据被修改了，打印提示
    try {
      const originalStr = JSON.stringify(responseData)
      const processedStr = JSON.stringify(processed)
      if (originalStr !== processedStr) {
        console.log('[envHelper] ✅ API响应数据已处理，URL已从 boba.app 替换为 bobapro.life')
        // 统计替换的数量
        const originalMatches = (originalStr.match(/https:\/\/boba\.app/g) || []).length
        if (originalMatches > 0) {
          console.log(`[envHelper] 替换统计: 发现 ${originalMatches} 个 boba.app URL，已全部替换为 bobapro.life`)
        }
    }
  } catch (e) {
    console.log('[envHelper] API响应数据已处理（无法比较差异，可能包含循环引用）')
  }
  
  return processed
}

module.exports = {
  getApiBaseDomain,
  processApiResponse
}
