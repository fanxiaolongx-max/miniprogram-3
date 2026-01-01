// 发现页面 - 显示文章管理内容
const blogApi = require('../../utils/blogApi.js')
const util = require('../../util/util.js')
const formatRelativeTime = util.formatRelativeTime
const authHelper = require('../../utils/authHelper.js')

Page({
  onShareAppMessage() {
    return {
      title: '发现',
      path: 'page/discover/index'
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
    showCategories: false, // 控制分类区域显示
    showMyPosts: false, // 是否仅显示我的发布
    // 需要排除的类别（默认不显示）- 支持部分匹配，如"汇率"会匹配"汇率转换"
    excludedCategories: ['汇率', '天气', '翻译'],
    // 分类映射：中文名称 -> 原始名称数组（用于合并相同中文的不同英文变体）
    categoryNameMap: {},
    // 分页相关
    page: 1,
    pageSize: 20,
    hasMore: true,
    loadingMore: false,
    preloading: false,
    preloadTriggered: false,
    // API列表（用于创建文章时选择分类）
    apiList: [],
    // 页面滚动位置
    scrollTop: 0
  },

  onLoad() {
    const systemInfo = require('../../utils/systemInfo.js')
    const { debounce } = require('../../utils/debounce.js')
    
    this.setData({
      theme: systemInfo.getTheme()
    })
    
    this._savedScrollTop = 0
    this._currentScrollTop = 0

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
    
    // 一次性加载所有分类列表，然后加载文章列表（确保分类列表加载完成后再请求文章，以便正确排除类别）
    this.loadAllCategories().then(() => {
      // 分类列表加载完成后，再加载文章列表（此时可以正确构建排除类别的请求参数）
      this.fetchArticles()
    }).catch(() => {
      // 即使分类列表加载失败，也尝试加载文章列表（会在客户端过滤）
      this.fetchArticles()
    })
  },

  onShow() {
    // 从编辑页面返回时刷新列表
    if (this._needRefresh) {
      this._needRefresh = false
      // 重置搜索和筛选条件，显示最新数据
      this.setData({
        searchKeyword: '',
        selectedCategory: '',
        page: 1,
        hasMore: true
      })
      // 刷新分类列表、API列表和文章列表
      Promise.all([
        this.loadAllCategories(),
        this.loadApiList(),
        this.fetchArticles()
      ]).then(() => {
        wx.showToast({
          title: '已更新',
          icon: 'success',
          duration: 1500
        })
      }).catch((error) => {
        console.error('[onShow] 刷新失败:', error)
      })
    }
  },

  // 页面滚动监听
  onPageScroll(e) {
    // 记录当前滚动位置
    this._currentScrollTop = e.scrollTop || 0
    // 更新数据中的滚动位置（用于调试）
    this.setData({
      scrollTop: this._currentScrollTop
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    console.log('[onPullDownRefresh] 下拉刷新触发')
    
    // 检查页面滚动位置，只有在顶部时才允许刷新
    const scrollTop = this._currentScrollTop || 0
    console.log('[onPullDownRefresh] 当前滚动位置:', scrollTop)
    
    // 如果不在顶部（允许5px的误差，因为可能有搜索框等固定元素），直接停止刷新
    if (scrollTop > 5) {
      console.log('[onPullDownRefresh] 不在顶部，取消刷新，当前scrollTop:', scrollTop)
      // 立即停止下拉刷新动画
      wx.stopPullDownRefresh()
      // 提示用户
      wx.showToast({
        title: '请回到顶部再刷新',
        icon: 'none',
        duration: 1500
      })
      return
    }
    
    // 在顶部，执行刷新逻辑
    this.performPullDownRefresh()
  },

  // 执行下拉刷新逻辑
  performPullDownRefresh() {
    // 重置搜索和筛选条件
    this.setData({
      searchKeyword: '',
      selectedCategory: '',
      showMyPosts: false, // 下拉刷新时取消选中"我的发布"，显示全部文章
      page: 1,
      hasMore: true
    })
    // 同时刷新分类列表、API列表和文章列表
    Promise.all([
      this.loadAllCategories(),
      this.loadApiList(),
      this.fetchArticles(false, false)
    ]).then(() => {
      // 刷新完成后停止下拉刷新动画
      wx.stopPullDownRefresh()
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1500
      })
    }).catch((error) => {
      console.error('[onPullDownRefresh] 刷新失败:', error)
      // 即使失败也要停止下拉刷新动画
      wx.stopPullDownRefresh()
    })
  },

  // 加载API列表
  async loadApiList() {
    try {
      const result = await blogApi.apiConfigApi.getList()
      if (result.success && result.data) {
        this.setData({
          apiList: Array.isArray(result.data) ? result.data : []
        })
      }
      return Promise.resolve()
    } catch (error) {
      console.error('加载API列表失败:', error)
      return Promise.reject(error)
    }
  },

  // 一次性加载所有分类列表（从API获取，不受文章加载影响）
  async loadAllCategories() {
    try {
      console.log('[loadAllCategories] 开始加载所有分类列表')
      const result = await blogApi.blogCategoryApi.getList()
      console.log('[loadAllCategories] API响应:', result)
      
      if (result && result.success && result.data && Array.isArray(result.data)) {
        // 提取分类名称，按名称排序
        const categoryNames = result.data.map(cat => cat.name).filter(name => name).sort()
        const categories = ['全部', ...categoryNames]
        
        console.log('[loadAllCategories] 加载成功，共', categories.length - 1, '个分类:', categoryNames)
        
        // 立即显示分类区域
        this.setData({
          categories: Array.isArray(categories) ? categories : ['全部'],
          showCategories: true // 立即显示分类区域
        })
        
        return Promise.resolve()
      } else {
        console.warn('[loadAllCategories] API返回格式不正确:', result)
        // 如果API返回格式不正确，使用空分类列表
        this.setData({
          categories: ['全部'],
          showCategories: true
        })
        return Promise.resolve()
      }
    } catch (error) {
      console.error('[loadAllCategories] 加载分类列表失败:', error)
      // 失败时也显示分类区域（至少显示"全部"）
      this.setData({
        categories: ['全部'],
        showCategories: true
      })
      return Promise.reject(error)
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
      // 如果不是加载更多，重置状态
      // 但如果分类区域已经显示，保持显示（避免选择分类时闪烁）
      const keepCategoriesVisible = this.data.showCategories
      this.setData({
        loading: true,
        page: 1,
        hasMore: true,
        preloadTriggered: false,
        error: false,
        showCategories: keepCategoriesVisible // 保持当前显示状态
      })
    }

    const currentPage = this.data.page
    const requestPage = isLoadMore ? (currentPage + 1) : 1
    const pageSize = this.data.pageSize
    
    const category = this.data.selectedCategory || ''
    const keyword = (this.data.searchKeyword || '').trim()
    const excludedCategories = this.data.excludedCategories || []
    
    // 构建category参数
    let categoryParam = undefined
    if (category) {
      // 如果用户选择了特定分类，使用用户选择的分类（允许显示被排除的类别，因为用户明确选择了）
      categoryParam = category
    } else {
      // 如果用户没有选择分类（显示全部），需要排除指定的类别
      // 获取所有可用分类，排除需要排除的类别（支持部分匹配）
      const allCategories = this.data.categories.filter(cat => cat !== '全部')
      const allowedCategories = allCategories.filter(cat => {
        // 检查分类是否包含被排除的关键词（部分匹配）
        return !excludedCategories.some(excluded => cat.includes(excluded))
      })
      
      // 如果有允许的分类，使用逗号分隔的字符串格式请求多个类别
      if (allowedCategories.length > 0) {
        categoryParam = allowedCategories.join(',')
        console.log('[fetchArticles] 默认排除类别，使用允许的分类:', allowedCategories)
      }
      // 如果没有允许的分类，categoryParam保持undefined，API会返回所有文章
      // 这种情况下，我们会在客户端过滤掉被排除的类别
    }
    
    // 使用新的 /api/blog/posts API 获取文章列表
    const params = {
      page: requestPage,
      pageSize: pageSize,
      category: categoryParam,
      search: keyword || undefined
    }
    
    // 如果选中了"仅显示我的发布"，检查是否已登录
    if (this.data.showMyPosts) {
      if (!authHelper.isLoggedInLocally()) {
        // 如果未登录，重置状态
        console.log('[fetchArticles] 未登录，重置showMyPosts状态')
        this.setData({
          showMyPosts: false
        })
      } else {
        // 已登录，添加 myPosts 和 published 参数
        params.myPosts = true
        params.published = 'true' // 只返回已发布的文章
        console.log('[fetchArticles] 已登录，添加myPosts=true和published=true参数')
      }
    }
    
    console.log('[fetchArticles] 请求参数:', {
      page: requestPage,
      pageSize: pageSize,
      category: category || '无',
      search: keyword || '无',
      showMyPosts: this.data.showMyPosts,
      myPosts: params.myPosts || false,
      isLoadMore: isLoadMore,
      isPreload: isPreload
    })
    
    return blogApi.blogPostApi.getList(params).then((result) => {
      console.log('[fetchArticles] API响应:', result)
      console.log('[fetchArticles] 响应类型:', typeof result)
      console.log('[fetchArticles] 是否为数组:', Array.isArray(result))
      if (result && typeof result === 'object') {
        console.log('[fetchArticles] 响应键:', Object.keys(result))
      }
      
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
          console.log('[fetchArticles] 分页信息:', {
            currentPage: currentPage,
            pageSize: result.pagination.pageSize,
            total: total,
            totalPages: totalPages,
            hasMore: hasMore
          })
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
        console.warn('[fetchArticles] 未识别的响应格式:', result)
        console.warn('[fetchArticles] 响应详情:', JSON.stringify(result, null, 2))
        items = []
        hasMore = false
        
        // 如果响应不为空但不是预期格式，尝试提取数据
        if (result && typeof result === 'object') {
          // 尝试查找可能的数组字段
          const possibleArrayFields = ['posts', 'articles', 'items', 'list', 'results']
          for (const field of possibleArrayFields) {
            if (result[field] && Array.isArray(result[field])) {
              console.log(`[fetchArticles] 在字段"${field}"中找到数组数据`)
              items = result[field]
              hasMore = items.length >= pageSize
              break
            }
          }
        }
      }
      
      // 标准化文章数据：将 title 字段映射为 name（如果存在）
      items = items.map(item => {
        // 如果API返回的是 title 而不是 name，进行映射
        if (!item.name && item.title) {
          item.name = item.title
        }
        return item
      })

      // 过滤掉非文章数据（确保只显示真正的文章）
      // 文章必须有id和name字段，且不应该只是分类名称
      const originalCount = items.length
      console.log(`[fetchArticles] 开始过滤，原始数据${originalCount}条`)
      
      // 如果用户没有选择特定分类，需要过滤掉被排除的类别
      const excludedCategories = this.data.excludedCategories || []
      const shouldFilterExcluded = !this.data.selectedCategory // 只有在没有选择特定分类时才过滤
      
      items = items.filter(item => {
        // 如果用户没有选择特定分类，过滤掉被排除的类别
        if (shouldFilterExcluded && excludedCategories.length > 0) {
          const itemCategory = (item.category || item.apiName || '').trim()
          if (excludedCategories.some(excluded => itemCategory === excluded || itemCategory.includes(excluded))) {
            console.log('[fetchArticles] 过滤掉被排除的类别:', itemCategory)
            return false
          }
        }
        // 必须有id字段
        if (!item.id) {
          console.warn('[fetchArticles] 过滤掉无id的数据:', item)
          return false
        }
        
        // 必须有name字段
        if (!item.name || typeof item.name !== 'string' || item.name.trim() === '') {
          console.warn('[fetchArticles] 过滤掉无name或name为空的数据:', item.id, item)
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
          const name = item.name.trim()
          console.warn('[fetchArticles] 过滤掉疑似分类数据（缺少文章字段）:', {
            name: name,
            item: item
          })
          return false
        }
        
        // 检查文章内容是否为空
        // 需要至少有一个内容字段有实际内容（不只是空白字符）
        // 注意：如果文章有category或apiName，即使内容为空也保留（可能是防骗指南等特殊类型文章）
        const hasContent = 
          (item.htmlContent && typeof item.htmlContent === 'string' && item.htmlContent.trim() !== '') ||
          (item.description && typeof item.description === 'string' && item.description.trim() !== '') ||
          (item.excerpt && typeof item.excerpt === 'string' && item.excerpt.trim() !== '')
        
        // 如果所有内容字段都为空，但有category或apiName，仍然保留（可能是防骗指南等特殊类型）
        const hasCategory = item.category || item.apiName
        
        if (!hasContent && !hasCategory) {
          const name = item.name.trim()
          console.warn('[fetchArticles] 过滤掉内容为空且无分类的数据:', {
            name: name,
            htmlContent: item.htmlContent ? '有但为空' : '无',
            description: item.description ? '有但为空' : '无',
            excerpt: item.excerpt ? '有但为空' : '无',
            category: item.category || '无',
            apiName: item.apiName || '无',
            item: item
          })
          return false
        }
        
        // 如果有分类但内容为空，记录日志但不过滤（可能是防骗指南等特殊类型）
        if (!hasContent && hasCategory) {
          console.log('[fetchArticles] 保留内容为空但有分类的文章（可能是防骗指南等特殊类型）:', {
            name: item.name,
            category: item.category || item.apiName
          })
        }
        
        return true
      })
      
      if (originalCount !== items.length) {
        console.log(`[fetchArticles] 过滤结果: 原始${originalCount}条，过滤后${items.length}条，过滤掉${originalCount - items.length}条无效数据`)
      } else {
        console.log(`[fetchArticles] 过滤结果: 所有${originalCount}条数据均有效`)
      }
      
      // 输出前3条数据用于调试
      if (items.length > 0) {
        console.log('[fetchArticles] 前3条数据示例:', items.slice(0, 3).map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          hasHtmlContent: item.htmlContent !== undefined,
          hasDescription: item.description !== undefined,
          hasCreatedAt: item.createdAt !== undefined
        })))
      } else {
        console.warn('[fetchArticles] 警告：过滤后没有有效数据！')
      }

      // 获取当前登录用户信息
      const currentUser = authHelper.getLoginInfo()
      // 获取当前用户的deviceId（优先使用phone作为deviceId，与保存文章时的逻辑一致）
      const currentDeviceId = currentUser && currentUser.phone ? currentUser.phone.trim() : null
      
      // 格式化时间戳，并提取浏览量和发布者信息，同时检查编辑权限
      items = items.map(item => {
        // 提取浏览量
        const views = item.views || 0
        const formattedViews = this.formatViews(views)
        
        // 提取发布者信息（从custom_fields中获取）
        let authorInfo = null
        let articleDeviceId = null
        if (item.custom_fields) {
          try {
            // custom_fields可能是JSON字符串或对象
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
            // 提取deviceId
            if (customFields && customFields.deviceId) {
              articleDeviceId = customFields.deviceId
            }
          } catch (e) {
            console.warn('[fetchArticles] 解析custom_fields失败:', e)
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
        // 提取deviceId（从直接字段）
        if (!articleDeviceId && item.deviceId) {
          articleDeviceId = item.deviceId
        }
        
        // 清理deviceId后比较
        const articleDeviceIdNormalized = articleDeviceId ? articleDeviceId.trim() : null
        
        // 判断是否允许编辑和删除：当前用户deviceId与文章编辑者deviceId一致
        const canEdit = currentDeviceId && articleDeviceIdNormalized && currentDeviceId === articleDeviceIdNormalized
        const canDelete = canEdit // 删除权限与编辑权限一致
        
        // 优先显示更新时间，如果没有更新时间再显示发布时间
        const displayTime = item.updatedAt ? formatRelativeTime(item.updatedAt) : (item.createdAt ? formatRelativeTime(item.createdAt) : '')
        
        return {
          ...item,
          createdAt: formatRelativeTime(item.createdAt),
          updatedAt: formatRelativeTime(item.updatedAt),
          displayTime: displayTime, // 显示时间（优先更新时间）
          views: views,
          formattedViews: formattedViews,
          authorInfo: authorInfo,
          canEdit: canEdit,
          canDelete: canDelete
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

      // 注意：分类列表只从API获取（loadAllCategories），不从文章数据中提取
      // 检查是否有防骗指南相关的文章（仅用于调试日志，不影响分类列表）
      const blacklistItems = items.filter(item => {
        const category = (item.category || item.apiName || '').toLowerCase()
        return category.includes('防骗') || category.includes('预警') || category.includes('blacklist') || category.includes('诈骗')
      })
      if (blacklistItems.length > 0) {
        console.log(`[fetchArticles] 找到${blacklistItems.length}条防骗指南相关文章:`, blacklistItems.map(item => ({
          id: item.id,
          name: item.name,
          category: item.category || item.apiName
        })))
      }
      this.applyFilters()
      return Promise.resolve() // 返回成功状态
    }).catch((error) => {
      console.error('[fetchArticles] 失败:', error)
      
      if (isLoadMore) {
        this.setData({ 
          loadingMore: false, 
          preloading: false 
        })
      } else {
        this.setData({
          loading: false,
          error: true,
          errorMessage: error.message || '获取文章列表失败'
          // 注意：错误时仍然显示分类区域，因为分类已经通过loadAllCategories加载了
        })
        
        wx.showToast({
          title: error.message || '加载失败',
          icon: 'none',
          duration: 2000
        })
      }
      return Promise.reject(error) // 返回失败状态
    })
  },


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
        const excerpt = (item.excerpt || '').toLowerCase()
        return name.includes(keyword) || description.includes(keyword) || excerpt.includes(keyword)
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

  onSearchInput(e) {
    const keyword = e.detail.value
    this.setData({
      searchKeyword: keyword
    })
    this.debouncedSearch()
  },

  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    const selectedCategory = category === '全部' ? '' : category
    // 重置分页，重新加载数据，但保持分类区域显示
    this.setData({
      selectedCategory: selectedCategory,
      page: 1,
      hasMore: true,
      showCategories: true // 确保分类区域保持显示
    })
    // 重新从服务器获取数据（带过滤条件）
    this.fetchArticles()
  },

  handleSearchOrFilter() {
    this.setData({
      page: 1,
      hasMore: true
    })
    this.fetchArticles()
  },

  // 切换"仅显示我的发布"
  toggleMyPosts() {
    const newValue = !this.data.showMyPosts
    
    console.log('[toggleMyPosts] 切换状态:', {
      oldValue: this.data.showMyPosts,
      newValue: newValue,
      isLoggedIn: authHelper.isLoggedInLocally()
    })
    
    // 如果要开启"仅显示我的发布"，检查是否已登录
    if (newValue && !authHelper.isLoggedInLocally()) {
      wx.showModal({
        title: '提示',
        content: '查看我的发布需要先登录，是否立即登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/page/my/index'
            })
          }
        }
      })
      return
    }
    
    this.setData({
      showMyPosts: newValue,
      page: 1,
      hasMore: true
    }, () => {
      // 在setData回调中确保状态已更新后再调用fetchArticles
      console.log('[toggleMyPosts] 状态已更新，开始重新加载文章列表')
      // 重新加载文章列表
      this.fetchArticles()
    })
  },

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


  createArticle() {
    wx.navigateTo({
      url: '/page/article-edit/index?mode=create'
    })
  },

  editArticle(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) return

    wx.navigateTo({
      url: `/page/article-edit/index?mode=edit&id=${item.id}`
    })
  },

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
      
      // 如果用户之前选中了"我的发布"，取消选中并刷新列表
      if (this.data.showMyPosts) {
        this.setData({
          showMyPosts: false,
          page: 1,
          hasMore: true
        })
      }
      
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

  loadMore() {
    if (this.data.loadingMore || this.data.preloading || !this.data.hasMore) {
      return
    }
    
    // 记录当前的过滤条件
    console.log('[loadMore] 当前过滤条件:', {
      selectedCategory: this.data.selectedCategory || '无',
      searchKeyword: this.data.searchKeyword || '无',
      currentPage: this.data.page
    })
    
    // 加载更多时会自动使用当前的过滤条件
    this.fetchArticles(true, false)
  },

  retry() {
    this.fetchArticles()
  },

  showError(message) {
    this.setData({
      loading: false,
      loadingMore: false,
      preloading: false,
      error: true,
      errorMessage: message || '获取数据失败，请稍后重试'
    })
  },

  onImageError(e) {
    console.log('图片加载失败:', e.detail)
  },

  // 双击顶部区域回到顶部（微信推荐的最佳实践）
  onFilterSectionTap(e) {
    // 阻止事件冒泡，避免触发其他点击事件
    e.stopPropagation && e.stopPropagation()
    
    const now = Date.now()
    const lastTapTime = this._lastFilterTapTime || 0
    const timeDiff = now - lastTapTime
    
    // 清除之前的定时器
    if (this._filterTapTimer) {
      clearTimeout(this._filterTapTimer)
      this._filterTapTimer = null
    }
    
    // 如果两次点击间隔小于350ms，认为是双击
    if (timeDiff > 0 && timeDiff < 350) {
      // 双击：滚动到顶部
      this.scrollToTop()
      this._lastFilterTapTime = 0
    } else {
      // 单次点击：记录时间，等待可能的第二次点击
      this._lastFilterTapTime = now
      // 如果350ms内没有第二次点击，清除记录
      this._filterTapTimer = setTimeout(() => {
        this._lastFilterTapTime = 0
        this._filterTapTimer = null
      }, 350)
    }
  },

  // 双击功能已移除，现在点击卡片立即跳转

  // 滚动到顶部（微信推荐的最佳实践）
  scrollToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    }).catch(err => {
      console.error('[scrollToTop] 滚动失败:', err)
    })
  }
})
