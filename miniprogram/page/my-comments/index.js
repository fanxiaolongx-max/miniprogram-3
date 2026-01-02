const app = getApp()
const blogApi = require('../../utils/blogApi.js')
const authHelper = require('../../utils/authHelper.js')

Page({
  onShareAppMessage() {
    return {
      title: '我的评论',
      path: 'page/my-comments/index'
    }
  },

  data: {
    commentsList: [],
    loading: false,
    error: false,
    errorMessage: '',
    currentPage: 1,
    pageSize: 10,
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
      const result = await blogApi.blogInteractionApi.getMyComments({
        page: page,
        pageSize: this.data.pageSize
      })

      if (result && result.success && result.data) {
        const currentList = this.data.commentsList || []
        const newComments = page === 1 ? result.data : [...currentList, ...result.data]
        const pagination = result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        this.setData({
          commentsList: newComments,
          currentPage: page,
          hasMore: hasMore,
          loading: false,
          error: false
        })
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[my-comments] 加载失败:', error)
      
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

  // 删除评论
  async deleteComment(e) {
    console.log('[my-comments] 删除评论事件:', e)
    const comment = e.currentTarget.dataset.comment
    console.log('[my-comments] 评论数据:', comment)
    
    if (!comment || !comment.id) {
      console.error('[my-comments] 评论信息错误:', comment)
      wx.showToast({
        title: '评论信息错误',
        icon: 'none'
      })
      return
    }

    // 获取文章ID
    const postId = comment.postId || (comment.post && comment.post.id)
    if (!postId) {
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none'
      })
      return
    }

    // 确认删除
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条评论吗？删除后无法恢复。',
      confirmText: '删除',
      confirmColor: '#ff3b30',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 显示加载提示
            wx.showLoading({
              title: '删除中...',
              mask: true
            })

            // 调用删除接口
            const result = await blogApi.blogInteractionApi.deleteComment(postId, comment.id)

            wx.hideLoading()

            if (result && result.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success',
                duration: 1500
              })

              // 从列表中移除该评论
              const commentsList = this.data.commentsList.filter(item => item.id !== comment.id)
              this.setData({
                commentsList: commentsList
              })

              // 通知"我的"页面更新评论数量
              const pages = getCurrentPages()
              const myPage = pages.find(page => page.route === 'page/my/index')
              if (myPage && typeof myPage.loadStats === 'function') {
                myPage.loadStats()
              }
            } else {
              throw new Error(result?.message || '删除失败')
            }
          } catch (error) {
            wx.hideLoading()
            console.error('[my-comments] 删除评论失败:', error)

            if (this.isUnauthorizedError(error)) {
              this.handleUnauthorizedError()
              return
            }

            wx.showToast({
              title: error.message || '删除失败，请稍后重试',
              icon: 'none',
              duration: 2000
            })
          }
        }
      }
    })
  },

  // 阻止事件冒泡
  stopPropagation(e) {
    console.log('[my-comments] 阻止事件冒泡')
    // 阻止事件继续传播
    if (e && e.stopPropagation) {
      e.stopPropagation()
    }
  }
})

