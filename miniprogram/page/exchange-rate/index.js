Page({
  onShareAppMessage() {
    return {
      title: '汇率转换工具',
      path: 'page/exchange-rate/index'
    }
  },

  data: {
    theme: 'light',
    exchangeRate: 6.7, // 默认汇率，可以根据实际情况更新
    cnyAmount: '',
    egpAmount: '0.00',
    rateLoading: false, // 加载状态
    lastUpdated: '' // 最后更新时间
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

    // 加载汇率数据
    this.fetchExchangeRate()
  },

  onCNYInput(e) {
    const cnyAmount = e.detail.value
    this.calculateEGP(cnyAmount)
  },

  calculateEGP(cnyAmount) {
    if (!cnyAmount || cnyAmount === '') {
      this.setData({
        cnyAmount: '',
        egpAmount: '0.00'
      })
      return
    }

    const amount = parseFloat(cnyAmount)
    if (isNaN(amount)) {
      this.setData({
        egpAmount: '0.00'
      })
      return
    }

    const egpAmount = (amount * this.data.exchangeRate).toFixed(2)
    this.setData({
      cnyAmount: cnyAmount,
      egpAmount: egpAmount
    })
  },

  setAmount(e) {
    const amount = e.currentTarget.dataset.amount
    this.calculateEGP(amount.toString())
  },

  updateRate() {
    // 调用API获取最新汇率
    this.fetchExchangeRate()
  },

  // 从 API 获取汇率
  fetchExchangeRate() {
    const config = require('../../config.js')
    const apiUrl = config.exchangeRateApi || `${config.apiBaseUrl}/exchange-rate`
    
    this.setData({
      rateLoading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取汇率响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取汇率失败', res.statusCode, res.data)
          this.showRateError()
          return
        }

        if (!res.data) {
          console.error('获取汇率失败：返回数据为空')
          this.showRateError()
          return
        }

          let rate = 6.7
          let lastUpdated = ''

          // 处理不同的API返回格式
          if (typeof res.data === 'number') {
            rate = res.data
          } else if (res.data.rate) {
            rate = parseFloat(res.data.rate)
          } else if (res.data.exchangeRate) {
            rate = parseFloat(res.data.exchangeRate)
        } else if (res.data.data) {
          if (typeof res.data.data === 'number') {
            rate = res.data.data
          } else if (res.data.data.rate) {
            rate = parseFloat(res.data.data.rate)
          } else if (res.data.data.exchangeRate) {
            rate = parseFloat(res.data.data.exchangeRate)
          }
        }

        // 检查汇率是否有效
        if (isNaN(rate) || rate <= 0) {
          console.error('获取汇率失败：汇率值无效', rate)
          this.showRateError()
          return
          }

          // 获取更新时间
          if (res.data.updatedAt || res.data.lastUpdated || res.data.updateTime) {
            lastUpdated = res.data.updatedAt || res.data.lastUpdated || res.data.updateTime
        } else if (res.data.data && (res.data.data.updatedAt || res.data.data.lastUpdated)) {
          lastUpdated = res.data.data.updatedAt || res.data.data.lastUpdated
          } else {
            lastUpdated = new Date().toLocaleString('zh-CN')
          }

          // 如果当前有输入金额，重新计算
          const currentAmount = this.data.cnyAmount
          let egpAmount = '0.00'
          if (currentAmount && currentAmount !== '') {
            const amount = parseFloat(currentAmount)
            if (!isNaN(amount)) {
              egpAmount = (amount * rate).toFixed(2)
            }
          }

          this.setData({
            exchangeRate: rate,
            lastUpdated: lastUpdated,
            egpAmount: egpAmount,
            rateLoading: false
          })

          wx.showToast({
            title: '汇率已更新',
            icon: 'success',
            duration: 2000
          })
      },
      fail: (err) => {
        console.error('获取汇率失败', err)
        this.showRateError()
      }
    })
  },

  // 显示汇率错误
  showRateError() {
    this.setData({
      rateLoading: false
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  }
})

