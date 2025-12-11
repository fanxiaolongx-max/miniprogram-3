Page({
  onShareAppMessage() {
    return {
      title: '紧急求助',
      path: 'page/emergency/index'
    }
  },

  data: {
    theme: 'light',
    emergencyNumbers: [
      { 
        icon: '🚨', 
        name: '报警', 
        number: '122',
        displayNumber: '122'
      },
      { 
        icon: '🔥', 
        name: '火警', 
        number: '180',
        displayNumber: '180'
      },
      { 
        icon: '🏥', 
        name: '急救', 
        number: '123',
        displayNumber: '123'
      },
      { 
        icon: '🚓', 
        name: '交通事故', 
        number: '128',
        displayNumber: '128'
      },
      { 
        icon: '👮‍♂️', 
        name: '旅游警察', 
        number: '126',
        displayNumber: '126'
      },
      { 
        icon: '🆘', 
        name: '全国紧急', 
        number: '112',
        displayNumber: '112'
      },
      { 
        icon: '💡', 
        name: '电力紧急', 
        number: '121',
        displayNumber: '121'
      },
      { 
        icon: '💧', 
        name: '自来水', 
        number: '125',
        displayNumber: '125'
      },
      { 
        icon: '🔥', 
        name: '燃气泄漏', 
        number: '129',
        displayNumber: '129'
      },
      { 
        icon: '🇨🇳', 
        name: '中国驻埃及使领馆（开罗）', 
        number: '+201067351051',
        displayNumber: '+20-106-735-1051'
      },
      { 
        icon: '🇨🇳', 
        name: '中国驻埃及使领馆（亚历山大）', 
        number: '+201204798929',
        displayNumber: '+20-120-479-8929'
      },
      { 
        icon: '🇨🇳', 
        name: '外交部领保热线', 
        number: '+861012308',
        displayNumber: '+86-10-12308'
      },
      { 
        icon: '🇨🇳', 
        name: '外交部领保热线（备用）', 
        number: '+861059913991',
        displayNumber: '+86-10-59913991'
      }
    ]
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
  },

  // 点击拨打号码
  callPhone(e) {
    const phone = e.currentTarget.dataset.phone
    
    if (!phone) {
      wx.showToast({
        title: '号码错误',
        icon: 'none',
        duration: 2000
      })
      return
    }

    // 直接调用微信拨打电话 API，系统会自动弹出确认框
    wx.makePhoneCall({
      phoneNumber: phone,
      success: () => {
        console.log('拨打成功：', phone)
      },
      fail: (err) => {
        // 用户点击取消时，不显示错误提示
        if (err.errMsg && err.errMsg.includes('cancel')) {
          console.log('用户取消拨打')
          return
        }
        // 其他错误才显示提示
        console.error('拨打失败：', err)
        wx.showToast({
          title: '拨打失败，请稍后重试',
          icon: 'none',
          duration: 2000
        })
      }
    })
  }
})
