Page({
  onShareAppMessage() {
    return {
      title: '租房/酒店',
      path: 'page/rental-list/index'
    }
  },

  data: {
    theme: 'light',
    items: [],
    filteredItems: [],
    loading: false,
    error: false,
    searchKeyword: '',
    selectedCategory: '',
    categories: ['全部'], // 动态从API数据中提取
    // 分页相关
    page: 1,
    pageSize: 20, // 每页加载数量
    hasMore: true, // 是否还有更多数据
    loadingMore: false, // 是否正在加载更多
    preloading: false, // 是否正在预加载
    preloadTriggered: false // 是否已触发预加载（防止重复触发）
  },

  onLoad() {
    const { debounce } = require('../../utils/debounce.js')
    
    this.setData({
      theme: (() => {
        const systemInfo = require('../../utils/systemInfo.js')
        return systemInfo.getTheme()
      })()
    })
    
    // 初始化保存的滚动位置
    this._savedScrollTop = 0

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 创建防抖搜索函数（500ms延迟）
    this.debouncedSearch = debounce(() => {
      this.handleSearchOrFilter()
    }, 500)

    // 加载租房数据
    this.fetchRentals()
  },

  // 从 API 获取租房数据
  fetchRentals(isLoadMore = false) {
    const config = require('../../config.js')
    const apiUrl = config.rentalsApi || `${config.apiBaseUrl}/rentals`
    
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

    // 构建请求参数（支持分页和过滤）
    // 如果是加载更多，应该请求下一页；如果是首次加载或过滤，请求第1页
    const currentPage = this.data.page
    const requestPage = isLoadMore ? (currentPage + 1) : 1
    const pageSize = this.data.pageSize
    
    // 获取过滤条件（两个独立的过滤条件，可以单独使用或组合使用）
    // category: 分类过滤（精确匹配 category 字段）
    // keyword: 全文搜索（搜索 title、address 等多个字段）
    const category = this.data.selectedCategory || ''
    const keyword = (this.data.searchKeyword || '').trim()
    
    // 构建URL参数
    const params = [`page=${requestPage}`, `pageSize=${pageSize}`]
    // 分类过滤：只传有值的分类
    if (category) {
      params.push(`category=${encodeURIComponent(category)}`)
    }
    // 关键词搜索：只传有值的关键词
    if (keyword) {
      params.push(`keyword=${encodeURIComponent(keyword)}`)
    }
    // 注意：如果两个条件都有值，会同时传递，后端会组合过滤
    
    const url = `${apiUrl}?${params.join('&')}`
    
    console.log(`[fetchRentals] 请求参数：isLoadMore=${isLoadMore}, currentPage=${currentPage}, requestPage=${requestPage}, pageSize=${pageSize}, category=${category || '无'}, keyword=${keyword || '无'}`)

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取租房数据响应', res)
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取租房数据失败', res.statusCode, res.data)
          if (isLoadMore) {
            this.setData({ loadingMore: false })
          } else {
            this.showError()
          }
          return
        }

        if (!res.data) {
          console.error('获取租房数据失败：返回数据为空')
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
          console.log(`[fetchRentals] 分页数据：请求页 ${requestPage}，返回 ${items.length} 条，总计 ${total}，还有更多：${hasMore}`)
        }
        // 处理数组格式（format=array 时）：[...]
        else if (Array.isArray(res.data)) {
          items = res.data
          // 如果返回数组，根据返回数量判断是否还有更多
          hasMore = items.length >= pageSize
          console.log(`[fetchRentals] 数组格式：请求页 ${requestPage}，返回 ${items.length} 条，还有更多：${hasMore}`)
        }
        // 兼容旧格式：{ rentals: [...] }
        else if (res.data.rentals && Array.isArray(res.data.rentals)) {
          items = res.data.rentals
          total = res.data.total || items.length
          hasMore = res.data.hasMore !== undefined ? res.data.hasMore : (items.length >= pageSize)
        }

        if (!Array.isArray(items)) {
          console.error('获取租房数据失败：返回格式不正确')
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

        const newItems = items.map(item => ({
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
          contact: item.contact || item.phone || '联系方式：请咨询',
          category: item.category || ''
        }))

        // 合并数据（加载更多时追加，首次加载时替换）
        const allItems = isLoadMore ? [...this.data.items, ...newItems] : newItems

        // 从所有数据中提取分类（只在首次加载时更新分类）
        let categories = this.data.categories
        if (!isLoadMore) {
          const categorySet = new Set()
          allItems.forEach(item => {
            if (item.category) {
              categorySet.add(item.category)
            }
          })
          categories = ['全部', ...Array.from(categorySet).sort()]
        }

        // 更新页码：加载更多时页码+1，首次加载时重置为1
        const nextPage = isLoadMore ? requestPage : 1
        console.log(`[fetchRentals] 准备更新数据，请求页: ${requestPage}，更新后页码: ${nextPage}，isLoadMore: ${isLoadMore}`)
        
        this.setData({
          items: allItems,
          filteredItems: allItems, // 后端已过滤，直接使用返回的数据
          categories: categories,
          loading: false,
          loadingMore: false,
          error: false,
          hasMore: hasMore,
          page: nextPage
        }, () => {
          console.log(`[fetchRentals] setData 完成，请求页: ${requestPage}，更新后页码: ${nextPage}，hasMore: ${hasMore}，items数量: ${allItems.length}`)
          
          // 如果是加载更多，恢复滚动位置
          if (isLoadMore && this._savedScrollTop !== undefined && this._savedScrollTop > 0) {
            // 延迟恢复，确保DOM已更新
            setTimeout(() => {
              wx.pageScrollTo({
                scrollTop: this._savedScrollTop,
                duration: 0 // 立即滚动，无动画
              })
              console.log(`[fetchRentals] 恢复滚动位置到: ${this._savedScrollTop}px`)
              // 重置保存的滚动位置
              this._savedScrollTop = 0
            }, 100)
          }
        })
      },
      fail: (err) => {
        console.error('获取租房数据失败', err)
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

  // 滚动到底部 - 已禁用自动加载，仅保留日志
  onReachBottom() {
    console.log('[onReachBottom] 触发，但已禁用自动加载，用户需手动点击"加载更多"按钮')
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      items: [],
      filteredItems: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchRentals()
  },

  // 处理搜索或过滤变化（重置页码并请求）
  handleSearchOrFilter() {
    console.log('[handleSearchOrFilter] 搜索或过滤条件变化，重置页码并请求数据')
    
    // 重置页码为1，清空列表，回顶
    this.setData({
      page: 1,
      items: [],
      filteredItems: [],
      hasMore: true
    })
    
    // 回顶
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
    
    // 重新请求数据（不带isLoadMore参数，表示首次加载）
    this.fetchRentals(false)
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    const newCategory = category === '全部' ? '' : category
    
    // 如果分类没有变化，不处理
    if (this.data.selectedCategory === newCategory) {
      return
    }
    
    console.log(`[selectCategory] 分类变化：${this.data.selectedCategory} -> ${newCategory}`)
    
    this.setData({
      selectedCategory: newCategory
    })
    
    // 重置页码并请求
    this.handleSearchOrFilter()
  },

  // 搜索输入（防抖处理）
  onSearchInput(e) {
    const keyword = e.detail.value || ''
    
    // 更新搜索关键词（立即更新UI）
    this.setData({
      searchKeyword: keyword
    })
    
    // 如果关键词为空，立即请求（取消搜索）
    if (!keyword.trim()) {
      console.log('[onSearchInput] 搜索关键词为空，立即请求')
      this.handleSearchOrFilter()
    } else {
      // 否则使用防抖，等待用户输入稳定后再请求
      console.log('[onSearchInput] 搜索关键词变化，等待防抖...')
      this.debouncedSearch()
    }
  },

  // 手动点击加载更多按钮
  loadMore() {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.preloading && !this.data.loading) {
      console.log('[loadMore] 用户点击加载更多按钮，当前页码:', this.data.page)
      
      // 保存当前滚动位置
      wx.createSelectorQuery().in(this).selectViewport().scrollOffset((res) => {
        const scrollTop = res ? res.scrollTop : 0
        console.log(`[loadMore] 保存当前滚动位置: ${scrollTop}px`)
        
        // 保存到页面数据中，用于加载完成后恢复
        this._savedScrollTop = scrollTop
        
        // 调用加载函数
        this.fetchRentals(true) // rental-list 没有预加载参数
      }).exec()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      items: [],
      filteredItems: []
    })
    this.fetchRentals(false)
    // 注意：fetchRentals 内部会设置 loading: false，这里延迟停止下拉刷新
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

  // 查看详情
  viewDetail(e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: item.title,
      content: `价格：${item.price} EGP/月\n地址：${item.address}\n类型：${item.type}\n房间：${item.rooms}室\n面积：${item.area}㎡\n\n联系方式：${item.contact}`,
      showCancel: true,
      cancelText: '关闭',
      confirmText: '联系',
      success: (res) => {
        if (res.confirm) {
          this.contactOwner(item)
        }
      }
    })
  },

  // 联系房东
  contactOwner(e) {
    const item = typeof e === 'object' && e.currentTarget ? e.currentTarget.dataset.item : e
    const contact = item.contact || item.phone || ''
    
    if (contact.includes('微信') || contact.includes('微信')) {
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showToast({
            title: '联系方式已复制',
            icon: 'success'
          })
        }
      })
    } else if (/^1[3-9]\d{9}$/.test(contact.replace(/\D/g, ''))) {
      // 手机号
      const phone = contact.replace(/\D/g, '')
      wx.makePhoneCall({
        phoneNumber: phone,
        fail: () => {
          wx.setClipboardData({
            data: contact,
            success: () => {
              wx.showToast({
                title: '联系方式已复制',
                icon: 'success'
              })
            }
          })
        }
      })
    } else {
      wx.setClipboardData({
        data: contact,
        success: () => {
          wx.showToast({
            title: '联系方式已复制',
            icon: 'success'
          })
        }
      })
    }
  },

  // 处理图片加载错误
  onImageError(e) {
    const index = e.currentTarget.dataset.index
    const itemId = e.currentTarget.dataset.id
    const defaultImage = '/page/component/resources/pic/1.jpg'
    
    // 优先使用 itemId 查找，如果没有则使用 index
    if (itemId) {
      const items = this.data.items
      const filteredItems = this.data.filteredItems
      
      // 更新 items 中的图片
      const itemInItems = items.find(item => String(item.id) === String(itemId))
      if (itemInItems && itemInItems.image !== defaultImage) {
        itemInItems.image = defaultImage
        this.setData({ items })
      }
      
      // 更新 filteredItems 中的图片
      const itemInFiltered = filteredItems.find(item => String(item.id) === String(itemId))
      if (itemInFiltered && itemInFiltered.image !== defaultImage) {
        itemInFiltered.image = defaultImage
        this.setData({ filteredItems })
      }
    } else {
      // 兼容旧逻辑：使用 index（可能不准确，因为 filteredItems 和 items 的索引可能不一致）
      const filteredItems = this.data.filteredItems
      if (filteredItems[index] && filteredItems[index].image !== defaultImage) {
        filteredItems[index].image = defaultImage
        this.setData({ filteredItems })
        
        // 同时更新 items 中对应的项
        const itemId = filteredItems[index].id
        const items = this.data.items
        const itemInItems = items.find(item => String(item.id) === String(itemId))
        if (itemInItems) {
          itemInItems.image = defaultImage
          this.setData({ items })
        }
      }
    }
    
    console.warn(`[onImageError] 图片加载失败，已使用默认占位图: index=${index}, id=${itemId || 'unknown'}`)
  },

})

