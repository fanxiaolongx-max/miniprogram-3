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
    error: false,
    links: [], // 存储从文章中提取的链接
    images: [], // 存储从文章中提取的图片
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
      
      // 提取文章中的图片
      const images = this.extractImages(htmlContent)
      
      // 处理HTML内容，使图片自适应屏幕宽度
      const processedContent = this.processHtmlContent(htmlContent)
      
      // 提取文章中的链接
      const links = this.extractLinks(htmlContent)
      
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
        links: links,
        images: images,
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

        // 提取文章中的图片（在处理内容之前提取，确保图片URL完整）
        const images = this.extractImages(content)
        
        // 提取文章中的链接（在处理内容之前提取，确保链接完整）
        const links = this.extractLinks(content)

        // 处理HTML内容，使图片自适应屏幕宽度
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
          links: links,
          images: images,
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
   * @returns {Array} 图片URL数组
   */
  extractImages(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const images = []
      // 匹配 <img> 标签，提取 src 属性
      const imgRegex = /<img[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi
      
      let match
      const seenUrls = new Set() // 用于去重
      
      while ((match = imgRegex.exec(html)) !== null) {
        const url = match[1].trim()
        
        // 只添加有效的图片URL，并去重
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) && !seenUrls.has(url)) {
          seenUrls.add(url)
          images.push(url)
        }
      }

      // 也匹配 <image> 标签（小程序可能使用的标签）
      const imageRegex = /<image[^>]*src\s*=\s*["']([^"']+)["'][^>]*>/gi
      while ((match = imageRegex.exec(html)) !== null) {
        const url = match[1].trim()
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
  }
})
