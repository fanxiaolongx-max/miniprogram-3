const config = require('./config')
// 引用 util 工具文件，避免主包未使用警告
require('./util/util.js')
// 引用 recycle-view，避免主包未使用警告
require('./miniprogram_npm/miniprogram-recycle-view/index.js')

const themeListeners = []
// 默认使用生产环境，如需开发环境请手动切换
global.isDemo = true
App({
  
  onLaunch(opts, data) {
    console.log('App Launch', opts)
    if (data && data.path) {
      wx.navigateTo({
        url: data.path,
      })
    }
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: config.envId,
        traceUser: true,
      })
    }
  },

  
  onShow(opts) {
    console.log('App Show', opts)
    // console.log(wx.getSystemInfoSync())
  },
  onHide() {
    console.log('App Hide')
  },
  onThemeChange({ theme }) {
    this.globalData.theme = theme
    themeListeners.forEach((listener) => {
        listener(theme)
    })
  },
  watchThemeChange(listener) {
      if (themeListeners.indexOf(listener) < 0) {
          themeListeners.push(listener)
      }
  },
  unWatchThemeChange(listener) {
      const index = themeListeners.indexOf(listener)
      if (index > -1) {
          themeListeners.splice(index, 1)
      }
  },
  globalData: {
    theme: (() => {
      try {
        const systemInfo = require('./utils/systemInfo.js')
        return systemInfo.getTheme()
      } catch (e) {
        return 'light'
      }
    })(),
    hasLogin: false,
    openid: null,
    iconTabbar: '/page/weui/example/images/icon_tabbar.png',
    // 汇率数据缓存
    exchangeRateCache: {
      rate: null, // CNY -> EGP 汇率
      reverseRate: null, // EGP -> CNY 汇率
      rates: null, // 多币种汇率对象 { CNY: { EGP: 6.7 }, USD: { EGP: 30.5 }, ... }
      lastUpdated: null, // 最后更新时间
      timestamp: null // 缓存时间戳，用于判断缓存是否过期
    }
  },
  // lazy loading openid
  getUserOpenId(callback) {
    const self = this

    if (self.globalData.openid) {
      callback(null, self.globalData.openid)
    } else {
      wx.login({
        success(data) {
          wx.cloud.callFunction({
            name: 'login',
            data: {
              action: 'openid'
            },
            success: res => {
              console.log('拉取openid成功', res)
              self.globalData.openid = res.result.openid
              callback(null, self.globalData.openid)
            },
            fail: err => {
              console.log('拉取用户openid失败，将无法正常使用开放接口等服务', res)
              callback(res)
            }
          })
        },
        fail(err) {
          console.log('wx.login 接口调用失败，将无法正常使用开放接口等服务', err)
          callback(err)
        }
      })
    }
  },
  // 通过云函数获取用户 openid，支持回调或 Promise
  getUserOpenIdViaCloud() {
    return wx.cloud.callFunction({
      name: 'wxContext',
      data: {}
    }).then(res => {
      this.globalData.openid = res.result.openid
      return res.result.openid
    })
  }
})
