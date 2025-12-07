const app = getApp()

Page({
  onShareAppMessage() {
    return {
      title: '我的',
      path: 'page/my/index'
    }
  },

  data: {
    theme: 'light',
    hasLogin: false,
    hasUserInfo: false,
    canIUseGetUserProfile: false,
    userInfo: {},
    // 反馈表单
    feedbackContent: '',
    feedbackCategory: '',
    feedbackCategoryIndex: 0,
    feedbackCategories: [
      { value: '', label: '请选择功能分类' },
      { value: '问路卡片', label: '问路卡片' },
      { value: '话费助手', label: '话费助手' },
      { value: '寻味中国', label: '寻味中国' },
      { value: '常用导航', label: '常用导航' },
      { value: '租房/酒店', label: '租房/酒店' },
      { value: '二手集市', label: '二手集市' },
      { value: '紧急求助', label: '紧急求助' },
      { value: '签证攻略', label: '签证攻略' },
      { value: '小费指南', label: '小费指南' },
      { value: '热门打卡地', label: '热门打卡地' },
      { value: '汇率转换', label: '汇率转换' },
      { value: '天气预警', label: '天气预警' },
      { value: '热门活动', label: '热门活动' },
      { value: '其他', label: '其他' }
    ],
    submitting: false
  },

  onLoad() {
    this.setData({
      theme: (() => {
        const systemInfo = require('../../utils/systemInfo.js')
        return systemInfo.getTheme()
      })(),
      hasLogin: app.globalData.hasLogin
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    if (wx.getUserProfile) {
      this.setData({
        canIUseGetUserProfile: true
      })
    }
  },

  onShow() {
    // 每次显示页面时更新登录状态
    this.setData({
      hasLogin: app.globalData.hasLogin
    })
  },

  login() {
    const that = this
    wx.login({
      success() {
        app.globalData.hasLogin = true
        that.setData({
          hasLogin: true
        })
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      },
      fail(err) {
        console.log('登录失败', err)
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        })
      }
    })
  },

  getUserInfo(info) {
    console.log('getUserInfo')
    const userInfo = info.detail.userInfo
    this.setData({
      userInfo,
      hasUserInfo: true
    })
  },

  handleGetUserProfile(e) {
    console.log('getUserProfile')
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        console.log('wx.getUserProfile: ', res.userInfo)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
        wx.showToast({
          title: '获取成功',
          icon: 'success'
        })
      },
      fail(err) {
        console.log('获取用户信息失败', err)
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        })
      }
    })
  },

  // 输入反馈内容
  onFeedbackInput(e) {
    this.setData({
      feedbackContent: e.detail.value
    })
  },

  // 选择功能分类
  onCategoryChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      feedbackCategory: this.data.feedbackCategories[index].value,
      feedbackCategoryIndex: index
    })
  },

  // 提交反馈
  submitFeedback() {
    // 检查用户是否已登录
    if (!this.data.hasUserInfo) {
      wx.showModal({
        title: '提示',
        content: '提交反馈需要先登录，是否立即登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户点击去登录，触发登录按钮
            if (this.data.canIUseGetUserProfile) {
              this.handleGetUserProfile()
            } else {
              // 如果无法使用 getUserProfile，提示用户点击登录按钮
              wx.showToast({
                title: '请点击上方登录按钮',
                icon: 'none',
                duration: 2000
              })
            }
          }
        }
      })
      return
    }

    const content = this.data.feedbackContent.trim()
    const category = this.data.feedbackCategory

    // 验证反馈内容
    if (!content) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (content.length < 5) {
      wx.showToast({
        title: '反馈内容至少5个字符',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (content.length > 500) {
      wx.showToast({
        title: '反馈内容不能超过500个字符',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({
      submitting: true
    })

    const config = require('../../config.js')
    const apiUrl = config.feedbackApi || `${config.apiBaseUrl}/feedback`

    // 准备用户信息
    const userInfo = this.data.userInfo || {}
    const requestData = {
      content: content,
      category: category || undefined,
      // 用户信息
      userInfo: {
        nickName: userInfo.nickName || '',
        avatarUrl: userInfo.avatarUrl || '',
        gender: userInfo.gender || 0, // 0: 未知, 1: 男, 2: 女
        country: userInfo.country || '',
        province: userInfo.province || '',
        city: userInfo.city || '',
        language: userInfo.language || ''
      }
    }

    wx.request({
      url: apiUrl,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: requestData,
      success: (res) => {
        console.log('提交反馈响应', res)
        
        if (res.statusCode === 200 && res.data && (res.data.success === true || res.data.success === undefined)) {
          wx.showToast({
            title: '提交成功，感谢您的反馈！',
            icon: 'success',
            duration: 2000
          })
          
          // 清空表单
          this.setData({
            feedbackContent: '',
            feedbackCategory: '',
            feedbackCategoryIndex: 0,
            submitting: false
          })
        } else {
          const errorMsg = res.data?.message || '提交失败，请稍后重试'
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
          this.setData({
            submitting: false
          })
        }
      },
      fail: (err) => {
        console.error('提交反馈失败', err)
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
          duration: 3000
        })
        this.setData({
          submitting: false
        })
      }
    })
  }
})

