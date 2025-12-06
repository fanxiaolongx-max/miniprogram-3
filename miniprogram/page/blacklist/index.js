Page({
  onShareAppMessage() {
    return {
      title: '防骗预警',
      path: 'page/blacklist/index'
    }
  },

  data: {
    theme: 'light',
    items: [],
    loading: false,
    error: false
  },

  onLoad() {
    this.setData({
      theme: wx.getSystemInfoSync().theme || 'light'
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 加载黑名单数据
    this.fetchBlacklist()
  },

  // 从 API 获取黑名单数据
  fetchBlacklist() {
    const config = require('../../config.js')
    const apiUrl = config.blacklistApi || `${config.apiBaseUrl}/blacklist`
    
    this.setData({
      loading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取防骗预警数据响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取防骗预警数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取防骗预警数据失败：返回数据为空')
          this.showError()
          return
        }

        let items = []
        
        // 处理不同的返回格式
        if (Array.isArray(res.data)) {
          items = res.data
        } else if (res.data.data && Array.isArray(res.data.data)) {
          items = res.data.data
        } else if (res.data.blacklist && Array.isArray(res.data.blacklist)) {
          items = res.data.blacklist
        }

        // 检查是否有有效数据
        if (!Array.isArray(items) || items.length === 0) {
          console.error('获取防骗预警数据失败：返回格式不正确或数据为空')
          this.showError()
          return
        }

        // 标准化数据格式
        items = items.map(item => ({
          id: item.id || item._id || Math.random(),
          title: item.title || item.name || '未知',
          description: item.description || item.desc || '',
          type: item.type || item.category || '',
          date: item.date || item.createdAt || ''
        }))

        this.setData({
          items: items,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取防骗预警数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      items: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchBlacklist()
  },

  // 查看详情
  viewItem(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: item.title,
      content: `${item.type ? `类型：${item.type}\n\n` : ''}${item.description || '暂无详细描述'}${item.date ? `\n\n发布时间：${item.date}` : ''}`,
      showCancel: false,
      confirmText: '知道了',
      confirmColor: '#ff9500'
    })
  }
})

