const blogApi = require('../../utils/blogApi.js')
const config = require('../../config.js')
const { extractChineseName } = require('../../util/util.js')
const authHelper = require('../../utils/authHelper.js')
const authApi = require('../../utils/authApi.js')
const systemInfo = require('../../utils/systemInfo.js')

Page({
  data: {
    theme: 'light',
    mode: 'create',
    articleId: null,
    saving: false,
    uploadingMedia: false,
    // 上传进度
    uploadProgress: 0,
    uploadTotal: 0,
    uploadCurrent: 0,
    showUploadProgress: false,
    uploadType: '', // 'image', 'video'
    // 表单数据
    name: '',
    apiName: '', // 实际的API名称（用于创建文章，如 "tip-guide"）
    apiNameDisplay: '', // 显示名称（用于界面显示，如 "小费指南"）
    htmlContent: '',
    image: '',
    phone: '', // 手机号
    address: '', // 地址
    latitude: null, // 纬度
    longitude: null, // 经度
    price: '', // 价格（二手市场、租房酒店）
    rooms: '', // 房间数（租房酒店）
    area: '', // 面积（租房酒店）
    isSecondHand: false, // 是否是二手市场分类（用于WXML条件判断）
    isRental: false, // 是否是租房酒店分类（用于WXML条件判断）
    hideContactFields: false, // 是否隐藏手机号和定位输入（小费指南、签证攻略、防骗指南）
    // API列表
    apiList: [],
    apiNameIndex: 0,
    // 错误信息
    errors: {},
    // 工具栏状态
    toolbarHeight: 60,
    showKeyboard: false,
    canUndo: false,
    canRedo: false,
    // 历史记录（用于撤回/重做）
    history: [],
    historyIndex: -1,
    // 媒体列表
    mediaList: [],
    // 弹窗状态
    showCategoryModal: false,
    showFontModal: false,
    showMediaPickerModal: false,
    showVideoPreview: false,
    previewVideoUrl: '',
    previewVideoPoster: '',
    // 滚动位置
    scrollIntoView: '',
    // 编辑器相关
    editorReady: false,
    editorCtx: null,
    // 全屏编辑状态
    fullscreen: false
  },

  onLoad(options) {
    const app = getApp()
    
    // 检查登录状态
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/page/my/index'
        })
      }, 1500)
      return
    }
    
    this.setData({
      theme: systemInfo.getTheme(),
      mode: options.mode || 'create',
      articleId: options.id || null
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 初始化历史记录
    this.saveToHistory()

    // 加载API列表
    this.loadApiList()

    // 如果是编辑模式，加载文章数据
    if (this.data.mode === 'edit' && this.data.articleId) {
      this.loadArticle()
    }

    // 监听键盘高度
    this.listenKeyboard()
  },

  // 监听键盘
  listenKeyboard() {
    // 小程序不支持直接监听键盘，这里只是占位
    // 实际可以通过监听输入框focus/blur来调整
  },

  // 禁止创建文章的分类列表
  getForbiddenCategories() {
    return ['天气', '汇率', '翻译', 'weather', 'exchange-rate', 'translation', 'exchangeRate', 'exchange_rate']
  },

  // 检查分类是否被禁止
  isForbiddenCategory(category) {
    if (!category) return false
    const forbiddenCategories = this.getForbiddenCategories()
    const normalizedCategory = category.trim().toLowerCase()
    return forbiddenCategories.some(forbidden => {
      const normalizedForbidden = forbidden.toLowerCase()
      return normalizedCategory === normalizedForbidden || 
             normalizedCategory.includes(normalizedForbidden) ||
             normalizedForbidden.includes(normalizedCategory)
    })
  },

  // 加载API列表
  async loadApiList() {
    try {
      const result = await blogApi.apiConfigApi.getList()
      console.log('[loadApiList] API列表原始结果:', JSON.stringify(result, null, 2))
      
      // 提取分类信息的辅助函数，返回 {name, apiName} 对象
      const extractCategoryInfo = (item) => {
        if (typeof item === 'string') {
          // 如果是字符串，同时作为 name 和 apiName
          return { name: item, apiName: item }
        }
        if (item && typeof item === 'object') {
          // 优先使用 apiName 作为实际API名称（后端需要的）
          // name 作为显示名称（中文）
          const apiName = item.apiName || item.name || item.title || item.label || ''
          const name = item.name || item.title || item.label || item.apiName || ''
          
          // 如果 apiName 和 name 都存在且不同，使用 apiName 作为实际值
          // 如果只有 name，则 name 同时作为显示和实际值
          return {
            name: name || apiName, // 显示名称（优先中文名称）
            apiName: apiName || name // 实际API名称（优先 apiName 字段）
          }
        }
        // 如果都无法提取，返回 null（会被过滤掉）
        return null
      }
      
      let apiList = []
      
      if (result.success && result.data) {
        apiList = result.data.map(extractCategoryInfo).filter(item => item && item.apiName)
      } else if (Array.isArray(result)) {
        // 如果直接返回数组
        apiList = result.map(extractCategoryInfo).filter(item => item && item.apiName)
      } else if (result && result.data && Array.isArray(result.data)) {
        // 如果result.data是数组
        apiList = result.data.map(extractCategoryInfo).filter(item => item && item.apiName)
      }
      
      // 过滤掉禁止创建文章的分类（天气、汇率、翻译）
      const forbiddenCategories = this.getForbiddenCategories()
      apiList = apiList.filter(item => {
        // 使用 apiName 或 name 来检查是否禁止
        const categoryName = item.apiName || item.name
        const isForbidden = this.isForbiddenCategory(categoryName)
        if (isForbidden) {
          console.log(`[loadApiList] 过滤掉禁止的分类: ${categoryName}`)
        }
        return !isForbidden
      })
      
      console.log('[loadApiList] 处理后的API列表（已过滤禁止分类）:', apiList)
      
      // 确保apiList始终是数组，避免渲染层错误
      const safeApiList = Array.isArray(apiList) ? apiList : []
      
      if (safeApiList.length === 0) {
        console.warn('[loadApiList] API列表为空，可能的原因：')
        console.warn('1. API返回数据格式不正确')
        console.warn('2. 所有分类都被过滤掉了')
        console.warn('3. API请求失败或返回空数据')
        console.warn('原始结果:', result)
      }
      
      this.setData({
        apiList: safeApiList
      })
      
      return safeApiList
    } catch (error) {
      console.error('[loadApiList] 加载API列表失败:', error)
      console.error('[loadApiList] 错误详情:', error.message, error.stack)
      wx.showToast({
        title: '加载分类失败: ' + (error.message || '未知错误'),
        icon: 'none',
        duration: 3000
      })
      // 设置空数组，避免渲染错误
      this.setData({
        apiList: []
      })
      return []
    }
  },

  // 加载文章数据
  async loadArticle() {
    // 先加载API列表
    const apiList = await this.loadApiList()
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    })

    try {
      const result = await blogApi.articleApi.getDetail(this.data.articleId)
      console.log('[loadArticle] 文章详情:', result)
      
      if (result.success && result.data) {
        const article = result.data
        console.log('[loadArticle] 文章数据:', article)
        
        // 检查编辑权限：判断当前登录用户是否和文章的编辑者一致（通过deviceId判断）
        const currentUser = authHelper.getLoginInfo()
        if (!currentUser || !currentUser.phone) {
          wx.hideLoading()
          wx.showToast({
            title: '请先登录',
            icon: 'none',
            duration: 2000
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
          return
        }
        
        // 获取当前用户的deviceId（优先使用phone作为deviceId，与保存文章时的逻辑一致）
        const currentDeviceId = currentUser.phone ? currentUser.phone.trim() : null
        
        // 提取文章的编辑者deviceId（从custom_fields或直接字段）
        let articleDeviceId = null
        if (article.custom_fields) {
          try {
            const customFields = typeof article.custom_fields === 'string' 
              ? JSON.parse(article.custom_fields) 
              : article.custom_fields
            if (customFields && customFields.deviceId) {
              articleDeviceId = customFields.deviceId
            }
          } catch (e) {
            console.warn('[loadArticle] 解析custom_fields失败:', e)
          }
        }
        
        // 如果没有从custom_fields获取到，尝试直接从文章对象获取
        if (!articleDeviceId && article.deviceId) {
          articleDeviceId = article.deviceId
        }
        
        // 清理deviceId后比较
        const articleDeviceIdNormalized = articleDeviceId ? articleDeviceId.trim() : null
        
        // 如果文章有deviceId且与当前用户不一致，不允许编辑
        if (articleDeviceId && articleDeviceIdNormalized && currentDeviceId !== articleDeviceIdNormalized) {
          wx.hideLoading()
          wx.showModal({
            title: '无编辑权限',
            content: '您不是此文章的编辑者，无权编辑此文章',
            showCancel: false,
            confirmText: '知道了',
            success: () => {
              wx.navigateBack()
            }
          })
          return
        }
        
        // 获取分类：优先使用apiName，如果没有则使用category
        const apiName = article.apiName || article.category || ''
        console.log('[loadArticle] 文章分类:', apiName)
        console.log('[loadArticle] API列表:', apiList)
        
        // 确保API列表已加载后再设置分类
        let apiNameIndex = 0
        let apiNameDisplay = apiName // 默认使用 apiName 作为显示名称
        
        if (apiName && apiList.length > 0) {
          // 查找匹配的分类项（支持对象格式和字符串格式）
          let index = apiList.findIndex(item => {
            if (typeof item === 'string') {
              return item === apiName
            }
            // 对象格式：匹配 apiName 或 name
            return item.apiName === apiName || item.name === apiName
          })
          
          // 如果精确匹配失败，尝试模糊匹配（去除空格、大小写不敏感）
          if (index < 0) {
            const normalizedApiName = apiName.trim().toLowerCase()
            index = apiList.findIndex(item => {
              let itemName = ''
              if (typeof item === 'string') {
                itemName = item
              } else {
                itemName = item.apiName || item.name || ''
              }
              const normalizedName = (itemName || '').trim().toLowerCase()
              return normalizedName === normalizedApiName
            })
          }
          
          if (index >= 0) {
            apiNameIndex = index
            const matchedItem = apiList[index]
            // 如果是对象格式，使用 name 作为显示名称
            if (typeof matchedItem === 'object' && matchedItem.name) {
              apiNameDisplay = matchedItem.name
            }
            console.log('[loadArticle] 找到分类索引:', index, '分类名称:', matchedItem)
          } else {
            console.warn('[loadArticle] 未找到匹配的分类:', apiName, '可用分类:', apiList)
          }
        } else {
          console.warn('[loadArticle] 分类为空或API列表为空:', { apiName, apiListLength: apiList.length })
        }
        
        // 从内容中提取第一张图片作为封面（如果文章有图片）
        let coverImage = ''
        if (article.htmlContent) {
          coverImage = this.extractFirstImage(article.htmlContent)
        }
        // 如果内容中没有图片，使用原有的封面图（向后兼容）
        if (!coverImage && article.image) {
          coverImage = article.image
        }
        
        // 处理经纬度：确保是数字类型或null
        let latitude = null
        let longitude = null
        if (article.latitude !== null && article.latitude !== undefined && article.latitude !== '') {
          const lat = parseFloat(article.latitude)
          if (!isNaN(lat) && lat >= -90 && lat <= 90) {
            latitude = lat
          }
        }
        if (article.longitude !== null && article.longitude !== undefined && article.longitude !== '') {
          const lng = parseFloat(article.longitude)
          if (!isNaN(lng) && lng >= -180 && lng <= 180) {
            longitude = lng
          }
        }
        
        // 计算分类类型
        const isSecondHand = this.isSecondHandCategory(apiName)
        const isRental = this.isRentalCategory(apiName)
        const hideContactFields = this.shouldHideContactFields(apiName)
        
        this.setData({
          name: article.name || '',
          apiName: apiName, // 实际的API名称（用于保存）
          apiNameDisplay: apiNameDisplay, // 显示名称（用于界面显示）
          apiNameIndex: apiNameIndex,
          htmlContent: article.htmlContent || '',
          image: coverImage,
          phone: article.phone || '',
          address: article.address || '',
          latitude: latitude,
          longitude: longitude,
          price: article.price !== null && article.price !== undefined ? String(article.price) : '',
          rooms: article.rooms !== null && article.rooms !== undefined ? String(article.rooms) : '',
          area: article.area !== null && article.area !== undefined ? String(article.area) : '',
          isSecondHand: isSecondHand,
          isRental: isRental,
          hideContactFields: hideContactFields
        })
        
        console.log('[loadArticle] 设置后的数据:', {
          apiName: apiName,
          apiNameIndex: apiNameIndex,
          apiListLength: this.data.apiList.length
        })
        
        // 解析媒体内容
        this.parseMediaFromContent()
        
        // 如果编辑器已就绪，设置内容
        if (this.data.editorReady && this.editorCtx) {
          this.setEditorContent(article.htmlContent || '')
        }
        
        // 保存到历史记录
        this.saveToHistory()
      }
      wx.hideLoading()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 从内容中提取第一张图片作为封面
  extractFirstImage(htmlContent) {
    if (!htmlContent) return ''
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/i
    const match = htmlContent.match(imgRegex)
    return match ? match[1] : ''
  },

  // 更新封面图（从内容中提取第一张图片）
  updateCoverFromContent(htmlContent) {
    // 总是从内容中提取第一张图片作为封面
    const firstImage = this.extractFirstImage(htmlContent)
    if (firstImage) {
      this.setData({ image: firstImage })
    } else {
      // 如果没有图片，清空封面
      this.setData({ image: '' })
    }
  },

  // 从内容中解析媒体
  parseMediaFromContent() {
    const content = this.data.htmlContent
    const mediaList = []
    
    // 解析图片
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
    let match
    while ((match = imgRegex.exec(content)) !== null) {
      mediaList.push({
        type: 'image',
        url: match[1]
      })
    }
    
    // 解析视频
    const videoRegex = /<video[^>]+src=["']([^"']+)["'][^>]*>/gi
    while ((match = videoRegex.exec(content)) !== null) {
      mediaList.push({
        type: 'video',
        url: match[1]
      })
    }
    
    this.setData({ mediaList })
  },

  // 输入处理（标题输入）
  onInput(e) {
    const field = e.currentTarget.dataset.field
    const value = e.detail.value
    this.setData({
      [field]: value,
      [`errors.${field}`]: ''
    })
    
    // 标题输入防抖保存历史记录
    if (field === 'name') {
      if (this._titleHistoryTimer) {
        clearTimeout(this._titleHistoryTimer)
      }
      this._titleHistoryTimer = setTimeout(() => {
        this.saveToHistory()
      }, 1000)
    }
  },
  
  // 手机号输入处理
  onPhoneInput(e) {
    const value = e.detail.value
    this.setData({
      phone: value,
      'errors.phone': ''
    })
  },
  
  // 价格输入处理
  onPriceInput(e) {
    const value = e.detail.value
    this.setData({
      price: value
    })
  },
  
  // 房间数输入处理
  onRoomsInput(e) {
    const value = e.detail.value
    this.setData({
      rooms: value
    })
  },
  
  // 面积输入处理
  onAreaInput(e) {
    const value = e.detail.value
    this.setData({
      area: value
    })
  },
  
  // 检查是否是租房酒店分类
  isRentalCategory(category) {
    if (!category) return false
    const normalizedCategory = category.trim().toLowerCase()
    const rentalKeywords = ['租房', '酒店', 'rental', 'hotel', '住宿', '公寓']
    return rentalKeywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      return normalizedCategory.indexOf(normalizedKeyword) !== -1 || 
             normalizedKeyword.indexOf(normalizedCategory) !== -1
    })
  },

  // 编辑器准备就绪
  onEditorReady() {
    const that = this
    wx.createSelectorQuery().in(this).select('#content-editor').context(function(res) {
      that.editorCtx = res.context
      that.setData({ editorReady: true })
      
      // 如果有初始内容，设置到编辑器
      if (that.data.htmlContent) {
        that.setEditorContent(that.data.htmlContent)
      }
    }).exec()
  },

  // 将视频标签转换为占位图片（用于编辑器显示）
  convertVideoToPlaceholder(html) {
    if (!html) return html
    
    // 初始化视频占位符映射（如果还没有）
    if (!this._videoPlaceholderMap) {
      this._videoPlaceholderMap = {}
    }
    
    let processedHtml = html
    // 匹配video标签，支持自闭合和闭合标签，提取src和poster属性
    const videoRegex = /<video([^>]+)>(?:\s*<\/video>)?/gi
    let match
    let videoIndex = 0
    
    while ((match = videoRegex.exec(html)) !== null) {
      const videoTag = match[0]
      const videoAttributes = match[1]
      
      // 提取src属性
      const srcMatch = videoAttributes.match(/src\s*=\s*["']([^"']+)["']/i)
      if (!srcMatch) continue
      const videoSrc = srcMatch[1]
      
      // 提取poster属性
      const posterMatch = videoAttributes.match(/poster\s*=\s*["']([^"']+)["']/i)
      const poster = posterMatch ? posterMatch[1] : null
      
      // 生成唯一的视频ID
      const videoId = `VIDEO_${Date.now()}_${videoIndex}_${Math.random().toString(36).substr(2, 9)}`
      videoIndex++
      
      // 保存视频信息到映射中（包括src和poster）
      this._videoPlaceholderMap[videoId] = {
        src: videoSrc,
        poster: poster
      }
      
      // 生成占位图片
      // 如果有poster，使用poster作为占位图；否则使用SVG占位图
      let placeholderImg
      if (poster && (poster.startsWith('http://') || poster.startsWith('https://') || poster.startsWith('//'))) {
        // 使用poster作为占位图
        placeholderImg = poster
      } else {
        // 生成SVG占位图
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120">
          <rect width="200" height="120" fill="#f0f0f0" stroke="#ddd" stroke-width="1"/>
          <circle cx="100" cy="60" r="25" fill="#07c160" opacity="0.9"/>
          <polygon points="95,50 95,70 110,60" fill="#fff"/>
          <text x="100" y="100" text-anchor="middle" font-size="12" fill="#666" font-family="Arial">视频</text>
        </svg>`
        placeholderImg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
      }
      
      // 将video标签替换为img标签（占位图）
      const placeholderImgTag = `<img src="${placeholderImg}" alt="视频_${videoId}" style="max-width: 100%; margin: 12px 0;" />`
      processedHtml = processedHtml.replace(videoTag, placeholderImgTag)
    }
    
    return processedHtml
  },

  // 将占位图片转换回视频标签（用于保存）
  convertPlaceholderToVideo(html) {
    if (!html) return html
    
    let processedHtml = html
    let hasVideoPlaceholder = false
    
    // 查找所有视频占位符图片（alt属性包含"视频_"前缀）
    const videoPlaceholderRegex = /<img[^>]+alt=["']视频_([^"']+)["'][^>]*>/gi
    let match
    
    while ((match = videoPlaceholderRegex.exec(html)) !== null) {
      const videoId = match[1]
      // 从映射中获取视频信息
      if (this._videoPlaceholderMap && this._videoPlaceholderMap[videoId]) {
        const videoInfo = this._videoPlaceholderMap[videoId]
        const videoSrc = videoInfo.src || videoInfo // 兼容旧格式（直接是URL）
        const poster = videoInfo.poster || null
        
        // 构建video标签
        let videoHtml = `<video src="${videoSrc}" controls style="max-width: 100%; margin: 12px 0;">`
        if (poster) {
          videoHtml = `<video src="${videoSrc}" poster="${poster}" controls style="max-width: 100%; margin: 12px 0;">`
        }
        videoHtml += `</video>`
        
        processedHtml = processedHtml.replace(match[0], videoHtml)
        hasVideoPlaceholder = true
      }
    }
    
    return processedHtml
  },

  // 设置编辑器内容
  setEditorContent(html) {
    if (!this.editorCtx || !html) return
    
    try {
      // 移除图片和视频标签，正文中不显示图片和视频（只在上方预览区域显示）
      let textOnlyHtml = html
      textOnlyHtml = textOnlyHtml.replace(/<img[^>]*>/gi, '')
      textOnlyHtml = textOnlyHtml.replace(/<image[^>]*>/gi, '')
      // 移除视频标签，视频不在正文中显示
      textOnlyHtml = textOnlyHtml.replace(/<video[^>]*>.*?<\/video>/gi, '')
      textOnlyHtml = textOnlyHtml.replace(/<video[^>]*\/>/gi, '')
      
      this.editorCtx.setContents({
        html: textOnlyHtml
      })
    } catch (error) {
      console.error('设置编辑器内容失败:', error)
    }
  },

  // 编辑器输入
  onEditorInput(e) {
    const html = e.detail.html || ''
    
    // 如果正在插入媒体，检查是否有占位符图片需要替换为video标签
    if (this._insertingMedia && this._mediaPlaceholderImg && this._mediaHtml) {
      // 检查HTML中是否有占位符图片
      const imgPlaceholderRegex = new RegExp(`<img[^>]+src=["']${this._mediaPlaceholderImg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'gi')
      if (imgPlaceholderRegex.test(html)) {
        // 将占位符图片替换为video标签（保存到htmlContent）
        const newHtml = html.replace(imgPlaceholderRegex, this._mediaHtml)
        this.setData({
          htmlContent: newHtml
        })
        
        // 清除标记
        this._insertingMedia = false
        this._mediaPlaceholder = null
        this._mediaPlaceholderImg = null
        this._mediaHtml = null
        
        // 检查并设置封面图
        this.updateCoverFromContent(newHtml)
        
        // 注意：不要调用 parseMediaFromContent()，因为视频已经通过占位符处理
        // mediaList 应该通过 insertImage 和 removeMedia 独立管理
        
        return
      }
    }
    
    // 如果正在插入媒体但还没有占位符，等待
    if (this._insertingMedia) {
      return
    }
    
    // 处理视频占位符：将编辑器中的占位符图片转换为HTML中的video标签
    let processedHtml = this.convertPlaceholderToVideo(html)
    let hasVideoPlaceholder = processedHtml !== html
    
    // 如果正在插入媒体，清除插入标记
    if (this._insertingMedia && hasVideoPlaceholder) {
      this._insertingMedia = false
      this._mediaPlaceholderImg = null
      this._mediaHtml = null
      this._currentVideoId = null
    }
    
    // 如果处理了视频占位符，使用处理后的HTML
    let finalHtml = hasVideoPlaceholder ? processedHtml : html
    
    // 移除图片和视频标签，正文中不显示图片和视频（只在上方预览区域显示）
    finalHtml = finalHtml.replace(/<img[^>]*>/gi, '')
    finalHtml = finalHtml.replace(/<image[^>]*>/gi, '')
    // 移除视频标签，视频不在正文中显示
    finalHtml = finalHtml.replace(/<video[^>]*>.*?<\/video>/gi, '')
    finalHtml = finalHtml.replace(/<video[^>]*\/>/gi, '')
    
    this.setData({
      htmlContent: finalHtml
    })
    
    // 检查并设置封面图
    this.updateCoverFromContent(finalHtml)
    
    // 注意：不要调用 parseMediaFromContent()，因为：
    // 1. 我们已经移除了图片标签，parseMediaFromContent() 会清空 mediaList
    // 2. mediaList 应该通过 insertImage 和 removeMedia 独立管理，不从 htmlContent 解析
    
    // 防抖保存历史记录
    if (this._historyTimer) {
      clearTimeout(this._historyTimer)
    }
    this._historyTimer = setTimeout(() => {
      this.saveToHistory()
    }, 500)
  },

  // 编辑器状态变化
  onEditorStatusChange(e) {
    // 可以在这里处理编辑器状态变化
  },

  // 标题聚焦
  onTitleFocus() {
    this.setData({
      scrollIntoView: 'title-input'
    })
  },

  // 标题失焦
  onTitleBlur() {
    // 可以在这里做一些处理
  },

  // 内容聚焦
  onContentFocus() {
    this.setData({
      scrollIntoView: 'content-input',
      showKeyboard: true
    })
  },

  // 内容失焦
  onContentBlur() {
    this.setData({
      showKeyboard: false
    })
  },

  // 保存到历史记录
  saveToHistory() {
    const history = Array.isArray(this.data.history) ? [...this.data.history] : []
    const currentState = {
      name: this.data.name,
      htmlContent: this.data.htmlContent
    }
    
    // 如果当前状态与最新历史不同，才保存
    if (history.length === 0 || 
        JSON.stringify(history[history.length - 1]) !== JSON.stringify(currentState)) {
      // 删除当前位置之后的历史
      history.splice(this.data.historyIndex + 1)
      history.push(currentState)
      
      // 限制历史记录数量
      if (history.length > 50) {
        history.shift()
      }
      
      this.setData({
        history: history,
        historyIndex: history.length - 1,
        canUndo: history.length > 1,
        canRedo: false
      })
    }
  },

  // 撤回
  undo() {
    if (this.editorCtx) {
      this.editorCtx.undo()
      return
    }
    
    if (!this.data.canUndo || this.data.historyIndex <= 0) return
    
    const newIndex = this.data.historyIndex - 1
    const state = this.data.history[newIndex]
    
    this.setData({
      historyIndex: newIndex,
      name: state.name,
      htmlContent: state.htmlContent,
      canUndo: newIndex > 0,
      canRedo: true
    })
    
    // 更新编辑器内容
    if (this.data.editorReady) {
      this.setEditorContent(state.htmlContent)
    }
  },

  // 重做
  redo() {
    if (this.editorCtx) {
      this.editorCtx.redo()
      return
    }
    
    if (!this.data.canRedo || 
        this.data.historyIndex >= this.data.history.length - 1) return
    
    const newIndex = this.data.historyIndex + 1
    const state = this.data.history[newIndex]
    
    this.setData({
      historyIndex: newIndex,
      name: state.name,
      htmlContent: state.htmlContent,
      canUndo: true,
      canRedo: newIndex < this.data.history.length - 1
    })
    
    // 更新编辑器内容
    if (this.data.editorReady) {
      this.setEditorContent(state.htmlContent)
    }
  },

  // 插入/更换封面功能已移除，封面自动从文章第一张图片提取

  // 显示媒体选择弹窗
  showMediaPicker() {
    this.setData({
      showMediaPickerModal: true
    })
  },

  // 隐藏媒体选择弹窗
  hideMediaPicker() {
    this.setData({
      showMediaPickerModal: false
    })
  },

  // 插入图片
  insertImage() {
    // 关闭弹窗
    this.setData({
      showMediaPickerModal: false
    })
    
    const that = this
    wx.chooseImage({
      count: 9,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async function(res) {
        const totalFiles = res.tempFilePaths.length
        that.setData({ 
          uploadingMedia: true,
          showUploadProgress: true,
          uploadProgress: 0,
          uploadTotal: totalFiles,
          uploadCurrent: 0,
          uploadType: 'image'
        })
        
        try {
          let completedFiles = 0
          const uploadPromises = res.tempFilePaths.map((filePath, index) => 
            that.uploadFile(filePath, 'image', (progress) => {
              // 计算总体进度：已完成文件数 * 100 + 当前文件进度
              const overallProgress = Math.round((completedFiles * 100 + progress) / totalFiles)
              that.setData({
                uploadProgress: overallProgress,
                uploadCurrent: completedFiles + 1
              })
            }).then((url) => {
              completedFiles++
              // 更新进度，当前文件已完成
              const overallProgress = Math.round((completedFiles * 100) / totalFiles)
              that.setData({
                uploadProgress: overallProgress,
                uploadCurrent: completedFiles
              })
              return url
            })
          )
          const imageUrls = await Promise.all(uploadPromises)
          
          // 添加到媒体列表（只添加到预览区域，不插入到编辑器）
          const mediaList = Array.isArray(that.data.mediaList) ? [...that.data.mediaList] : []
          imageUrls.forEach(url => {
            mediaList.push({
              type: 'image',
              url: url
            })
          })
          
          that.setData({
            mediaList: mediaList,
            uploadingMedia: false,
            showUploadProgress: false,
            uploadProgress: 0
          })
          
          that.saveToHistory()
          
          wx.showToast({
            title: '图片已添加',
            icon: 'success',
            duration: 1500
          })
        } catch (error) {
          that.setData({ 
            uploadingMedia: false,
            showUploadProgress: false,
            uploadProgress: 0
          })
          // 显示详细的错误信息
          const errorMsg = error.message || '上传失败'
          console.error('[insertImage] 图片上传失败:', errorMsg, error)
          wx.showModal({
            title: '图片上传失败',
            content: errorMsg,
            showCancel: false,
            confirmText: '知道了'
          })
        }
      },
      fail: function(err) {
        console.error('[insertImage] 选择图片失败:', err)
        const errMsg = err.errMsg || '选择图片失败'
        let errorMsg = '选择图片失败'
        
        if (errMsg.includes('cancel')) {
          // 用户取消选择，不需要提示
          return
        } else if (errMsg.includes('permission')) {
          errorMsg = '需要相机和相册权限，请在设置中开启'
        } else if (errMsg) {
          errorMsg = `选择图片失败：${errMsg}`
        }
        
        wx.showModal({
          title: '选择图片失败',
          content: errorMsg,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  // 插入视频
  insertVideo() {
    // 关闭弹窗
    this.setData({
      showMediaPickerModal: false
    })
    
    const that = this
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      camera: 'back',
      success: async function(res) {
        that.setData({ 
          uploadingMedia: true,
          showUploadProgress: true,
          uploadProgress: 0,
          uploadTotal: 1,
          uploadCurrent: 0,
          uploadType: 'video'
        })
        
        try {
          // 上传视频文件
          const videoUrl = await that.uploadFile(res.tempFilePath, 'video', (progress) => {
            that.setData({
              uploadProgress: progress,
              uploadCurrent: 1
            })
          })
          
          // 如果有封面图，也上传封面图
          let posterUrl = null
          if (res.thumbTempFilePath) {
            try {
              posterUrl = await that.uploadFile(res.thumbTempFilePath, 'image', () => {})
            } catch (error) {
              console.warn('[insertVideo] 封面图上传失败，继续使用视频:', error)
            }
          }
          
          // 添加到媒体列表（只添加到预览区域，不插入到编辑器）
          const mediaList = Array.isArray(that.data.mediaList) ? [...that.data.mediaList] : []
          mediaList.push({
            type: 'video',
            url: videoUrl,
            poster: posterUrl || res.thumbTempFilePath || null // 保存封面图URL或临时路径
          })
          
          that.setData({
            mediaList: mediaList,
            uploadingMedia: false,
            showUploadProgress: false,
            uploadProgress: 0
          })
          
          that.saveToHistory()
          
          wx.showToast({
            title: '视频已添加',
            icon: 'success',
            duration: 1500
          })
        } catch (error) {
          that.setData({ 
            uploadingMedia: false,
            showUploadProgress: false,
            uploadProgress: 0
          })
          // 显示详细的错误信息
          const errorMsg = error.message || '上传失败'
          console.error('[insertVideo] 视频上传失败:', errorMsg, error)
          wx.showModal({
            title: '视频上传失败',
            content: errorMsg,
            showCancel: false,
            confirmText: '知道了'
          })
        }
      },
      fail: function(err) {
        console.error('[insertVideo] 选择视频失败:', err)
        const errMsg = err.errMsg || '选择视频失败'
        let errorMsg = '选择视频失败'
        
        if (errMsg.includes('cancel')) {
          // 用户取消选择，不需要提示
          return
        } else if (errMsg.includes('permission')) {
          errorMsg = '需要相机和相册权限，请在设置中开启'
        } else if (errMsg.includes('duration')) {
          errorMsg = '视频时长超过限制，最大支持60秒'
        } else if (errMsg.includes('size')) {
          errorMsg = '视频文件过大，最大支持50MB'
        } else if (errMsg) {
          errorMsg = `选择视频失败：${errMsg}`
        }
        
        wx.showModal({
          title: '选择视频失败',
          content: errorMsg,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  // 预览视频
  previewVideo(e) {
    const index = e.currentTarget.dataset.index
    const mediaList = this.data.mediaList || []
    const media = mediaList[index]
    
    if (media && media.type === 'video' && media.url) {
      this.setData({
        showVideoPreview: true,
        previewVideoUrl: media.url,
        previewVideoPoster: media.poster || media.thumbTempFilePath || ''
      })
    }
  },

  // 隐藏视频预览
  hideVideoPreview() {
    // 暂停视频播放
    const videoContext = wx.createVideoContext('preview-video-player', this)
    if (videoContext) {
      videoContext.pause()
    }
    
    this.setData({
      showVideoPreview: false,
      previewVideoUrl: '',
      previewVideoPoster: ''
    })
  },

  // 删除媒体
  removeMedia(e) {
    const index = e.currentTarget.dataset.index
    const mediaList = Array.isArray(this.data.mediaList) ? [...this.data.mediaList] : []
    
    // 从媒体列表中移除（图片和视频现在只显示在预览区域，不需要从HTML中移除）
    mediaList.splice(index, 1)
    
    this.setData({
      mediaList: mediaList
    })
    
    this.saveToHistory()
  },

  // 显示分类选择器
  showCategoryPicker() {
    this.setData({ showCategoryModal: true })
  },

  // 隐藏分类选择器
  hideCategoryPicker() {
    this.setData({ showCategoryModal: false })
  },

  // 选择分类
  selectCategory(e) {
    const categoryName = e.currentTarget.dataset.category // 这是显示名称
    // 从 apiList 中找到对应的项，获取实际的 apiName
    const categoryItem = this.data.apiList.find(item => {
      // 兼容旧格式（字符串）和新格式（对象）
      if (typeof item === 'string') {
        return item === categoryName
      }
      return item.name === categoryName || item.apiName === categoryName
    })
    
    // 获取实际的 apiName（用于创建文章）
    const actualApiName = categoryItem 
      ? (typeof categoryItem === 'object' ? categoryItem.apiName : categoryItem)
      : categoryName
    
    // 获取显示名称
    const displayName = categoryItem 
      ? (typeof categoryItem === 'object' ? categoryItem.name : categoryItem)
      : categoryName
    
    const index = this.data.apiList.findIndex(item => {
      if (typeof item === 'string') {
        return item === categoryName
      }
      return item.name === categoryName || item.apiName === categoryName
    })
    
    // 安全地更新errors对象
    const currentErrors = this.data.errors || {}
    
    // 计算分类类型（使用实际的 apiName）
    const isSecondHand = this.isSecondHandCategory(actualApiName)
    const isRental = this.isRentalCategory(actualApiName)
    const hideContactFields = this.shouldHideContactFields(actualApiName)
    
    console.log('[selectCategory] 选择分类:', {
      displayName,
      actualApiName,
      categoryItem,
      index
    })
    
    this.setData({
      apiName: actualApiName, // 使用实际的 apiName（后端需要的）
      apiNameDisplay: displayName, // 保存显示名称（可选，用于显示）
      apiNameIndex: index >= 0 ? index : 0,
      showCategoryModal: false,
      isSecondHand: isSecondHand,
      isRental: isRental,
      hideContactFields: hideContactFields,
      errors: Object.assign({}, currentErrors, { apiName: '' })
    })
    
    // 如果选择的是二手市场分类，滚动到联系方式输入区域
    if (isSecondHand) {
      setTimeout(() => {
        this.setData({
          scrollIntoView: 'contact-section'
        })
      }, 300)
    }
  },
  
  // 检查是否是二手市场分类
  isSecondHandCategory(category) {
    if (!category) return false
    const normalizedCategory = category.trim().toLowerCase()
    const secondHandKeywords = ['二手', 'second-hand', 'secondhand', '二手市场', '二手集市']
    return secondHandKeywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      return normalizedCategory.indexOf(normalizedKeyword) !== -1 || 
             normalizedKeyword.indexOf(normalizedCategory) !== -1
    })
  },
  
  // 检查是否需要隐藏手机号和定位的分类（小费指南、签证攻略、防骗指南）
  shouldHideContactFields(category) {
    if (!category) return false
    const normalizedCategory = category.trim().toLowerCase()
    const hideKeywords = ['小费指南', 'tip-guide', 'tipguide', '签证攻略', 'visa-guide', 'visaguide', '防骗指南', '防骗指南', 'blacklist', 'scam']
    return hideKeywords.some(keyword => {
      const normalizedKeyword = keyword.toLowerCase()
      return normalizedCategory.indexOf(normalizedKeyword) !== -1 || 
             normalizedKeyword.indexOf(normalizedCategory) !== -1
    })
  },
  
  // 选择地图定位
  chooseLocation() {
    const that = this
    
    // 先检查位置权限
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] === false) {
          // 用户之前拒绝了授权，需要引导用户打开设置
          wx.showModal({
            title: '需要位置权限',
            content: '需要您授权位置权限才能选择地图定位，请在设置中开启',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 用户已授权，调用选择位置
                      that.callChooseLocation()
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] === undefined) {
          // 未授权，先请求授权
          wx.authorize({
            scope: 'scope.userLocation',
            success: () => {
              // 授权成功，调用选择位置
              that.callChooseLocation()
            },
            fail: () => {
              wx.showModal({
                title: '需要位置权限',
                content: '需要您授权位置权限才能选择地图定位',
                confirmText: '去设置',
                cancelText: '取消',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting()
                  }
                }
              })
            }
          })
        } else {
          // 已授权，直接调用选择位置
          that.callChooseLocation()
        }
      },
      fail: () => {
        // 获取设置失败，直接尝试调用
        that.callChooseLocation()
      }
    })
  },
  
  // 调用选择位置API
  callChooseLocation() {
    const that = this
    
    // 防止重复调用：如果正在选择位置，直接返回
    if (that._isChoosingLocation) {
      console.log('[callChooseLocation] 正在选择位置，忽略重复调用')
      return
    }
    
    // 设置标志，防止重复调用
    that._isChoosingLocation = true
    
    wx.chooseLocation({
      success: function(res) {
        console.log('[chooseLocation] 选择位置成功:', res)
        
        // 清除标志
        that._isChoosingLocation = false
        
        // 验证并处理经纬度
        let latitude = null
        let longitude = null
        
        // 检查返回数据是否有效
        if (!res || (res.latitude === undefined && res.longitude === undefined)) {
          console.error('[chooseLocation] 返回数据无效:', res)
          wx.showToast({
            title: '位置信息无效',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        if (res.latitude !== null && res.latitude !== undefined) {
          const lat = parseFloat(res.latitude)
          if (!isNaN(lat) && lat >= -90 && lat <= 90) {
            latitude = lat
          } else {
            console.warn('[chooseLocation] 纬度无效:', res.latitude)
          }
        }
        
        if (res.longitude !== null && res.longitude !== undefined) {
          const lng = parseFloat(res.longitude)
          if (!isNaN(lng) && lng >= -180 && lng <= 180) {
            longitude = lng
          } else {
            console.warn('[chooseLocation] 经度无效:', res.longitude)
          }
        }
        
        // 验证经纬度是否都有效
        if (latitude === null || longitude === null) {
          console.error('[chooseLocation] 经纬度验证失败:', { latitude, longitude, res })
          wx.showToast({
            title: '位置信息无效，请重新选择',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        // 安全地更新errors对象
        const currentErrors = that.data.errors || {}
        that.setData({
          address: res.address || res.name || '已选择位置',
          latitude: latitude,
          longitude: longitude,
          errors: Object.assign({}, currentErrors, {
            address: '',
            phone: ''
          })
        })
        
        console.log('[chooseLocation] 位置已设置:', { address: res.address || res.name, latitude, longitude })
        
        wx.showToast({
          title: '位置已选择',
          icon: 'success',
          duration: 1500
        })
      },
      fail: function(err) {
        console.error('[chooseLocation] 选择位置失败:', err)
        
        // 清除标志
        that._isChoosingLocation = false
        
        const errMsg = err.errMsg || ''
        
        // 注意：如果用户在地图上选择了位置并点击确定，不应该触发fail回调
        // 但如果确实触发了fail，需要区分是取消还是其他错误
        
        if (errMsg.includes('cancel') || errMsg.includes('取消')) {
          // 用户取消选择，不填入位置
          console.log('[chooseLocation] 用户取消选择，不填入位置')
          return
        } else if (errMsg.includes('auth') || errMsg.includes('permission') || errMsg.includes('权限')) {
          wx.showModal({
            title: '需要位置权限',
            content: '需要您授权位置权限才能选择地图定位，请在设置中开启',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.userLocation']) {
                      // 用户已授权，获取当前位置
                      that.getCurrentLocation()
                    }
                  }
                })
              }
            }
          })
        } else {
          // 其他错误：可能是网络问题、API调用失败等
          // 不自动获取当前位置，让用户知道发生了什么
          console.error('[chooseLocation] 选择位置失败，错误信息:', errMsg)
          wx.showToast({
            title: errMsg || '选择位置失败',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  
  // 获取当前位置
  getCurrentLocation() {
    const that = this
    wx.showLoading({
      title: '获取位置中...',
      mask: true
    })
    
    wx.getLocation({
      type: 'gcj02', // 返回可以用于wx.openLocation的经纬度
      success: function(res) {
        console.log('[getCurrentLocation] 获取当前位置成功:', res)
        
        // 验证并处理经纬度
        let latitude = null
        let longitude = null
        
        if (res.latitude !== null && res.latitude !== undefined) {
          const lat = parseFloat(res.latitude)
          if (!isNaN(lat) && lat >= -90 && lat <= 90) {
            latitude = lat
          }
        }
        
        if (res.longitude !== null && res.longitude !== undefined) {
          const lng = parseFloat(res.longitude)
          if (!isNaN(lng) && lng >= -180 && lng <= 180) {
            longitude = lng
          }
        }
        
        // 验证经纬度是否都有效
        if (latitude === null || longitude === null) {
          wx.hideLoading()
          wx.showToast({
            title: '位置信息无效',
            icon: 'none',
            duration: 2000
          })
          return
        }
        
        // 使用腾讯地图逆地理编码API获取详细地址
        that.reverseGeocode(latitude, longitude)
      },
      fail: function(err) {
        wx.hideLoading()
        console.error('[getCurrentLocation] 获取当前位置失败:', err)
        const errMsg = err.errMsg || ''
        
        if (errMsg.includes('auth') || errMsg.includes('permission') || errMsg.includes('权限')) {
          wx.showModal({
            title: '需要位置权限',
            content: '需要您授权位置权限才能获取当前位置，请在设置中开启',
            confirmText: '去设置',
            cancelText: '取消',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          wx.showToast({
            title: errMsg || '获取位置失败',
            icon: 'none',
            duration: 2000
          })
        }
      }
    })
  },
  
  // 逆地理编码：根据经纬度获取地址
  reverseGeocode(latitude, longitude) {
    const that = this
    
    // 使用腾讯地图逆地理编码API（需要配置key，这里先使用简单方式）
    // 如果不需要详细地址，可以直接使用经纬度
    // 注意：实际项目中应该使用配置的API key
    
    // 先设置位置数据，地址可以后续更新
    that.setLocationData(latitude, longitude, '当前位置')
    
    // 可选：如果需要详细地址，可以调用逆地理编码API
    // 这里先使用简单方式，直接显示"当前位置"
    wx.hideLoading()
  },
  
  // 设置位置数据
  setLocationData(latitude, longitude, address) {
    // 安全地更新errors对象
    const currentErrors = this.data.errors || {}
    this.setData({
      address: address || '当前位置',
      latitude: latitude,
      longitude: longitude,
      errors: Object.assign({}, currentErrors, {
        address: '',
        phone: ''
      })
    })
    wx.hideLoading()
    wx.showToast({
      title: '位置已设置',
      icon: 'success',
      duration: 1500
    })
  },

  // 显示字体选项
  showFontOptions() {
    this.setData({ showFontModal: true })
  },

  // 隐藏字体选项
  hideFontOptions() {
    this.setData({ showFontModal: false })
  },


  // 格式化文本
  formatText(e) {
    const format = e.currentTarget.dataset.format
    
    if (!this.editorCtx) {
      wx.showToast({
        title: '编辑器未就绪',
        icon: 'none'
      })
      return
    }
    
    switch(format) {
      case 'bold':
        this.editorCtx.format('bold')
        break
      case 'italic':
        this.editorCtx.format('italic')
        break
      case 'h2':
        this.editorCtx.format('header', { level: 2 })
        break
    }
    
    this.setData({
      showFontModal: false
    })
  },

  // 切换全屏编辑
  toggleFullscreen() {
    const fullscreen = !this.data.fullscreen
    this.setData({
      fullscreen: fullscreen
    })
    
    // 全屏时滚动到编辑器位置
    if (fullscreen) {
      setTimeout(() => {
        this.setData({
          scrollIntoView: 'content-editor'
        })
      }, 100)
    }
  },


  // 切换键盘
  toggleKeyboard() {
    // 小程序无法直接控制键盘，这里只是占位
    wx.showToast({
      title: '请点击输入框',
      icon: 'none'
    })
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 阻止弹窗内容点击时关闭弹窗
  },

  // 上传文件
  uploadFile(filePath, type = 'image', onProgress) {
    return new Promise((resolve, reject) => {
      const uploadUrl = `${config.apiBaseDomain}/api/blog-admin/upload`
      
      // 获取用户认证头（包含 x-user-token）
      const authHeaders = authApi.getAuthHeaders ? authApi.getAuthHeaders() : {}
      
      const uploadTask = wx.uploadFile({
        url: uploadUrl,
        filePath: filePath,
        name: 'file',
        formData: {
          type: type
        },
        header: {
          ...authHeaders // 使用 x-user-token 认证
        },
        success: (res) => {
          const statusCode = res.statusCode || 200
          console.log(`[uploadFile] 上传响应状态码: ${statusCode}, 类型: ${type}`)
          
          // 处理不同的HTTP状态码
          if (statusCode === 200) {
            try {
              const data = JSON.parse(res.data)
              console.log('[uploadFile] 服务器响应数据:', data)
              
              if (data.success && data.url) {
                resolve(data.url)
              } else {
                // 服务器返回了错误信息
                const errorMsg = data.message || data.error || '上传失败'
                console.error('[uploadFile] 服务器返回错误:', errorMsg)
                reject(new Error(errorMsg))
              }
            } catch (error) {
              console.error('[uploadFile] 解析响应数据失败:', error, res.data)
              reject(new Error('服务器响应格式错误，请稍后重试'))
            }
          } else if (statusCode === 400) {
            // 请求参数错误（文件类型不支持、文件格式错误等）
            try {
              const data = JSON.parse(res.data)
              const errorMsg = data.message || data.error || '请求参数错误，请检查文件格式和大小'
              console.error('[uploadFile] 400错误:', errorMsg)
              reject(new Error(errorMsg))
            } catch (error) {
              console.error('[uploadFile] 400错误，解析响应失败:', error)
              const typeName = type === 'video' ? '视频' : '图片'
              reject(new Error(`${typeName}格式不支持或文件格式错误，请检查文件格式`))
            }
          } else if (statusCode === 401) {
            // 认证失败
            try {
              const data = JSON.parse(res.data)
              const errorMsg = data.message || data.error || '认证失败，请重新登录'
              console.error('[uploadFile] 401错误:', errorMsg)
              reject(new Error(errorMsg))
            } catch (error) {
              console.error('[uploadFile] 401错误，解析响应失败:', error)
              reject(new Error('认证失败，请重新登录'))
            }
          } else if (statusCode === 413) {
            // 文件过大
            try {
              const data = JSON.parse(res.data)
              const errorMsg = data.message || data.error || '文件大小超过限制'
              console.error('[uploadFile] 413错误:', errorMsg)
              const typeName = type === 'video' ? '视频' : '图片'
              reject(new Error(`${typeName}文件过大，${errorMsg.includes('MB') ? errorMsg : '请选择较小的文件'}`))
            } catch (error) {
              console.error('[uploadFile] 413错误，解析响应失败:', error)
              const typeName = type === 'video' ? '视频' : '图片'
              const maxSize = type === 'video' ? '50MB' : '10MB'
              reject(new Error(`${typeName}文件过大，最大支持${maxSize}，请选择较小的文件`))
            }
          } else if (statusCode === 500) {
            // 服务器错误
            try {
              const data = JSON.parse(res.data)
              const errorMsg = data.message || data.error || '服务器错误，请稍后重试'
              console.error('[uploadFile] 500错误:', errorMsg)
              reject(new Error(`服务器错误：${errorMsg}`))
            } catch (error) {
              console.error('[uploadFile] 500错误，解析响应失败:', error)
              reject(new Error('服务器错误，请稍后重试'))
            }
          } else {
            // 其他HTTP错误
            try {
              const data = JSON.parse(res.data)
              const errorMsg = data.message || data.error || `上传失败（错误代码：${statusCode}）`
              console.error(`[uploadFile] ${statusCode}错误:`, errorMsg)
              reject(new Error(errorMsg))
            } catch (error) {
              console.error(`[uploadFile] ${statusCode}错误，解析响应失败:`, error)
              reject(new Error(`上传失败（错误代码：${statusCode}），请稍后重试`))
            }
          }
        },
        fail: (err) => {
          console.error('[uploadFile] 上传请求失败:', err)
          
          // 根据错误类型提供更详细的错误信息
          let errorMsg = '上传失败'
          const errMsg = err.errMsg || ''
          
          if (errMsg.includes('timeout') || errMsg.includes('超时')) {
            errorMsg = '上传超时，请检查网络连接后重试'
          } else if (errMsg.includes('fail') && errMsg.includes('network')) {
            errorMsg = '网络连接失败，请检查网络设置'
          } else if (errMsg.includes('fail') && errMsg.includes('ssl')) {
            errorMsg = 'SSL证书验证失败，请检查网络安全设置'
          } else if (errMsg.includes('file not exist')) {
            errorMsg = '文件不存在，请重新选择文件'
          } else if (errMsg.includes('file size')) {
            const typeName = type === 'video' ? '视频' : '图片'
            const maxSize = type === 'video' ? '50MB' : '10MB'
            errorMsg = `${typeName}文件过大，最大支持${maxSize}`
          } else if (errMsg) {
            errorMsg = `上传失败：${errMsg}`
          } else {
            errorMsg = '上传失败，请检查网络连接后重试'
          }
          
          reject(new Error(errorMsg))
        }
      })
      
      // 监听上传进度
      if (onProgress && uploadTask.onProgressUpdate) {
        uploadTask.onProgressUpdate((res) => {
          const progress = res.progress || 0
          onProgress(progress)
        })
      }
    })
  },

  // 验证表单
  validate() {
    const errors = {}
    
    if (!this.data.name.trim()) {
      errors.name = '文章标题不能为空'
    }
    
    if (!this.data.apiName.trim()) {
      errors.apiName = '分类不能为空'
    } else {
      // 检查是否选择了禁止创建文章的分类
      if (this.isForbiddenCategory(this.data.apiName)) {
        const errorMsg = this.data.mode === 'create'
          ? '不允许创建此分类的文章（天气、汇率、翻译分类禁止创建）'
          : '不允许将文章修改为此分类（天气、汇率、翻译分类禁止创建）'
        errors.apiName = errorMsg
      }
      
      // 如果是二手市场分类，验证手机号和定位
      if (this.isSecondHandCategory(this.data.apiName)) {
        if (!this.data.phone || !this.data.phone.trim()) {
          errors.phone = '二手市场分类必须填写手机号'
        } else {
          // 简单的手机号格式验证（支持国际格式）
          const phoneRegex = /^[\d\s\+\-\(\)]+$/
          if (!phoneRegex.test(this.data.phone.trim())) {
            errors.phone = '手机号格式不正确'
          }
        }
        
        // 验证经纬度：必须是有效的数字且在合理范围内
        const lat = this.data.latitude
        const lng = this.data.longitude
        if (lat === null || lat === undefined || lng === null || lng === undefined) {
          errors.address = '二手市场分类必须选择地图定位'
        } else {
          const latitude = parseFloat(lat)
          const longitude = parseFloat(lng)
          if (isNaN(latitude) || isNaN(longitude) || 
              latitude < -90 || latitude > 90 || 
              longitude < -180 || longitude > 180) {
            errors.address = '地图定位信息无效，请重新选择'
          }
        }
      }
    }

    this.setData({ errors })
    return Object.keys(errors).length === 0
  },

  // 获取设备信息
  getDeviceInfo() {
    const app = getApp()
    const deviceInfo = {
      nickname: null,
      deviceModel: null,
      deviceId: null,
      deviceIp: null // 不提供，由服务器自动获取
    }
    
    try {
      // 获取用户信息（手机号和昵称）
      const user = authHelper.getLoginInfo() || app.globalData.user
      if (user) {
        // 昵称：优先使用 name，其次使用 nickname
        deviceInfo.nickname = user.name || user.nickname || null
        
        // 设备ID：使用手机号作为设备ID（如果手机号存在）
        if (user.phone) {
          deviceInfo.deviceId = user.phone
        }
      }
      
      // 获取设备型号
      try {
        const deviceData = systemInfo.getDeviceInfo()
        if (deviceData && deviceData.model) {
          deviceInfo.deviceModel = deviceData.model
        } else {
          // 兼容旧版本API
          const systemData = wx.getSystemInfoSync()
          if (systemData && systemData.model) {
            deviceInfo.deviceModel = systemData.model
          }
        }
      } catch (e) {
        console.warn('[getDeviceInfo] 获取设备型号失败:', e)
      }
    } catch (error) {
      console.error('[getDeviceInfo] 获取设备信息异常:', error)
    }
    
    return deviceInfo
  },

  // 保存文章
  async saveArticle() {
    // 检查登录状态
    const app = getApp()
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/page/my/index'
        })
      }, 1500)
      return
    }
    
    if (!this.validate()) {
      wx.showToast({
        title: '请检查表单',
        icon: 'none'
      })
      return
    }

    // 双重检查：再次验证分类是否被禁止（防止绕过前端验证）
    if (this.isForbiddenCategory(this.data.apiName)) {
      this.setData({ saving: false })
      const errorMsg = this.data.mode === 'create' 
        ? '不允许创建此分类的文章（天气、汇率、翻译分类禁止创建）'
        : '不允许将文章修改为此分类（天气、汇率、翻译分类禁止创建）'
      wx.showToast({
        title: errorMsg,
        icon: 'none',
        duration: 3000
      })
      return
    }

    this.setData({ saving: true })
    
    // 获取设备信息
    const deviceInfo = await this.getDeviceInfo()

    // 确保将占位图片转换为video标签（保存时）
    let htmlContent = this.data.htmlContent.trim()
    htmlContent = this.convertPlaceholderToVideo(htmlContent)
    
    // 移除正文中的图片和视频标签（图片和视频只在上方预览区域显示，不在正文中显示）
    htmlContent = htmlContent.replace(/<img[^>]*>/gi, '')
    htmlContent = htmlContent.replace(/<image[^>]*>/gi, '')
    // 移除视频标签，确保删除的视频不会保留在 htmlContent 中
    htmlContent = htmlContent.replace(/<video[^>]*>.*?<\/video>/gi, '')
    htmlContent = htmlContent.replace(/<video[^>]*\/>/gi, '')
    
    // 将 mediaList 中的图片和视频插入到 HTML 内容中（在文本内容之前）
    // 视频会写入到 htmlContent，但详情页会在顶部轮播区域显示，不在正文中显示
    const mediaHtmlParts = []
    if (this.data.mediaList && Array.isArray(this.data.mediaList) && this.data.mediaList.length > 0) {
      this.data.mediaList.forEach(media => {
        if (media.type === 'image' && media.url) {
          mediaHtmlParts.push(`<img src="${media.url}" alt="" />`)
        } else if (media.type === 'video' && media.url) {
          // 视频需要写入到 htmlContent，以便详情页可以提取并在顶部轮播显示
          const poster = media.poster ? ` poster="${media.poster}"` : ''
          mediaHtmlParts.push(`<video src="${media.url}"${poster} controls></video>`)
        }
      })
    }
    
    // 将媒体内容插入到HTML内容之前
    if (mediaHtmlParts.length > 0) {
      htmlContent = mediaHtmlParts.join('\n') + '\n' + htmlContent
    }
    
    // 从最终HTML内容中提取第一张图片作为封面
    let coverImage = this.extractFirstImage(htmlContent)

    const data = {
      name: this.data.name.trim(),
      apiName: this.data.apiName.trim(),
      htmlContent: htmlContent,
      published: true,
      // 添加新字段
      nickname: deviceInfo.nickname || null,
      deviceModel: deviceInfo.deviceModel || null,
      deviceId: deviceInfo.deviceId || null,
      deviceIp: deviceInfo.deviceIp || null // 不提供，由服务器自动获取
    }

    if (coverImage) {
      data.image = coverImage.trim()
    }
    
    // 处理手机号和定位信息（所有分类都支持）
    // 按照API规范：phone和address是字符串，latitude和longitude是数字（浮点数）
    
    // 手机号：字符串类型，如果为空则传null删除
    if (this.data.phone && this.data.phone.trim()) {
      data.phone = this.data.phone.trim()
    } else {
      // 如果手机号为空，传null删除字段（或传空字符串，API会删除）
      data.phone = null
    }
    
    // 地址：字符串类型，如果为空则传null删除
    if (this.data.address && this.data.address.trim()) {
      data.address = this.data.address.trim()
    } else {
      // 如果地址为空，传null删除字段
      data.address = null
    }
    
    // 纬度：数字类型（浮点数），如果无效则传null删除
    if (this.data.latitude !== null && this.data.latitude !== undefined) {
      const lat = parseFloat(this.data.latitude)
      if (!isNaN(lat) && lat >= -90 && lat <= 90) {
        data.latitude = lat
      } else {
        // 无效的纬度值，传null删除
        data.latitude = null
      }
    } else {
      // 没有纬度值，传null删除
      data.latitude = null
    }
    
    // 经度：数字类型（浮点数），如果无效则传null删除
    if (this.data.longitude !== null && this.data.longitude !== undefined) {
      const lng = parseFloat(this.data.longitude)
      if (!isNaN(lng) && lng >= -180 && lng <= 180) {
        data.longitude = lng
      } else {
        // 无效的经度值，传null删除
        data.longitude = null
      }
    } else {
      // 没有经度值，传null删除
      data.longitude = null
    }
    
    // 处理价格、房间数、面积字段（根据分类）
    const isSecondHand = this.isSecondHandCategory(this.data.apiName)
    const isRental = this.isRentalCategory(this.data.apiName)
    
    // 价格：二手市场和租房酒店都支持
    if (isSecondHand || isRental) {
      if (this.data.price && this.data.price.trim()) {
        // 尝试转换为数字，如果失败则使用字符串
        const priceNum = parseFloat(this.data.price.trim())
        data.price = !isNaN(priceNum) ? priceNum : this.data.price.trim()
      } else {
        data.price = null
      }
    }
    
    // 房间数和面积：仅租房酒店支持
    if (isRental) {
      // 房间数
      if (this.data.rooms && this.data.rooms.trim()) {
        const roomsNum = parseFloat(this.data.rooms.trim())
        data.rooms = !isNaN(roomsNum) ? roomsNum : this.data.rooms.trim()
      } else {
        data.rooms = null
      }
      
      // 面积
      if (this.data.area && this.data.area.trim()) {
        const areaNum = parseFloat(this.data.area.trim())
        data.area = !isNaN(areaNum) ? areaNum : this.data.area.trim()
      } else {
        data.area = null
      }
    }

    try {
      let result
      if (this.data.mode === 'create') {
        result = await blogApi.articleApi.create(data)
      } else {
        result = await blogApi.articleApi.update(this.data.articleId, data)
      }

      wx.showToast({
        title: this.data.mode === 'create' ? '发布成功' : '更新成功',
        icon: 'success'
      })

      // 设置需要刷新的标志，让返回的页面自动刷新
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        // 检查是否是发现页面或文章管理页面
        const route = prevPage.route || ''
        if (route === 'page/article-admin/index' || route === 'page/discover/index') {
        prevPage._needRefresh = true
          console.log('[saveArticle] 已设置刷新标志，页面返回后将自动刷新')
        }
      }

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      this.setData({ saving: false })
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 取消
  cancel() {
    wx.navigateBack()
  },

  // 存草稿
  async saveDraft() {
    // 检查登录状态
    const app = getApp()
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 如果正在保存，防止重复点击
    if (this.data.saving) {
      return
    }

    this.setData({ saving: true })

    try {
      // 获取设备信息
      const deviceInfo = await this.getDeviceInfo()

      // 确保将占位图片转换为video标签（保存时）
      let htmlContent = this.data.htmlContent.trim()
      htmlContent = this.convertPlaceholderToVideo(htmlContent)
      
      // 移除正文中的图片和视频标签（图片和视频只在上方预览区域显示，不在正文中显示）
      htmlContent = htmlContent.replace(/<img[^>]*>/gi, '')
      htmlContent = htmlContent.replace(/<image[^>]*>/gi, '')
      // 移除视频标签，确保删除的视频不会保留在 htmlContent 中
      htmlContent = htmlContent.replace(/<video[^>]*>.*?<\/video>/gi, '')
      htmlContent = htmlContent.replace(/<video[^>]*\/>/gi, '')
      
      // 将 mediaList 中的图片和视频插入到 HTML 内容中（在文本内容之前）
      // 视频会写入到 htmlContent，但详情页会在顶部轮播区域显示，不在正文中显示
      const mediaHtmlParts = []
      if (this.data.mediaList && Array.isArray(this.data.mediaList) && this.data.mediaList.length > 0) {
        this.data.mediaList.forEach(media => {
          if (media.type === 'image' && media.url) {
            mediaHtmlParts.push(`<img src="${media.url}" alt="" />`)
          } else if (media.type === 'video' && media.url) {
            // 视频需要写入到 htmlContent，以便详情页可以提取并在顶部轮播显示
            const poster = media.poster ? ` poster="${media.poster}"` : ''
            mediaHtmlParts.push(`<video src="${media.url}"${poster} controls></video>`)
          }
        })
      }
      
      // 将媒体内容插入到HTML内容之前
      if (mediaHtmlParts.length > 0) {
        htmlContent = mediaHtmlParts.join('\n') + '\n' + htmlContent
      }
      
      // 从最终HTML内容中提取第一张图片作为封面
      let coverImage = this.extractFirstImage(htmlContent)

      const data = {
        name: this.data.name.trim() || '未命名草稿',
        apiName: this.data.apiName.trim() || 'discover',
        htmlContent: htmlContent,
        published: false, // 存草稿时设置为 false
        // 添加新字段
        nickname: deviceInfo.nickname || null,
        deviceModel: deviceInfo.deviceModel || null,
        deviceId: deviceInfo.deviceId || null,
        deviceIp: deviceInfo.deviceIp || null
      }

      if (coverImage) {
        data.image = coverImage.trim()
      }
      
      // 处理手机号和定位信息
      if (this.data.phone && this.data.phone.trim()) {
        data.phone = this.data.phone.trim()
      } else {
        data.phone = null
      }
      
      if (this.data.address && this.data.address.trim()) {
        data.address = this.data.address.trim()
      } else {
        data.address = null
      }
      
      // 纬度
      if (this.data.latitude !== null && this.data.latitude !== undefined) {
        const lat = parseFloat(this.data.latitude)
        if (!isNaN(lat) && lat >= -90 && lat <= 90) {
          data.latitude = lat
        } else {
          data.latitude = null
        }
      } else {
        data.latitude = null
      }
      
      // 经度
      if (this.data.longitude !== null && this.data.longitude !== undefined) {
        const lng = parseFloat(this.data.longitude)
        if (!isNaN(lng) && lng >= -180 && lng <= 180) {
          data.longitude = lng
        } else {
          data.longitude = null
        }
      } else {
        data.longitude = null
      }
      
      // 处理价格、房间数、面积字段（根据分类）
      const isSecondHand = this.isSecondHandCategory(this.data.apiName)
      const isRental = this.isRentalCategory(this.data.apiName)
      
      // 价格：二手市场和租房酒店都支持
      if (isSecondHand || isRental) {
        if (this.data.price && this.data.price.trim()) {
          const priceNum = parseFloat(this.data.price.trim())
          data.price = !isNaN(priceNum) ? priceNum : this.data.price.trim()
        } else {
          data.price = null
        }
      }
      
      // 房间数和面积：仅租房酒店支持
      if (isRental) {
        // 房间数
        if (this.data.rooms && this.data.rooms.trim()) {
          const roomsNum = parseFloat(this.data.rooms.trim())
          data.rooms = !isNaN(roomsNum) ? roomsNum : this.data.rooms.trim()
        } else {
          data.rooms = null
        }
        
        // 面积
        if (this.data.area && this.data.area.trim()) {
          const areaNum = parseFloat(this.data.area.trim())
          data.area = !isNaN(areaNum) ? areaNum : this.data.area.trim()
        } else {
          data.area = null
        }
      }

      // 发送请求到服务器保存草稿
      let result
      if (this.data.mode === 'create') {
        result = await blogApi.articleApi.create(data)
      } else {
        result = await blogApi.articleApi.update(this.data.articleId, data)
      }

      // 保存到本地存储（作为备份）
    const draftData = {
      name: this.data.name,
      apiName: this.data.apiName,
      htmlContent: this.data.htmlContent,
      image: this.data.image,
      phone: this.data.phone,
      address: this.data.address,
      latitude: this.data.latitude,
      longitude: this.data.longitude,
      price: this.data.price,
      rooms: this.data.rooms,
      area: this.data.area,
      mediaList: this.data.mediaList,
      timestamp: Date.now()
    }

    try {
      wx.setStorageSync('article_draft', draftData)
      } catch (storageError) {
        console.warn('[saveDraft] 本地存储保存失败:', storageError)
      }

      // 如果是编辑模式，更新 articleId（如果是新创建的）
      if (this.data.mode === 'create' && result && result.data && result.data.id) {
        this.setData({
          articleId: result.data.id,
          mode: 'edit'
        })
      }

      // 设置需要刷新的标志
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        const route = prevPage.route || ''
        if (route === 'page/article-admin/index' || route === 'page/discover/index') {
          prevPage._needRefresh = true
          console.log('[saveDraft] 已设置刷新标志，页面返回后将自动刷新')
        }
      }

      wx.showToast({
        title: '草稿已保存',
        icon: 'success',
        duration: 1500
      })

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (error) {
      console.error('[saveDraft] 保存草稿失败:', error)
      wx.showToast({
        title: error.message || '保存失败',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ saving: false })
    }
  }
})
