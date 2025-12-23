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
        
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
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

        // 处理不同的数据格式
        // 格式1: 直接在 res.data 中：{ globalAlert: {...}, attractions: [...], traffic: [...] }
        // 格式2: 包装在 res.data.data 中：{ data: { globalAlert: {...}, attractions: [...], traffic: [...] } }
        let data = res.data
        if (res.data.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data)) {
          // 如果 res.data.data 是对象，检查是否包含 globalAlert/attractions/traffic
          if (res.data.data.globalAlert || res.data.data.attractions || res.data.data.traffic) {
            data = res.data.data
          }
        }

        // 处理全域预警（优先从 data 中获取，如果没有则从 res.data 中获取）
        const globalAlert = data.globalAlert || res.data.globalAlert || null

        // 处理景点信息（优先从 data 中获取，如果没有则从 res.data 中获取）
        let attractions = []
        const attractionsData = data.attractions || res.data.attractions || []
        if (Array.isArray(attractionsData)) {
          attractions = attractionsData.map(item => ({
            id: item.id || item._id || Math.random(),
            name: item.name || '未知景点',
            temperature: item.temperature || 0,
            visibility: item.visibility || '中',
            uvIndex: item.uvIndex || 0,
            windSpeed: item.windSpeed || '',
            suggestion: item.suggestion || ''
          }))
        }

        // 处理路况广播（优先从 data 中获取，如果没有则从 res.data 中获取）
        let traffic = []
        const trafficData = data.traffic || res.data.traffic || []
        if (Array.isArray(trafficData)) {
          traffic = trafficData.map(item => ({
            id: item.id || item._id || Math.random(),
            time: item.time || '',
            type: item.type || '其他',
            location: item.location || '',
            message: item.message || ''
          }))
        }

        // 即使没有数据也正常显示（显示空状态），不报错
        // 只有在API明确返回错误时才报错
        console.log(`[fetchWeather] 数据处理完成：globalAlert=${!!globalAlert}, attractions=${attractions.length}条, traffic=${traffic.length}条`)

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
