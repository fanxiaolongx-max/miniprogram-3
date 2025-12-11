Page({
  onShareAppMessage() {
    return {
      title: '防骗预警',
      path: 'page/blacklist/index'
    }
  },

  data: {
    theme: 'light',
    items: [],
    loading: false,
    error: false,
    // 分页相关
    page: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false
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

    // 加载黑名单数据
    this.fetchBlacklist()
  },

  // 从 API 获取黑名单数据
  fetchBlacklist(isLoadMore = false) {
    const config = require('../../config.js')
    const apiUrl = config.blacklistApi || `${config.apiBaseUrl}/blacklist`
    
    // 如果是加载更多，设置 loadingMore；否则设置 loading
    if (isLoadMore) {
      this.setData({
        loadingMore: true
      })
    } else {
      this.setData({
        loading: true,
        page: 1,
        hasMore: true
      })
    }

    // 构建请求参数
    const currentPage = this.data.page
    const requestPage = isLoadMore ? (currentPage + 1) : 1
    const pageSize = this.data.pageSize
    
    const url = `${apiUrl}?page=${requestPage}&pageSize=${pageSize}`
    
    console.log(`[fetchBlacklist] 请求参数：isLoadMore=${isLoadMore}, currentPage=${currentPage}, requestPage=${requestPage}, pageSize=${pageSize}`)

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取防骗预警数据响应', res)
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取防骗预警数据失败', res.statusCode, res.data)
          if (isLoadMore) {
            this.setData({ loadingMore: false })
          } else {
            this.showError()
          }
          return
        }

        if (!res.data) {
          console.error('获取防骗预警数据失败：返回数据为空')
          if (isLoadMore) {
            this.setData({ loadingMore: false })
          } else {
            this.showError()
          }
          return
        }

        let items = []
        let total = 0
        let hasMore = false

        // 处理分页返回格式（默认）：{ data: [...], total: 100, hasMore: true }
        if (res.data.data && Array.isArray(res.data.data)) {
          items = res.data.data
          total = res.data.total || 0
          hasMore = res.data.hasMore !== undefined ? res.data.hasMore : (items.length >= pageSize)
        }
        // 处理数组格式（format=array 时）：[...]
        else if (Array.isArray(res.data)) {
          items = res.data
          hasMore = items.length >= pageSize
        }
        // 兼容旧格式：{ blacklist: [...] }
        else if (res.data.blacklist && Array.isArray(res.data.blacklist)) {
          items = res.data.blacklist
          total = res.data.total || items.length
          hasMore = res.data.hasMore !== undefined ? res.data.hasMore : (items.length >= pageSize)
        }

        if (!Array.isArray(items)) {
          console.error('获取防骗预警数据失败：返回格式不正确')
          if (isLoadMore) {
            this.setData({ loadingMore: false })
          } else {
            this.showError()
          }
          return
        }

        // 如果没有数据且不是首次加载，说明没有更多了
        if (items.length === 0 && isLoadMore) {
          this.setData({
            loadingMore: false,
            hasMore: false
          })
          wx.showToast({
            title: '没有更多数据了',
            icon: 'none',
            duration: 1500
          })
          return
        }

        // 获取分类图标
        const getTypeIcon = (type) => {
          const iconMap = {
            '诈骗': '⚠️',
            '虚假信息': '📢',
            '网络诈骗': '💻',
            '电话诈骗': '📞',
            '租房诈骗': '🏠',
            '交易诈骗': '💰',
            '其他': '🚫'
          }
          return iconMap[type] || '⚠️'
        }

        // 标准化数据格式
        const newItems = items.map(item => {
          const type = item.type || item.category || ''
          return {
            id: item.id || item._id || Math.random(),
            title: item.title || item.name || '未知',
            description: item.description || item.desc || '',
            type: type,
            typeIcon: getTypeIcon(type),
            date: item.date || item.createdAt || '',
            image: item.image || item.imageUrl || '',
            detailApi: item.detailApi || item.detailUrl || ''
          }
        })

        // 合并数据（加载更多时追加，首次加载时替换）
        const allItems = isLoadMore ? [...this.data.items, ...newItems] : newItems

        // 更新页码
        const nextPage = isLoadMore ? requestPage : 1
        
        this.setData({
          items: allItems,
          loading: false,
          loadingMore: false,
          error: false,
          hasMore: hasMore,
          page: nextPage
        })
      },
      fail: (err) => {
        console.error('获取防骗预警数据失败', err)
        if (isLoadMore) {
          this.setData({ loadingMore: false })
          wx.showToast({
            title: '加载失败，请重试',
            icon: 'none',
            duration: 2000
          })
        } else {
          this.showError()
        }
      }
    })
  },

  // 手动点击加载更多按钮
  loadMore() {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.loading) {
      console.log('[loadMore] 用户点击加载更多按钮，当前页码:', this.data.page)
      this.fetchBlacklist(true)
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      items: []
    })
    this.fetchBlacklist(false)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
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
    this.fetchBlacklist()
  },

  // 查看详情
  viewItem(e) {
    const item = e.currentTarget.dataset.item
    
    // 如果有detailApi，调用API获取HTML内容并展示
    if (item.detailApi) {
      wx.navigateTo({
        url: `/page/article-detail/index?apiUrl=${encodeURIComponent(item.detailApi)}`
      })
    } else {
      // 如果没有detailApi，保持原来的逻辑（显示弹窗）
      wx.showModal({
        title: item.title,
        content: `${item.type ? `类型：${item.type}\n\n` : ''}${item.description || '暂无详细描述'}${item.date ? `\n\n发布时间：${item.date}` : ''}`,
        showCancel: false,
        confirmText: '知道了',
        confirmColor: '#ff9500'
      })
    }
  },

  onImageError(e) {
    const index = e.currentTarget.dataset.index
    const itemId = e.currentTarget.dataset.id
    const defaultImage = '/page/component/resources/pic/1.jpg'
    
    // 优先使用 itemId 查找
    if (itemId) {
      const items = this.data.items
      
      // 更新 items 中的图片
      const itemInItems = items.find(item => String(item.id) === String(itemId))
      if (itemInItems && itemInItems.image && itemInItems.image !== defaultImage) {
        itemInItems.image = defaultImage
        this.setData({ items })
      }
    } else {
      // 兼容旧逻辑：使用 index
      const items = this.data.items
      if (items[index] && items[index].image && items[index].image !== defaultImage) {
        items[index].image = defaultImage
        this.setData({ items })
      }
    }
    
    console.warn(`[onImageError] 图片加载失败，已使用默认占位图: index=${index}, id=${itemId || 'unknown'}`)
  }
})

