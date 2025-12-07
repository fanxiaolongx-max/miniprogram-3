Page({
  onShareAppMessage() {
    return {
      title: '签证攻略',
      path: 'page/visa-guide/index'
    }
  },

  data: {
    theme: 'light',
    title: '签证攻略',
    content: '',
    loading: false,
    error: false
  },

  onLoad() {
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

    // 加载签证攻略数据
    this.fetchVisaGuide()
  },

  // 从 API 获取签证攻略数据
  fetchVisaGuide() {
    const config = require('../../config.js')
    const apiUrl = config.visaGuideApi || `${config.apiBaseUrl}/visa-guide`
    
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
        console.log('获取签证攻略数据响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取签证攻略数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取签证攻略数据失败：返回数据为空')
          this.showError()
          return
        }

        let title = '签证攻略'
        let content = ''
        
        // 处理不同的返回格式
        if (typeof res.data === 'string') {
          content = res.data
        } else if (res.data.content) {
          title = res.data.title || title
          content = res.data.content
        } else if (res.data.text) {
          title = res.data.title || title
          content = res.data.text
        } else if (res.data.data) {
          if (typeof res.data.data === 'string') {
            content = res.data.data
          } else {
            title = res.data.data.title || title
            content = res.data.data.content || res.data.data.text || ''
          }
        }

        // 检查是否有有效内容
        if (!content || content.trim() === '') {
          console.error('获取签证攻略数据失败：内容为空')
          this.showError()
          return
        }

        this.setData({
          title: title,
          content: content,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取签证攻略数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      content: ''
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchVisaGuide()
  }
})

