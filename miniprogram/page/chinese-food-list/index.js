Page({
  onShareAppMessage() {
    return {
      title: '寻味中国',
      path: 'page/chinese-food-list/index'
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

    this.fetchMenuLinks()
  },

  // 从 API 获取菜单链接数据
  fetchMenuLinks(isLoadMore = false, isPreload = false) {
    const config = require('../../config.js')
    const apiUrl = config.menuLinksApi || `${config.apiBaseUrl}/menu-links`
    
    // 如果是加载更多，设置 loadingMore；否则设置 loading
    if (isLoadMore) {
      if (isPreload) {
        // 预加载时不显示 loadingMore，避免影响用户体验
        console.log('[fetchMenuLinks] 预加载模式，不显示加载提示')
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
    
    // 获取过滤条件（两个独立的过滤条件，可以单独使用或组合使用）
    // category: 分类过滤（精确匹配 category 字段）
    // keyword: 全文搜索（搜索 name、title 等多个字段）
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
    
    console.log(`[fetchMenuLinks] 请求参数：isLoadMore=${isLoadMore}, currentPage=${currentPage}, requestPage=${requestPage}, pageSize=${pageSize}, category=${category || '无'}, keyword=${keyword || '无'}`)

    wx.request({
      url: url,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取菜单链接响应', res)
        
        // 处理API响应数据，自动替换URL（开发环境：bobapro.life -> boba.app）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取菜单链接失败', res.statusCode, res.data)
          if (isLoadMore) {
            this.setData({ loadingMore: false })
          } else {
            this.showError()
          }
          return
        }

        if (!res.data) {
          console.error('获取菜单链接失败：返回数据为空')
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
          console.log(`[fetchMenuLinks] 分页数据：请求页 ${requestPage}，返回 ${items.length} 条，总计 ${total}，还有更多：${hasMore}`)
        }
        // 处理数组格式（format=array 时）：[...]
        else if (Array.isArray(res.data)) {
          items = res.data
          // 如果返回数组，根据返回数量判断是否还有更多
          hasMore = items.length >= pageSize
          console.log(`[fetchMenuLinks] 数组格式：请求页 ${requestPage}，返回 ${items.length} 条，还有更多：${hasMore}`)
        }
        // 兼容旧格式：{ menuLinks: [...] }
        else if (res.data.menuLinks && Array.isArray(res.data.menuLinks)) {
          items = res.data.menuLinks
          total = res.data.total || items.length
          hasMore = res.data.hasMore !== undefined ? res.data.hasMore : (items.length >= pageSize)
        }

        if (!Array.isArray(items)) {
          console.error('获取菜单链接失败：返回格式不正确')
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

        // 生成唯一ID，确保不会重复
        const existingItems = isLoadMore ? (this.data.items || []) : []
        const existingIds = new Set(existingItems.map(item => String(item.id)))
        
        const newItems = items.map((item, index) => {
          // 优先使用API返回的id
          let uniqueId = String(item.id || item._id || '')
          
          // 如果id为空，生成唯一id
          if (!uniqueId) {
            // 使用请求页码、索引、时间戳和随机数生成唯一id
            uniqueId = `item_${requestPage}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          
          // 如果id已存在，也生成新的唯一id（避免重复）
          if (existingIds.has(uniqueId)) {
            console.warn(`[fetchMenuLinks] 发现重复id: ${uniqueId}，生成新id`)
            uniqueId = `item_${requestPage}_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
          
          // 添加到已存在id集合，避免同批次数据重复
          existingIds.add(uniqueId)
          
          return {
            id: uniqueId,
            name: item.name || item.title || '未知菜单',
            title: item.title || item.name || '菜单',
            description: item.description || item.desc || '',
            image: item.image || item.imageUrl || '/page/component/resources/pic/1.jpg',
            category: item.category || item.type || '',
            htmlContent: item.htmlContent || '', // 添加 htmlContent 字段
            detailApi: item.detailApi || item.detailUrl || '', // 保留用于向后兼容
            meta: item.meta || item.date || item.updatedAt || '', // 添加 meta 字段
            published: item.published !== false, // 添加 published 字段，默认为 true
            // 保留原有字段用于兼容
            url: item.url || item.link || '',
            // 地址信息（可选）- 统一使用 parseFloat 提取，支持多种字段名
            latitude: (item.latitude !== undefined && item.latitude !== null) || (item.lat !== undefined && item.lat !== null)
              ? parseFloat((item.latitude !== undefined && item.latitude !== null) ? item.latitude : item.lat)
              : null,
            longitude: (item.longitude !== undefined && item.longitude !== null) || (item.lng !== undefined && item.lng !== null) || (item.lon !== undefined && item.lon !== null)
              ? parseFloat((item.longitude !== undefined && item.longitude !== null) ? item.longitude : ((item.lng !== undefined && item.lng !== null) ? item.lng : item.lon))
              : null,
            address: item.address || item.location || '',
            // 电话信息（可选）
            phone: item.phone || null
          }
        })

        // 合并数据（加载更多时追加，首次加载时替换）
        // 再次过滤：确保新数据的id不在已存在的数据中
        const uniqueNewItems = isLoadMore 
          ? newItems.filter(item => {
              const exists = existingItems.some(existing => String(existing.id) === String(item.id))
              if (exists) {
                console.warn(`[fetchMenuLinks] 过滤重复项: id=${item.id}`)
              }
              return !exists
            })
          : newItems
        
        const allItems = isLoadMore 
          ? [...existingItems, ...uniqueNewItems]
          : uniqueNewItems
        
        // 最终去重：使用Map确保id唯一（双重保险）
        const uniqueItemsMap = new Map()
        allItems.forEach(item => {
          const itemId = String(item.id)
          if (!uniqueItemsMap.has(itemId)) {
            uniqueItemsMap.set(itemId, item)
          } else {
            console.warn(`[fetchMenuLinks] 最终去重：发现重复id: ${itemId}，已跳过`)
          }
        })
        const finalItems = Array.from(uniqueItemsMap.values())
        
        console.log(`[fetchMenuLinks] 数据处理：API返回 ${items.length} 条，处理后 ${newItems.length} 条，过滤重复后 ${uniqueNewItems.length} 条，合并后 ${allItems.length} 条，最终去重后 ${finalItems.length} 条`)

        // 从所有数据中提取分类（只在首次加载时更新分类）
        let categories = this.data.categories
        if (!isLoadMore) {
          const categorySet = new Set()
          finalItems.forEach(item => {
            if (item.category) {
              categorySet.add(item.category)
            }
          })
          categories = ['全部', ...Array.from(categorySet).sort()]
        }

        // 更新页码：加载更多时页码+1，首次加载时重置为1
        const nextPage = isLoadMore ? requestPage : 1
        console.log(`[fetchMenuLinks] 准备更新数据，请求页: ${requestPage}，更新后页码: ${nextPage}，isLoadMore: ${isLoadMore}`)
        
        // 更新数据
        // 注意：由于后端已处理过滤，返回的数据已经是过滤后的结果
        const updateData = {
          items: finalItems,
          filteredItems: finalItems, // 后端已过滤，直接使用返回的数据
          categories: categories,
          loading: false,
          error: false,
          hasMore: hasMore,
          page: nextPage
        }

        // 根据加载类型设置不同的状态
        if (isPreload) {
          // 预加载完成，重置预加载状态
          updateData.preloading = false
          console.log(`[fetchMenuLinks] 预加载完成，请求页: ${requestPage}，更新后页码: ${nextPage}，hasMore: ${hasMore}，items数量: ${finalItems.length}（新增 ${newItems.length} 条）`)
        } else if (isLoadMore) {
          // 正常加载更多完成
          updateData.loadingMore = false
          updateData.preloadTriggered = false // 重置预加载标记，允许下次预加载
          console.log(`[fetchMenuLinks] 加载更多完成，请求页: ${requestPage}，更新后页码: ${nextPage}，hasMore: ${hasMore}，items数量: ${finalItems.length}（新增 ${newItems.length} 条，原有 ${existingItems.length} 条）`)
        } else {
          // 首次加载完成
          updateData.preloadTriggered = false // 重置预加载标记
          console.log(`[fetchMenuLinks] 首次加载完成，请求页: ${requestPage}，更新后页码: ${nextPage}，hasMore: ${hasMore}，items数量: ${finalItems.length}`)
        }

        this.setData(updateData, () => {
          // 如果是加载更多（非预加载），恢复滚动位置
          if (isLoadMore && !isPreload && this._savedScrollTop !== undefined && this._savedScrollTop > 0) {
            // 延迟恢复，确保DOM已更新
            setTimeout(() => {
              wx.pageScrollTo({
                scrollTop: this._savedScrollTop,
                duration: 0 // 立即滚动，无动画
              })
              console.log(`[fetchMenuLinks] 恢复滚动位置到: ${this._savedScrollTop}px`)
              // 重置保存的滚动位置
              this._savedScrollTop = 0
            }, 100)
          }
        })
      },
      fail: (err) => {
        console.error('获取菜单链接失败', err)
        if (isLoadMore) {
          if (isPreload) {
            // 预加载失败，重置预加载状态
            this.setData({ 
              preloading: false,
              preloadTriggered: false 
            })
            console.error('[fetchMenuLinks] 预加载失败，已重置预加载状态')
          } else {
            this.setData({ loadingMore: false })
            wx.showToast({
              title: '加载失败，请重试',
              icon: 'none',
              duration: 2000
            })
          }
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
        this.fetchMenuLinks(true, false) // 第二个参数 false 表示不是预加载
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
    this.fetchMenuLinks(false)
    // 注意：fetchMenuLinks 内部会设置 loading: false，这里延迟停止下拉刷新
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
    this.fetchMenuLinks()
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
    this.fetchMenuLinks(false)
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

  // 查看详情（直接使用 htmlContent 字段）
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

  viewDetail(e) {
    const item = e.currentTarget.dataset.item
    
    // 直接使用 htmlContent 字段，不再通过 detailApi 获取
    if (item.htmlContent) {
      const params = {
        htmlContent: encodeURIComponent(item.htmlContent),
        title: encodeURIComponent(item.title || item.name || '详情'),
        meta: encodeURIComponent(item.meta || item.date || '')
      }
      wx.navigateTo({
        url: `/page/article-detail/index?htmlContent=${params.htmlContent}&title=${params.title}&meta=${params.meta}`
      })
    } else {
      // 如果没有 htmlContent，提示用户
      wx.showToast({
        title: '暂无详情内容',
        icon: 'none',
        duration: 2000
      })
    }
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
  }
})
