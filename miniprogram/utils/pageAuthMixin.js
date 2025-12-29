/**
 * 页面登录状态检查混入
 * 按照微信小程序最佳实践，提供统一的登录状态检查功能
 * 
 * 使用方法：
 * const authMixin = require('../../utils/pageAuthMixin.js')
 * Page(authMixin({
 *   // 你的页面配置
 *   onLoad() {
 *     // 页面加载
 *   }
 * }))
 */

const authHelper = require('./authHelper.js')

/**
 * 创建页面登录状态检查混入
 * @param {Object} pageConfig - 页面配置对象
 * @returns {Object} 增强后的页面配置对象
 */
function createAuthMixin(pageConfig) {
  const app = getApp()
  
  // 保存原始的onLoad和onShow方法
  const originalOnLoad = pageConfig.onLoad || function() {}
  const originalOnShow = pageConfig.onShow || function() {}
  
  // 增强onLoad方法
  pageConfig.onLoad = function(options) {
    // 先执行原始onLoad
    originalOnLoad.call(this, options)
    
    // 检查登录状态（快速从本地恢复）
    const localUser = authHelper.getLoginInfo()
    if (localUser) {
      this.setData({
        isLoggedIn: true,
        user: localUser
      })
      app.globalData.user = localUser
      app.globalData.isLoggedIn = true
    }
  }
  
  // 增强onShow方法
  pageConfig.onShow = function() {
    // 先执行原始onShow
    originalOnShow.call(this)
    
    // 检查并更新登录状态
    authHelper.checkAndUpdateLoginStatus(app, this).catch(err => {
      console.error('[pageAuthMixin] 检查登录状态失败:', err)
    })
  }
  
  // 添加登录状态检查方法
  pageConfig.checkLoginStatus = function() {
    return authHelper.checkAndUpdateLoginStatus(app, this)
  }
  
  // 添加获取当前用户方法
  pageConfig.getCurrentUser = function() {
    return app.globalData.user || authHelper.getLoginInfo()
  }
  
  // 添加检查是否已登录方法
  pageConfig.isLoggedIn = function() {
    return app.globalData.isLoggedIn || authHelper.isLoggedInLocally()
  }
  
  return pageConfig
}

module.exports = createAuthMixin





