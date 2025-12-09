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
    locationOpen: false,
    rentalOpen: false,
    chineseFoodOpen: false,
    spotsOpen: false,
    theme: 'light',
    menuLinks: [], // 从 API 获取（用于寻味中国）
    menuLinksLoading: false, // 加载状态
    locationList: [], // 从 API 获取
    locationLoading: false, // 加载状态
    hotSpots: [], // 从 API 获取
    hotSpotsLoading: false, // 加载状态
    rentalList: [], // 从 API 获取
    rentalLoading: false, // 加载状态
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

  // 从 API 获取常用菜单链接
  fetchMenuLinks() {
    const config = require('../../config.js')
    const apiUrl = config.menuLinksApi || `${config.apiBaseUrl}/menu-links`
    
    this.setData({
      menuLinksLoading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取菜单链接响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取菜单链接失败', res.statusCode, res.data)
          this.showMenuLinksError()
          return
        }

        if (!res.data) {
          console.error('获取菜单链接失败：返回数据为空')
          this.showMenuLinksError()
          return
        }

          // 处理 API 返回的数据
          let menuLinks = []
          if (Array.isArray(res.data)) {
            menuLinks = res.data
          } else if (res.data.data && Array.isArray(res.data.data)) {
            menuLinks = res.data.data
          } else if (res.data.menuLinks && Array.isArray(res.data.menuLinks)) {
            menuLinks = res.data.menuLinks
          }

        // 检查是否有有效数据
        if (!Array.isArray(menuLinks) || menuLinks.length === 0) {
          console.error('获取菜单链接失败：返回格式不正确或数据为空')
          this.showMenuLinksError()
          return
        }

          // 确保数据格式正确，并编码URL和标题
          menuLinks = menuLinks.map(item => ({
            id: item.id || item._id || Math.random(),
            name: item.name || item.title || '未知菜单',
            url: encodeURIComponent(item.url || item.link || ''),
            title: encodeURIComponent(item.title || item.name || '菜单')
          }))

          this.setData({
            menuLinks: menuLinks,
            menuLinksLoading: false
          })
      },
      fail: (err) => {
        console.error('获取菜单链接失败', err)
        this.showMenuLinksError()
      }
    })
  },

  // 显示菜单链接错误
  showMenuLinksError() {
    this.setData({
      menuLinks: [],
      menuLinksLoading: false
    })

    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 从 API 获取常用地点导航列表
  fetchLocationList() {
    const config = require('../../config.js')
    const apiUrl = config.locationsApi || `${config.apiBaseUrl}/locations`
    
    this.setData({
      locationLoading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取地点列表响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取地点列表失败', res.statusCode, res.data)
          this.showLocationError()
          return
        }

        if (!res.data) {
          console.error('获取地点列表失败：返回数据为空')
          this.showLocationError()
          return
        }

          // 处理 API 返回的数据
          let locationList = []
          if (Array.isArray(res.data)) {
            locationList = res.data
          } else if (res.data.data && Array.isArray(res.data.data)) {
            locationList = res.data.data
          } else if (res.data.locations && Array.isArray(res.data.locations)) {
            locationList = res.data.locations
          }

        // 检查是否有有效数据
        if (!Array.isArray(locationList) || locationList.length === 0) {
          console.error('获取地点列表失败：返回格式不正确或数据为空')
          this.showLocationError()
          return
        }

          // 确保数据格式正确
          locationList = locationList.map(item => ({
            id: item.id || item._id || Math.random(),
            name: item.name || item.title || '未知地点',
            address: item.address || item.location || '',
            latitude: parseFloat(item.latitude || item.lat || 30.0444),
            longitude: parseFloat(item.longitude || item.lng || item.lon || 31.2357),
            image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg'
          }))

          this.setData({
            locationList: locationList,
            locationLoading: false
          })
      },
      fail: (err) => {
        console.error('获取地点列表失败', err)
        this.showLocationError()
      }
    })
  },

  // 显示地点列表错误
  showLocationError() {
    this.setData({
      locationList: [],
      locationLoading: false
    })

    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 从 API 获取热门打卡地
  fetchHotSpots() {
    const config = require('../../config.js')
    const apiUrl = config.hotSpotsApi || `${config.apiBaseUrl}/hot-spots`
    
    this.setData({
      hotSpotsLoading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取热门打卡地响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取热门打卡地失败', res.statusCode, res.data)
          this.showHotSpotsError()
          return
        }

        if (!res.data) {
          console.error('获取热门打卡地失败：返回数据为空')
          this.showHotSpotsError()
          return
        }

          let hotSpots = []
          if (Array.isArray(res.data)) {
            hotSpots = res.data
          } else if (res.data.data && Array.isArray(res.data.data)) {
            hotSpots = res.data.data
          } else if (res.data.hotSpots && Array.isArray(res.data.hotSpots)) {
            hotSpots = res.data.hotSpots
          }

        // 检查是否有有效数据
        if (!Array.isArray(hotSpots) || hotSpots.length === 0) {
          console.error('获取热门打卡地失败：返回格式不正确或数据为空')
          this.showHotSpotsError()
          return
        }

          hotSpots = hotSpots.map(item => ({
            id: item.id || item._id || Math.random(),
            name: item.name || item.title || '未知地点',
            description: item.description || item.desc || '',
            image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg',
            latitude: parseFloat(item.latitude || item.lat || 30.0444),
            longitude: parseFloat(item.longitude || item.lng || item.lon || 31.2357)
          }))

          this.setData({
            hotSpots: hotSpots,
            hotSpotsLoading: false
          })
      },
      fail: (err) => {
        console.error('获取热门打卡地失败', err)
        this.showHotSpotsError()
      }
    })
  },

  // 显示热门打卡地错误
  showHotSpotsError() {
    this.setData({
      hotSpots: [],
      hotSpotsLoading: false
    })

    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 从 API 获取租房信息
  fetchRentals() {
    const config = require('../../config.js')
    const apiUrl = config.rentalsApi || `${config.apiBaseUrl}/rentals`
    
    this.setData({
      rentalLoading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取租房信息响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取租房信息失败', res.statusCode, res.data)
          this.showRentalsError()
          return
        }

        if (!res.data) {
          console.error('获取租房信息失败：返回数据为空')
          this.showRentalsError()
          return
        }

          let rentalList = []
          if (Array.isArray(res.data)) {
            rentalList = res.data
          } else if (res.data.data && Array.isArray(res.data.data)) {
            rentalList = res.data.data
          } else if (res.data.rentals && Array.isArray(res.data.rentals)) {
            rentalList = res.data.rentals
          }

        // 检查是否有有效数据
        if (!Array.isArray(rentalList) || rentalList.length === 0) {
          console.error('获取租房信息失败：返回格式不正确或数据为空')
          this.showRentalsError()
          return
        }

          rentalList = rentalList.map(item => ({
            id: item.id || item._id || Math.random(),
            title: item.title || item.name || '未知房源',
            address: item.address || item.location || '',
            price: String(item.price || item.rent || '0'),
            type: item.type || item.rentType || '整租',
            rooms: String(item.rooms || item.bedrooms || '1'),
            area: String(item.area || item.squareMeters || '0'),
            image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg',
            latitude: parseFloat(item.latitude || item.lat || 30.0444),
            longitude: parseFloat(item.longitude || item.lng || item.lon || 31.2357),
            contact: item.contact || item.phone || '联系方式：请咨询'
          }))

          this.setData({
            rentalList: rentalList,
            rentalLoading: false
          })
      },
      fail: (err) => {
        console.error('获取租房信息失败', err)
        this.showRentalsError()
      }
    })
  },

  // 显示租房信息错误
  showRentalsError() {
    this.setData({
      rentalList: [],
      rentalLoading: false
    })

    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
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

  goToPhoneHelper() {
    const url = 'https://pay.iezan.cn/'
    const title = '话费充值'
    wx.navigateTo({
      url: `/packageComponent/pages/open/web-view/web-view?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
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
    wx.showModal({
      title: '紧急求助',
      content: '报警电话：122\n救护车：123\n消防：180\n中国驻埃及大使馆：+20-2-27361234',
      showCancel: false,
      confirmText: '知道了'
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
        if (res.statusCode === 200 && res.data) {
          let rate = 6.7
          let rates = {}
          let lastUpdated = ''
          const data = res.data.data || res.data
          
          // 优先处理多币种格式
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            // 检查是否是多币种格式：{ CNY: { EGP: 6.7 }, USD: { EGP: 30.5 } }
            if (data.CNY && data.CNY.EGP) {
              rate = parseFloat(data.CNY.EGP)
              // 过滤掉非汇率字段（如 updatedAt, lastUpdated, updateTime）
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
            // 检查是否是 rates 格式：{ rates: { CNY: { EGP: 6.7 } } }
            else if (data.rates && data.rates.CNY && data.rates.CNY.EGP) {
              rate = parseFloat(data.rates.CNY.EGP)
              rates = data.rates
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
          
          // 获取更新时间
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
          
          // 计算反向汇率
          const reverseRate = parseFloat((1 / rate).toFixed(4))
          
          // 存储到全局缓存
          app.globalData.exchangeRateCache = {
            rate: rate,
            reverseRate: reverseRate,
            rates: rates,
            lastUpdated: lastUpdated,
            timestamp: Date.now() // 记录缓存时间
          }
          
          console.log('[fetchExchangeRateForBanner] 汇率数据已缓存到 globalData', app.globalData.exchangeRateCache)
          
          this.setData({
            exchangeRate: rate.toFixed(2)
          })
        }
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

  openLocation(e) {
    const location = e.currentTarget.dataset.location
    // 显示选择弹窗
    wx.showActionSheet({
      itemList: ['微信内地图', '复制谷歌地图链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 选择微信内地图
          this.openWeChatMap(location)
        } else if (res.tapIndex === 1) {
          // 选择复制谷歌地图链接
          this.copyGoogleMapLink(location)
        }
      }
    })
  },

  // 打开微信内地图
  openWeChatMap(location) {
    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name,
      address: location.address,
      scale: 18,
      success: () => {
        console.log('打开微信地图成功')
      },
      fail: (err) => {
        console.error('打开微信地图失败', err)
        wx.showToast({
          title: '打开地图失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制谷歌地图链接
  copyGoogleMapLink(location) {
    const googleMapUrl = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    
    // 先复制链接到剪贴板
    wx.setClipboardData({
      data: googleMapUrl,
      success: () => {
        // 复制成功后显示提示
        wx.showModal({
          title: location.name,
          content: `地址：${location.address}\n\n✅ 谷歌地图链接已复制到剪贴板\n\n请在浏览器中粘贴并打开查看`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            wx.showToast({
              title: '链接已复制，请在浏览器打开',
              icon: 'none',
              duration: 3000
            })
          }
        })
      },
      fail: () => {
        // 复制失败时也显示链接
        wx.showModal({
          title: location.name,
          content: `地址：${location.address}\n\n谷歌地图链接：\n${googleMapUrl}\n\n请复制链接到浏览器打开`,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  shareSpot(e) {
    const spot = e.currentTarget.dataset.spot
    // 显示选择弹窗
    wx.showActionSheet({
      itemList: ['微信内地图', '复制谷歌地图链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 选择微信内地图
          this.openWeChatMapForSpot(spot)
        } else if (res.tapIndex === 1) {
          // 选择复制谷歌地图链接
          this.copyGoogleMapLinkForSpot(spot)
        }
      }
    })
  },

  // 打开微信内地图（打卡地）
  openWeChatMapForSpot(spot) {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    
    wx.openLocation({
      latitude: spot.latitude,
      longitude: spot.longitude,
      name: spot.name,
      address: spot.description,
      scale: 18,
      success: () => {
        console.log('打开微信地图成功')
      },
      fail: (err) => {
        console.error('打开微信地图失败', err)
        wx.showToast({
          title: '打开地图失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制谷歌地图链接（打卡地）
  copyGoogleMapLinkForSpot(spot) {
    const googleMapUrl = `https://www.google.com/maps?q=${spot.latitude},${spot.longitude}`
    
    wx.setClipboardData({
      data: googleMapUrl,
      success: () => {
        wx.showModal({
          title: spot.name,
          content: `描述：${spot.description}\n\n✅ 谷歌地图链接已复制到剪贴板\n\n请在浏览器中粘贴并打开查看`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            wx.showToast({
              title: '链接已复制，请在浏览器打开',
              icon: 'none',
              duration: 3000
            })
          }
        })
      },
      fail: () => {
        wx.showModal({
          title: spot.name,
          content: `描述：${spot.description}\n\n谷歌地图链接：\n${googleMapUrl}\n\n请复制链接到浏览器打开`,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  viewRental(e) {
    const rental = e.currentTarget.dataset.rental
    wx.showModal({
      title: rental.title,
      content: `价格：${rental.price} EGP/月\n地址：${rental.address}\n类型：${rental.type}\n房间：${rental.rooms}室\n面积：${rental.area}㎡\n\n${rental.contact}`,
      showCancel: true,
      cancelText: '查看地图',
      confirmText: '知道了',
      success: (res) => {
        if (res.cancel) {
          // 点击查看地图，显示选择弹窗
          wx.showActionSheet({
            itemList: ['微信内地图', '复制谷歌地图链接'],
            success: (actionRes) => {
              if (actionRes.tapIndex === 0) {
                // 选择微信内地图
                this.openWeChatMapForRental(rental)
              } else if (actionRes.tapIndex === 1) {
                // 选择复制谷歌地图链接
                this.copyGoogleMapLinkForRental(rental)
              }
            }
          })
        }
      }
    })
  },

  // 打开微信内地图（租房）
  openWeChatMapForRental(rental) {
    wx.openLocation({
      latitude: rental.latitude,
      longitude: rental.longitude,
      name: rental.title,
      address: rental.address,
      scale: 18,
      success: () => {
        console.log('打开微信地图成功')
      },
      fail: (err) => {
        console.error('打开微信地图失败', err)
        wx.showToast({
          title: '打开地图失败',
          icon: 'none'
        })
      }
    })
  },

  // 复制谷歌地图链接（租房）
  copyGoogleMapLinkForRental(rental) {
    const googleMapUrl = `https://www.google.com/maps?q=${rental.latitude},${rental.longitude}`
    
    wx.setClipboardData({
      data: googleMapUrl,
      success: () => {
        wx.showModal({
          title: rental.title,
          content: `地址：${rental.address}\n\n✅ 谷歌地图链接已复制到剪贴板\n\n请在浏览器中粘贴并打开查看`,
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            wx.showToast({
              title: '链接已复制，请在浏览器打开',
              icon: 'none',
              duration: 3000
            })
          }
        })
      },
      fail: () => {
        wx.showModal({
          title: rental.title,
          content: `地址：${rental.address}\n\n谷歌地图链接：\n${googleMapUrl}\n\n请复制链接到浏览器打开`,
          showCancel: false,
          confirmText: '知道了'
        })
      }
    })
  },

  // 处理图片加载错误
  onImageError(e) {
    const { index, type } = e.currentTarget.dataset
    const defaultImage = '/page/component/resources/pic/1.jpg'
    
    // 根据类型更新对应的数据
    if (type === 'location') {
      const locationList = this.data.locationList
      if (locationList[index] && locationList[index].image !== defaultImage) {
        locationList[index].image = defaultImage
        this.setData({ locationList })
      }
    } else if (type === 'rental') {
      const rentalList = this.data.rentalList
      if (rentalList[index] && rentalList[index].image !== defaultImage) {
        rentalList[index].image = defaultImage
        this.setData({ rentalList })
      }
    } else if (type === 'hotSpot') {
      const hotSpots = this.data.hotSpots
      if (hotSpots[index] && hotSpots[index].image !== defaultImage) {
        hotSpots[index].image = defaultImage
        this.setData({ hotSpots })
      }
    }
    
    console.warn(`图片加载失败，已使用默认占位图: ${type}[${index}]`)
  }
})
