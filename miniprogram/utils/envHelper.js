/**
 * 环境检测和URL替换工具
 * 用于智能识别开发/生产环境，并自动替换API返回数据中的URL
 */

/**
 * 检测当前是否为开发/调试环境
 * @returns {boolean} true表示开发环境，false表示生产环境
 */
function isDevelopment() {
  try {
    // 方法1: 检查全局标志（如果明确设置为 true，才认为是开发环境）
    // 注意：默认情况下 global.isDemo 不存在或为 false，表示生产环境
    if (typeof global !== 'undefined' && global.isDemo === true) {
      console.log('[envHelper] 通过 global.isDemo 检测到开发环境')
      return true
    }
    
    // 方法2: 检查小程序版本信息（最可靠的方法）
    try {
      const accountInfo = wx.getAccountInfoSync()
      if (accountInfo && accountInfo.miniProgram) {
        const envVersion = accountInfo.miniProgram.envVersion
        console.log('[envHelper] 通过 getAccountInfoSync 检测到环境版本:', envVersion)
        
        // 只有明确是开发版时才认为是开发环境
        if (envVersion === 'develop') {
          return true
        }
        // 体验版和正式版都使用生产环境
        if (envVersion === 'trial' || envVersion === 'release') {
          return false
        }
      }
    } catch (e) {
      // getAccountInfoSync 可能不支持，继续其他检测
      console.log('[envHelper] getAccountInfoSync 不可用，使用其他方法检测:', e.message)
    }
    
    // 方法3: 检查微信开发者工具环境（仅在开发者工具中才认为是开发环境）
    // 注意：即使是在开发者工具中，默认也使用生产环境，除非明确设置 global.isDemo = true
    // 这里不自动检测开发者工具，因为用户可能想在开发者工具中测试生产环境
    
    // 默认返回 false（生产环境）
    // 如果需要开发环境，请通过主页的切换按钮手动切换，或设置 global.isDemo = true
    console.log('[envHelper] 未检测到明确的开发环境标识，默认使用生产环境')
    return false
  } catch (err) {
    console.error('[envHelper] 检测环境时出错', err)
    // 出错时默认返回 false（生产环境）
    return false
  }
}

/**
 * 从本地存储获取手动选择的域名
 * @returns {string|null} 返回保存的域名，如果没有则返回 null
 */
function getManualDomain() {
  try {
    const savedDomain = wx.getStorageSync('api_domain_override')
    if (savedDomain && (savedDomain === 'https://boba.app' || savedDomain === 'https://bobapro.life')) {
      console.log('[envHelper] 从本地存储读取手动选择的域名:', savedDomain)
      return savedDomain
    }
  } catch (e) {
    console.warn('[envHelper] 读取本地存储失败:', e)
  }
  return null
}

/**
 * 保存手动选择的域名到本地存储
 * @param {string} domain - 要保存的域名
 */
function setManualDomain(domain) {
  try {
    if (domain === 'https://boba.app' || domain === 'https://bobapro.life') {
      wx.setStorageSync('api_domain_override', domain)
      console.log('[envHelper] 已保存手动选择的域名到本地存储:', domain)
    } else {
      console.warn('[envHelper] 无效的域名，未保存:', domain)
    }
  } catch (e) {
    console.error('[envHelper] 保存本地存储失败:', e)
  }
}

/**
 * 清除手动选择的域名
 */
function clearManualDomain() {
  try {
    wx.removeStorageSync('api_domain_override')
    console.log('[envHelper] 已清除手动选择的域名')
  } catch (e) {
    console.warn('[envHelper] 清除本地存储失败:', e)
  }
}

/**
 * 获取当前环境对应的API基础域名
 * @returns {string} 开发环境返回 'https://boba.app'，生产环境返回 'https://bobapro.life'
 */
function getApiBaseDomain() {
  // 优先使用手动选择的域名
  const manualDomain = getManualDomain()
  if (manualDomain) {
    console.log(`[envHelper] 使用手动选择的域名: ${manualDomain}`)
    return manualDomain
  }
  
  // 否则使用自动检测的环境
  const isDev = isDevelopment()
  const domain = isDev ? 'https://boba.app' : 'https://bobapro.life'
  console.log(`[envHelper] 当前环境: ${isDev ? '开发环境' : '生产环境'}，使用域名: ${domain}`)
  return domain
}

/**
 * 切换API域名（在开发和生产环境之间切换）
 * @returns {string} 切换后的域名
 */
function toggleApiDomain() {
  const currentDomain = getApiBaseDomain()
  const newDomain = currentDomain === 'https://boba.app' ? 'https://bobapro.life' : 'https://boba.app'
  setManualDomain(newDomain)
  console.log(`[envHelper] 域名已切换: ${currentDomain} -> ${newDomain}`)
  return newDomain
}

/**
 * 替换URL中的域名
 * @param {string} url - 原始URL
 * @param {boolean} isDev - 是否为开发环境
 * @returns {string} 替换后的URL
 */
function replaceUrlDomain(url, isDev) {
  if (!url || typeof url !== 'string') {
    return url
  }
  
  // 开发环境：将 bobapro.life 替换为 boba.app
  // 生产环境：将 boba.app 替换为 bobapro.life
  if (isDev) {
    // 开发环境：替换 bobapro.life -> boba.app
    if (url.includes('https://bobapro.life')) {
      const replaced = url.replace(/https:\/\/bobapro\.life/g, 'https://boba.app')
      console.log(`[envHelper] URL替换（开发环境）: ${url} -> ${replaced}`)
      return replaced
    }
  } else {
    // 生产环境：替换 boba.app -> bobapro.life
    if (url.includes('https://boba.app')) {
      const replaced = url.replace(/https:\/\/boba\.app/g, 'https://bobapro.life')
      console.log(`[envHelper] URL替换（生产环境）: ${url} -> ${replaced}`)
      return replaced
    }
  }
  
  return url
}

