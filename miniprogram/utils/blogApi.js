/**
 * 博客管理API工具类
 * 封装所有博客管理相关的API调用
 */

const envHelper = require('./envHelper.js')
const config = require('../config.js')
const authHelper = require('./authHelper.js')

/**
 * 处理未登录错误：清除登录状态并跳转到"我的"页面
 * @param {string} message - 错误消息
 */
function handleUnauthorizedError(message) {
  console.log('[blogApi] 检测到未登录错误，清除登录状态并跳转')
  
  // 清除登录状态
  try {
    authHelper.clearLoginInfo()
    // 更新全局状态（安全地获取app实例）
    try {
      const app = getApp()
      if (app && app.globalData) {
        app.globalData.user = null
        app.globalData.isLoggedIn = false
      }
    } catch (appError) {
      console.warn('[blogApi] 无法获取app实例:', appError)
    }
  } catch (error) {
    console.error('[blogApi] 清除登录状态失败:', error)
  }
  
  // 提示用户并跳转
  wx.showToast({
    title: '登录已过期，请重新登录',
    icon: 'none',
    duration: 2000
  })
  
  // 延迟跳转，让用户看到提示
  setTimeout(() => {
    try {
      wx.switchTab({
        url: '/page/my/index',
        fail: (err) => {
          console.error('[blogApi] 跳转到"我的"页面失败:', err)
          // 如果switchTab失败，尝试使用navigateTo（但需要确保路径正确）
          wx.navigateTo({
            url: '/page/my/index',
            fail: () => {
              console.error('[blogApi] navigateTo也失败，无法跳转')
            }
          })
        }
      })
    } catch (error) {
      console.error('[blogApi] 跳转异常:', error)
    }
  }, 500)
}

/**
 * 检查响应是否为未登录错误
 * @param {Object} responseData - API响应数据
 * @param {number} statusCode - HTTP状态码
 * @returns {boolean} 是否为未登录错误
 */
function isUnauthorizedError(responseData, statusCode) {
  // 检查状态码401
  if (statusCode === 401) {
    return true
  }
  
  // 检查业务状态：success: false 且 message 包含"未登录"
  if (responseData && responseData.success === false && responseData.message) {
    const message = String(responseData.message).toLowerCase()
    return message.includes('未登录') || 
           message.includes('未认证') || 
           message.includes('unauthorized') ||
           message.includes('请先登录') ||
           message.includes('需要登录')
  }
  
  return false
}

// API基础URL
const API_BASE_URL = `${config.apiBaseDomain}/api/blog-admin`

/**
 * 通用请求函数
 * @param {Object} options - 请求选项
 * @param {string} options.url - 请求路径（相对于API_BASE_URL）
 * @param {string} options.method - 请求方法（GET, POST, PUT, DELETE）
 * @param {Object} options.data - 请求数据
 * @param {Object} options.header - 额外的请求头
 * @returns {Promise} 返回Promise对象
 */
