const app = getApp()
const blogApi = require('../../utils/blogApi.js')
const authHelper = require('../../utils/authHelper.js')

Page({
  onShareAppMessage() {
    return {
      title: '我的收藏',
      path: 'page/my-favorites/index'
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
    if (!app.globalData.isLoggedIn) {
      wx.navigateBack()
      return
    }
  },

  async loadData(page = 1) {
    if (this.data.loading) return

    this.setData({
      loading: true,
      error: false,
      errorMessage: ''
    })

    try {
      const result = await blogApi.blogInteractionApi.getMyFavorites({
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
      console.error('[my-favorites] 加载失败:', error)
      
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

  loadMore() {
    this.loadData(this.data.currentPage + 1)
  },

  retryLoad() {
    this.loadData(1)
  },

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

  onImageError(e) {
    console.log('[onImageError] 图片加载失败:', e)
  }
})

