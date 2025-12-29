const blogApi = require('../../utils/blogApi.js')
const { formatTimestamp } = require('../../util/util.js')
const authHelper = require('../../utils/authHelper.js')

Page({
  onShareAppMessage() {
    return {
      title: '文章管理',
      path: 'page/article-admin/index'
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
    categories: ['全部'],
    // 分页相关
    page: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false,
    preloading: false,
    preloadTriggered: false,
    // API列表（用于创建文章时选择分类）
    apiList: []
  },

  onLoad() {
    const systemInfo = require('../../utils/systemInfo.js')
    const { debounce } = require('../../utils/debounce.js')
    
    this.setData({
      theme: systemInfo.getTheme()
    })
    
    this._savedScrollTop = 0

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 创建防抖搜索函数
    this.debouncedSearch = debounce(() => {
      this.handleSearchOrFilter()
    }, 500)

    // 加载API列表（用于创建文章时选择分类）
    this.loadApiList()
    
    // 加载文章列表
    this.fetchArticles()
  },

  onShow() {
    // 从编辑页面返回时刷新列表
    if (this._needRefresh) {
      this._needRefresh = false
      this.fetchArticles()
    }
  },

  // 加载API列表
  async loadApiList() {
    try {
      const result = await blogApi.apiConfigApi.getList()
      if (result.success && result.data) {
        this.setData({
          apiList: result.data
        })
      }
    } catch (error) {
      console.error('加载API列表失败:', error)
    }
  },

  // 获取文章列表
  fetchArticles(isLoadMore = false, isPreload = false) {
    if (isLoadMore) {
      if (isPreload) {
        console.log('[fetchArticles] 预加载模式')
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
        preloadTriggered: false,
        error: false
      })
    }

    const currentPage = this.data.page
    const requestPage = isLoadMore ? (currentPage + 1) : 1
    const pageSize = this.data.pageSize
    
    const category = this.data.selectedCategory || ''
    const keyword = (this.data.searchKeyword || '').trim()
    
    blogApi.articleApi.getList({
      page: requestPage,
      pageSize: pageSize,
      category: category || undefined,
      keyword: keyword || undefined
    }).then((result) => {
      console.log('[fetchArticles] 响应:', result)
      
      let items = []
      let total = 0
      let hasMore = false

      // 处理不同的响应格式
      if (result && result.data && Array.isArray(result.data)) {
        // 格式1: {success: true, data: [...], total: 100}
        items = result.data
        total = result.total || 0
        hasMore = result.hasMore !== undefined ? result.hasMore : (items.length >= pageSize)
      } else if (Array.isArray(result)) {
        // 格式2: 直接数组 [...]
        items = result
        hasMore = items.length >= pageSize
      } else if (result && result.success && result.data && Array.isArray(result.data)) {
        // 格式3: {success: true, data: [...]}
        items = result.data
        total = result.total || 0
        hasMore = result.hasMore !== undefined ? result.hasMore : (items.length >= pageSize)
      } else {
        // 格式4: 空数据或其他格式
        console.warn('[fetchArticles] 未识别的响应格式:', result)
        items = []
        hasMore = false
      }

      // 过滤掉非文章数据（确保只显示真正的文章）
      // 文章必须有id和name字段，且不应该只是分类名称
      const originalCount = items.length
      items = items.filter(item => {
        // 必须有id字段
        if (!item.id) {
          return false
        }
        
        // 必须有name字段
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          return false
        }
        
        // 检查是否是分类数据
        // 分类数据通常只有name和category/apiName字段，没有文章相关字段
        // 文章应该至少有以下字段之一：htmlContent、description、excerpt、slug、published、createdAt等
        const hasArticleFields = 
          item.htmlContent !== undefined ||  // 有HTML内容（即使为空）
          item.description !== undefined ||  // 有描述
          item.excerpt !== undefined ||       // 有摘要
          item.slug !== undefined ||          // 有slug
          item.published !== undefined ||     // 有发布状态
          item.createdAt !== undefined ||     // 有创建时间
          item.updatedAt !== undefined        // 有更新时间
        
        // 如果完全没有文章字段，可能是分类数据
        if (!hasArticleFields) {
          console.warn('[fetchArticles] 过滤掉疑似分类数据（缺少文章字段）:', item.name, item)
          return false
        }
        
        return true
      })
      
      if (originalCount !== items.length) {
        console.log(`[fetchArticles] 过滤结果: 原始${originalCount}条，过滤后${items.length}条，过滤掉${originalCount - items.length}条非文章数据`)
      }

      console.log(`[fetchArticles] 解析结果: items=${items.length}, total=${total}, hasMore=${hasMore}`)

      // 获取当前登录用户信息
      const currentUser = authHelper.getLoginInfo()
      // 获取当前用户的deviceId（优先使用phone作为deviceId，与保存文章时的逻辑一致）
      const currentDeviceId = currentUser && currentUser.phone ? currentUser.phone.trim() : null
      
      // 格式化时间戳并检查编辑权限
      items = items.map(item => {
        // 提取文章的编辑者deviceId（从custom_fields或直接字段）
        let articleDeviceId = null
        if (item.custom_fields) {
          try {
            const customFields = typeof item.custom_fields === 'string' 
              ? JSON.parse(item.custom_fields) 
              : item.custom_fields
            if (customFields && customFields.deviceId) {
              articleDeviceId = customFields.deviceId
            }
          } catch (e) {
            console.warn('[fetchArticles] 解析custom_fields失败:', e)
          }
        }
        
        // 如果没有从custom_fields获取到，尝试直接从文章对象获取
        if (!articleDeviceId && item.deviceId) {
          articleDeviceId = item.deviceId
        }
        
        // 清理deviceId后比较
        const articleDeviceIdNormalized = articleDeviceId ? articleDeviceId.trim() : null
        
        // 判断是否允许编辑和删除：当前用户deviceId与文章编辑者deviceId一致
        const canEdit = currentDeviceId && articleDeviceIdNormalized && currentDeviceId === articleDeviceIdNormalized
        const canDelete = canEdit // 删除权限与编辑权限一致
        
        // 优先显示更新时间，如果没有更新时间再显示发布时间
        const displayTime = item.updatedAt ? formatTimestamp(item.updatedAt) : (item.createdAt ? formatTimestamp(item.createdAt) : '')
        
        return {
        ...item,
        createdAt: formatTimestamp(item.createdAt),
          updatedAt: formatTimestamp(item.updatedAt),
          displayTime: displayTime, // 显示时间（优先更新时间）
          canEdit: canEdit,
          canDelete: canDelete
        }
      })

      if (isLoadMore) {
        // 追加数据
        const existingItems = this.data.items || []
        this.setData({
          items: [...existingItems, ...items],
          page: requestPage,
          hasMore: hasMore,
          loadingMore: false,
          preloading: false
        })
      } else {
        // 替换数据
        this.setData({
          items: items,
          page: requestPage,
          hasMore: hasMore,
          loading: false,
          error: false
        })
      }

      // 更新分类列表
      this.updateCategories(items)

      // 应用过滤
      this.applyFilters()
    }).catch((error) => {
      console.error('[fetchArticles] 失败:', error)
      console.error('[fetchArticles] 错误详情:', error.message, error.stack)
      
      if (isLoadMore) {
        this.setData({ 
          loadingMore: false, 
          preloading: false 
        })
      } else {
        // 确保loading状态被重置
        this.setData({
          loading: false,
          error: true,
          errorMessage: error.message || '获取文章列表失败'
        })
        
        wx.showToast({
          title: error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  // 更新分类列表
  updateCategories(items) {
    const categories = new Set(['全部'])
    items.forEach(item => {
      if (item.category) {
        categories.add(item.category)
      }
      if (item.apiName) {
        categories.add(item.apiName)
      }
    })
    this.setData({
      categories: Array.from(categories)
    })
  },

  // 应用过滤
  applyFilters() {
    const { items, searchKeyword, selectedCategory } = this.data
    let filtered = [...items]

    // 分类过滤
    if (selectedCategory && selectedCategory !== '全部') {
      filtered = filtered.filter(item => 
        item.category === selectedCategory || item.apiName === selectedCategory
      )
    }

    // 关键词搜索
    if (searchKeyword.trim()) {
      const keyword = searchKeyword.toLowerCase()
      filtered = filtered.filter(item => {
        const name = (item.name || '').toLowerCase()
        const description = (item.description || '').toLowerCase()
        const excerpt = (item.excerpt || '').toLowerCase()
        return name.includes(keyword) || description.includes(keyword) || excerpt.includes(keyword)
      })
    }

    this.setData({
      filteredItems: filtered
    })
  },

  // 搜索输入
  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    this.debouncedSearch()
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category === '全部' ? '' : category
    })
    this.applyFilters()
  },

  // 处理搜索或过滤
  handleSearchOrFilter() {
    // 重置分页
    this.setData({
      page: 1,
      hasMore: true
    })
    // 重新获取数据
    this.fetchArticles()
  },

  // 查看详情
  viewDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    const title = item.title || item.name || ''
    
    // 列表API不再返回htmlContent，统一通过文章ID获取详情
    // 这样可以减少列表API响应体积，提升加载速度
    wx.navigateTo({
      url: `/page/article-detail/index?id=${encodeURIComponent(item.id)}&title=${encodeURIComponent(title)}`
    })
  },

  // 创建文章
  createArticle() {
    // 检查登录状态
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/page/my/index'
        })
      }, 1500)
      return
    }
    
    // 跳转到编辑页面（新建模式）
    wx.navigateTo({
      url: '/page/article-edit/index?mode=create'
    })
  },

  // 编辑文章
  editArticle(e) {
    // 检查登录状态
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/page/my/index'
        })
      }, 1500)
      return
    }
    
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    // 跳转到编辑页面（编辑模式）
    wx.navigateTo({
      url: `/page/article-edit/index?mode=edit&id=${item.id}`
    })
  },

  // 删除文章
  deleteArticle(e) {
    // 检查登录状态
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/page/my/index'
        })
      }, 1500)
      return
    }
    
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    wx.showModal({
      title: '确认删除',
      content: `确定要删除文章"${item.name || '未命名'}"吗？此操作不可恢复。`,
      confirmText: '删除',
      confirmColor: '#ff3b30',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(item.id)
        }
      }
    })
  },

  // 执行删除
  async performDelete(id) {
    // 再次检查登录状态（防止绕过前端检查）
    if (!authHelper.isLoggedInLocally()) {
      wx.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      })
      setTimeout(() => {
        wx.switchTab({
          url: '/page/my/index'
        })
      }, 1500)
      return
    }
    
    // 获取当前用户的deviceId（使用phone作为deviceId，与保存文章时的逻辑一致）
    const currentUser = authHelper.getLoginInfo()
    const deviceId = currentUser && currentUser.phone ? currentUser.phone.trim() : null
    
    if (!deviceId) {
      wx.showToast({
        title: '无法获取设备ID',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    wx.showLoading({
      title: '删除中...',
      mask: true
    })

    try {
      await blogApi.articleApi.delete(id, deviceId)
      wx.hideLoading()
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      })
      // 刷新列表
      this.fetchArticles()
    } catch (error) {
      wx.hideLoading()
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      })
    }
  },

  // 加载更多
  loadMore() {
    if (this.data.loadingMore || this.data.preloading || !this.data.hasMore) {
      return
    }
    this.fetchArticles(true, false)
  },

  // 重试
  retry() {
    this.fetchArticles()
  },

  // 显示错误
  showError(message) {
    console.error('[showError]', message)
    this.setData({
      loading: false,
      loadingMore: false,
      preloading: false,
      error: true,
      errorMessage: message || '获取数据失败，请稍后重试'
    })
  },

  // 图片加载错误
  onImageError(e) {
    console.log('图片加载失败:', e.detail)
    // 可以设置默认图片
  }
})

