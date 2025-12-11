Page({
  onShareAppMessage() {
    return {
      title: '尼罗河热映',
      path: 'page/nile-hot/index'
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

    this.fetchNileHot()
  },

  fetchNileHot(isLoadMore = false) {
    const config = require('../../config.js')
    const apiUrl = config.nileHotApi || `${config.apiBaseUrl}/nile-hot`
    
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
    const currentPage = this.data.page
    const requestPage = isLoadMore ? (currentPage + 1) : 1
    const pageSize = this.data.pageSize
    
    // 获取过滤条件
    const category = this.data.selectedCategory || ''
    const keyword = (this.data.searchKeyword || '').trim()
    
    // 构建URL参数
    const params = [`page=${requestPage}`, `pageSize=${pageSize}`]
    if (category) {
      params.push(`category=${encodeURIComponent(category)}`)
    }
    if (keyword) {
      params.push(`keyword=${encodeURIComponent(keyword)}`)
    }
    
    const url = `${apiUrl}?${params.join('&')}`
    
    console.log(`[fetchNileHot] 请求参数：isLoadMore=${isLoadMore}, currentPage=${currentPage}, requestPage=${requestPage}, pageSize=${pageSize}, category=${category || '无'}, keyword=${keyword || '无'}`)

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取尼罗河热映响应', res)
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取尼罗河热映失败', res.statusCode, res.data)
          if (isLoadMore) {
            this.setData({ loadingMore: false })
          } else {
            this.showError()
          }
          return
        }

        if (!res.data) {
          console.error('获取尼罗河热映失败：返回数据为空')
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
          console.log(`[fetchNileHot] 分页数据：请求页 ${requestPage}，返回 ${items.length} 条，总计 ${total}，还有更多：${hasMore}`)
        }
        // 处理数组格式（format=array 时）：[...]
        else if (Array.isArray(res.data)) {
          items = res.data
          hasMore = items.length >= pageSize
          console.log(`[fetchNileHot] 数组格式：请求页 ${requestPage}，返回 ${items.length} 条，还有更多：${hasMore}`)
        }
        // 兼容旧格式：{ items: [...] }
        else if (res.data.items && Array.isArray(res.data.items)) {
          items = res.data.items
          total = res.data.total || items.length
          hasMore = res.data.hasMore !== undefined ? res.data.hasMore : (items.length >= pageSize)
        }

        if (!Array.isArray(items)) {
          console.error('获取尼罗河热映失败：返回格式不正确')
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
          name: item.name || item.title || '未知应用',
          description: item.description || item.desc || '',
          image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg',
          category: item.category || '',
          detailApi: item.detailApi || item.detailUrl || ''
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

        // 更新页码
        const nextPage = isLoadMore ? requestPage : 1
        console.log(`[fetchNileHot] 准备更新数据，请求页: ${requestPage}，更新后页码: ${nextPage}，isLoadMore: ${isLoadMore}`)
        
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
          console.log(`[fetchNileHot] setData 完成，请求页: ${requestPage}，更新后页码: ${nextPage}，hasMore: ${hasMore}，items数量: ${allItems.length}`)
          
          // 如果是加载更多，恢复滚动位置
          if (isLoadMore && this._savedScrollTop !== undefined && this._savedScrollTop > 0) {
            setTimeout(() => {
              wx.pageScrollTo({
                scrollTop: this._savedScrollTop,
                duration: 0
              })
              console.log(`[fetchNileHot] 恢复滚动位置到: ${this._savedScrollTop}px`)
              this._savedScrollTop = 0
            }, 100)
          }
        })
      },
      fail: (err) => {
        console.error('获取尼罗河热映失败', err)
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

  // 滚动到底部 - 已禁用自动加载
  onReachBottom() {
    console.log('[onReachBottom] 触发，但已禁用自动加载，用户需手动点击"加载更多"按钮')
  },

  // 手动点击加载更多按钮
  loadMore() {
    if (this.data.hasMore && !this.data.loadingMore && !this.data.preloading && !this.data.loading) {
      console.log('[loadMore] 用户点击加载更多按钮，当前页码:', this.data.page)
      
      // 保存当前滚动位置
      wx.createSelectorQuery().in(this).selectViewport().scrollOffset((res) => {
        const scrollTop = res ? res.scrollTop : 0
        console.log(`[loadMore] 保存当前滚动位置: ${scrollTop}px`)
        
        this._savedScrollTop = scrollTop
        
        // 调用加载函数
        this.fetchNileHot(true)
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
    this.fetchNileHot(false)
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 500)
  },

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

  retry() {
    this.fetchNileHot()
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
    
    // 重新请求数据
    this.fetchNileHot(false)
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

  // 打开应用（如果有detailApi则调用API获取HTML内容，否则显示详情）
  openApp(e) {
    const item = e.currentTarget.dataset.item
    
    if (item.detailApi) {
      // 如果有detailApi，调用API获取HTML内容并展示
      wx.navigateTo({
        url: `/page/article-detail/index?apiUrl=${encodeURIComponent(item.detailApi)}`
      })
    } else {
      // 如果没有detailApi，显示详情
      wx.showModal({
        title: item.name,
        content: item.description || '暂无描述',
        showCancel: false,
        confirmText: '知道了'
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
      // 兼容旧逻辑：使用 index
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
  }
})
