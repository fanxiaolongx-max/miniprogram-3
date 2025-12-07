/**
 * 系统信息工具函数
 * 统一处理系统信息获取，避免使用已废弃的 wx.getSystemInfoSync
 */

/**
 * 获取系统主题（兼容新旧 API）
 * @returns {string} 'light' | 'dark'
 */
function getTheme() {
  try {
    if (wx.getSystemSetting) {
      return wx.getSystemSetting().theme || 'light'
    }
    // 兼容旧版本，但不直接调用，避免警告
    if (wx.getSystemInfoSync) {
      return wx.getSystemInfoSync().theme || 'light'
    }
  } catch (e) {
    console.warn('[getTheme] 获取主题失败', e)
  }
  return 'light'
}

/**
 * 获取窗口信息（兼容新旧 API）
 * @returns {object} { windowHeight, windowWidth, ... }
 */
function getWindowInfo() {
  try {
    if (wx.getWindowInfo) {
      return wx.getWindowInfo()
    }
    // 兼容旧版本
    if (wx.getSystemInfoSync) {
      const info = wx.getSystemInfoSync()
      return {
        windowHeight: info.windowHeight || 667,
        windowWidth: info.windowWidth || 375,
        ...info
      }
    }
  } catch (e) {
    console.warn('[getWindowInfo] 获取窗口信息失败', e)
  }
  return {
    windowHeight: 667,
    windowWidth: 375
  }
}

/**
 * 获取设备信息（兼容新旧 API）
 * @returns {object} { pixelRatio, screenWidth, screenHeight, ... }
 */
function getDeviceInfo() {
  try {
    if (wx.getDeviceInfo) {
      return wx.getDeviceInfo()
    }
    // 兼容旧版本
    if (wx.getSystemInfoSync) {
      const info = wx.getSystemInfoSync()
      return {
        pixelRatio: info.pixelRatio || 2,
        screenWidth: info.screenWidth || 375,
        screenHeight: info.screenHeight || 667,
        ...info
      }
    }
  } catch (e) {
    console.warn('[getDeviceInfo] 获取设备信息失败', e)
  }
  return {
    pixelRatio: 2,
    screenWidth: 375,
    screenHeight: 667
  }
}

/**
 * 获取应用基础信息（兼容新旧 API）
 * @returns {object} { SDKVersion, version, ... }
 */
function getAppBaseInfo() {
  try {
    if (wx.getAppBaseInfo) {
      return wx.getAppBaseInfo()
    }
    // 兼容旧版本
    if (wx.getSystemInfoSync) {
      const info = wx.getSystemInfoSync()
      return {
        SDKVersion: info.SDKVersion || '',
        version: info.version || '',
        ...info
      }
    }
  } catch (e) {
    console.warn('[getAppBaseInfo] 获取应用基础信息失败', e)
  }
  return {
    SDKVersion: '',
    version: ''
  }
}

module.exports = {
  getTheme,
  getWindowInfo,
  getDeviceInfo,
  getAppBaseInfo
}

