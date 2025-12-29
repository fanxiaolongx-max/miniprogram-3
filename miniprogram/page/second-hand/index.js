Page({
  onShareAppMessage() {
    return {
      title: '二手集市',
      path: 'page/second-hand/index'
    }
  },

  data: {
    theme: 'light',
    items: [],
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

    // 加载二手集市数据
    this.fetchSecondHand()
  },

  // 从 API 获取二手集市数据
  fetchSecondHand() {
    const blogApi = require('../../utils/blogApi.js')
    
    this.setData({
      loading: true
    })

    blogApi.blogPostApi.getList({
      category: '二手市场',
      page: 1,
      pageSize: 100  // 获取所有数据
    }).then((result) => {
      console.log('获取二手集市数据响应', result)
      
      // 处理新的响应格式：{success, data, pagination}
      let items = []
      if (result.success && result.data && Array.isArray(result.data)) {
        items = result.data
      } else if (Array.isArray(result)) {
        items = result
      }

      // 检查是否有有效数据
      if (!Array.isArray(items) || items.length === 0) {
        console.warn('获取二手集市数据：返回数据为空')
        this.setData({
          items: [],
          loading: false,
          error: false
        })
        return
      }

      // 标准化数据格式
      items = items.map(item => ({
        id: item.id || item._id || Math.random(),
        title: item.title || item.name || '未知商品',
        price: item.price || item.amount || '0',
        description: item.description || item.excerpt || item.desc || '',
        image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg',
        contact: item.contact || item.phone || '',
        category: item.category || item.type || ''
      }))

      this.setData({
        items: items,
        loading: false,
        error: false
      })
    }).catch((error) => {
      console.error('获取二手集市数据失败', error)
      this.showError()
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      items: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchSecondHand()
  },

  // 查看商品详情
  viewItem(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: item.title,
      content: `价格：${item.price} EGP\n\n${item.description || ''}\n\n联系方式：${item.contact}`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  // 复制联系方式
  copyContact(e) {
    const contact = e.currentTarget.dataset.contact
    wx.setClipboardData({
      data: contact,
      success: () => {
        wx.showToast({
          title: '已复制联系方式',
          icon: 'success'
        })
      }
    })
  },

  // 处理图片加载错误
  onImageError(e) {
    const index = e.currentTarget.dataset.index
    const items = this.data.items
    if (items[index]) {
      items[index].image = '/page/component/resources/pic/1.jpg'
      this.setData({ items })
    }
  }
})

