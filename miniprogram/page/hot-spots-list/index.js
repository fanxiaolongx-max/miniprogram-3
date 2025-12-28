const blogApi = require('../../utils/blogApi.js')
const { formatTimestamp } = require('../../util/util.js')

Page({
  onShareAppMessage() {
    return {
      title: '热门打卡',
      path: 'page/hot-spots-list/index'
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
    preloadTriggered: false, // 是否已触发预加载（防止重复触发）
    // 页面分类（用于API过滤）
    pageCategory: '热门打卡' // 固定分类，用于统一API请求
  },

  onLoad() {
    const systemInfo = require('../../utils/systemInfo.js')
    const { debounce } = require('../../utils/debounce.js')
    
    this.setData({
      theme: systemInfo.getTheme()
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

    this.fetchHotSpots()
  },

  // 从 API 获取热门打卡数据（统一使用blogApi.blogPostApi.getList）
  fetchHotSpots(isLoadMore = false, isPreload = false) {
    // 如果是加载更多，设置 loadingMore；否则设置 loading
    if (isLoadMore) {
      if (isPreload) {
        // 预加载时不显示 loadingMore，避免影响用户体验
        console.log('[fetchHotSpots] 预加载模式，不显示加载提示')
      } else {
        this.setData({
          loadingMore: true
        })
      }
    } else {
      this.setData({
        loading: true,
        page: 1,
        hasMore: true,
        preloadTriggered: false // 重置预加载标记
      })
    }

    // 构建请求参数（支持分页和过滤）
    // 如果是加载更多，应该请求下一页；如果是首次加载或过滤，请求第1页
    const currentPage = this.data.page
    const requestPage = isLoadMore ? (currentPage + 1) : 1
    const pageSize = this.data.pageSize
    
    // 获取过滤条件
    // 固定使用页面分类（热门打卡），同时支持子分类和搜索关键词
    const pageCategory = this.data.pageCategory || '热门打卡'
    const subCategory = this.data.selectedCategory || ''
    const keyword = (this.data.searchKeyword || '').trim()
    
    // 确定最终使用的分类：如果有子分类则使用子分类，否则使用页面分类
    const finalCategory = subCategory || pageCategory
    
    console.log('[fetchHotSpots] 请求参数:', {
      page: requestPage,
      pageSize: pageSize,
      category: finalCategory || '无',
      search: keyword || '无',
      isLoadMore: isLoadMore,
      isPreload: isPreload
    })
    
    // 使用统一的 blogApi.blogPostApi.getList API
    return blogApi.blogPostApi.getList({
      page: requestPage,
      pageSize: pageSize,
      category: finalCategory || undefined,
      search: keyword || undefined,
      published: 'true' // 只返回已发布的文章
    }).then((result) => {
      console.log('[fetchHotSpots] API响应:', result)
      
      let items = []
      let total = 0
      let hasMore = false

      // 处理新的API返回格式：{ success: true, data: [...], pagination: {...} }
      if (result && result.success && result.data && Array.isArray(result.data)) {
        items = result.data
        
        // 从 pagination 对象中提取分页信息
        if (result.pagination) {
          total = result.pagination.total || 0
          const currentPage = result.pagination.currentPage || requestPage
          const totalPages = result.pagination.totalPages || 0
          hasMore = currentPage < totalPages
        } else {
          // 如果没有 pagination 对象，使用旧逻辑
          total = result.total || items.length
          hasMore = result.hasMore !== undefined ? result.hasMore : (items.length >= pageSize)
        }
      } else if (result && result.data && Array.isArray(result.data)) {
        // 兼容没有 success 字段的格式
        items = result.data
        if (result.pagination) {
          total = result.pagination.total || 0
          const currentPage = result.pagination.currentPage || requestPage
          const totalPages = result.pagination.totalPages || 0
          hasMore = currentPage < totalPages
        } else {
          total = result.total || 0
          hasMore = result.hasMore !== undefined ? result.hasMore : (items.length >= pageSize)
        }
      } else if (Array.isArray(result)) {
        // 兼容直接返回数组的格式
        items = result
        hasMore = items.length >= pageSize
      } else {
        console.warn('[fetchHotSpots] 未识别的响应格式:', result)
        items = []
        hasMore = false
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
        return Promise.resolve()
      }

      // 标准化数据格式：将 title 字段映射为 name（如果存在）
      items = items.map(item => {
        // 如果API返回的是 title 而不是 name，进行映射
        if (!item.name && item.title) {
          item.name = item.title
        }
        return item
      })

      // 格式化时间戳并确保字段兼容性，并提取浏览量和发布者信息
      items = items.map(item => {
        // 提取浏览量
        const views = item.views || 0
        const formattedViews = this.formatViews(views)
        
        // 提取发布者信息（从custom_fields中获取）
        let authorInfo = null
        if (item.custom_fields) {
          try {
            const customFields = typeof item.custom_fields === 'string' 
              ? JSON.parse(item.custom_fields) 
              : item.custom_fields
            
            if (customFields && (customFields.nickname || customFields.phone || customFields.deviceModel)) {
              authorInfo = {
                nickname: customFields.nickname || null,
                phone: customFields.phone || null,
                deviceModel: customFields.deviceModel || null
              }
            }
          } catch (e) {
            console.warn('[fetchHotSpots] 解析custom_fields失败:', e)
          }
        }
        
        // 如果没有从custom_fields获取到，尝试直接从文章对象获取（向后兼容）
        if (!authorInfo && (item.nickname || item.phone || item.deviceModel)) {
          authorInfo = {
            nickname: item.nickname || null,
            phone: item.phone || null,
            deviceModel: item.deviceModel || null
          }
        }
        
        return {
          ...item,
          createdAt: formatTimestamp(item.createdAt),
          updatedAt: formatTimestamp(item.updatedAt),
          // 确保字段兼容性
          name: item.name || item.title || '未知地点',
          title: item.title || item.name || '打卡地详情',
          description: item.description || item.desc || '',
          image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg',
          category: item.category || item.apiName || '',
          htmlContent: item.htmlContent || '',
          meta: item.meta || item.date || item.createdAt || '',
          published: item.published !== false,
          // 保留原有字段用于兼容
          latitude: (item.latitude !== undefined && item.latitude !== null) ? parseFloat(item.latitude) : null,
          longitude: (item.longitude !== undefined && item.longitude !== null) ? parseFloat(item.longitude) : null,
          phone: item.phone || null,
          // 浏览量和发布者信息
          views: views,
          formattedViews: formattedViews,
          authorInfo: authorInfo
        }
      })

      if (isLoadMore) {
        const existingItems = Array.isArray(this.data.items) ? this.data.items : []
        this.setData({
          items: Array.isArray(items) ? [...existingItems, ...items] : existingItems,
          page: requestPage,
          hasMore: hasMore,
          loadingMore: false,
          preloading: false
        })
      } else {
        this.setData({
          items: Array.isArray(items) ? items : [],
          page: requestPage,
          hasMore: hasMore,
          loading: false,
          error: false
        })
      }

      // 应用过滤（主要是客户端搜索过滤）
      this.applyFilters()
      return Promise.resolve()
    }).catch((error) => {
      console.error('[fetchHotSpots] 失败:', error)
      
      if (isLoadMore) {
        this.setData({ 
          loadingMore: false, 
          preloading: false 
        })
        wx.showToast({
          title: '加载失败，请重试',
          icon: 'none',
          duration: 2000
        })
      } else {
        this.setData({
          loading: false,
          error: true,
          errorMessage: error.message || '获取数据失败'
        })
        wx.showToast({
          title: error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
      return Promise.reject(error)
    })
  },

  // 应用过滤（客户端搜索过滤）
  applyFilters() {
    const { items, searchKeyword } = this.data
    // 确保items是数组
    const safeItems = Array.isArray(items) ? items : []
    let filtered = [...safeItems]

    // 注意：分类过滤已经在API层面完成（通过 category 参数），不需要客户端再次过滤
    // 只需要处理搜索关键词的客户端过滤（如果API的搜索功能不够完善，可以在这里补充）
    if (searchKeyword && searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(item => {
        const name = (item.name || '').toLowerCase()
        const description = (item.description || '').toLowerCase()
        return name.includes(keyword) || description.includes(keyword)
      })
    }

    this.setData({
      filteredItems: Array.isArray(filtered) ? filtered : []
    })
  },

  // 格式化浏览量
  formatViews(views) {
    if (!views || views === 0) {
      return '0'
    }
    if (views < 1000) {
      return String(views)
    } else if (views < 10000) {
      return (views / 1000).toFixed(1) + 'k'
    } else {
      return (views / 10000).toFixed(1) + 'w'
    }
  },

  // 滚动到底部 - 已禁用自动加载，仅保留日志
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
        
        // 保存到页面数据中，用于加载完成后恢复
        this._savedScrollTop = scrollTop
        
        // 调用加载函数
        this.fetchHotSpots(true, false) // 第二个参数 false 表示不是预加载
      }).exec()
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    // 下拉刷新时保持当前的过滤条件，只重置页码
    this.setData({
      page: 1,
      hasMore: true,
      items: [],
      filteredItems: [],
      preloadTriggered: false // 重置预加载标记
    })
    this.fetchHotSpots(false)
    // 注意：fetchHotSpots 内部会设置 loading: false，这里延迟停止下拉刷新
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
    this.fetchHotSpots()
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
    this.fetchHotSpots(false)
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

  viewDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    const title = item.title || item.name || ''
    
    // 统一使用文章ID跳转，与发现页保持一致
    // 列表API不再返回htmlContent，统一通过文章ID获取详情
    // 这样可以减少列表API响应体积，提升加载速度，并获取完整信息（浏览量、作者信息等）
    wx.navigateTo({
      url: `/page/article-detail/index?id=${encodeURIComponent(item.id)}&title=${encodeURIComponent(title)}`
    })
  },

  openLocation(e) {
    e.stopPropagation && e.stopPropagation()
    const item = e.currentTarget.dataset.item
    
    if (!item) {
      wx.showToast({
        title: '位置信息不完整',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 提取并验证经纬度 - 优先使用已存储的值，如果没有则从原始字段提取
    let latitude = item.latitude
    let longitude = item.longitude
    
    // 如果存储的值是 null，尝试从原始字段提取
    if (latitude === null || latitude === undefined) {
      latitude = item.lat
    }
    if (longitude === null || longitude === undefined) {
      longitude = item.lng || item.lon
    }
    
    // 转换为数字类型
    latitude = parseFloat(latitude)
    longitude = parseFloat(longitude)
    
    // 验证经纬度是否为有效数字且在合理范围内
    if (isNaN(latitude) || isNaN(longitude) || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      wx.showToast({
        title: '位置信息不完整',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 确保值是精确的数字类型，避免浮点数精度问题
    const finalLatitude = parseFloat(latitude.toFixed(6))
    const finalLongitude = parseFloat(longitude.toFixed(6))
    
    wx.openLocation({
      latitude: finalLatitude,
      longitude: finalLongitude,
      name: item.name || item.title || '位置',
      address: item.address || item.description || '',
      scale: 18,
      success: () => {
        console.log('[openLocation] 打开地图成功')
      },
      fail: (err) => {
        console.error('[openLocation] 打开地图失败', err)
        wx.showToast({
          title: err.errMsg || '打开地图失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  makePhoneCall(e) {
    e.stopPropagation && e.stopPropagation()
    const item = e.currentTarget.dataset.item
    const phone = item.phone || ''
    
    if (!phone) {
      wx.showToast({
        title: '电话号码不存在',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 清理电话号码，只保留数字和+号
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    
    wx.makePhoneCall({
      phoneNumber: cleanPhone,
      success: () => {
        console.log('[makePhoneCall] 拨打电话成功', cleanPhone)
      },
      fail: (err) => {
        console.error('[makePhoneCall] 拨打电话失败', err)
        // 如果拨打失败，尝试复制到剪贴板
        wx.setClipboardData({
          data: phone,
          success: () => {
            wx.showToast({
              title: '电话号码已复制',
              icon: 'success',
              duration: 2000
            })
          }
        })
      }
    })
  },

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
    console.warn(`[onImageError] 失败原因可能是：1) 域名未添加到微信公众平台的 downloadFile 白名单；2) 服务器未配置正确的 CORS 响应头；3) 服务器有防盗链限制`)
  }
})

