Page({
  onShareAppMessage() {
    return {
      title: '话费助手',
      path: 'page/phone-helper/index'
    }
  },

  data: {
    theme: 'light',
    codes: [],
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

    // 加载话费助手数据
    this.fetchPhoneHelper()
  },

  // 从 API 获取话费助手数据
  fetchPhoneHelper() {
    const config = require('../../config.js')
    const apiUrl = config.phoneHelperApi || `${config.apiBaseUrl}/phone-helper`
    
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
        console.log('获取话费助手数据响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取话费助手数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取话费助手数据失败：返回数据为空')
          this.showError()
          return
        }

        let codes = []
        
        // 处理不同的返回格式
        if (Array.isArray(res.data)) {
          codes = res.data
        } else if (res.data.data && Array.isArray(res.data.data)) {
          codes = res.data.data
        } else if (res.data.codes && Array.isArray(res.data.codes)) {
          codes = res.data.codes
        }

        // 检查是否有有效数据
        if (!Array.isArray(codes) || codes.length === 0) {
          console.error('获取话费助手数据失败：返回格式不正确或数据为空')
          this.showError()
          return
        }

        // 标准化数据格式
        codes = codes.map(item => ({
          id: item.id || item._id || Math.random(),
          operator: item.operator || item.name || '未知运营商',
          balanceCode: item.balanceCode || item.balance || '',
          rechargeCode: item.rechargeCode || item.recharge || '',
          description: item.description || item.desc || ''
        }))

        this.setData({
          codes: codes,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取话费助手数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      codes: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchPhoneHelper()
  },

  // 复制代码
  copyCode(e) {
    const code = e.currentTarget.dataset.code
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        })
      }
    })
  },

  // 拨打电话代码
  callCode(e) {
    const code = e.currentTarget.dataset.code
    wx.makePhoneCall({
      phoneNumber: code,
      success: () => {
        console.log('拨打电话代码成功')
      },
      fail: (err) => {
        console.error('拨打电话代码失败', err)
        // 如果无法直接拨打，则复制到剪贴板
        this.copyCode(e)
      }
    })
  }
})

