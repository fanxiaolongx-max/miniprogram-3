/**
 * 用户认证API工具
 * 支持手机号 + PIN码登录，以及手机号 + 验证码 + PIN码登录
 */

const config = require('../config.js')
const authHelper = require('./authHelper.js')

/**
 * 获取认证请求头（自动添加Token）
 * @param {Object} extraHeaders - 额外的请求头
 * @returns {Object} 包含认证信息的请求头
 */
function getAuthHeaders(extraHeaders = {}) {
  let token = null
  try {
    // 直接从存储获取token，避免循环依赖
    token = wx.getStorageSync('authToken') || null
  } catch (error) {
    console.error('[authApi.getAuthHeaders] 获取Token失败:', error)
    token = null
  }
  
  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders
  }
  
  // 如果存在token，同时添加到Authorization头和X-User-Token头（确保兼容性）
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
    headers['X-User-Token'] = token
    console.log('[authApi] 使用Token认证（Authorization + X-User-Token）')
  } else {
    console.log('[authApi] 未找到Token，使用Session认证')
  }
  
  return headers
}

const authApi = {
  /**
   * 发送验证码
   * @param {string} phone - 手机号（8-15位数字，支持国际格式）
   * @param {string} type - 验证码类型，默认 'login'
   * @returns {Promise} 返回Promise对象
   */
  sendCode(phone, type = 'login') {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${config.apiBaseDomain}/api/auth/sms/send`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          phone: phone,
          type: type
        },
        success: (res) => {
          console.log('[authApi.sendCode] 响应状态码:', res.statusCode)
          console.log('[authApi.sendCode] 响应数据:', JSON.stringify(res.data))
          console.log('[authApi.sendCode] 请求数据:', JSON.stringify({ phone, type }))
          
          if (res.statusCode === 200 && res.data && res.data.success) {
            resolve(res.data)
          } else {
            const errorMsg = res.data?.message || `发送验证码失败 (状态码: ${res.statusCode})`
            console.error('[authApi.sendCode] 发送失败:', errorMsg, res.data)
            reject(new Error(errorMsg))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  /**
   * PIN码登录（自动注册）
   * @param {string} phone - 手机号
   * @param {string} pin - 4位数字PIN码
   * @param {string} name - 用户姓名（可选）
   * @returns {Promise} 返回Promise对象
   */
  loginWithPin(phone, pin, name) {
    return new Promise((resolve, reject) => {
      const data = {
        phone: phone,
        pin: pin
      }
      if (name) {
        data.name = name
      }

      const url = `${config.apiBaseDomain}/api/auth/user/login`
      console.log('[authApi.loginWithPin] 请求URL:', url)
      console.log('[authApi.loginWithPin] 请求数据:', JSON.stringify(data))

      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: data,
        withCredentials: true, // 携带Cookie，用于Session认证（备用）
        success: (res) => {
          console.log('[authApi.loginWithPin] 响应状态码:', res.statusCode)
          console.log('[authApi.loginWithPin] 响应数据:', JSON.stringify(res.data))
          
          if (res.statusCode === 200 && res.data) {
            if (res.data.success) {
              // 检查是否有token
              const token = res.data.token
              if (token) {
                console.log('[authApi.loginWithPin] ✅ 登录成功，已获取Token，将使用Token认证')
                // Token会通过authHelper.handleLoginSuccess保存
              } else {
                console.warn('[authApi.loginWithPin] ⚠️ 登录成功但未返回Token，将使用Session认证')
                // 检查响应头（小程序中Set-Cookie可能在小写键中）
                const headers = res.header || {}
                const setCookie = headers['Set-Cookie'] || headers['set-cookie'] || headers['SET-COOKIE']
                if (!setCookie) {
                  console.warn('[authApi.loginWithPin] ⚠️ 警告：响应中没有Set-Cookie头！')
                }
              }
              
              // 登录成功，立即验证认证是否生效（异步验证，不阻塞登录流程）
              console.log('[authApi.loginWithPin] 登录成功，等待500ms后验证认证...')
              setTimeout(() => {
                this.getCurrentUser().then(user => {
                  console.log('[authApi.loginWithPin] ✅ 认证验证成功:', user)
                }).catch(err => {
                  // 认证验证失败不影响登录成功，只记录日志
                  console.warn('[authApi.loginWithPin] ⚠️ 认证验证失败（不影响登录）:', err.message)
                  if (err.isAuthError) {
                    if (token) {
                      console.warn('[authApi.loginWithPin] 提示：Token认证失败，但登录已成功，可能是服务器端Token验证延迟')
                    } else {
                      console.warn('[authApi.loginWithPin] 提示：Session认证失败，但登录已成功，可能是Cookie设置延迟')
                    }
                  }
                }).catch(console.error) // 捕获所有未处理的错误
              }, 500)
              
              resolve(res.data)
            } else {
              // 处理各种错误情况
              const error = new Error(res.data.message || '登录失败')
              error.requiresPinSetup = res.data.requiresPinSetup
              error.requiresCode = res.data.requiresCode
              error.lockedUntil = res.data.lockedUntil
              console.error('[authApi.loginWithPin] 登录失败:', error.message, res.data)
              reject(error)
            }
          } else if (res.data && res.data.message) {
            // 处理非200状态码但有错误信息的情况（如400状态码）
            const error = new Error(res.data.message || `登录失败 (状态码: ${res.statusCode})`)
            error.requiresPinSetup = res.data.requiresPinSetup
            error.requiresCode = res.data.requiresCode
            error.lockedUntil = res.data.lockedUntil
            console.error('[authApi.loginWithPin] 登录失败:', error.message, res.data)
            reject(error)
          } else {
            console.error('[authApi.loginWithPin] 响应格式错误:', res)
            reject(new Error(`登录失败 (状态码: ${res.statusCode})`))
          }
        },
        fail: (err) => {
          console.error('[authApi.loginWithPin] 请求失败:', err)
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  /**
   * 验证码登录（自动注册）
   * @param {string} phone - 手机号
   * @param {string} code - 6位数字验证码
   * @param {string} pin - 4位数字PIN码
   * @param {string} name - 用户姓名（可选）
   * @returns {Promise} 返回Promise对象
   */
  loginWithCode(phone, code, pin, name) {
    return new Promise((resolve, reject) => {
      const data = {
        phone: phone,
        code: code
      }
      // PIN码是可选的，只有在提供时才添加到请求中
      if (pin) {
        data.pin = pin
      }
      if (name) {
        data.name = name
      }

      const url = `${config.apiBaseDomain}/api/auth/user/login-with-code`
      console.log('[authApi.loginWithCode] 请求URL:', url)
      console.log('[authApi.loginWithCode] 请求数据:', JSON.stringify({...data, pin: '****', code: '****'}))

      wx.request({
        url: url,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: data,
        withCredentials: true, // 携带Cookie，用于Session认证
        success: (res) => {
          console.log('[authApi.loginWithCode] 响应状态码:', res.statusCode)
          console.log('[authApi.loginWithCode] 响应数据:', JSON.stringify(res.data))
          
          if (res.statusCode === 200 && res.data) {
            if (res.data.success) {
              // 检查是否有token
              const token = res.data.token
              if (token) {
                console.log('[authApi.loginWithCode] ✅ 登录成功，已获取Token，将使用Token认证')
                // Token会通过authHelper.handleLoginSuccess保存
              } else {
                console.warn('[authApi.loginWithCode] ⚠️ 登录成功但未返回Token，将使用Session认证')
                // 检查响应头（小程序中Set-Cookie可能在小写键中）
                const headers = res.header || {}
                const setCookie = headers['Set-Cookie'] || headers['set-cookie'] || headers['SET-COOKIE']
                if (!setCookie) {
                  console.warn('[authApi.loginWithCode] ⚠️ 警告：响应中没有Set-Cookie头！')
                }
              }
              
              resolve(res.data)
            } else {
              const error = new Error(res.data.message || '登录失败')
              error.requiresPinSetup = res.data.requiresPinSetup
              console.error('[authApi.loginWithCode] 登录失败:', error.message, res.data)
              reject(error)
            }
          } else {
            console.error('[authApi.loginWithCode] 响应格式错误:', res)
            reject(new Error(`登录失败 (状态码: ${res.statusCode})`))
          }
        },
        fail: (err) => {
          console.error('[authApi.loginWithCode] 请求失败:', err)
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  /**
   * 检查PIN状态
   * @param {string} phone - 手机号
   * @returns {Promise} 返回Promise对象
   */
  checkPinStatus(phone) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${config.apiBaseDomain}/api/auth/user/check-pin-status`,
        method: 'POST',
        header: {
          'Content-Type': 'application/json'
        },
        data: {
          phone: phone
        },
        withCredentials: true, // 携带Cookie
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.success !== false) {
            resolve(res.data)
          } else {
            reject(new Error(res.data?.message || '检查失败'))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  /**
   * 用户登出
   * @returns {Promise} 返回Promise对象
   */
  logout() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${config.apiBaseDomain}/api/auth/user/logout`,
        method: 'POST',
        header: getAuthHeaders(), // 自动添加Token或使用Session
        withCredentials: true, // 携带Cookie，用于Session认证（备用）
        success: (res) => {
          if (res.statusCode === 200 && res.data && res.data.success) {
            resolve(res.data)
          } else {
            reject(new Error(res.data?.message || '登出失败'))
          }
        },
        fail: (err) => {
          reject(new Error(err.errMsg || '网络错误'))
        }
      })
    })
  },

  /**
   * 获取当前用户信息
   * @returns {Promise} 返回Promise对象
   */
  getCurrentUser() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${config.apiBaseDomain}/api/auth/user/me`,
        method: 'GET',
        header: getAuthHeaders(), // 自动添加Token或使用Session
        withCredentials: true, // 携带Cookie，用于Session认证（备用）
        success: (res) => {
          console.log('[authApi.getCurrentUser] 响应状态码:', res.statusCode)
          console.log('[authApi.getCurrentUser] 响应数据:', JSON.stringify(res.data))
          console.log('[authApi.getCurrentUser] 响应头:', JSON.stringify(res.header || {}))
          
          // 检查Cookie相关响应头
          if (res.header) {
            if (res.header['Set-Cookie']) {
              console.log('[authApi.getCurrentUser] Set-Cookie:', res.header['Set-Cookie'])
            }
            // 小程序中Cookie会自动处理，但我们可以检查其他相关头
            console.log('[authApi.getCurrentUser] 所有响应头键:', Object.keys(res.header))
          }
          
          if (res.statusCode === 200 && res.data) {
            if (res.data.success && res.data.user) {
              // 确保返回的用户对象是安全的，不包含会导致迭代错误的null值
              const user = res.data.user
              const safeUser = {
                id: user.id || null,
                phone: user.phone || '',
                name: user.name || user.phone || '用户',
                ...user // 保留其他字段，但确保基本字段存在
              }
              resolve(safeUser)
            } else {
              const error = new Error(res.data.message || '未登录')
              error.statusCode = res.statusCode
              error.isAuthError = true
              
              if (res.statusCode === 401) {
                console.warn('[authApi.getCurrentUser] 401错误：认证失败')
                console.warn('[authApi.getCurrentUser] 可能原因：1. Token无效或过期 2. Session未正确设置 3. Cookie未正确发送')
              }
              
              reject(error)
            }
          } else {
            const error = new Error(`获取用户信息失败 (状态码: ${res.statusCode})`)
            error.statusCode = res.statusCode
            error.isAuthError = res.statusCode === 401
            
            if (res.statusCode === 401) {
              console.warn('[authApi.getCurrentUser] 401错误：认证失败')
            }
            
            reject(error)
          }
        },
        fail: (err) => {
          console.error('[authApi.getCurrentUser] 请求失败:', err)
          const error = new Error(err.errMsg || '网络错误')
          error.isNetworkError = true
          reject(error)
        }
      })
    })
  }
}

module.exports = authApi

