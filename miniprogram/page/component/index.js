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
  fetchExchangeRateForBanner() {
    const config = require('../../config.js')
    const apiUrl = config.exchangeRateApi || `${config.apiBaseUrl}/exchange-rate`
    const app = getApp()
    
    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
        // 检查状态码
        if (res.statusCode !== 200) {
          console.error('[fetchExchangeRateForBanner] 获取汇率失败，状态码:', res.statusCode)
          return
        }

        // 检查是否有明确的错误标识
        if (res.data && res.data.success === false) {
          console.error('[fetchExchangeRateForBanner] API返回错误:', res.data)
          return
        }

        // 如果没有数据，使用默认值
        if (!res.data) {
          console.warn('[fetchExchangeRateForBanner] API返回数据为空，使用默认汇率')
          return
        }

          let rate = 6.7
          let lastUpdated = ''
        let rates = {} // 多币种汇率对象

        // 处理不同的API返回格式（与汇率页面完全一致）
        // 格式1（优先）: res.data 是数组 [{ CNY: { EGP: 6.74 }, ... }]
        // 格式2: 包装在 res.data.data 中：{ data: [{ CNY: { EGP: 6.74 }, ... }] }
        // 格式3: 直接在 res.data 中：{ "0": { CNY: { EGP: 6.74 }, ... }, data: [...] }
        // 格式4: 直接在 res.data 中：{ CNY: { EGP: 6.74 }, ... }
        console.log('[fetchExchangeRateForBanner] 处理数据，res.data:', res.data, 'res.data类型:', typeof res.data, '是否为数组:', Array.isArray(res.data))
        
        let rateData = null
        
        // 优先检查 res.data 是否是数组（格式1）
        if (Array.isArray(res.data) && res.data.length > 0) {
          const firstItem = res.data[0]
          if (firstItem && typeof firstItem === 'object' && firstItem.CNY && firstItem.CNY.EGP) {
            rateData = firstItem
            console.log('[fetchExchangeRateForBanner] 从 res.data 数组第一个元素提取汇率数据:', rateData)
          }
        }
        
        // 如果 res.data 不是数组，检查其他格式
        if (!rateData && res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
          // 格式2: 检查 res.data.data 是否是数组
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            const firstItem = res.data.data[0]
            if (firstItem && typeof firstItem === 'object' && firstItem.CNY && firstItem.CNY.EGP) {
              rateData = firstItem
              console.log('[fetchExchangeRateForBanner] 从 res.data.data 数组第一个元素提取汇率数据:', rateData)
            }
          }
          // 格式3: 检查是否有数字键（如 "0"）包含汇率数据
          else {
            const keys = Object.keys(res.data)
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i]
              // 检查是否是数字键且包含汇率数据
              if (/^\d+$/.test(key) && res.data[key] && typeof res.data[key] === 'object') {
                const item = res.data[key]
                if (item.CNY && item.CNY.EGP) {
                  rateData = item
                  console.log('[fetchExchangeRateForBanner] 从数字键', key, '中提取汇率数据:', rateData)
                  break
                }
              }
            }
          }
          
          // 格式4: 检查 res.data.data 是否是对象
          if (!rateData && res.data.data && typeof res.data.data === 'object' && !Array.isArray(res.data.data)) {
            if (res.data.data.CNY && res.data.data.CNY.EGP) {
              rateData = res.data.data
              console.log('[fetchExchangeRateForBanner] 从 res.data.data 提取汇率数据:', rateData)
            }
          }
          
          // 格式5: 检查 res.data 本身是否包含汇率数据
          if (!rateData && res.data.CNY && res.data.CNY.EGP) {
            rateData = res.data
            console.log('[fetchExchangeRateForBanner] 从 res.data 直接提取汇率数据:', rateData)
          }
        }
        
        // 如果找到了汇率数据，解析它
        if (rateData) {
          if (rateData.CNY && rateData.CNY.EGP) {
            rate = parseFloat(rateData.CNY.EGP)
            console.log('[fetchExchangeRateForBanner] 提取到 CNY->EGP 汇率:', rate)
            
            // 提取所有货币汇率（过滤掉非汇率字段）
            rates = {}
            const keys = Object.keys(rateData)
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i]
              // 跳过非汇率字段
              if (key !== 'id' && key !== 'name' && key !== 'detailApi' && 
                  key !== 'updatedAt' && key !== 'lastUpdated' && key !== 'updateTime' &&
                  key !== 'htmlContent' && key !== 'views' && key !== 'createdAt') {
                if (rateData[key] && typeof rateData[key] === 'object' && !Array.isArray(rateData[key])) {
                  rates[key] = rateData[key]
                }
              }
            }
            console.log('[fetchExchangeRateForBanner] 提取到多币种汇率:', rates)
            
            // 提取更新时间
            if (rateData.updatedAt) {
              lastUpdated = rateData.updatedAt
            } else if (rateData.lastUpdated) {
              lastUpdated = rateData.lastUpdated
            } else if (rateData.updateTime) {
              lastUpdated = rateData.updateTime
            }
          }
        } else {
          // 如果没有找到，尝试旧的格式处理逻辑（向后兼容）
          const data = res.data.data || res.data
          console.log('[fetchExchangeRateForBanner] 未找到新格式，尝试旧格式，data:', data)
          
          // 优先处理多币种汇率格式
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            // 检查是否是 rates 格式：{ rates: { CNY: { EGP: 6.7 }, USD: { EGP: 30.5 } } }
            if (data.rates && typeof data.rates === 'object' && !Array.isArray(data.rates)) {
              if (data.rates.CNY && data.rates.CNY.EGP) {
                rate = parseFloat(data.rates.CNY.EGP)
                rates = data.rates
                console.log('[fetchExchangeRateForBanner] 从 rates 格式提取，rate:', rate)
              }
            }
            // 检查是否是多币种格式：{ CNY: { EGP: 6.7 }, USD: { EGP: 30.5 } }
            else if (data.CNY && typeof data.CNY === 'object' && !Array.isArray(data.CNY) && data.CNY.EGP) {
              rate = parseFloat(data.CNY.EGP)
              // 过滤掉非汇率字段
              rates = {}
              if (data && typeof data === 'object' && !Array.isArray(data) && data !== null) {
                try {
                  const keys = Object.keys(data)
                  for (let i = 0; i < keys.length; i++) {
                    const key = keys[i]
                    if (key !== 'updatedAt' && key !== 'lastUpdated' && key !== 'updateTime' && 
                        data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]) && data[key] !== null) {
                      rates[key] = data[key]
                    }
                  }
                } catch (err) {
                  console.error('[fetchExchangeRateForBanner] 处理多币种汇率数据出错', err)
                  rates = {}
                }
              }
            }
            // 检查是否是单币种对象格式：{ rate: 6.7 } 或 { exchangeRate: 6.7 }
            else if (data.rate) {
              rate = parseFloat(data.rate)
            } else if (data.exchangeRate) {
              rate = parseFloat(data.exchangeRate)
            }
          }
          // 处理数字格式
          else if (typeof data === 'number') {
            rate = data
          }
        }

        // 检查汇率是否有效
        if (isNaN(rate) || rate <= 0) {
          console.warn('[fetchExchangeRateForBanner] 无法从API解析有效汇率，使用默认值 6.7')
          rate = 6.7
          rates = {}
        }

        // 获取更新时间（如果之前没有从 rateData 中提取）
        if (!lastUpdated) {
          if (res.data.updatedAt || res.data.lastUpdated || res.data.updateTime) {
            lastUpdated = res.data.updatedAt || res.data.lastUpdated || res.data.updateTime
          } else if (res.data.data && (res.data.data.updatedAt || res.data.data.lastUpdated || res.data.data.updateTime)) {
            lastUpdated = res.data.data.updatedAt || res.data.data.lastUpdated || res.data.data.updateTime
          } else {
            // 如果没有提供更新时间，使用当前时间
            const now = new Date()
            const month = String(now.getMonth() + 1).padStart(2, '0')
            const day = String(now.getDate()).padStart(2, '0')
            const hours = String(now.getHours()).padStart(2, '0')
            const minutes = String(now.getMinutes()).padStart(2, '0')
            lastUpdated = `${month}-${day} ${hours}:${minutes}`
          }
          }
          
          // 计算反向汇率
          const reverseRate = parseFloat((1 / rate).toFixed(4))
          
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
      },
      fail: () => {
        // 使用默认值
      }
    })
  },

  // 获取出行风向标（用于 Banner 显示）
  fetchWeather() {
    const config = require('../../config.js')
    const apiUrl = config.weatherApi || `${config.apiBaseUrl}/weather`

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
        // Banner 中只显示简单提示
        if (res.statusCode === 200 && res.data) {
          let data = res.data
          if (res.data.data) {
            data = res.data.data
          }
          
          // 如果有全域预警，显示预警提示
          if (data.globalAlert && data.globalAlert.message) {
            this.setData({
              weather: '有预警'
            })
          } else {
            // 否则显示"查看"
            this.setData({
              weather: '查看'
            })
          }
        }
      },
      fail: (err) => {
        console.error('获取出行风向标数据失败（Banner）', err)
        // Banner 中失败不显示错误，保持默认值
        this.setData({
          weather: '查看'
        })
      }
    })
  },

})
