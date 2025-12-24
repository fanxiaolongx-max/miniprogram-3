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
    parsedContent: [], // 解析后的内容节点数组 [{type: 'text'|'image'|'video'|'link', ...}]
    apiUrl: '',
    loading: false,
    error: false,
    links: [], // 存储从文章中提取的链接（保留用于底部显示，可选）
    images: [], // 存储从文章中提取的图片（保留用于底部显示，可选）
    videos: [], // 存储从文章中提取的视频（保留用于底部显示，可选）
    location: null, // 存储地址信息 { name, address, latitude, longitude }
    mapMarkers: [] // 地图标记点
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
      
      // 提取文章中的图片（保留用于底部显示，可选）
      const images = this.extractImages(htmlContent)
      
      // 提取文章中的视频（保留用于底部显示，可选）
      const videos = this.extractVideos(htmlContent)
      
      // 提取文章中的链接（保留用于底部显示，可选）
      const links = this.extractLinks(htmlContent)
      
      // 解析HTML为节点数组（用于内联显示）
      const parsedContent = this.parseHtmlToNodes(htmlContent)
      
      // 处理HTML内容，使图片自适应屏幕宽度，并移除视频标签（rich-text不支持，用于向后兼容）
      const processedContent = this.processHtmlContent(htmlContent)
      
      // 注意：直接传递 htmlContent 时，无法获取地址信息，因为地址信息在 JSON 返回中
      // 如果需要支持地址，需要通过 options 传递地址参数
      const locationData = options.latitude && options.longitude ? {
        name: title || '位置',
        address: options.address || '',
        latitude: parseFloat(options.latitude),
        longitude: parseFloat(options.longitude)
      } : null

      // 如果有地址信息，生成地图标记点
      const mapMarkers = locationData ? [{
        id: 1,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        title: locationData.name || '位置',
        callout: {
          content: locationData.name || '位置',
          color: '#333',
          fontSize: 14,
          borderRadius: 4,
          bgColor: '#fff',
          padding: 8,
          display: 'ALWAYS'
        }
      }] : []
      
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
        parsedContent: parsedContent, // 解析后的节点数组
        links: links,
        images: images,
        videos: videos,
        location: locationData,
        mapMarkers: mapMarkers,
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
        
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
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
        let locationData = null // 存储地址信息

        // 格式0: 数组格式 [{ content: "HTML内容", title: "标题" }] - 取第一个元素
        if (Array.isArray(res.data) && res.data.length > 0) {
          const firstItem = res.data[0]
          content = firstItem.content || firstItem.html || firstItem.htmlContent || ''
          title = firstItem.title || firstItem.name || ''
          meta = firstItem.meta || firstItem.date || firstItem.updatedAt || ''
          locationData = this.extractLocation(firstItem)
        }
        // 格式1: { content: "HTML内容", title: "标题" }
        else if (res.data.content || res.data.html || res.data.htmlContent) {
          content = res.data.content || res.data.html || res.data.htmlContent || ''
          title = res.data.title || ''
          meta = res.data.meta || res.data.date || res.data.updatedAt || ''
          locationData = this.extractLocation(res.data)
        }
        // 格式2: { data: { content: "HTML内容", title: "标题" } }
        else if (res.data.data) {
          // 如果 data 是数组，取第一个元素
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            const firstItem = res.data.data[0]
            content = firstItem.content || firstItem.html || firstItem.htmlContent || ''
            title = firstItem.title || firstItem.name || ''
            meta = firstItem.meta || firstItem.date || firstItem.updatedAt || ''
            locationData = this.extractLocation(firstItem)
          } else if (typeof res.data.data === 'object') {
            content = res.data.data.content || res.data.data.html || res.data.data.htmlContent || ''
            title = res.data.data.title || ''
            meta = res.data.data.meta || res.data.data.date || res.data.data.updatedAt || ''
            locationData = this.extractLocation(res.data.data)
          }
        }
        // 格式3: { html: "HTML内容", title: "标题" } 或 { htmlContent: "HTML内容", title: "标题" }
        else if (res.data.html || res.data.htmlContent) {
          content = res.data.html || res.data.htmlContent || ''
          title = res.data.title || ''
          meta = res.data.meta || res.data.date || res.data.updatedAt || ''
          locationData = this.extractLocation(res.data)
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

        // 提取文章中的图片（在处理内容之前提取，确保图片URL完整，保留用于底部显示，可选）
        const images = this.extractImages(content)
        
        // 提取文章中的视频（在处理内容之前提取，确保视频URL完整，保留用于底部显示，可选）
        const videos = this.extractVideos(content)
        
        // 提取文章中的链接（在处理内容之前提取，确保链接完整，保留用于底部显示，可选）
        const links = this.extractLinks(content)

        // 解析HTML为节点数组（用于内联显示）
        const parsedContent = this.parseHtmlToNodes(content)

        // 处理HTML内容，使图片自适应屏幕宽度，并移除视频标签（rich-text不支持，用于向后兼容）
        content = this.processHtmlContent(content)

        // 设置导航栏标题
        if (title) {
          wx.setNavigationBarTitle({
            title: title
          })
        }

        // 如果有地址信息，生成地图标记点
        const mapMarkers = locationData ? [{
          id: 1,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          title: locationData.name || '位置',
          callout: {
            content: locationData.name || '位置',
            color: '#333',
            fontSize: 14,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'ALWAYS'
          }
        }] : []

        this.setData({
          title: title,
          meta: meta,
          content: content,
          parsedContent: parsedContent, // 解析后的节点数组
          links: links,
          images: images,
          videos: videos,
          location: locationData,
          mapMarkers: mapMarkers,
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
   * 验证URL是否是图片格式
   * @param {string} url - URL字符串
   * @returns {boolean} 是否是图片URL
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return false
    }
    
    // 常见的图片格式扩展名
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico']
    // 常见的视频格式扩展名（需要排除）
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.f4v', '.m3u8']
    
    const lowerUrl = url.toLowerCase()
    
    // 先检查是否是视频格式，如果是则返回false
    for (const ext of videoExtensions) {
      if (lowerUrl.includes(ext)) {
        return false
      }
    }
    
    // 检查是否是图片格式
    for (const ext of imageExtensions) {
      if (lowerUrl.includes(ext)) {
        return true
      }
    }
    
    // 如果没有明确的扩展名，但URL包含图片相关的路径，也认为是图片
    // 例如：/uploads/images/xxx 或 /image/xxx
    if (lowerUrl.includes('/image') || lowerUrl.includes('/img') || lowerUrl.includes('/photo') || lowerUrl.includes('/picture')) {
      return true
    }
    
    // 默认情况下，如果没有明确的视频扩展名，也允许（可能是动态生成的图片）
    return true
  },

  /**
   * 解析HTML内容为节点数组，将图片、视频、链接提取为独立节点
   * @param {string} html - 原始HTML内容
   * @returns {Array} 节点数组 [{type: 'text'|'image'|'video'|'link', ...}]
   */
  parseHtmlToNodes(html) {
    if (!html || typeof html !== 'string') {
      return [{ type: 'text', content: '' }]
    }

    try {
      const nodes = []
      let lastIndex = 0
      let htmlCopy = html

      // 获取屏幕宽度用于图片样式
      const systemInfo = wx.getSystemInfoSync()
      const screenWidth = systemInfo.windowWidth || 375
      const maxWidth = screenWidth - 40

      // 1. 提取并替换视频（优先级最高，因为视频标签可能包含其他标签）
      const videoBlockRegex = /<video([^>]*)>([\s\S]*?)<\/video>/gi
      const videoSelfClosingRegex = /<video([^>]*)\/>/gi
      const iframeRegex = /<iframe([^>]*)>.*?<\/iframe>/gi
      
      const videoPlaceholders = []
      let videoIndex = 0

      // 处理 <video>...</video> 块
      htmlCopy = htmlCopy.replace(videoBlockRegex, (match, attributes, content) => {
        let src = null
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          src = srcMatch[1].trim()
        } else if (content) {
          const sourceMatch = content.match(/<source([^>]*)>/i)
          if (sourceMatch) {
            const sourceSrcMatch = sourceMatch[1].match(/src\s*=\s*["']([^"']+)["']/i)
            if (sourceSrcMatch) {
              src = sourceSrcMatch[1].trim()
            }
          }
        }

        let poster = null
        const posterMatch = attributes.match(/poster\s*=\s*["']([^"']+)["']/i)
        if (posterMatch) {
          const posterValue = posterMatch[1].trim()
          // 验证poster是否是有效的网络URL且是图片格式（不能是视频格式）
          if (posterValue && 
              (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
              this.isValidImageUrl(posterValue)) {
            poster = posterValue
          } else {
            console.warn('[parseHtmlToNodes] 忽略无效的poster URL（不是图片格式）:', posterValue)
          }
        }

        if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//'))) {
          const placeholder = `__VIDEO_PLACEHOLDER_${videoIndex}__`
          videoPlaceholders.push({ placeholder, src, poster })
          videoIndex++
          return placeholder
        }
        return ''
      })

      // 处理自闭合的 <video />
      htmlCopy = htmlCopy.replace(videoSelfClosingRegex, (match, attributes) => {
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          const src = srcMatch[1].trim()
          if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//'))) {
            let poster = null
            const posterMatch = attributes.match(/poster\s*=\s*["']([^"']+)["']/i)
            if (posterMatch) {
              const posterValue = posterMatch[1].trim()
              // 验证poster是否是有效的网络URL且是图片格式（不能是视频格式）
              if (posterValue && 
                  (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
                  this.isValidImageUrl(posterValue)) {
                poster = posterValue
              } else {
                console.warn('[parseHtmlToNodes] 忽略无效的poster URL（不是图片格式）:', posterValue)
              }
            }
            const placeholder = `__VIDEO_PLACEHOLDER_${videoIndex}__`
            videoPlaceholders.push({ placeholder, src, poster })
            videoIndex++
            return placeholder
          }
        }
        return ''
      })

      // 处理 <iframe> 中的视频
      htmlCopy = htmlCopy.replace(iframeRegex, (match, attributes) => {
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          const iframeSrc = srcMatch[1].trim()
          if (iframeSrc && (iframeSrc.includes('youtube.com') || 
                           iframeSrc.includes('youtu.be') ||
                           iframeSrc.includes('bilibili.com') ||
                           iframeSrc.includes('vimeo.com') ||
                           iframeSrc.includes('youku.com') ||
                           iframeSrc.includes('iqiyi.com') ||
                           iframeSrc.includes('qq.com/video'))) {
            const placeholder = `__VIDEO_PLACEHOLDER_${videoIndex}__`
            videoPlaceholders.push({ placeholder, src: iframeSrc, poster: null })
            videoIndex++
            return placeholder
          }
        }
        return ''
      })

      // 2. 提取并替换图片
      const imgRegex = /<img([^>]*)>/gi
      const imageRegex = /<image([^>]*)>/gi
      const imagePlaceholders = []
      let imageIndex = 0

      htmlCopy = htmlCopy.replace(imgRegex, (match, attributes) => {
        let url = null
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }

        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
          const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
          imagePlaceholders.push({ placeholder, url })
          imageIndex++
          return placeholder
        }
        return ''
      })

      htmlCopy = htmlCopy.replace(imageRegex, (match, attributes) => {
        let url = null
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }

        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
          const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
          imagePlaceholders.push({ placeholder, url })
          imageIndex++
          return placeholder
        }
        return ''
      })

      // 3. 提取并替换链接
      const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
      const linkPlaceholders = []
      let linkIndex = 0

      htmlCopy = htmlCopy.replace(linkRegex, (match, url, text) => {
        const cleanUrl = url.trim()
        const cleanText = text.replace(/<[^>]+>/g, '').trim() || cleanUrl

        if (cleanUrl && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
          const placeholder = `__LINK_PLACEHOLDER_${linkIndex}__`
          linkPlaceholders.push({ placeholder, url: cleanUrl, text: cleanText })
          linkIndex++
          return placeholder
        }
        return match
      })

      // 4. 分割文本并插入媒体节点
      const parts = htmlCopy.split(/(__(?:IMAGE|VIDEO|LINK)_PLACEHOLDER_\d+__)/g)

      parts.forEach(part => {
        if (part.startsWith('__IMAGE_PLACEHOLDER_')) {
          const index = parseInt(part.match(/\d+/)[0])
          const imageData = imagePlaceholders[index]
          if (imageData) {
            nodes.push({
              type: 'image',
              url: imageData.url
            })
          }
        } else if (part.startsWith('__VIDEO_PLACEHOLDER_')) {
          const index = parseInt(part.match(/\d+/)[0])
          const videoData = videoPlaceholders[index]
          if (videoData) {
            nodes.push({
              type: 'video',
              src: videoData.src,
              poster: videoData.poster || null
            })
          }
        } else if (part.startsWith('__LINK_PLACEHOLDER_')) {
          const index = parseInt(part.match(/\d+/)[0])
          const linkData = linkPlaceholders[index]
          if (linkData) {
            nodes.push({
              type: 'link',
              url: linkData.url,
              text: linkData.text
            })
          }
        } else if (part.trim()) {
          // 文本节点，处理图片样式
          let textContent = part
          // 处理剩余的图片标签，添加样式
          textContent = textContent.replace(/<img([^>]*)>/gi, (match, attributes) => {
            const hasStyle = /style\s*=/i.test(attributes)
            if (!hasStyle) {
              const styleAttr = `style="max-width: ${maxWidth}px; width: 100%; height: auto; display: block;"`
              return `<img${attributes} ${styleAttr}>`
            }
            return match
          })
          nodes.push({
            type: 'text',
            content: textContent
          })
        }
      })

      // 如果没有节点，至少返回一个空文本节点
      if (nodes.length === 0) {
        nodes.push({ type: 'text', content: '' })
      }

      console.log('[parseHtmlToNodes] 解析完成，节点数量:', nodes.length)
      return nodes
    } catch (err) {
      console.error('[parseHtmlToNodes] 解析HTML时出错:', err)
      return [{ type: 'text', content: html }]
    }
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

      // 移除 <video> 标签（rich-text 不支持 video，我们会在单独的区域显示）
      processedHtml = processedHtml.replace(/<video[^>]*>.*?<\/video>/gi, '')
      processedHtml = processedHtml.replace(/<video[^>]*\/>/gi, '')
      
      // 移除 <iframe> 标签中的视频（如 YouTube、Bilibili 等）
      // 注意：iframe 中的视频链接会在 extractVideos 中处理
      processedHtml = processedHtml.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')

      console.log('[processHtmlContent] HTML内容已处理，图片已添加自适应样式，视频标签已移除')
      return processedHtml
    } catch (err) {
      console.error('[processHtmlContent] 处理HTML内容时出错:', err)
      // 出错时返回原始内容
      return html
    }
  },

  /**
   * 从数据对象中提取地址信息
   * @param {Object} data - 数据对象
   * @returns {Object|null} 地址信息对象 { name, address, latitude, longitude } 或 null
   */
  extractLocation(data) {
    if (!data || typeof data !== 'object') {
      return null
    }

    try {
      // 支持多种字段名：latitude/lat, longitude/lng/lon, address/location, name/title
      const latitude = parseFloat(data.latitude || data.lat || 0)
      const longitude = parseFloat(data.longitude || data.lng || data.lon || 0)
      const address = data.address || data.location || ''
      const name = data.name || data.title || '位置'

      // 必须有有效的经纬度才返回地址信息
      if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        return {
          name: name,
          address: address,
          latitude: latitude,
          longitude: longitude
        }
      }

      return null
    } catch (err) {
      console.error('[extractLocation] 提取地址信息时出错:', err)
      return null
    }
  },

  /**
   * 从HTML内容中提取所有图片
   * @param {string} html - HTML内容
   * @returns {Array} 图片URL数组（优先使用原图URL）
   */
  extractImages(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const images = []
      // 匹配 <img> 标签，优先提取 data-original（原图），否则使用 src
      const imgRegex = /<img([^>]*)>/gi
      
      let match
      const seenUrls = new Set() // 用于去重
      
      while ((match = imgRegex.exec(html)) !== null) {
        const attributes = match[1]
        
        // 优先查找 data-original（原图URL）
        let url = null
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          // 如果没有 data-original，使用 src
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }
        
        // 只添加有效的图片URL，并去重
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) && !seenUrls.has(url)) {
          seenUrls.add(url)
          images.push(url)
        }
      }

      // 也匹配 <image> 标签（小程序可能使用的标签）
      const imageRegex = /<image([^>]*)>/gi
      while ((match = imageRegex.exec(html)) !== null) {
        const attributes = match[1]
        let url = null
        
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }
        
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url)
          images.push(url)
        }
      }

      console.log('[extractImages] 提取到图片数量:', images.length)
      return images
    } catch (err) {
      console.error('[extractImages] 提取图片时出错:', err)
      return []
    }
  },

  /**
   * 从HTML内容中提取所有链接
   * @param {string} html - HTML内容
   * @returns {Array} 链接数组，每个元素包含 url 和 text
   */
  extractLinks(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const links = []
      // 匹配 <a> 标签，提取 href 和文本内容
      // 匹配格式：<a href="url">text</a> 或 <a href='url'>text</a>
      const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
      
      let match
      const seenUrls = new Set() // 用于去重
      
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1].trim()
        const text = match[2].replace(/<[^>]+>/g, '').trim() || url // 移除HTML标签，如果没有文本则使用URL
        
        // 只添加有效的HTTP/HTTPS链接，并去重
        if (url && (url.startsWith('http://') || url.startsWith('https://')) && !seenUrls.has(url)) {
          seenUrls.add(url)
          links.push({
            url: url,
            text: text || url
          })
        }
      }

      console.log('[extractLinks] 提取到链接数量:', links.length)
      return links
    } catch (err) {
      console.error('[extractLinks] 提取链接时出错:', err)
      return []
    }
  },

  /**
   * 从HTML内容中提取所有视频
   * @param {string} html - HTML内容
   * @returns {Array} 视频数组，每个元素包含 { src, poster }
   */
  extractVideos(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const videos = []
      const seenUrls = new Set() // 用于去重
      
      // 匹配完整的 <video>...</video> 块（包括嵌套的 <source>）
      // 格式1: <video src="url" poster="posterUrl">...</video>
      // 格式2: <video poster="posterUrl"><source src="url" /></video>
      const videoBlockRegex = /<video([^>]*)>([\s\S]*?)<\/video>/gi
      
      let match
      while ((match = videoBlockRegex.exec(html)) !== null) {
        const videoAttributes = match[1]
        const videoContent = match[2] || '' // video 标签内的内容
        
        // 先尝试从 <video> 标签的 src 属性中提取
        let src = null
        const videoSrcMatch = videoAttributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (videoSrcMatch) {
          src = videoSrcMatch[1].trim()
        }
        
        // 如果没有找到 src，尝试从嵌套的 <source> 标签中提取
        if (!src && videoContent) {
          const sourceRegex = /<source([^>]*)>/gi
          let sourceMatch
          while ((sourceMatch = sourceRegex.exec(videoContent)) !== null) {
            const sourceAttributes = sourceMatch[1]
            const sourceSrcMatch = sourceAttributes.match(/src\s*=\s*["']([^"']+)["']/i)
            if (sourceSrcMatch) {
              src = sourceSrcMatch[1].trim()
              break // 使用第一个找到的 source src
            }
          }
        }
        
        // 提取 poster 属性（封面图）
        let poster = null
        const posterMatch = videoAttributes.match(/poster\s*=\s*["']([^"']+)["']/i)
        if (posterMatch) {
          const posterValue = posterMatch[1].trim()
          // 验证 poster 是否是有效的网络 URL 且是图片格式（不能是视频格式）
          if (posterValue && 
              (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
              this.isValidImageUrl(posterValue)) {
            poster = posterValue
          } else {
            console.warn('[extractVideos] 忽略无效的poster URL（不是图片格式）:', posterValue)
          }
        }
        
        // 只添加有效的视频URL，并去重
        if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) && !seenUrls.has(src)) {
          seenUrls.add(src)
          // 只有当 poster 是有效的网络 URL 时才设置 poster 字段
          const videoItem = { src: src }
          if (poster) {
            videoItem.poster = poster
          }
          videos.push(videoItem)
        }
      }
      
      // 也匹配自闭合的 <video /> 标签（向后兼容）
      const videoSelfClosingRegex = /<video([^>]*)\/>/gi
      while ((match = videoSelfClosingRegex.exec(html)) !== null) {
        const attributes = match[1]
        
        let src = null
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          src = srcMatch[1].trim()
        }
        
        let poster = null
        const posterMatch = attributes.match(/poster\s*=\s*["']([^"']+)["']/i)
        if (posterMatch) {
          const posterValue = posterMatch[1].trim()
          // 验证 poster 是否是有效的网络 URL 且是图片格式（不能是视频格式）
          if (posterValue && 
              (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
              this.isValidImageUrl(posterValue)) {
            poster = posterValue
          } else {
            console.warn('[extractVideos] 忽略无效的poster URL（不是图片格式）:', posterValue)
          }
        }
        
        if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) && !seenUrls.has(src)) {
          seenUrls.add(src)
          // 只有当 poster 是有效的网络 URL 时才设置 poster 字段
          const videoItem = { src: src }
          if (poster) {
            videoItem.poster = poster
          }
          videos.push(videoItem)
        }
      }
      
      // 匹配 <iframe> 标签中的视频（如 YouTube、Bilibili 等）
      // 格式：<iframe src="https://www.youtube.com/embed/xxx"></iframe>
      const iframeRegex = /<iframe([^>]*)>/gi
      while ((match = iframeRegex.exec(html)) !== null) {
        const attributes = match[1]
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          const iframeSrc = srcMatch[1].trim()
          // 检查是否是视频平台的嵌入链接
          if (iframeSrc && (iframeSrc.includes('youtube.com') || 
                           iframeSrc.includes('youtu.be') ||
                           iframeSrc.includes('bilibili.com') ||
                           iframeSrc.includes('vimeo.com') ||
                           iframeSrc.includes('youku.com') ||
                           iframeSrc.includes('iqiyi.com') ||
                           iframeSrc.includes('qq.com/video'))) {
            if (!seenUrls.has(iframeSrc)) {
              seenUrls.add(iframeSrc)
              videos.push({
                src: iframeSrc,
                poster: ''
              })
            }
          }
        }
      }

      console.log('[extractVideos] 提取到视频数量:', videos.length)
      return videos
    } catch (err) {
      console.error('[extractVideos] 提取视频时出错:', err)
      return []
    }
  },

  /**
   * 复制链接到剪贴板
   * @param {Object} e - 事件对象
   */
  copyLink(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      return
    }

    wx.setClipboardData({
      data: url,
      success: () => {
        // 先显示第一行提示
        wx.showToast({
          title: '链接已复制',
          icon: 'success',
          duration: 1500
        })
        
        // 延迟显示第二行提示
        setTimeout(() => {
          wx.showToast({
            title: '请粘贴到浏览器打开',
            icon: 'none',
            duration: 2000
          })
        }, 1600)
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 将缩略图 URL 转换为原图 URL
   * @param {string} url - 图片 URL
   * @returns {string} 原图 URL
   */
  getOriginalImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return url
    }
    
    try {
      let originalUrl = url
      
      // 如果 URL 已经包含明确的原图标识，直接返回
      if (originalUrl.includes('/original/') || originalUrl.includes('/full/')) {
        return originalUrl
      }
      
      // 移除常见的缩略图查询参数
      // 例如: ?w=100, ?h=100, ?size=small, ?thumbnail=true 等
      const thumbnailParams = [
        /[?&]w=\d+/gi,
        /[?&]h=\d+/gi,
        /[?&]width=\d+/gi,
        /[?&]height=\d+/gi,
        /[?&]size=(small|medium|thumb|thumbnail)/gi,
        /[?&]thumbnail=(true|1)/gi,
        /[?&]thumb=(true|1)/gi,
        /[?&]format=(thumb|thumbnail)/gi,
        /[?&]quality=\d+/gi, // 移除质量参数，可能限制图片大小
        /[?&]compress=(true|1)/gi
      ]
      
      thumbnailParams.forEach(param => {
        originalUrl = originalUrl.replace(param, '')
      })
      
      // 移除路径中的缩略图相关路径段
      // 例如: /thumbnail/, /thumb/, /small/, /medium/ 等
      const thumbnailPaths = [
        /\/thumbnail\//gi,
        /\/thumb\//gi,
        /\/small\//gi,
        /\/medium\//gi,
        /\/preview\//gi,
        /\/resized\//gi
      ]
      
      thumbnailPaths.forEach(path => {
        originalUrl = originalUrl.replace(path, '/')
      })
      
      // 移除文件名中的缩略图后缀
      // 例如: image_thumb.jpg -> image.jpg, image-small.jpg -> image.jpg
      originalUrl = originalUrl.replace(/_thumb(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/-thumb(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/_small(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/-small(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/_medium(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/-medium(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      
      // 如果 URL 包含 resize 或 crop 参数，尝试移除
      originalUrl = originalUrl.replace(/[?&]resize=\d+[xX]\d+/gi, '')
      originalUrl = originalUrl.replace(/[?&]crop=\d+[xX]\d+/gi, '')
      originalUrl = originalUrl.replace(/[?&]scale=\d+/gi, '')
      
      // 清理 URL 末尾的 & 或 ?
      originalUrl = originalUrl.replace(/[&?]+$/, '')
      
      // 如果处理后的 URL 与原始 URL 不同，记录日志
      if (originalUrl !== url) {
        console.log('[getOriginalImageUrl] 原URL:', url, '-> 处理后:', originalUrl)
      }
      
      return originalUrl
    } catch (err) {
      console.error('[getOriginalImageUrl] 处理URL时出错:', err)
      return url
    }
  },

  /**
   * 预览图片（点击缩略图查看大图）
   * @param {Object} e - 事件对象
   */
  previewImage(e) {
    const currentUrl = e.currentTarget.dataset.url
    const currentIndex = e.currentTarget.dataset.index || 0
    const images = this.data.images || []
    
    if (!currentUrl || images.length === 0) {
      return
    }
    
    // 将所有图片 URL 转换为原图 URL
    const originalImages = images.map(url => this.getOriginalImageUrl(url))
    const currentOriginalUrl = this.getOriginalImageUrl(currentUrl)
    
    console.log('[previewImage] 预览图片，当前索引:', currentIndex, '原图URL:', currentOriginalUrl)
    
    // 使用微信小程序的图片预览功能，使用原图 URL
    wx.previewImage({
      current: currentOriginalUrl, // 当前显示图片的原图URL
      urls: originalImages // 需要预览的图片原图URL列表
    })
  },

  /**
   * 从节点预览图片（内联图片）
   * @param {Object} e - 事件对象
   */
  previewImageFromNode(e) {
    const currentUrl = e.currentTarget.dataset.url
    const nodeIndex = e.currentTarget.dataset.index || 0
    const parsedContent = this.data.parsedContent || []
    
    if (!currentUrl) {
      return
    }
    
    // 从 parsedContent 中提取所有图片 URL
    const imageUrls = []
    let currentImageIndex = 0
    let targetIndex = 0
    
    parsedContent.forEach((node, index) => {
      if (node.type === 'image') {
        imageUrls.push(node.url)
        if (index === nodeIndex) {
          targetIndex = currentImageIndex
        }
        currentImageIndex++
      }
    })
    
    if (imageUrls.length === 0) {
      return
    }
    
    // 将所有图片 URL 转换为原图 URL
    const originalImages = imageUrls.map(url => this.getOriginalImageUrl(url))
    const currentOriginalUrl = this.getOriginalImageUrl(currentUrl)
    
    console.log('[previewImageFromNode] 预览图片，节点索引:', nodeIndex, '图片索引:', targetIndex, '原图URL:', currentOriginalUrl)
    
    // 使用微信小程序的图片预览功能
    wx.previewImage({
      current: currentOriginalUrl,
      urls: originalImages
    })
  },

  /**
   * 从节点保存图片（内联图片）
   * @param {Object} e - 事件对象
   */
  saveImageFromNode(e) {
    const imageUrl = e.currentTarget.dataset.url
    if (!imageUrl) {
      return
    }
    // 复用现有的保存图片逻辑
    this.saveImage({ currentTarget: { dataset: { url: imageUrl } } })
  },

  /**
   * 保存图片到相册
   * @param {Object} e - 事件对象
   */
  saveImage(e) {
    const imageUrl = e.currentTarget.dataset.url
    if (!imageUrl) {
      return
    }

    // 检查授权状态
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          // 已授权，直接保存
          this.downloadAndSaveImage(imageUrl)
        } else if (res.authSetting['scope.writePhotosAlbum'] === false) {
          // 用户之前拒绝了授权，需要引导用户打开设置
          wx.showModal({
            title: '需要授权',
            content: '需要您授权保存图片到相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.writePhotosAlbum']) {
                      this.downloadAndSaveImage(imageUrl)
                    }
                  }
                })
              }
            }
          })
        } else {
          // 未授权，请求授权
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.downloadAndSaveImage(imageUrl)
            },
            fail: () => {
              wx.showToast({
                title: '需要授权才能保存',
                icon: 'none',
                duration: 2000
              })
            }
          })
        }
      }
    })
  },

  /**
   * 下载并保存图片
   * @param {string} imageUrl - 图片URL
   */
  downloadAndSaveImage(imageUrl) {
    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading()
              wx.showToast({
                title: '图片已保存',
                icon: 'success',
                duration: 2000
              })
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('保存图片失败', err)
              wx.showToast({
                title: '保存失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '下载失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载图片失败', err)
        wx.showToast({
          title: '下载失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 打开地图导航
   */
  openLocation() {
    const location = this.data.location
    if (!location) {
      return
    }

    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name || '位置',
      address: location.address || '',
      scale: 18,
      success: () => {
        console.log('打开地图成功')
      },
      fail: (err) => {
        console.error('打开地图失败', err)
        wx.showToast({
          title: '打开地图失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 视频播放错误处理
   * @param {Object} e - 事件对象
   */
  onVideoError(e) {
    const nodeIndex = e.currentTarget.dataset.index || 0
    const parsedContent = this.data.parsedContent || []
    const videos = this.data.videos || []
    
    // 优先从 parsedContent 中获取视频信息（内联渲染）
    let video = null
    if (parsedContent.length > 0 && parsedContent[nodeIndex] && parsedContent[nodeIndex].type === 'video') {
      video = parsedContent[nodeIndex]
    } else if (videos.length > 0) {
      // 向后兼容：从 videos 数组中获取（底部显示）
      video = videos[nodeIndex]
    }
    
    const errorDetail = e.detail || {}
    const errorMsg = errorDetail.errMsg || errorDetail.message || JSON.stringify(errorDetail)
    const videoUrl = video?.src || ''
    
    // ERR_FAILED 通常是网络错误，但如果视频能播放，可能是预加载失败
    // 这种情况在开发工具中很常见，实际播放时能成功
    if (errorMsg.includes('ERR_FAILED') || errorMsg.includes('net::ERR')) {
      // 如果是网络错误，只在控制台记录警告，不显示用户提示
      // 因为视频播放器可能会自动重试，最终可能成功播放
      console.warn('[onVideoError] 视频预加载网络错误（可能不影响播放）:', {
        error: errorMsg,
        videoURL: videoUrl,
        note: '如果视频能正常播放，可以忽略此错误'
      })
      return // 不显示错误提示，让播放器自动重试
    }
    
    console.error('[onVideoError] 视频播放失败:', {
      error: errorDetail,
      errorMsg: errorMsg,
      videoURL: videoUrl,
      nodeIndex: nodeIndex
    })
    
    // 检查视频格式
    const videoExt = videoUrl.split('.').pop()?.toLowerCase()
    
    // 微信小程序支持的视频格式：mp4, m3u8, flv, f4v
    const supportedFormats = ['mp4', 'm3u8', 'flv', 'f4v']
    
    if (videoExt && !supportedFormats.includes(videoExt)) {
      wx.showModal({
        title: '视频格式不支持',
        content: `当前视频格式（${videoExt}）可能不被支持。微信小程序支持 mp4、m3u8 等格式。`,
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      // 只有在非网络错误时才显示提示
      wx.showToast({
        title: '视频加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  }
})
