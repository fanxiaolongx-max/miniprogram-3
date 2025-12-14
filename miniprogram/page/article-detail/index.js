Page({
  onShareAppMessage() {
    // 如果使用 htmlContent，分享时使用标题
    if (this.data.content && !this.data.apiUrl) {
      return {
        title: this.data.title || '详情',
        path: `page/article-detail/index?htmlContent=${encodeURIComponent(this.data.content)}&title=${encodeURIComponent(this.data.title || '')}&meta=${encodeURIComponent(this.data.meta || '')}`
      }
    }
    // 兼容旧的 apiUrl 方式
    return {
      title: this.data.title || '详情',
      path: `page/article-detail/index?apiUrl=${encodeURIComponent(this.data.apiUrl || '')}`
    }
  },

  data: {
    theme: 'light',
    title: '',
    meta: '',
    content: '',
    apiUrl: '',
    loading: false,
    error: false
  },

  onLoad(options) {
    this.setData({
      theme: (() => {
        const systemInfo = require('../../utils/systemInfo.js')
        return systemInfo.getTheme()
      })()
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 优先使用直接传递的 htmlContent
    const htmlContent = options.htmlContent ? decodeURIComponent(options.htmlContent) : ''
    const title = options.title ? decodeURIComponent(options.title) : ''
    const meta = options.meta ? decodeURIComponent(options.meta) : ''
    
    if (htmlContent) {
      // 如果直接提供了 htmlContent，直接使用，不需要请求API
      console.log('[article-detail] 使用直接传递的 htmlContent')
      
      // 处理HTML内容，使图片自适应屏幕宽度
      const processedContent = this.processHtmlContent(htmlContent)
      
      // 设置导航栏标题
      if (title) {
        wx.setNavigationBarTitle({
          title: title
        })
      }
      
      this.setData({
        title: title,
        meta: meta,
        content: processedContent,
        loading: false,
        error: false
      })
      return
    }
    
    // 如果没有 htmlContent，则使用原来的 API 方式（向后兼容）
    const apiUrl = options.apiUrl || ''
    if (!apiUrl) {
      this.showError('缺少参数')
      return
    }

    this.setData({ apiUrl })
    this.fetchArticleDetail()
  },

  // 从API获取文章详情
  fetchArticleDetail() {
    const apiUrl = decodeURIComponent(this.data.apiUrl)
    
    if (!apiUrl) {
      this.showError('API地址无效')
      return
    }

    this.setData({
      loading: true,
      error: false
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取文章详情响应', res)
        
        // 处理API响应数据，自动替换URL（开发环境：bobapro.life -> boba.app）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取文章详情失败', res.statusCode, res.data)
          this.showError('获取内容失败')
          return
        }

        if (!res.data) {
          console.error('获取文章详情失败：返回数据为空')
          this.showError('获取内容失败')
          return
        }

        // 处理不同的返回格式
        let content = ''
        let title = ''
        let meta = ''

        // 格式0: 数组格式 [{ content: "HTML内容", title: "标题" }] - 取第一个元素
        if (Array.isArray(res.data) && res.data.length > 0) {
          const firstItem = res.data[0]
          content = firstItem.content || firstItem.html || ''
          title = firstItem.title || firstItem.name || ''
          meta = firstItem.meta || firstItem.date || ''
        }
        // 格式1: { content: "HTML内容", title: "标题" }
        else if (res.data.content) {
          content = res.data.content
          title = res.data.title || ''
          meta = res.data.meta || res.data.date || ''
        }
        // 格式2: { data: { content: "HTML内容", title: "标题" } }
        else if (res.data.data) {
          // 如果 data 是数组，取第一个元素
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            const firstItem = res.data.data[0]
            content = firstItem.content || firstItem.html || ''
            title = firstItem.title || firstItem.name || ''
            meta = firstItem.meta || firstItem.date || ''
          } else if (typeof res.data.data === 'object') {
            content = res.data.data.content || res.data.data.html || ''
            title = res.data.data.title || ''
            meta = res.data.data.meta || res.data.data.date || ''
          }
        }
        // 格式3: { html: "HTML内容", title: "标题" }
        else if (res.data.html) {
          content = res.data.html
          title = res.data.title || ''
          meta = res.data.meta || res.data.date || ''
        }
        // 格式4: 直接字符串
        else if (typeof res.data === 'string') {
          content = res.data
        }

        if (!content) {
          console.error('获取文章详情失败：内容为空')
          this.showError('内容为空')
          return
        }

        // 处理HTML内容，使图片自适应屏幕宽度
        content = this.processHtmlContent(content)

        // 设置导航栏标题
        if (title) {
          wx.setNavigationBarTitle({
            title: title
          })
        }

        this.setData({
          title: title,
          meta: meta,
          content: content,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取文章详情失败', err)
        this.showError('网络请求失败')
      }
    })
  },

  showError(message) {
    this.setData({
      loading: false,
      error: true,
      content: '',
      title: '',
      meta: ''
    })
    
    wx.showToast({
      title: message || '获取内容失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  retry() {
    this.fetchArticleDetail()
  },

  /**
   * 处理HTML内容，使图片自适应屏幕宽度
   * @param {string} html - 原始HTML内容
   * @returns {string} 处理后的HTML内容
   */
  processHtmlContent(html) {
    if (!html || typeof html !== 'string') {
      return html
    }

    try {
      // 获取屏幕宽度（单位：px）
      const systemInfo = wx.getSystemInfoSync()
      const screenWidth = systemInfo.windowWidth || 375
      // 减去容器左右padding（20px * 2 = 40px）
      const maxWidth = screenWidth - 40
      
      console.log('[processHtmlContent] 屏幕宽度:', screenWidth, '图片最大宽度:', maxWidth)

      // 处理所有 <img> 标签，添加自适应样式
      // 匹配 <img> 标签，包括自闭合标签和带属性的标签
      const imgRegex = /<img([^>]*)>/gi
      
      let processedHtml = html.replace(imgRegex, (match, attributes) => {
        // 检查是否已经有 style 属性
        const hasStyle = /style\s*=/i.test(attributes)
        
        if (hasStyle) {
          // 如果已有 style，在现有样式基础上添加 max-width
          // 提取现有的 style 值
          const styleMatch = attributes.match(/style\s*=\s*["']([^"']*)["']/i)
          if (styleMatch) {
            let existingStyle = styleMatch[1]
            // 检查是否已有 max-width
            if (!/max-width\s*:/i.test(existingStyle)) {
              existingStyle += `; max-width: ${maxWidth}px; width: 100%; height: auto;`
            }
            // 替换 style 属性
            return match.replace(/style\s*=\s*["'][^"']*["']/i, `style="${existingStyle}"`)
          }
        } else {
          // 如果没有 style 属性，添加新的 style 属性
          const styleAttr = `style="max-width: ${maxWidth}px; width: 100%; height: auto; display: block;"`
          return `<img${attributes} ${styleAttr}>`
        }
        
        return match
      })

      // 同时处理可能存在的 <image> 标签（虽然HTML标准是img，但有些内容可能用了image）
      processedHtml = processedHtml.replace(/<image([^>]*)>/gi, (match, attributes) => {
        const hasStyle = /style\s*=/i.test(attributes)
        if (!hasStyle) {
          const styleAttr = `style="max-width: ${maxWidth}px; width: 100%; height: auto; display: block;"`
          return `<image${attributes} ${styleAttr}>`
        }
        return match
      })

      console.log('[processHtmlContent] HTML内容已处理，图片已添加自适应样式')
      return processedHtml
    } catch (err) {
      console.error('[processHtmlContent] 处理HTML内容时出错:', err)
      // 出错时返回原始内容
      return html
    }
  }
})
