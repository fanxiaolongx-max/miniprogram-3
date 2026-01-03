const app = getApp()
const blogApi = require('../../utils/blogApi.js')
const authHelper = require('../../utils/authHelper.js')

Page({
  onShareAppMessage() {
    return {
      title: '我的消息',
      path: 'page/my-messages/index'
    }
  },

  data: {
    messagesList: [],
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
    // 查看消息后，标记为已读并重置未读数量
    this.markAsRead()
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
      const result = await blogApi.blogInteractionApi.getMyPostsInteractions({
        page: page,
        pageSize: this.data.pageSize,
        type: 'all'
      })

      if (result && result.success && result.data) {
        // 辅助函数：提取用户信息（支持多种数据结构）
        const extractUserInfo = (item) => {
          // 优先使用 user 对象
          if (item.user && typeof item.user === 'object') {
            return {
              id: item.user.id || item.user.userId || null,
              name: item.user.name || item.user.nickname || item.user.userName || null,
              phone: item.user.phone || item.user.phoneNumber || null
            }
          }
          // 使用 author 对象
          if (item.author && typeof item.author === 'object') {
            return {
              id: item.author.id || item.author.userId || null,
              name: item.author.name || item.author.nickname || item.author.userName || null,
              phone: item.author.phone || item.author.phoneNumber || null
            }
          }
          // 使用 createdBy 对象
          if (item.createdBy && typeof item.createdBy === 'object') {
            return {
              id: item.createdBy.id || item.createdBy.userId || null,
              name: item.createdBy.name || item.createdBy.nickname || item.createdBy.userName || null,
              phone: item.createdBy.phone || item.createdBy.phoneNumber || null
            }
          }
          // 使用扁平字段（支持新数据结构：评论用authorName/authorPhone，点赞/收藏用userName/userPhone）
          if (item.userName || item.userPhone || item.userId || item.nickname || item.authorName || item.authorPhone) {
            return {
              id: item.userId || item.user_id || item.id || null,
              name: item.userName || item.user_name || item.nickname || item.authorName || item.author_name || null,
              phone: item.userPhone || item.user_phone || item.phone || item.authorPhone || item.author_phone || null
            }
          }
          // 如果没有找到用户信息，返回 null
          return null
        }

        // 合并所有类型的消息
        const allMessages = []
        
        // 新结构：优先处理 items 数组（每个item都有type字段）
        if (result.data.items && Array.isArray(result.data.items)) {
          result.data.items.forEach((item, index) => {
            // 根据type字段确定时间字段
            let time = ''
            if (item.type === 'comment') {
              time = item.createdAt || item.created_at || item.sortTime || item.createdTime || item.created_time || ''
            } else if (item.type === 'like') {
              time = item.likedAt || item.liked_at || item.sortTime || item.createdAt || item.created_at || item.createdTime || item.created_time || ''
            } else if (item.type === 'favorite') {
              time = item.favoritedAt || item.favorited_at || item.sortTime || item.createdAt || item.created_at || item.createdTime || item.created_time || ''
            } else {
              // 默认使用sortTime或createdAt
              time = item.sortTime || item.createdAt || item.created_at || item.createdTime || item.created_time || ''
            }
            
            const userInfo = extractUserInfo(item)
            allMessages.push({ 
              ...item, 
              type: item.type || 'comment',
              uniqueKey: `${item.type || 'comment'}-${item.id || item.postId || 'unknown'}-${index}`,
              displayTime: time,
              user: userInfo
            })
          })
        } else {
          // 旧结构：分别处理 comments、likes、favorites（兼容性）
          if (result.data.comments && Array.isArray(result.data.comments)) {
            result.data.comments.forEach((item, index) => {
              const time = item.createdAt || item.created_at || item.createdTime || item.created_time || ''
              const userInfo = extractUserInfo(item)
              allMessages.push({ 
                ...item, 
                type: 'comment',
                uniqueKey: `comment-${item.id || 'unknown'}-${index}`,
                displayTime: time,
                user: userInfo
              })
            })
          }
          if (result.data.likes && Array.isArray(result.data.likes)) {
            result.data.likes.forEach((item, index) => {
              const time = item.likedAt || item.liked_at || item.createdAt || item.created_at || item.createdTime || item.created_time || ''
              const userInfo = extractUserInfo(item)
              allMessages.push({ 
                ...item, 
                type: 'like',
                uniqueKey: `like-${item.id || 'unknown'}-${index}`,
                displayTime: time,
                user: userInfo
              })
            })
          }
          if (result.data.favorites && Array.isArray(result.data.favorites)) {
            result.data.favorites.forEach((item, index) => {
              const time = item.favoritedAt || item.favorited_at || item.createdAt || item.created_at || item.createdTime || item.created_time || ''
              const userInfo = extractUserInfo(item)
              allMessages.push({ 
                ...item, 
                type: 'favorite',
                uniqueKey: `favorite-${item.id || 'unknown'}-${index}`,
                displayTime: time,
                user: userInfo
              })
            })
          }
        }

        // 按时间排序（最新的在前）- 新结构服务器已排序，但为了兼容性保留排序逻辑
        allMessages.sort((a, b) => {
          const timeA = new Date(a.displayTime || a.sortTime || a.createdAt || a.created_at || a.likedAt || a.favoritedAt || 0).getTime()
          const timeB = new Date(b.displayTime || b.sortTime || b.createdAt || b.created_at || b.likedAt || b.favoritedAt || 0).getTime()
          return timeB - timeA
        })

        // 调试：打印用户信息提取结果
        console.log('[my-messages] 提取的用户信息示例:', allMessages.slice(0, 3).map(msg => ({
          type: msg.type,
          user: msg.user,
          rawItem: {
            user: msg.user,
            author: msg.author,
            createdBy: msg.createdBy,
            userName: msg.userName,
            userPhone: msg.userPhone
          }
        })))

        const currentList = this.data.messagesList || []
        const newMessages = page === 1 ? allMessages : [...currentList, ...allMessages]
        // 分页信息可能在 result.data.pagination 或 result.pagination
        const pagination = result.data.pagination || result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        // 如果是第一页，更新未读数量（使用服务器返回的 notifications）
        if (page === 1 && result.data.notifications) {
          const notifications = result.data.notifications
          // 计算未读数量：使用三个值的和
          const unreadCommentsCount = notifications.unreadCommentsCount || 0
          const unreadLikesCount = notifications.unreadLikesCount || 0
          const unreadFavoritesCount = notifications.unreadFavoritesCount || 0
          const unreadCount = unreadCommentsCount + unreadLikesCount + unreadFavoritesCount
          const hasUnread = notifications.hasUnreadMessage || unreadCount > 0
          
          // 通知"我的"页面更新未读数量
          const pages = getCurrentPages()
          const myPage = pages.find(page => page.route === 'page/my/index')
          if (myPage) {
            console.log('[my-messages] 更新"我的"页面未读数量:', {
              unreadCount: unreadCount,
              unreadCommentsCount: unreadCommentsCount,
              unreadLikesCount: unreadLikesCount,
              unreadFavoritesCount: unreadFavoritesCount
            })
            myPage.setData({
              messagesUnreadCount: unreadCount,
              hasUnreadMessage: hasUnread
            })
          }
        }

        this.setData({
          messagesList: newMessages,
          currentPage: page,
          hasMore: hasMore,
          loading: false,
          error: false
        })
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[my-messages] 加载失败:', error)
      
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

  // 标记消息为已读
  async markAsRead() {
    try {
      await blogApi.blogInteractionApi.markMessagesAsRead()
      console.log('[my-messages] 消息已标记为已读')
      
      // 直接更新"我的"页面的未读数量为0（避免重复请求）
      const pages = getCurrentPages()
      const myPage = pages.find(page => page.route === 'page/my/index')
      if (myPage) {
        console.log('[my-messages] 更新"我的"页面未读数量为0')
        myPage.setData({
          messagesUnreadCount: 0,
          hasUnreadMessage: false
        })
      }
    } catch (error) {
      console.error('[my-messages] 标记已读失败:', error)
      // 标记失败不影响页面显示，静默处理
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
  }
})