function request(options) {
  return new Promise((resolve, reject) => {
    const { url, method = 'GET', data = {}, header = {} } = options
    
    // 构建完整URL
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`
    
    // 获取用户认证头（包含 x-user-token）
    const authApi = require('./authApi.js')
    const authHeaders = authApi.getAuthHeaders ? authApi.getAuthHeaders() : {}
    
    // 构建请求头（不再固定添加 X-API-Token，可通过 header 参数自定义）
    const requestHeader = {
      'Content-Type': 'application/json',
      ...authHeaders, // 合并用户认证头（包含 x-user-token）
      ...header // 允许通过 header 参数自定义所有请求头
    }
    
    console.log(`[blogApi] ${method} ${fullUrl}`, data)
    console.log(`[blogApi] 请求头:`, requestHeader)
    
    wx.request({
      url: fullUrl,
      method: method,
      header: requestHeader,
      data: data,
      timeout: 30000, // 设置30秒超时
      success: (res) => {
        console.log(`[blogApi] 响应状态码:`, res.statusCode)
        
        // 快速处理响应，避免超时
        let responseData = res.data
        
        // 检查状态码
        if (res.statusCode === 200) {
          // 检查业务状态
          if (responseData && responseData.success === false) {
            // 检查是否为未登录错误
            if (isUnauthorizedError(responseData, res.statusCode)) {
              handleUnauthorizedError(responseData.message || '未登录')
              reject(new Error(responseData.message || '未登录'))
              return
            }
            reject(new Error(responseData.message || '请求失败'))
            return
          }
          
          // 处理URL替换（优化后的处理应该很快）
          try {
            responseData = envHelper.processApiResponse(responseData)
          } catch (error) {
            console.warn('[blogApi] URL处理失败，使用原始数据:', error)
            // 处理失败时继续使用原始数据
          }
          
          // 成功：返回数据
          resolve(responseData)
        } else if (res.statusCode === 401) {
          // 处理未登录错误
          handleUnauthorizedError(responseData && responseData.message || '未登录')
          reject(new Error(responseData && responseData.message || '认证失败，请检查API Token'))
        } else if (res.statusCode === 403) {
          reject(new Error(responseData && responseData.message || '权限不足'))
        } else if (res.statusCode === 404) {
          reject(new Error(responseData && responseData.message || '资源不存在'))
        } else if (res.statusCode === 400) {
          const errorMsg = (responseData && responseData.message) || '请求参数错误'
          const errors = (responseData && responseData.errors) || []
          reject(new Error(`${errorMsg}${errors.length > 0 ? ': ' + errors.map(e => e.msg).join(', ') : ''}`))
        } else {
          reject(new Error((responseData && responseData.message) || `请求失败 (${res.statusCode})`))
        }
      },
      fail: (err) => {
        console.error('[blogApi] 请求失败:', err)
        console.error('[blogApi] 错误详情:', JSON.stringify(err))
        reject(new Error(err.errMsg || '网络错误，请检查网络连接'))
      }
    })
  })
}

/**
 * 文章管理API
 */
const articleApi = {
  /**
   * 获取文章列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（可选）
   * @param {number} params.pageSize - 每页数量（可选）
   * @param {string} params.category - 分类过滤（可选）
   * @param {string} params.keyword - 搜索关键词（可选）
   * @returns {Promise} 返回文章列表
   */
  getList(params = {}) {
    const queryParams = []
    if (params.page) queryParams.push(`page=${params.page}`)
    if (params.pageSize) queryParams.push(`pageSize=${params.pageSize}`)
    if (params.category) queryParams.push(`category=${encodeURIComponent(params.category)}`)
    if (params.keyword) queryParams.push(`keyword=${encodeURIComponent(params.keyword)}`)
    
    const url = `/posts${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`
    return request({ url, method: 'GET' })
  },

  /**
   * 获取文章详情
   * @param {string} id - 文章ID或slug
   * @param {Object} options - 查询选项
   * @param {boolean} options.includeComments - 是否包含评论列表（默认 true，API 默认也包含）
   * @param {number} options.commentsPage - 评论页码（默认 1）
   * @param {number} options.commentsPageSize - 每页评论数量（默认 10）
   * @returns {Promise} 返回文章详情，可能包含 comments 字段
   */
  getDetail(id, options = {}) {
    const queryParams = []
    
    // 默认包含评论（如果未指定或为 true）
    if (options.includeComments !== false) {
      queryParams.push('includeComments=true')
      
      // 添加评论分页参数（如果指定了）
      if (options.commentsPage) {
        queryParams.push(`commentsPage=${options.commentsPage}`)
      } else {
        // 默认第一页
        queryParams.push('commentsPage=1')
      }
      
      if (options.commentsPageSize) {
        queryParams.push(`commentsPageSize=${options.commentsPageSize}`)
      } else {
        // 默认每页10条
        queryParams.push('commentsPageSize=10')
      }
    } else {
      // 明确不包含评论
      queryParams.push('includeComments=false')
    }
    
    const url = `/posts/${id}${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`
    return request({ url, method: 'GET' })
  },

  /**
   * 创建文章
   * @param {Object} data - 文章数据
   * @param {string} data.name - 文章名称（必填）
   * @param {string} data.apiName - API名称/分类（必填）
   * @param {string} data.htmlContent - HTML内容（可选）
   * @param {string} data.slug - URL友好的标识符（可选）
   * @param {string} data.excerpt - 摘要（可选）
   * @param {string} data.description - 描述（可选）
   * @param {string} data.image - 图片URL（可选）
   * @param {string} data.category - 分类/标签（可选）
   * @param {boolean} data.published - 是否发布（可选，默认false）
   * @param {string} data.price - 价格（可选）
   * @param {string} data.rooms - 房间数（可选）
   * @param {string} data.area - 面积（可选）
   * @param {string} data.phone - 电话（可选）
   * @param {string} data.address - 地址（可选）
   * @param {number} data.latitude - 纬度（可选）
   * @param {number} data.longitude - 经度（可选）
   * @returns {Promise} 返回创建的文章
   */
  create(data) {
    return request({ url: '/posts', method: 'POST', data })
  },

  /**
   * 更新文章
   * @param {string} id - 文章ID
   * @param {Object} data - 要更新的文章数据（所有字段可选）
   * @returns {Promise} 返回更新后的文章
   */
  update(id, data) {
    return request({ url: `/posts/${id}`, method: 'PUT', data })
  },

  /**
   * 删除文章
   * @param {string} id - 文章ID
   * @param {string} deviceId - 设备ID（用于权限验证）
   * @returns {Promise} 返回删除结果
   */
  delete(id, deviceId) {
    // 使用查询参数方式传递deviceId（推荐方式）
    const url = deviceId ? `/posts/${id}?deviceId=${encodeURIComponent(deviceId)}` : `/posts/${id}`
    return request({ url: url, method: 'DELETE' })
  }
}

/**
 * 分类管理API
 */
const categoryApi = {
  /**
   * 获取分类列表
   * @returns {Promise} 返回分类列表
   */
  getList() {
    return request({ url: '/categories', method: 'GET' })
  },

  /**
   * 创建分类
   * @param {Object} data - 分类数据
   * @param {string} data.name - 分类名称（必填）
   * @param {string} data.path - 分类路径（可选）
   * @param {string} data.description - 描述（可选）
   * @returns {Promise} 返回创建的分类
   */
  create(data) {
    return request({ url: '/categories', method: 'POST', data })
  },

  /**
   * 更新分类
   * @param {string} id - 分类ID
   * @param {Object} data - 要更新的分类数据
   * @returns {Promise} 返回更新后的分类
   */
  update(id, data) {
    return request({ url: `/categories/${id}`, method: 'PUT', data })
  },

  /**
   * 删除分类
   * @param {string} id - 分类ID
   * @returns {Promise} 返回删除结果
   */
  delete(id) {
    return request({ url: `/categories/${id}`, method: 'DELETE' })
  }
}

/**
 * 标签管理API
 */
const tagApi = {
  /**
   * 获取标签列表
   * @returns {Promise} 返回标签列表
   */
  getList() {
    return request({ url: '/tags', method: 'GET' })
  },

  /**
   * 创建标签
   * @param {Object} data - 标签数据
   * @param {string} data.name - 标签名称（必填）
   * @param {string} data.slug - URL友好的标识符（可选）
   * @returns {Promise} 返回创建的标签
   */
  create(data) {
    return request({ url: '/tags', method: 'POST', data })
  }
}

/**
 * API配置管理
 */
const apiConfigApi = {
  /**
   * 获取API列表
   * @returns {Promise} 返回所有可用的API列表
   */
  getList() {
    return request({ url: '/apis', method: 'GET' })
  },

  /**
   * 获取字段映射配置
   * @param {string} apiName - API名称
   * @returns {Promise} 返回字段映射配置
   */
  getFieldMapping(apiName) {
    return request({ url: `/apis/${encodeURIComponent(apiName)}/field-mapping`, method: 'GET' })
  },

  /**
   * 更新字段映射配置
   * @param {string} apiName - API名称
   * @param {Object} mapping - 字段映射对象
   * @returns {Promise} 返回更新结果
   */
  updateFieldMapping(apiName, mapping) {
    return request({ url: `/apis/${encodeURIComponent(apiName)}/field-mapping`, method: 'PUT', data: { mapping } })
  }
}

/**
 * 博客文章API（公开API，在 /api/blog 路径下）
 * 注意：这个API在 /api/blog 路径下，不在 /api/blog-admin 路径下
 */
const blogPostApi = {
  /**
   * 获取文章列表（公开API）
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（默认：1）
   * @param {number} params.pageSize - 每页数量（默认：6）
   * @param {string} params.category - 分类名称（支持中文名称）
   * @param {string} params.search - 搜索关键词
   * @param {string} params.published - 是否只返回已发布的文章（默认：'true'）
   * @returns {Promise} 返回文章列表，格式：{ success: true, data: [...], pagination: {...} }
   */
  getList(params = {}) {
    // 这个API在 /api/blog 路径下，需要单独构建URL
    const blogApiBaseUrl = `${config.apiBaseDomain}/api/blog`
    const queryParams = []
    
    if (params.page) queryParams.push(`page=${params.page}`)
    if (params.pageSize) queryParams.push(`pageSize=${params.pageSize}`)
    if (params.category) queryParams.push(`category=${encodeURIComponent(params.category)}`)
    if (params.search) queryParams.push(`search=${encodeURIComponent(params.search)}`)
    if (params.published !== undefined) queryParams.push(`published=${params.published}`)
    if (params.myPosts === true) queryParams.push(`myPosts=true`)
    
    const fullUrl = `${blogApiBaseUrl}/posts${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`
    
    return new Promise((resolve, reject) => {
      // 获取用户认证头（包含 x-user-token）
      const authApi = require('./authApi.js')
      const authHeaders = authApi.getAuthHeaders ? authApi.getAuthHeaders() : {}
      
      const requestHeader = {
        'Content-Type': 'application/json',
        ...authHeaders // 合并用户认证头（包含 x-user-token）
      }
      
      console.log(`[blogPostApi] GET ${fullUrl}`)
      console.log(`[blogPostApi] 请求参数:`, params)
      console.log(`[blogPostApi] 请求头:`, requestHeader)
      
      wx.request({
        url: fullUrl,
        method: 'GET',
        header: requestHeader,
        timeout: 30000,
        success: (res) => {
          console.log(`[blogPostApi] 响应状态码:`, res.statusCode)
          
          let responseData = res.data
          
          if (res.statusCode === 200) {
            // 检查业务状态
            if (responseData && responseData.success === false) {
              // 检查是否为未登录错误
              if (isUnauthorizedError(responseData, res.statusCode)) {
                handleUnauthorizedError(responseData.message || '未登录')
                reject(new Error(responseData.message || '未登录'))
                return
              }
              reject(new Error(responseData.message || '请求失败'))
              return
            }
            
            // 处理URL替换
            try {
              responseData = envHelper.processApiResponse(responseData)
            } catch (error) {
              console.warn('[blogPostApi] URL处理失败，使用原始数据:', error)
            }
            
            resolve(responseData)
          } else if (res.statusCode === 401) {
            // 处理未登录错误
            handleUnauthorizedError(responseData && responseData.message || '未登录')
            reject(new Error(responseData && responseData.message || '认证失败，请检查API Token'))
          } else if (res.statusCode === 403) {
            reject(new Error(responseData && responseData.message || '权限不足'))
          } else if (res.statusCode === 404) {
            reject(new Error(responseData && responseData.message || '资源不存在'))
          } else if (res.statusCode === 400) {
            const errorMsg = (responseData && responseData.message) || '请求参数错误'
            const errors = (responseData && responseData.errors) || []
            reject(new Error(`${errorMsg}${errors.length > 0 ? ': ' + errors.map(e => e.msg).join(', ') : ''}`))
          } else {
            reject(new Error((responseData && responseData.message) || `请求失败 (${res.statusCode})`))
          }
        },
        fail: (err) => {
          console.error('[blogPostApi] 请求失败:', err)
          console.error('[blogPostApi] 错误详情:', JSON.stringify(err))
          reject(new Error(err.errMsg || '网络错误，请检查网络连接'))
        }
      })
    })
  }
}

/**
 * 博客分类API（从文章数据中提取的分类列表）
 * 注意：这个API在 /api/blog 路径下，不在 /api/blog-admin 路径下
 */
const blogCategoryApi = {
  /**
   * 获取所有博客文章的分类列表（从文章数据中提取分类）
   * @returns {Promise} 返回分类列表，格式：{ success: true, data: [{ id, name, slug, description, postCount, latestPostDate }] }
   */
  getList() {
    // 这个API在 /api/blog 路径下，需要单独构建URL
    const blogApiBaseUrl = `${config.apiBaseDomain}/api/blog`
    const fullUrl = `${blogApiBaseUrl}/categories`
    
    return new Promise((resolve, reject) => {
      const requestHeader = {
        'Content-Type': 'application/json'
      }
      
      console.log(`[blogCategoryApi] GET ${fullUrl}`)
      console.log(`[blogCategoryApi] 请求头:`, requestHeader)
      
      wx.request({
        url: fullUrl,
        method: 'GET',
        header: requestHeader,
        timeout: 30000,
        success: (res) => {
          console.log(`[blogCategoryApi] 响应状态码:`, res.statusCode)
          
          let responseData = res.data
          
          if (res.statusCode === 200) {
            // 检查业务状态
            if (responseData && responseData.success === false) {
              // 检查是否为未登录错误
              if (isUnauthorizedError(responseData, res.statusCode)) {
                handleUnauthorizedError(responseData.message || '未登录')
                reject(new Error(responseData.message || '未登录'))
                return
              }
              reject(new Error(responseData.message || '请求失败'))
              return
            }
            
            // 处理URL替换
            try {
              responseData = envHelper.processApiResponse(responseData)
            } catch (error) {
              console.warn('[blogCategoryApi] URL处理失败，使用原始数据:', error)
            }
            
            resolve(responseData)
          } else if (res.statusCode === 401) {
            // 处理未登录错误
            handleUnauthorizedError(responseData && responseData.message || '未登录')
            reject(new Error(responseData && responseData.message || '认证失败，请检查API Token'))
          } else if (res.statusCode === 403) {
            reject(new Error(responseData && responseData.message || '权限不足'))
          } else if (res.statusCode === 404) {
            reject(new Error(responseData && responseData.message || '资源不存在'))
          } else if (res.statusCode === 400) {
            const errorMsg = (responseData && responseData.message) || '请求参数错误'
            const errors = (responseData && responseData.errors) || []
            reject(new Error(`${errorMsg}${errors.length > 0 ? ': ' + errors.map(e => e.msg).join(', ') : ''}`))
          } else {
            reject(new Error((responseData && responseData.message) || `请求失败 (${res.statusCode})`))
          }
        },
        fail: (err) => {
          console.error('[blogCategoryApi] 请求失败:', err)
          console.error('[blogCategoryApi] 错误详情:', JSON.stringify(err))
          reject(new Error(err.errMsg || '网络错误，请检查网络连接'))
        }
      })
    })
  }
}

/**
 * 博客互动API（点赞、收藏、评论）
 * 注意：这个API在 /api/blog 路径下，需要用户认证（Token）
 */
const blogInteractionApi = {
  /**
   * 通用请求函数（用于互动API）
   * @param {string} url - 请求URL
   * @param {string} method - 请求方法
   * @param {Object} data - 请求数据
   * @returns {Promise} 返回Promise对象
   */
  _request(url, method = 'GET', data = {}) {
    return new Promise((resolve, reject) => {
      const blogApiBaseUrl = `${config.apiBaseDomain}/api/blog`
      const fullUrl = url.startsWith('http') ? url : `${blogApiBaseUrl}${url}`
      
      // 获取用户认证头（包含 x-user-token）
      const authApi = require('./authApi.js')
      const authHeaders = authApi.getAuthHeaders ? authApi.getAuthHeaders() : {}
      
      const requestHeader = {
        'Content-Type': 'application/json',
        ...authHeaders // 合并用户认证头（包含 x-user-token）
      }
      
      console.log(`[blogInteractionApi] ${method} ${fullUrl}`, data)
      console.log(`[blogInteractionApi] 请求头:`, requestHeader)
      
      wx.request({
        url: fullUrl,
        method: method,
        header: requestHeader,
        data: data,
        timeout: 30000,
        success: (res) => {
          console.log(`[blogInteractionApi] 响应状态码:`, res.statusCode)
          
          let responseData = res.data
          
          if (res.statusCode === 200 || res.statusCode === 201) {
            // 检查业务状态
            if (responseData && responseData.success === false) {
              reject(new Error(responseData.message || '请求失败'))
              return
            }
            
            // 处理URL替换
            try {
              responseData = envHelper.processApiResponse(responseData)
            } catch (error) {
              console.warn('[blogInteractionApi] URL处理失败，使用原始数据:', error)
            }
            
            resolve(responseData)
          } else if (res.statusCode === 401) {
            // 处理未登录错误
            handleUnauthorizedError(responseData && responseData.message || '未登录')
            reject(new Error(responseData && responseData.message || '认证失败，请先登录'))
          } else if (res.statusCode === 403) {
            reject(new Error(responseData && responseData.message || '权限不足'))
          } else if (res.statusCode === 404) {
            reject(new Error(responseData && responseData.message || '资源不存在'))
          } else if (res.statusCode === 400) {
            const errorMsg = (responseData && responseData.message) || '请求参数错误'
            const errors = (responseData && responseData.errors) || []
            reject(new Error(`${errorMsg}${errors.length > 0 ? ': ' + errors.map(e => e.msg).join(', ') : ''}`))
          } else {
            reject(new Error((responseData && responseData.message) || `请求失败 (${res.statusCode})`))
          }
        },
        fail: (err) => {
          console.error('[blogInteractionApi] 请求失败:', err)
          console.error('[blogInteractionApi] 错误详情:', JSON.stringify(err))
          reject(new Error(err.errMsg || '网络错误，请检查网络连接'))
        }
      })
    })
  },

  /**
   * 点赞文章
   * @param {string} postId - 文章ID
   * @returns {Promise} 返回点赞结果
   */
  likePost(postId) {
    return this._request(`/posts/${postId}/like`, 'POST')
  },

  /**
   * 取消点赞文章
   * @param {string} postId - 文章ID
   * @returns {Promise} 返回取消点赞结果
   */
  unlikePost(postId) {
    return this._request(`/posts/${postId}/like`, 'DELETE')
  },

  /**
   * 收藏文章
   * @param {string} postId - 文章ID
   * @returns {Promise} 返回收藏结果
   */
  favoritePost(postId) {
    return this._request(`/posts/${postId}/favorite`, 'POST')
  },

  /**
   * 取消收藏文章
   * @param {string} postId - 文章ID
   * @returns {Promise} 返回取消收藏结果
   */
  unfavoritePost(postId) {
    return this._request(`/posts/${postId}/favorite`, 'DELETE')
  },

  /**
   * 创建评论
   * @param {string} postId - 文章ID
   * @param {Object} data - 评论数据
   * @param {string} data.content - 评论内容（必填）
   * @param {string} data.parentId - 父评论ID（可选，用于回复评论）
   * @returns {Promise} 返回创建的评论
   */
  createComment(postId, data) {
    return this._request(`/posts/${postId}/comments`, 'POST', data)
  },

  /**
   * 删除评论
   * @param {string} postId - 文章ID
   * @param {string} commentId - 评论ID
   * @returns {Promise} 返回删除结果
   */
  deleteComment(postId, commentId) {
    return this._request(`/posts/${postId}/comments/${commentId}`, 'DELETE')
  },

  /**
   * 获取用户对文章的互动状态（是否已点赞/收藏）
   * @param {string} postId - 文章ID
   * @returns {Promise} 返回互动状态，格式：{ success: true, data: { liked: boolean, favorited: boolean } }
   */
  getInteractions(postId) {
    return this._request(`/posts/${postId}/interactions`, 'GET')
  },

  /**
   * 点赞评论
   * @param {string} commentId - 评论ID
   * @returns {Promise} 返回点赞结果
   */
  likeComment(commentId) {
    return this._request(`/comments/${commentId}/like`, 'POST')
  },

  /**
   * 取消点赞评论
   * @param {string} commentId - 评论ID
   * @returns {Promise} 返回取消点赞结果
   */
  unlikeComment(commentId) {
    return this._request(`/comments/${commentId}/like`, 'DELETE')
  },

  /**
   * 获取用户对评论的互动状态（是否已点赞）
   * @param {string} commentId - 评论ID
   * @returns {Promise} 返回互动状态，格式：{ success: true, data: { liked: boolean } }
   */
  getCommentInteractions(commentId) {
    return this._request(`/comments/${commentId}/interactions`, 'GET')
  },

  /**
   * 获取我点赞的文章列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（默认：1）
   * @param {number} params.pageSize - 每页数量（默认：6）
   * @returns {Promise} 返回文章列表，格式：{ success: true, data: [...], pagination: {...} }
   */
  getMyLikes(params = {}) {
    const queryParams = []
    if (params.page) queryParams.push(`page=${params.page}`)
    if (params.pageSize) queryParams.push(`pageSize=${params.pageSize}`)
    
    const url = `/posts/my-likes${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`
    return this._request(url, 'GET')
  },

  /**
   * 获取我的收藏文章列表
   * @param {Object} params - 查询参数
   * @param {number} params.page - 页码（默认：1）
   * @param {number} params.pageSize - 每页数量（默认：6）
   * @returns {Promise} 返回文章列表，格式：{ success: true, data: [...], pagination: {...} }
   */
  getMyFavorites(params = {}) {
    const queryParams = []
    if (params.page) queryParams.push(`page=${params.page}`)
    if (params.pageSize) queryParams.push(`pageSize=${params.pageSize}`)
    
    const url = `/posts/my-favorites${queryParams.length > 0 ? '?' + queryParams.join('&') : ''}`
    return this._request(url, 'GET')
  }
}

module.exports = {
  articleApi,
  categoryApi,
  tagApi,
  apiConfigApi,
  blogPostApi,
  blogCategoryApi,
  blogInteractionApi,
  request
}

