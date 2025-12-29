Page({
  onShow() {
    wx.reportAnalytics('enter_home_programmatically', {})

    // http://tapd.oa.com/miniprogram_experiment/prong/stories/view/1020425689866413543
    if (wx.canIUse('getExptInfoSync')) {
      console.log('getExptInfoSync expt_args_1', wx.getExptInfoSync(['expt_args_1']))
      console.log('getExptInfoSync expt_args_2', wx.getExptInfoSync(['expt_args_2']))
      console.log('getExptInfoSync expt_args_3', wx.getExptInfoSync(['expt_args_3']))
    }
    if (wx.canIUse('reportEvent')) {
      wx.reportEvent('expt_event_1', {expt_data: 1})
      wx.reportEvent('expt_event_2', {expt_data: 5})
      wx.reportEvent('expt_event_3', {expt_data: 9})
      wx.reportEvent('expt_event_4', {expt_data: 200})

      wx.reportEvent('weexpt_event_key_1', {option_1: 1, option_2: 10, option_str_1: 'abc'})
      wx.reportEvent('weexpt_event_key_1', {option_1: 'abc', option_2: '1000', option_str_1: '1'})
    }
    
    // 检查并刷新汇率（如果缓存过期）
    this.fetchExchangeRateForBanner()
  },
  onShareAppMessage() {
    return {
      title: '埃及最好用的小程序',
      path: 'page/component/index'
    }
  },
  onShareTimeline() {
    '埃及最好用的小程序'
  },

  data: {
    theme: 'light',
    exchangeRate: 6.7, // 汇率
    weather: '晴朗 28°C', // 天气
    hotActivity: '查看' // 热门活动
  },

  onLoad() {
    const systemInfo = require('../../utils/systemInfo.js')
    
    this.setData({
      theme: systemInfo.getTheme()
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 加载汇率
    this.fetchExchangeRateForBanner()
    // 加载天气
    this.fetchWeather()
  },


  locationToggle(e) {
    wx.navigateTo({
      url: '/page/location-list/index'
    })
  },

  rentalToggle(e) {
    wx.navigateTo({
      url: '/page/rental-list/index'
    })
  },

  spotsToggle(e) {
    wx.navigateTo({
      url: '/page/hot-spots-list/index'
    })
  },

  // 顶部 Banner 相关功能
  goToExchangeRate() {
    wx.navigateTo({
      url: '/page/exchange-rate/index'
    })
  },

  goToWeather() {
    wx.navigateTo({
      url: '/page/weather/index'
    })
  },

  goToHotActivity() {
    wx.navigateTo({
      url: '/page/hot-activity/index'
    })
  },

  // 主功能区跳转
  goToTranslation() {
    wx.navigateTo({
      url: '/page/translation/index'
    })
  },

  goToNileHot() {
    wx.navigateTo({
      url: '/page/nile-hot/index'
    })
  },

  goToChineseFood() {
    wx.navigateTo({
      url: '/page/chinese-food-list/index'
    })
  },

  goToSecondHand() {
    wx.navigateTo({
      url: '/page/second-hand-list/index'
    })
  },

  // 次要功能区跳转
  goToVisaGuide() {
    wx.navigateTo({
      url: '/page/visa-guide/index'
    })
  },

  goToTipGuide() {
    wx.navigateTo({
      url: '/page/tip-guide/index'
    })
  },

  goToEmergency() {
    wx.navigateTo({
      url: '/page/emergency/index'
    })
  },

  goToBlacklist() {
    wx.navigateTo({
      url: '/page/blacklist/index'
    })
  },

  // 获取汇率（用于 Banner）
  fetchExchangeRateForBanner(forceRefresh = false) {
    const blogApi = require('../../utils/blogApi.js')
    const app = getApp()
    
    // 如果不是强制刷新，先检查缓存
    if (!forceRefresh) {
      const cache = app.globalData.exchangeRateCache
      if (cache && cache.rate && cache.timestamp) {
        const cacheAge = Date.now() - cache.timestamp
        const cacheValidTime = 5 * 60 * 1000 // 5分钟
        
        if (cacheAge < cacheValidTime) {
          console.log('[fetchExchangeRateForBanner] 使用缓存的汇率数据，缓存时间:', cacheAge, 'ms')
          // 使用缓存数据
          this.setData({
            exchangeRate: cache.rate.toFixed(2)
          })
          return
        } else {
          console.log('[fetchExchangeRateForBanner] 缓存已过期，重新获取汇率数据')
        }
      } else {
        console.log('[fetchExchangeRateForBanner] 没有缓存数据，重新获取汇率数据')
      }
    }
    
    blogApi.blogPostApi.getList({
      category: '汇率转换',
      page: 1,
      pageSize: 1
    }).then((result) => {
      // 检查响应格式
      if (!result || result.success === false) {
        console.error('[fetchExchangeRateForBanner] API返回错误:', result)
        return
      }

      // 从API格式中提取数据：{success, data: [{CNY: {EGP: ...}, USD: {EGP: ...}, ...}]}
      let rateData = null
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const firstItem = result.data[0]
        // 优先检查 _originalData 字段（旧格式兼容）
        if (firstItem._originalData && Array.isArray(firstItem._originalData) && firstItem._originalData.length > 0) {
          rateData = firstItem._originalData[0]
          console.log('[fetchExchangeRateForBanner] 从 _originalData 提取汇率数据:', rateData)
        } else if (firstItem._originalData && typeof firstItem._originalData === 'object') {
          rateData = firstItem._originalData
          console.log('[fetchExchangeRateForBanner] 从 _originalData 对象提取汇率数据:', rateData)
        } else if (firstItem.CNY && typeof firstItem.CNY === 'object') {
          // 新格式：数据直接在 firstItem 中，包含 CNY、USD 等字段
          rateData = firstItem
          console.log('[fetchExchangeRateForBanner] 从 data[0] 直接提取汇率数据:', rateData)
        }
      }

      if (!rateData) {
        console.warn('[fetchExchangeRateForBanner] API返回数据为空，使用默认汇率')
        // 使用默认值，不返回，继续执行
        rateData = { CNY: { EGP: 6.7 } }
      }

      // 解析汇率数据
      let rate = 6.7
      if (rateData.CNY && rateData.CNY.EGP) {
        rate = parseFloat(rateData.CNY.EGP)
      }

      // 检查汇率是否有效
      if (isNaN(rate) || rate <= 0) {
        rate = 6.7
      }

      // 计算反向汇率
      const reverseRate = parseFloat((1 / rate).toFixed(4))
      
      // 提取所有货币汇率（过滤掉非汇率字段）
      let rates = {}
      if (rateData && typeof rateData === 'object') {
        // 定义需要过滤的非汇率字段（包括所有可能的元数据字段）
        const nonRateFields = [
          'id', 'category', 'createdAt', 'description', 'detailApi', 'excerpt',
          'image', 'name', 'published', 'slug', 'title', 'updateTime', 
          'updatedAt', 'lastUpdated', 'views', '_sourceApiName', '_specialData', 
          '_specialType', '_originalData'
        ]
        
        const keys = Object.keys(rateData)
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i]
          // 跳过非汇率字段
          if (nonRateFields.indexOf(key) === -1) {
            // 只保留值是对象且包含EGP字段的键（货币代码）
            if (rateData[key] && typeof rateData[key] === 'object' && !Array.isArray(rateData[key]) && rateData[key].EGP !== undefined) {
              rates[key] = rateData[key]
              console.log(`[fetchExchangeRateForBanner] 提取货币 ${key} 汇率:`, rateData[key])
            }
          }
        }
      }

      // 提取更新时间
      let lastUpdated = rateData.updatedAt || rateData.lastUpdated || rateData.updateTime || ''
      if (!lastUpdated) {
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        lastUpdated = `${month}-${day} ${hours}:${minutes}`
      }
      
      // 保存到全局缓存
      app.globalData.exchangeRateCache = {
        rate: rate,
        reverseRate: reverseRate,
        rates: rates,
        lastUpdated: lastUpdated,
        timestamp: Date.now()
      }
      console.log('[fetchExchangeRateForBanner] 汇率数据已缓存到 globalData', app.globalData.exchangeRateCache)
      
      this.setData({
        exchangeRate: rate.toFixed(2)
      })
    }).catch((error) => {
      console.error('[fetchExchangeRateForBanner] 获取汇率失败', error)
      // 使用默认值，不显示错误
    })
  },

  // 获取出行风向标（用于 Banner 显示）
  fetchWeather() {
    const blogApi = require('../../utils/blogApi.js')

    blogApi.blogPostApi.getList({
      category: '天气路况',
      page: 1,
      pageSize: 1
    }).then((result) => {
      // 检查响应格式
      if (!result || result.success === false) {
        this.setData({ weather: '查看' })
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

      // Banner 中只显示简单提示
      if (weatherData && weatherData.globalAlert && weatherData.globalAlert.message) {
        this.setData({
          weather: '有预警'
        })
      } else {
        // 否则显示"查看"
        this.setData({
          weather: '查看'
        })
      }
    }).catch((error) => {
      console.error('获取出行风向标数据失败（Banner）', error)
      // Banner 中失败不显示错误，保持默认值
      this.setData({
        weather: '查看'
      })
    })
  },

})
