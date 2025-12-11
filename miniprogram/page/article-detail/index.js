Page({
  onShareAppMessage() {
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

    // 获取API地址
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

        // 格式1: { content: "HTML内容", title: "标题" }
        if (res.data.content) {
          content = res.data.content
          title = res.data.title || ''
          meta = res.data.meta || res.data.date || ''
        }
        // 格式2: { data: { content: "HTML内容", title: "标题" } }
        else if (res.data.data) {
          content = res.data.data.content || res.data.data.html || ''
          title = res.data.data.title || ''
          meta = res.data.data.meta || res.data.data.date || ''
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
  }
})
