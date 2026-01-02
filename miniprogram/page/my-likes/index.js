const app = getApp()
const blogApi = require('../../utils/blogApi.js')
const authHelper = require('../../utils/authHelper.js')

Page({
  onShareAppMessage() {
    return {
      title: '我的喜欢',
      path: 'page/my-likes/index'
    }
  },

  data: {
    articlesList: [],
    loading: false,
    error: false,
    errorMessage: '',
    currentPage: 1,
    pageSize: 6,
    hasMore: false
  },

  onLoad() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
      return
    }
    this.loadData()
  },

  onShow() {
    // 每次显示页面时检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.navigateBack()
      return
    }
  },

  // 加载数据
  async loadData(page = 1) {
    if (this.data.loading) return

    this.setData({
      loading: true,
      error: false,
      errorMessage: ''
    })

    try {
      const result = await blogApi.blogInteractionApi.getMyLikes({
        page: page,
        pageSize: this.data.pageSize
      })

      if (result && result.success && result.data) {
        const currentList = this.data.articlesList || []
        const newArticles = page === 1 ? result.data : [...currentList, ...result.data]
        const pagination = result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        this.setData({
          articlesList: newArticles,
          currentPage: page,
          hasMore: hasMore,
          loading: false,
          error: false
        })
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[my-likes] 加载失败:', error)
      
      // 检查是否为未登录错误
      if (this.isUnauthorizedError(error)) {
        this.handleUnauthorizedError()
        return
      }
      
      this.setData({
        error: true,
        errorMessage: error.message || '获取数据失败，请稍后重试',
        loading: false
      })
    }
  },

  // 检查是否为未登录错误
  isUnauthorizedError(error) {
    if (!error) return false
    const errorMessage = String(error.message || '').toLowerCase()
    return errorMessage.includes('未登录') || 
           errorMessage.includes('未认证') || 
           errorMessage.includes('unauthorized') ||
           errorMessage.includes('请先登录') ||
           errorMessage.includes('需要登录') ||
           errorMessage.includes('认证失败') ||
           errorMessage.includes('登录过期') ||
           error.statusCode === 401
  },

  // 处理未登录错误
  handleUnauthorizedError() {
    authHelper.handleLogout(app, this)
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
      duration: 2000
    })
    setTimeout(() => {
      wx.switchTab({
        url: '/page/my/index'
      })
    }, 2000)
  },

  // 加载更多
  loadMore() {
    this.loadData(this.data.currentPage + 1)
  },

  // 重试加载
  retryLoad() {
    this.loadData(1)
  },

  // 查看文章详情
  viewArticleDetail(e) {
    const item = e.currentTarget.dataset.item
    if (!item || !item.id) {
      wx.showToast({
        title: '文章信息错误',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: `/page/article-detail/index?id=${item.id}`
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    console.log('[onImageError] 图片加载失败:', e)
  }
})

