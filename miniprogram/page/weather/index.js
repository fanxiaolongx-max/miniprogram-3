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
    const blogApi = require('../../utils/blogApi.js')
    
    this.setData({
      loading: true
    })

    blogApi.blogPostApi.getList({
      category: '天气路况',
      page: 1,
      pageSize: 1  // 天气通常只需要一条数据
    }).then((result) => {
      console.log('获取出行风向标数据响应', result)
      
      // 检查响应格式
      if (!result || result.success === false) {
        console.error('获取出行风向标数据失败', result)
        this.showError()
        return
      }

      // 从API格式中提取数据：{success, data: [{_specialData: {...}}]}
      let weatherData = null
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const firstItem = result.data[0]
        // 优先检查 _specialData 字段（新格式）
        if (firstItem._specialData && typeof firstItem._specialData === 'object') {
          weatherData = firstItem._specialData
          console.log('[fetchWeather] 从 _specialData 提取天气数据:', weatherData)
        } else if (firstItem._originalData && typeof firstItem._originalData === 'object') {
          // 兼容旧格式 _originalData
          weatherData = firstItem._originalData
          console.log('[fetchWeather] 从 _originalData 提取天气数据:', weatherData)
        }
      }

      if (!weatherData) {
        console.warn('[fetchWeather] API返回数据为空')
        this.setData({
          globalAlert: null,
          attractions: [],
          traffic: [],
          loading: false,
          error: false
        })
        return
      }

      // 处理全域预警
      const globalAlert = weatherData.globalAlert || null

      // 处理景点信息
      let attractions = []
      const attractionsData = weatherData.attractions || []
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

      // 处理路况广播
      let traffic = []
      const trafficData = weatherData.traffic || []
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
      console.log(`[fetchWeather] 数据处理完成：globalAlert=${!!globalAlert}, attractions=${attractions.length}条, traffic=${traffic.length}条`)

      this.setData({
        globalAlert: globalAlert,
        attractions: attractions,
        traffic: traffic,
        loading: false,
        error: false
      })
    }).catch((error) => {
      console.error('获取出行风向标数据失败', error)
      this.showError()
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
