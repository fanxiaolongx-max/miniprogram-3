Page({
  onShareAppMessage() {
    return {
      title: '出行风向标',
      path: 'page/weather/index'
    }
  },

  data: {
    theme: 'light',
    globalAlert: null,
    attractions: [],
    traffic: [],
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

    this.fetchWeather()
  },

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
        console.log('获取出行风向标数据响应', res)
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取出行风向标数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取出行风向标数据失败：返回数据为空')
          this.showError()
          return
        }

        let data = res.data
        if (res.data.data) {
          data = res.data.data
        }

        // 处理全域预警
        const globalAlert = data.globalAlert || null

        // 处理景点信息
        let attractions = []
        if (Array.isArray(data.attractions)) {
          attractions = data.attractions.map(item => ({
            id: item.id || item._id || Math.random(),
            name: item.name || '未知景点',
            temperature: item.temperature || 0,
            visibility: item.visibility || '中',
            uvIndex: item.uvIndex || 0,
            windSpeed: item.windSpeed || '',
            suggestion: item.suggestion || ''
          }))
        }

        // 处理路况广播
        let traffic = []
        if (Array.isArray(data.traffic)) {
          traffic = data.traffic.map(item => ({
            id: item.id || item._id || Math.random(),
            time: item.time || '',
            type: item.type || '其他',
            location: item.location || '',
            message: item.message || ''
          }))
        }

        // 检查是否有有效数据
        if (attractions.length === 0 && !globalAlert && traffic.length === 0) {
          console.error('获取出行风向标数据失败：数据格式不正确或为空')
          this.showError()
          return
        }

        this.setData({
          globalAlert: globalAlert,
          attractions: attractions,
          traffic: traffic,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取出行风向标数据失败', err)
        this.showError()
      }
    })
  },

  showError() {
    this.setData({
      loading: false,
      error: true,
      globalAlert: null,
      attractions: [],
      traffic: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  retry() {
    this.fetchWeather()
  },

  // 获取温度描述
  getTemperatureDesc(temp) {
    if (temp >= 35) return '暴晒'
    if (temp >= 30) return '炎热'
    if (temp >= 25) return '温暖'
    if (temp >= 15) return '舒适'
    if (temp >= 5) return '凉爽'
    return '极冷'
  },

  // 获取紫外线描述
  getUVDesc(uvIndex) {
    if (uvIndex >= 10) return '极高'
    if (uvIndex >= 7) return '高'
    if (uvIndex >= 4) return '中等'
    return '低'
  },

  // 获取预警级别样式
  getAlertLevelClass(level) {
    if (level === 'high') return 'alert-high'
    if (level === 'medium') return 'alert-medium'
    return 'alert-low'
  },

  // 获取路况类型图标
  getTrafficTypeIcon(type) {
    if (type === '车祸') return '🚨'
    if (type === '施工') return '🚧'
    if (type === '天气') return '🌤️'
    return '📢'
  }
})