/**
 * 递归替换对象/数组中的所有URL字符串
 * @param {any} data - 要处理的数据（可以是对象、数组、字符串等）
 * @param {boolean} isDev - 是否为开发环境
 * @param {number} depth - 递归深度（防止无限递归）
 * @returns {any} 处理后的数据
 */
function replaceUrlsInData(data, isDev, depth = 0) {
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
    return replaceUrlDomain(data, isDev)
  }
  
  // 数组：递归处理每个元素
  if (Array.isArray(data)) {
    return data.map(item => replaceUrlsInData(item, isDev, depth + 1))
  }
  
  // 对象：递归处理每个属性
  if (typeof data === 'object') {
    const result = {}
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        result[key] = replaceUrlsInData(data[key], isDev, depth + 1)
      }
    }
    return result
  }
  
  // 其他类型（数字、布尔值等）：直接返回
  return data
}

/**
 * 处理API响应数据，自动替换其中的URL
 * @param {any} responseData - API返回的数据
 * @returns {any} 处理后的数据
 */
function processApiResponse(responseData) {
  // 检查是否有手动选择的域名
  const manualDomain = getManualDomain()
  
  // 如果手动选择了生产环境，需要将 boba.app 替换为 bobapro.life
  if (manualDomain === 'https://bobapro.life') {
    console.log('[envHelper] 用户手动选择了生产环境，将 boba.app 替换为 bobapro.life')
    const processed = replaceUrlsInData(responseData, false) // false 表示生产环境
    
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
      } else {
        console.log('[envHelper] API响应数据无需处理（未发现 boba.app URL）')
      }
    } catch (e) {
      console.log('[envHelper] API响应数据已处理（无法比较差异，可能包含循环引用）')
    }
    
    return processed
  }
  
  // 如果手动选择了开发环境，需要将 bobapro.life 替换为 boba.app
  if (manualDomain === 'https://boba.app') {
    console.log('[envHelper] 用户手动选择了开发环境，将 bobapro.life 替换为 boba.app')
    const processed = replaceUrlsInData(responseData, true) // true 表示开发环境
    
    // 如果数据被修改了，打印提示
    try {
      const originalStr = JSON.stringify(responseData)
      const processedStr = JSON.stringify(processed)
      if (originalStr !== processedStr) {
        console.log('[envHelper] ✅ API响应数据已处理，URL已从 bobapro.life 替换为 boba.app')
        // 统计替换的数量
        const originalMatches = (originalStr.match(/https:\/\/bobapro\.life/g) || []).length
        if (originalMatches > 0) {
          console.log(`[envHelper] 替换统计: 发现 ${originalMatches} 个 bobapro.life URL，已全部替换为 boba.app`)
        }
      } else {
        console.log('[envHelper] API响应数据无需处理（未发现 bobapro.life URL）')
      }
    } catch (e) {
      console.log('[envHelper] API响应数据已处理（无法比较差异，可能包含循环引用）')
    }
    
    return processed
  }
  
  // 如果没有手动选择，使用自动检测的环境
  const isDev = isDevelopment()
  
  if (!isDev) {
    // 生产环境：将 boba.app 替换为 bobapro.life
    console.log('[envHelper] 自动检测到生产环境，将 boba.app 替换为 bobapro.life')
    const processed = replaceUrlsInData(responseData, false)
    
    try {
      const originalStr = JSON.stringify(responseData)
      const processedStr = JSON.stringify(processed)
      if (originalStr !== processedStr) {
        console.log('[envHelper] ✅ API响应数据已处理，URL已从 boba.app 替换为 bobapro.life')
        const originalMatches = (originalStr.match(/https:\/\/boba\.app/g) || []).length
        if (originalMatches > 0) {
          console.log(`[envHelper] 替换统计: 发现 ${originalMatches} 个 boba.app URL，已全部替换为 bobapro.life`)
        }
      }
    } catch (e) {
      console.log('[envHelper] API响应数据已处理（无法比较差异）')
    }
    
    return processed
  }
  
  // 开发环境：替换所有 bobapro.life -> boba.app
  console.log('[envHelper] 自动检测到开发环境，将 bobapro.life 替换为 boba.app')
  const processed = replaceUrlsInData(responseData, isDev)
  
  // 如果数据被修改了，打印提示
  try {
    const originalStr = JSON.stringify(responseData)
    const processedStr = JSON.stringify(processed)
    if (originalStr !== processedStr) {
      console.log('[envHelper] ✅ API响应数据已处理，URL已从 bobapro.life 替换为 boba.app')
      // 统计替换的数量
      const originalMatches = (originalStr.match(/https:\/\/bobapro\.life/g) || []).length
      const processedMatches = (processedStr.match(/https:\/\/boba\.app/g) || []).length
      if (originalMatches > 0) {
        console.log(`[envHelper] 替换统计: 发现 ${originalMatches} 个 bobapro.life URL，已全部替换为 boba.app`)
      }
    } else {
      console.log('[envHelper] API响应数据无需处理（未发现 bobapro.life URL）')
    }
  } catch (e) {
    // JSON.stringify 可能失败（循环引用等），但数据已经处理
    console.log('[envHelper] API响应数据已处理（无法比较差异，可能包含循环引用）')
  }
  
  return processed
}

module.exports = {
  isDevelopment,
  getApiBaseDomain,
  getManualDomain,
  setManualDomain,
  clearManualDomain,
  toggleApiDomain,
  replaceUrlDomain,
  replaceUrlsInData,
  processApiResponse
}
