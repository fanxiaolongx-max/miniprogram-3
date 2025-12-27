/**
 * 登录状态管理工具
 * 按照微信小程序最佳实践实现登录状态保持
 */

const authApi = require('./authApi.js')

const authHelper = {
  // Storage key
  STORAGE_KEY_USER: 'user',
  STORAGE_KEY_USER_ID: 'userId',
  STORAGE_KEY_LOGIN_TIME: 'loginTime',
  STORAGE_KEY_TOKEN: 'authToken',
  
  /**
   * 保存登录信息到本地存储
   * @param {Object} user - 用户信息
   * @param {string} token - 认证Token（可选）
   */
  saveLoginInfo(user, token) {
    if (!user) {
      console.warn('[authHelper] 用户信息为空，无法保存')
      return
    }
    
    try {
      wx.setStorageSync(this.STORAGE_KEY_USER, user)
      wx.setStorageSync(this.STORAGE_KEY_USER_ID, user.id)
      wx.setStorageSync(this.STORAGE_KEY_LOGIN_TIME, Date.now())
      if (token) {
        wx.setStorageSync(this.STORAGE_KEY_TOKEN, token)
        console.log('[authHelper] 登录信息和Token已保存到本地存储')
      } else {
        console.log('[authHelper] 登录信息已保存到本地存储')
      }
    } catch (error) {
      console.error('[authHelper] 保存登录信息失败:', error)
    }
  },
  
  /**
   * 获取认证Token
   * @returns {string|null} Token或null
   */
  getToken() {
    try {
      const token = wx.getStorageSync(this.STORAGE_KEY_TOKEN)
      return token || null
    } catch (error) {
      console.error('[authHelper] 获取Token失败:', error)
      return null
    }
  },
  
  /**
   * 从本地存储获取登录信息
   * @returns {Object|null} 用户信息或null
   */
  getLoginInfo() {
    try {
      const user = wx.getStorageSync(this.STORAGE_KEY_USER)
      if (user) {
        console.log('[authHelper] 从本地存储获取到用户信息')
        return user
      }
    } catch (error) {
      console.error('[authHelper] 获取登录信息失败:', error)
    }
    return null
  },
  
  /**
   * 清除登录信息
   */
  clearLoginInfo() {
    try {
      wx.removeStorageSync(this.STORAGE_KEY_USER)
      wx.removeStorageSync(this.STORAGE_KEY_USER_ID)
      wx.removeStorageSync(this.STORAGE_KEY_LOGIN_TIME)
      wx.removeStorageSync(this.STORAGE_KEY_TOKEN)
      console.log('[authHelper] 登录信息和Token已清除')
    } catch (error) {
      console.error('[authHelper] 清除登录信息失败:', error)
    }
  },
  
  /**
   * 检查是否已登录（仅检查本地存储）
   * @returns {boolean}
   */
  isLoggedInLocally() {
    const user = this.getLoginInfo()
    return user !== null
  },
  
  /**
   * 验证服务器端登录状态
   * @param {boolean} clearOnAuthError - 认证错误时是否清除本地登录信息，默认false
   * @returns {Promise<Object|null>} 返回用户信息或null
   */
  async verifyLoginStatus(clearOnAuthError = false) {
    try {
      const user = await authApi.getCurrentUser()
      // 验证成功，更新本地存储
      this.saveLoginInfo(user)
      return user
    } catch (error) {
      console.log('[authHelper] 服务器端登录验证失败:', error.message)
      
      // 如果是网络错误，保持本地登录状态
      if (error.isNetworkError) {
        console.log('[authHelper] 网络错误，保持本地登录状态')
        return null // 返回null但不清除本地状态
      }
      
      // 如果是认证错误（401），根据参数决定是否清除
      if (error.isAuthError || error.statusCode === 401) {
        if (clearOnAuthError) {
          console.log('[authHelper] 认证错误且需要清除，清除本地登录信息')
          this.clearLoginInfo()
        } else {
          console.log('[authHelper] 认证错误但保持本地登录状态（可能Cookie未正确发送）')
        }
        return null
      }
      
      // 其他错误，保持本地登录状态
      console.log('[authHelper] 其他错误，保持本地登录状态')
      return null
    }
  },
  
  /**
   * 初始化登录状态（从本地存储恢复）
   * @param {Object} app - App实例
   * @returns {Object|null} 用户信息或null
   */
  initLoginStatus(app) {
    const user = this.getLoginInfo()
    if (user) {
      app.globalData.user = user
      app.globalData.isLoggedIn = true
      console.log('[authHelper] 从本地存储恢复登录状态')
      return user
    } else {
      app.globalData.user = null
      app.globalData.isLoggedIn = false
      console.log('[authHelper] 未找到本地登录信息')
      return null
    }
  },
  
  /**
   * 检查并更新登录状态（先检查本地，再验证服务器）
   * @param {Object} app - App实例
   * @param {Object} page - Page实例（可选）
   * @param {boolean} clearOnAuthError - 认证错误时是否清除本地登录信息，默认false
   * @returns {Promise<Object|null>} 返回用户信息或null
   */
  async checkAndUpdateLoginStatus(app, page = null, clearOnAuthError = false) {
    // 先检查本地存储
    const localUser = this.getLoginInfo()
    if (!localUser) {
      // 本地没有登录信息
      app.globalData.user = null
      app.globalData.isLoggedIn = false
      if (page) {
        page.setData({
          isLoggedIn: false,
          user: null
        })
      }
      return null
    }
    
    // 本地有登录信息，先设置到全局和页面（立即显示，提升用户体验）
    app.globalData.user = localUser
    app.globalData.isLoggedIn = true
    if (page) {
      page.setData({
        isLoggedIn: true,
        user: localUser
      })
    }
    
    // 然后验证服务器端登录状态（静默验证，不阻塞UI）
    // 注意：验证失败时不清除本地登录状态，保持离线可用
    try {
      const serverUser = await this.verifyLoginStatus(clearOnAuthError)
      if (serverUser) {
        // 服务器验证成功，更新全局和页面
        app.globalData.user = serverUser
        app.globalData.isLoggedIn = true
        if (page) {
          page.setData({
            isLoggedIn: true,
            user: serverUser
          })
        }
        return serverUser
      } else {
        // 服务器验证失败，但保持本地登录状态（可能是Cookie问题或网络问题）
        // 这样用户可以继续使用，直到真正需要服务器验证的操作失败
        console.log('[authHelper] 服务器验证失败，但保持本地登录状态')
        return localUser
      }
    } catch (error) {
      console.error('[authHelper] 验证登录状态异常:', error)
      // 验证异常时保持本地登录状态
      return localUser
    }
  },
  
  /**
   * 登录成功后的处理
   * @param {Object} user - 用户信息
   * @param {Object} app - App实例
   * @param {Object} page - Page实例（可选）
   * @param {string} token - 认证Token（可选）
   */
  handleLoginSuccess(user, app, page = null, token = null) {
    try {
      // 验证用户对象
      if (!user || typeof user !== 'object') {
        console.error('[authHelper] 用户信息无效:', user)
        throw new Error('用户信息无效')
      }
      
      // 创建安全的用户对象副本，确保所有字段都是有效的
      const safeUser = {
        id: user.id || null,
        phone: user.phone || '',
        name: user.name || user.phone || '用户',
        ...user // 保留其他字段
      }
      
      // 保存到本地存储（包括token）
      this.saveLoginInfo(safeUser, token)
      
      // 更新全局状态
      app.globalData.user = safeUser
      app.globalData.isLoggedIn = true
      
      // 更新页面状态（使用安全的用户对象）
      if (page && typeof page.setData === 'function') {
        try {
          page.setData({
            isLoggedIn: true,
            user: safeUser
          })
        } catch (setDataError) {
          console.error('[authHelper] setData失败:', setDataError)
          // 尝试使用更安全的方式设置数据
          setTimeout(() => {
            try {
              page.setData({
                isLoggedIn: true,
                user: safeUser
              })
            } catch (retryError) {
              console.error('[authHelper] setData重试失败:', retryError)
            }
          }, 100)
        }
      }
      
      console.log('[authHelper] 登录成功，状态已更新')
    } catch (error) {
      console.error('[authHelper] 处理登录成功时出错:', error)
      // 即使出错，也尝试更新基本状态
      try {
        if (app) {
          app.globalData.isLoggedIn = false
          app.globalData.user = null
        }
        if (page && typeof page.setData === 'function') {
          page.setData({
            isLoggedIn: false,
            user: null
          })
        }
      } catch (fallbackError) {
        console.error('[authHelper] 回退处理也失败:', fallbackError)
      }
      throw error
    }
  },
  
  /**
   * 登出处理
   * @param {Object} app - App实例
   * @param {Object} page - Page实例（可选）
   */
  handleLogout(app, page = null) {
    // 清除本地存储
    this.clearLoginInfo()
    
    // 更新全局状态
    app.globalData.user = null
    app.globalData.isLoggedIn = false
    
    // 更新页面状态
    if (page) {
      page.setData({
        isLoggedIn: false,
        user: null
      })
    }
    
    console.log('[authHelper] 已登出，状态已清除')
  },
  
  /**
   * 检查是否需要重新登录（用于需要服务器验证的操作）
   * 如果服务器验证失败，会清除本地登录状态并返回false
   * @param {Object} app - App实例
   * @param {Object} page - Page实例（可选）
   * @returns {Promise<boolean>} 返回true表示已登录，false表示需要重新登录
   */
  async checkAuthForAction(app, page = null) {
    // 先检查本地登录状态
    const localUser = this.getLoginInfo()
    if (!localUser) {
      return false
    }
    
    // 验证服务器端登录状态（这次如果失败，清除本地状态）
    try {
      const serverUser = await this.verifyLoginStatus(true) // 认证错误时清除
      if (serverUser) {
        // 验证成功，更新状态
        app.globalData.user = serverUser
        app.globalData.isLoggedIn = true
        if (page) {
          page.setData({
            isLoggedIn: true,
            user: serverUser
          })
        }
        return true
      } else {
        // 验证失败，已清除本地状态
        app.globalData.user = null
        app.globalData.isLoggedIn = false
        if (page) {
          page.setData({
            isLoggedIn: false,
            user: null
          })
        }
        return false
      }
    } catch (error) {
      console.error('[authHelper] 验证登录状态异常:', error)
      // 异常时保持本地状态，但返回false提示需要验证
      return false
    }
  }
}

module.exports = authHelper

