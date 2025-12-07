Page({
  onShareAppMessage() {
    return {
      title: '问路卡片 - 中阿互译',
      path: 'page/translation/index'
    }
  },

  data: {
    theme: 'light',
    phrases: [],
    loading: false,
    categories: [],
    selectedCategory: 'all',
    error: false,
    showModal: false,
    currentPhrase: {}
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

    // 加载翻译数据
    this.fetchTranslation()
  },

  // 从 API 获取翻译数据
  fetchTranslation() {
    const config = require('../../config.js')
    const apiUrl = config.translationApi || `${config.apiBaseUrl}/translation`
    
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
        console.log('获取翻译数据响应', res)
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取翻译数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取翻译数据失败：返回数据为空')
          this.showError()
          return
        }

        let phrases = []
        
        // 处理不同的返回格式
        if (Array.isArray(res.data)) {
          phrases = res.data
        } else if (res.data.data && Array.isArray(res.data.data)) {
          phrases = res.data.data
        } else if (res.data.phrases && Array.isArray(res.data.phrases)) {
          phrases = res.data.phrases
        }

        // 检查是否有有效数据
        if (!Array.isArray(phrases) || phrases.length === 0) {
          console.error('获取翻译数据失败：返回格式不正确或数据为空')
          this.showError()
          return
        }

        // 标准化数据格式
        phrases = phrases.map(item => ({
          id: item.id || item._id || Math.random(),
          chinese: item.chinese || item.zh || item.text || '',
          arabic: item.arabic || item.ar || item.translation || '',
          category: item.category || item.type || '其他'
        }))

        // 提取分类
        const categories = ['all', ...new Set(phrases.map(p => p.category))]

        this.setData({
          phrases: phrases,
          categories: categories,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取翻译数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      phrases: [],
      categories: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchTranslation()
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category
    })
  },

  // 显示短语（全屏弹窗）
  showPhrase(e) {
    const phrase = e.currentTarget.dataset.phrase
    this.setData({
      showModal: true,
      currentPhrase: phrase
    })
  },

  // 隐藏弹窗
  hidePhrase() {
    this.setData({
      showModal: false
    })
  },

  // 复制阿拉伯文
  copyArabic(e) {
    const text = e.currentTarget.dataset.text || this.data.currentPhrase.arabic
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制阿语',
          icon: 'success'
        })
      }
    })
  },

  // 复制中文
  copyChinese(e) {
    const text = e.currentTarget.dataset.text || this.data.currentPhrase.chinese
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制中文',
          icon: 'success'
        })
      }
    })
  }
})

