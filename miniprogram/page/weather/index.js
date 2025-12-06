Page({
  onShareAppMessage() {
    return {
      title: '天气预警',
      path: 'page/weather/index'
    }
  },

  data: {
    theme: 'light',
    weather: '',
    condition: '',
    temperature: '',
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

    // 加载天气数据
    this.fetchWeather()
  },

  // 从 API 获取天气数据
  fetchWeather() {
    const config = require('../../config.js')
    const apiUrl = config.weatherApi || `${config.apiBaseUrl}/weather`
    
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
        console.log('获取天气数据响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取天气数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取天气数据失败：返回数据为空')
          this.showError()
          return
        }

        let weather = ''
        let condition = ''
        let temperature = ''

        // 处理不同的返回格式
        if (typeof res.data === 'string') {
          weather = res.data
        } else if (res.data.weather) {
          weather = res.data.weather
          condition = res.data.condition || ''
          temperature = res.data.temperature || ''
        } else if (res.data.data) {
          if (typeof res.data.data === 'string') {
            weather = res.data.data
          } else if (res.data.data.weather) {
            weather = res.data.data.weather
            condition = res.data.data.condition || ''
            temperature = res.data.data.temperature || ''
          }
        }

        // 如果没有 weather 字段，尝试从 condition 和 temperature 组合
        if (!weather && (condition || temperature)) {
          if (condition && temperature) {
            weather = `${condition} ${temperature}°C`
          } else if (condition) {
            weather = condition
          } else if (temperature) {
            weather = `${temperature}°C`
          }
        }

        // 检查是否有有效内容
        if (!weather || weather.trim() === '') {
          console.error('获取天气数据失败：内容为空')
          this.showError()
          return
        }

        this.setData({
          weather: weather,
          condition: condition,
          temperature: temperature,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取天气数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      weather: '',
      condition: '',
      temperature: ''
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchWeather()
  }
})

