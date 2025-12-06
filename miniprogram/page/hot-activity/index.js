Page({
  onShareAppMessage() {
    return {
      title: '热门活动',
      path: 'page/hot-activity/index'
    }
  },

  data: {
    theme: 'light',
    activities: [],
    loading: false,
    error: false
  },

  onLoad() {
    this.setData({
      theme: wx.getSystemInfoSync().theme || 'light'
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 加载热门活动数据
    this.fetchHotActivity()
  },

  // 从 API 获取热门活动数据
  fetchHotActivity() {
    const config = require('../../config.js')
    const apiUrl = config.hotActivityApi || `${config.apiBaseUrl}/hot-activity`
    
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
        console.log('获取热门活动数据响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取热门活动数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取热门活动数据失败：返回数据为空')
          this.showError()
          return
        }

        let activities = []
        
        // 处理不同的返回格式
        if (Array.isArray(res.data)) {
          activities = res.data
        } else if (res.data.data && Array.isArray(res.data.data)) {
          activities = res.data.data
        } else if (res.data.activities && Array.isArray(res.data.activities)) {
          activities = res.data.activities
        } else if (res.data.title || res.data.name) {
          // 单个对象格式
          activities = [{
            id: res.data.id || Math.random(),
            title: res.data.title || res.data.name || '活动',
            description: res.data.description || res.data.desc || ''
          }]
        }

        // 检查是否有有效数据
        if (!Array.isArray(activities) || activities.length === 0) {
          console.error('获取热门活动数据失败：返回格式不正确或数据为空')
          this.showError()
          return
        }

        // 标准化数据格式
        activities = activities.map(item => ({
          id: item.id || item._id || Math.random(),
          title: item.title || item.name || '活动',
          description: item.description || item.desc || ''
        }))

        this.setData({
          activities: activities,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取热门活动数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      activities: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchHotActivity()
  },

  // 查看活动详情
  viewActivity(e) {
    const activity = e.currentTarget.dataset.activity
    wx.showModal({
      title: activity.title,
      content: activity.description || '暂无详细描述',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})

