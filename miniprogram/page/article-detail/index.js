const { formatRelativeTime } = require('../../util/util.js')

/**
 * 根据用户ID生成固定的可爱头像图案
 * @param {string|number} userId - 用户ID
 * @returns {string} 可爱图案emoji
 */
function getCuteAvatar(userId) {
  // 可爱的emoji图案列表（与用户登录页面保持一致）
  const cuteEmojis = [
    '🐱', '🐰', '🐻', '🐼', '🐨', '🐯', '🦁', '🐶', '🐷', '🐸',
    '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺',
    '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟',
    '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑',
    '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈',
    '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪',
    '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏',
    '🐑', '🦙', '🐐', '🦌', '🐕', '🦮', '🐩', '🐈', '🐓', '🦃',
    '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🦅', '🦉', '🦇', '🐺',
    '🌻', '🌺', '🌹', '🌷', '🌼', '🌸', '💐', '🌾', '🌿', '🍀',
    '☘️', '🍃', '🍂', '🍁', '🌳', '🌲', '🌴', '🌵', '🌊', '⭐',
    '🌟', '✨', '💫', '💥', '💢', '💤', '💨', '🌈', '☀️', '🌙',
    '☁️', '⛅', '☔', '❄️', '⛄', '🔥', '💧', '🌊', '🍎', '🍊',
    '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍',
    '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🌽',
    '🥕', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚',
    '🍳', '🥞', '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍕',
    '🥪', '🥙', '🌮', '🌯', '🥗', '🥘', '🥫', '🍝', '🍜', '🍲',
    '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠',
    '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🍰', '🎂', '🍮',
    '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🍯', '🥛',
    '🍼', '☕', '🍵',
    '🍸', '🍹', '🧉', '🧊', '🥄', '🍴', '🍽️', '🥢', '🥣', '🥡',
    '🥤', '🧃', '🧉', '🧊', '🥤', '🧃', '🧉', '🧊', '🥤', '🧃'
  ]
  
  // 如果没有用户ID，使用随机图案
  if (!userId) {
    return cuteEmojis[Math.floor(Math.random() * cuteEmojis.length)]
  }
  
  // 根据用户ID生成固定的索引（确保同一用户总是得到同一个图案）
  const userIdStr = String(userId)
  let hash = 0
  for (let i = 0; i < userIdStr.length; i++) {
    const char = userIdStr.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  
  // 使用哈希值选择图案（确保是正数）
  const index = Math.abs(hash) % cuteEmojis.length
  return cuteEmojis[index]
}

Page({
  onShareAppMessage() {
    // 获取转发图片：优先使用封面图片，其次使用文章内容中的第一张图片
    let imageUrl = ''
    if (this.data.coverImage) {
      imageUrl = this.data.coverImage
    } else if (this.data.images && this.data.images.length > 0) {
      imageUrl = this.data.images[0]
    }
    
    // 如果使用文章ID，分享时使用ID
    if (this.data.articleId) {
      const shareConfig = {
        title: this.data.title || '详情',
        path: `page/article-detail/index?id=${encodeURIComponent(this.data.articleId)}`
      }
      if (imageUrl) {
        shareConfig.imageUrl = imageUrl
      }
      return shareConfig
    }
    
    // 如果使用 htmlContent，分享时使用标题
    if (this.data.content && !this.data.apiUrl) {
      const shareConfig = {
        title: this.data.title || '详情',
        path: `page/article-detail/index?htmlContent=${encodeURIComponent(this.data.content)}&title=${encodeURIComponent(this.data.title || '')}&meta=${encodeURIComponent(this.data.meta || '')}`
      }
      if (imageUrl) {
        shareConfig.imageUrl = imageUrl
      }
      return shareConfig
    }
    
    // 兼容旧的 apiUrl 方式
    const shareConfig = {
      title: this.data.title || '详情',
      path: `page/article-detail/index?apiUrl=${encodeURIComponent(this.data.apiUrl || '')}`
    }
    if (imageUrl) {
      shareConfig.imageUrl = imageUrl
    }
    return shareConfig
  },

  data: {
    theme: 'light',
    title: '',
    meta: '',
    content: '',
    parsedContent: [], // 解析后的内容节点数组 [{type: 'text'|'image'|'video'|'link', ...}]
    parsedImages: [], // 从解析内容中提取的图片节点（用于顶部横向滚动）
    apiUrl: '',
    loading: false,
    error: false,
    links: [], // 存储从文章中提取的链接（保留用于底部显示，可选）
    images: [], // 存储从文章中提取的图片（保留用于底部显示，可选）
    videos: [], // 存储从文章中提取的视频（保留用于底部显示，可选）
    location: null, // 存储地址信息 { name, address, latitude, longitude }
    mapMarkers: [], // 地图标记点
    coverImage: '', // 文章封面图片（优先用于转发）
    articleId: '', // 文章ID（用于转发时构建路径）
    authorInfo: null, // 发布者信息 { nickname, phone, deviceModel }
    currentImageIndex: 0, // 当前图片索引（用于显示指示器）
    // 互动数据
    liked: false, // 是否已点赞
    likeCount: 0, // 点赞数
    favorited: false, // 是否已收藏
    favoriteCount: 0, // 收藏数
    // 评论相关
    comments: [], // 评论列表
    commentsCount: 0, // 评论总数（从API获取）
    commentsPage: 1, // 当前评论页码
    commentsPageSize: 10, // 每页评论数量
    hasMoreComments: false, // 是否还有更多评论
    loadingComments: false, // 是否正在加载评论
    showCommentInput: false, // 是否显示评论输入框
    commentText: '', // 评论内容
    replyingTo: null, // 正在回复的评论ID
    commentInputFocus: false, // 评论输入框焦点状态
    submittingComment: false // 是否正在提交评论
  },

  onLoad(options) {
    this.setData({
      theme: (() => {
        const systemInfo = require('../../utils/systemInfo.js')
        return systemInfo.getTheme()
      })()
    })

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }

    // 优先检查是否有文章ID（列表API不再返回htmlContent，统一通过ID获取）
    const articleId = options.id || options.articleId || ''
    if (articleId) {
      // 通过文章ID获取详情（推荐方式）
      this.fetchArticleById(articleId)
      return
    }
    
    // 向后兼容：如果直接传递了htmlContent（旧版本或其他页面可能使用）
    const htmlContent = options.htmlContent ? decodeURIComponent(options.htmlContent) : ''
    const title = options.title ? decodeURIComponent(options.title) : ''
    const meta = options.meta ? decodeURIComponent(options.meta) : ''
    
    if (htmlContent) {
      // 如果直接提供了 htmlContent，直接使用，不需要请求API
      console.log('[article-detail] 使用直接传递的 htmlContent')
      
      // 提取文章中的图片（保留用于底部显示，可选）
      const images = this.extractImages(htmlContent)
      
      // 提取文章中的视频（保留用于底部显示，可选）
      const videos = this.extractVideos(htmlContent)
      
      // 提取文章中的链接（保留用于底部显示，可选）
      const links = this.extractLinks(htmlContent)
      
      // 解析HTML为节点数组（用于内联显示）
      const parsedContent = this.parseHtmlToNodes(htmlContent)
      
      // 从解析后的内容中提取图片和视频节点（用于顶部横向滚动显示）
      const parsedMedia = parsedContent.filter(node => node.type === 'image' || node.type === 'video')
      // 向后兼容：保留 parsedImages 变量名
      const parsedImages = parsedMedia
      
      // 过滤掉图片和视频节点，正文中不显示图片和视频（只显示文本、链接）
      const parsedContentWithoutImages = parsedContent.filter(node => node.type !== 'image' && node.type !== 'video')
      
      // 处理HTML内容，使图片自适应屏幕宽度，并移除视频标签（rich-text不支持，用于向后兼容）
      const processedContent = this.processHtmlContent(htmlContent)
      
      // 注意：直接传递 htmlContent 时，无法获取地址信息，因为地址信息在 JSON 返回中
      // 如果需要支持地址，需要通过 options 传递地址参数
      const locationData = options.latitude && options.longitude ? {
        name: title || '位置',
        address: options.address || '',
        latitude: parseFloat(options.latitude),
        longitude: parseFloat(options.longitude)
      } : null

      // 如果有地址信息，生成地图标记点
      const mapMarkers = locationData ? [{
        id: 1,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        title: locationData.name || '位置',
        width: 30,
        height: 30,
        callout: {
          content: locationData.name || '位置',
          color: '#333',
          fontSize: 14,
          borderRadius: 4,
          bgColor: '#fff',
          padding: 8,
          display: 'ALWAYS'
        }
      }] : []
      
      // 设置导航栏标题
      if (title) {
        wx.setNavigationBarTitle({
          title: title
        })
      }
      
      // 向后兼容：直接传递 htmlContent 时无法获取互动数据
      const liked = false
      const likeCount = 0
      const favorited = false
      const favoriteCount = 0
      const comments = []
      const commentsCount = 0
      
      this.setData({
        title: title,
        meta: meta,
        content: processedContent,
        parsedContent: Array.isArray(parsedContentWithoutImages) ? parsedContentWithoutImages : [],
        parsedImages: Array.isArray(parsedImages) ? parsedImages : [],
        links: Array.isArray(links) ? links : [],
        images: Array.isArray(images) ? images : [],
        videos: Array.isArray(videos) ? videos : [],
        location: locationData,
        mapMarkers: Array.isArray(mapMarkers) ? mapMarkers : [],
        currentImageIndex: 0,
        liked: liked,
        likeCount: likeCount,
        favorited: favorited,
        favoriteCount: favoriteCount,
        comments: comments,
        commentsCount: commentsCount,
        loading: false,
        error: false
      })
      return
    }
    
    // 如果没有 htmlContent 也没有 ID，则使用原来的 API 方式（向后兼容）
    const apiUrl = options.apiUrl || ''
    if (!apiUrl) {
      this.showError('缺少参数：请提供文章ID或文章内容')
      return
    }

    this.setData({ apiUrl })
    this.fetchArticleDetail()
  },

  // 通过文章ID获取详情（列表API不再返回htmlContent，统一通过此方法获取）
  async fetchArticleById(articleId) {
    console.log('[article-detail] 通过文章ID获取详情:', articleId)
    
    this.setData({
      loading: true,
      error: false
    })

    try {
      const blogApi = require('../../utils/blogApi.js')
      // 明确传递参数，确保包含评论列表（第一页，10条）
      const result = await blogApi.articleApi.getDetail(articleId, {
        includeComments: true,
        commentsPage: 1,
        commentsPageSize: this.data.commentsPageSize || 10
      })
      
      if (result.success && result.data) {
        const article = result.data
        const htmlContent = article.htmlContent || ''
        const title = article.title || article.name || ''
        // 优先显示更新时间，如果没有更新时间再显示发布时间
        const meta = formatRelativeTime(article.updatedAt || article.createdAt || '')
        const views = article.views || 0 // 浏览量
        
        if (!htmlContent) {
          this.showError('文章内容为空')
          return
        }
        
        console.log('[article-detail] 获取到文章详情，标题:', title, '内容长度:', htmlContent.length)
        
        // 提取文章中的图片、视频、链接
        const images = this.extractImages(htmlContent)
        const videos = this.extractVideos(htmlContent)
        const links = this.extractLinks(htmlContent)
        
        // 解析HTML为节点数组
        const parsedContent = this.parseHtmlToNodes(htmlContent)
        
        // 从解析后的内容中提取图片和视频节点（用于顶部横向滚动显示）
        const parsedMedia = parsedContent.filter(node => node.type === 'image' || node.type === 'video')
        // 向后兼容：保留 parsedImages 变量名
        const parsedImages = parsedMedia
        
        // 过滤掉图片和视频节点，正文中不显示图片和视频（只显示文本、链接）
        const parsedContentWithoutImages = parsedContent.filter(node => node.type !== 'image' && node.type !== 'video')
        
        // 处理HTML内容
        const processedContent = this.processHtmlContent(htmlContent)
        
        // 处理地址信息
        const locationData = (article.latitude && article.longitude) ? {
          name: title || '位置',
          address: article.address || '',
          latitude: parseFloat(article.latitude),
          longitude: parseFloat(article.longitude)
        } : null
        
        // 生成地图标记点
        const mapMarkers = locationData ? [{
          id: 1,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          title: locationData.name || '位置',
          width: 30,
          height: 30,
          callout: {
            content: locationData.name || '位置',
            color: '#333',
            fontSize: 14,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'ALWAYS'
          }
        }] : []
        
        // 提取发布者信息（从custom_fields中获取）
        let authorInfo = null
        if (article.custom_fields) {
          try {
            // custom_fields可能是JSON字符串或对象
            const customFields = typeof article.custom_fields === 'string' 
              ? JSON.parse(article.custom_fields) 
              : article.custom_fields
            
            if (customFields && (customFields.nickname || customFields.phone || customFields.deviceModel)) {
              authorInfo = {
                nickname: customFields.nickname || null,
                phone: customFields.phone || null,
                deviceModel: customFields.deviceModel || null
              }
            }
          } catch (e) {
            console.warn('[article-detail] 解析custom_fields失败:', e)
          }
        }
        
        // 如果没有从custom_fields获取到，尝试直接从文章对象获取（向后兼容）
        if (!authorInfo && (article.nickname || article.phone || article.deviceModel)) {
          authorInfo = {
            nickname: article.nickname || null,
            phone: article.phone || null,
            deviceModel: article.deviceModel || null
          }
        }
        
        // 格式化浏览量
        const formattedViews = this.formatViews(views)
        
        // 从API获取点赞数、收藏数、评论数
        const likeCount = article.likesCount || 0
        const favoriteCount = article.favoritesCount || 0
        const commentsCount = article.commentsCount || 0
        
        // 设置导航栏标题
        if (title) {
          wx.setNavigationBarTitle({
            title: title
          })
        }
        
        // 从API返回的数据中获取用户互动状态（如果API返回了这些字段）
        // 支持 isLiked/isFavorited 和 liked/favorited 两种字段名
        // 如果没有返回，则默认为false，稍后会通过fetchUserInteractions获取
        const liked = article.isLiked === true || article.isLiked === 1 || article.isLiked === 'true' ||
                      article.liked === true || article.liked === 1 || article.liked === 'true'
        const favorited = article.isFavorited === true || article.isFavorited === 1 || article.isFavorited === 'true' ||
                          article.favorited === true || article.favorited === 1 || article.favorited === 'true'
        
        console.log('[article-detail] 从文章详情获取互动状态:', { 
          liked, 
          favorited, 
          isLiked: article.isLiked,
          isFavorited: article.isFavorited,
          articleLiked: article.liked, 
          articleFavorited: article.favorited,
          articleKeys: Object.keys(article).filter(k => k.includes('like') || k.includes('favor') || k.includes('Like') || k.includes('Favor'))
        })
        
        // 处理评论列表（从API响应中获取）
        let comments = []
        let hasMoreComments = false
        if (result.comments && result.comments.comments && Array.isArray(result.comments.comments)) {
          comments = this.formatComments(result.comments.comments)
          console.log('[article-detail] 获取到评论列表，数量:', comments.length)
          
          // 判断是否还有更多评论
          const totalComments = result.comments.total || 0
          const currentPage = result.comments.currentPage || 1
          const totalPages = result.comments.totalPages || 1
          hasMoreComments = currentPage < totalPages
          
          console.log('[article-detail] 评论分页信息:', {
            total: totalComments,
            currentPage: currentPage,
            totalPages: totalPages,
            hasMore: hasMoreComments
          })
        }

        this.setData({
          title: title,
          meta: meta,
          views: views,
          formattedViews: formattedViews,
          content: processedContent,
          parsedContent: Array.isArray(parsedContentWithoutImages) ? parsedContentWithoutImages : [],
          parsedImages: Array.isArray(parsedImages) ? parsedImages : [],
          links: Array.isArray(links) ? links : [],
          images: Array.isArray(images) ? images : [],
          videos: Array.isArray(videos) ? videos : [],
          location: locationData,
          mapMarkers: Array.isArray(mapMarkers) ? mapMarkers : [],
          coverImage: article.image || '', // 保存封面图片
          articleId: articleId, // 保存文章ID用于转发
          authorInfo: authorInfo, // 发布者信息
          currentImageIndex: 0, // 当前图片索引
          liked: liked,
          likeCount: likeCount,
          favorited: favorited,
          favoriteCount: favoriteCount,
          comments: comments,
          commentsCount: commentsCount,
          commentsPage: 1,
          hasMoreComments: hasMoreComments,
          loadingComments: false,
          loading: false,
          error: false
        })
        
        // 如果第一个媒体是视频，自动播放
        if (parsedImages && parsedImages.length > 0 && parsedImages[0].type === 'video') {
          setTimeout(() => {
            const videoId = 'gallery-video-0'
            const videoContext = wx.createVideoContext(videoId, this)
            if (videoContext) {
              videoContext.play()
            }
          }, 300)
        }
        
        // 获取用户互动状态（是否已点赞/收藏）
        this.fetchUserInteractions(articleId)
      } else {
        console.error('[article-detail] API返回失败:', result)
        this.showError('获取文章详情失败')
      }
    } catch (error) {
      console.error('[article-detail] 获取文章详情异常:', error)
      this.showError(error.message || '获取文章详情失败，请稍后重试')
    }
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

  // 从API获取文章详情
  fetchArticleDetail() {
    const apiUrl = decodeURIComponent(this.data.apiUrl)
    
    if (!apiUrl) {
      this.showError('API地址无效')
      return
    }

    this.setData({
      loading: true,
      error: false
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取文章详情响应', res)
        
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取文章详情失败', res.statusCode, res.data)
          this.showError('获取内容失败')
          return
        }

        if (!res.data) {
          console.error('获取文章详情失败：返回数据为空')
          this.showError('获取内容失败')
          return
        }

        // 处理不同的返回格式
        let content = ''
        let title = ''
        let meta = ''
        let locationData = null // 存储地址信息
        let coverImage = '' // 存储封面图片
        let articleData = null // 存储文章数据对象（用于提取发布者信息）
        let views = 0 // 浏览量

        // 格式0: 数组格式 [{ content: "HTML内容", title: "标题" }] - 取第一个元素
        if (Array.isArray(res.data) && res.data.length > 0) {
          const firstItem = res.data[0]
          articleData = firstItem
          content = firstItem.content || firstItem.html || firstItem.htmlContent || ''
          title = firstItem.title || firstItem.name || ''
          // 优先显示更新时间，如果没有更新时间再显示发布时间
          meta = formatRelativeTime(firstItem.meta || firstItem.date || firstItem.updatedAt || firstItem.createdAt || '')
          locationData = this.extractLocation(firstItem)
          coverImage = firstItem.image || ''
          views = firstItem.views || 0
        }
        // 格式1: { content: "HTML内容", title: "标题" }
        else if (res.data.content || res.data.html || res.data.htmlContent) {
          articleData = res.data
          content = res.data.content || res.data.html || res.data.htmlContent || ''
          title = res.data.title || ''
          // 优先显示更新时间，如果没有更新时间再显示发布时间
          meta = formatRelativeTime(res.data.meta || res.data.date || res.data.updatedAt || res.data.createdAt || '')
          locationData = this.extractLocation(res.data)
          coverImage = res.data.image || ''
          views = res.data.views || 0
        }
        // 格式2: { data: { content: "HTML内容", title: "标题" } }
        else if (res.data.data) {
          // 如果 data 是数组，取第一个元素
          if (Array.isArray(res.data.data) && res.data.data.length > 0) {
            const firstItem = res.data.data[0]
            articleData = firstItem
            content = firstItem.content || firstItem.html || firstItem.htmlContent || ''
            title = firstItem.title || firstItem.name || ''
            // 优先显示更新时间，如果没有更新时间再显示发布时间
            meta = formatRelativeTime(firstItem.meta || firstItem.date || firstItem.updatedAt || firstItem.createdAt || '')
            locationData = this.extractLocation(firstItem)
            coverImage = firstItem.image || ''
            views = firstItem.views || 0
          } else if (typeof res.data.data === 'object') {
            articleData = res.data.data
            content = res.data.data.content || res.data.data.html || res.data.data.htmlContent || ''
            title = res.data.data.title || ''
            // 优先显示更新时间，如果没有更新时间再显示发布时间
            meta = formatRelativeTime(res.data.data.meta || res.data.data.date || res.data.data.updatedAt || res.data.data.createdAt || '')
            locationData = this.extractLocation(res.data.data)
            coverImage = res.data.data.image || ''
            views = res.data.data.views || 0
          }
        }
        // 格式3: { html: "HTML内容", title: "标题" } 或 { htmlContent: "HTML内容", title: "标题" }
        else if (res.data.html || res.data.htmlContent) {
          articleData = res.data
          content = res.data.html || res.data.htmlContent || ''
          title = res.data.title || ''
          // 优先显示更新时间，如果没有更新时间再显示发布时间
          meta = formatRelativeTime(res.data.meta || res.data.date || res.data.updatedAt || res.data.createdAt || '')
          locationData = this.extractLocation(res.data)
          coverImage = res.data.image || ''
          views = res.data.views || 0
        }
        // 格式4: 直接字符串
        else if (typeof res.data === 'string') {
          content = res.data
        }
        
        // 提取发布者信息
        let authorInfo = null
        if (articleData) {
          if (articleData.custom_fields) {
            try {
              const customFields = typeof articleData.custom_fields === 'string' 
                ? JSON.parse(articleData.custom_fields) 
                : articleData.custom_fields
              
              if (customFields && (customFields.nickname || customFields.phone || customFields.deviceModel)) {
                authorInfo = {
                  nickname: customFields.nickname || null,
                  phone: customFields.phone || null,
                  deviceModel: customFields.deviceModel || null
                }
              }
            } catch (e) {
              console.warn('[article-detail] 解析custom_fields失败:', e)
            }
          }
          
          // 如果没有从custom_fields获取到，尝试直接从文章对象获取
          if (!authorInfo && (articleData.nickname || articleData.phone || articleData.deviceModel)) {
            authorInfo = {
              nickname: articleData.nickname || null,
              phone: articleData.phone || null,
              deviceModel: articleData.deviceModel || null
            }
          }
        }

        if (!content) {
          console.error('获取文章详情失败：内容为空')
          this.showError('内容为空')
          return
        }

        // 提取文章中的图片（在处理内容之前提取，确保图片URL完整，保留用于底部显示，可选）
        const images = this.extractImages(content)
        
        // 提取文章中的视频（在处理内容之前提取，确保视频URL完整，保留用于底部显示，可选）
        const videos = this.extractVideos(content)
        
        // 提取文章中的链接（在处理内容之前提取，确保链接完整，保留用于底部显示，可选）
        const links = this.extractLinks(content)

        // 解析HTML为节点数组（用于内联显示）
        const parsedContent = this.parseHtmlToNodes(content)
        
        // 从解析后的内容中提取图片和视频节点（用于顶部横向滚动显示）
        const parsedMedia = parsedContent.filter(node => node.type === 'image' || node.type === 'video')
        // 向后兼容：保留 parsedImages 变量名
        const parsedImages = parsedMedia
        
        // 过滤掉图片和视频节点，正文中不显示图片和视频（只显示文本、链接）
        const parsedContentWithoutImages = parsedContent.filter(node => node.type !== 'image' && node.type !== 'video')

        // 处理HTML内容，使图片自适应屏幕宽度，并移除视频标签（rich-text不支持，用于向后兼容）
        content = this.processHtmlContent(content)

        // 设置导航栏标题
        if (title) {
          wx.setNavigationBarTitle({
            title: title
          })
        }

        // 如果有地址信息，生成地图标记点
        const mapMarkers = locationData ? [{
          id: 1,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          title: locationData.name || '位置',
          width: 30,
          height: 30,
          callout: {
            content: locationData.name || '位置',
            color: '#333',
            fontSize: 14,
            borderRadius: 4,
            bgColor: '#fff',
            padding: 8,
            display: 'ALWAYS'
          }
        }] : []

        // 格式化浏览量
        const formattedViews = this.formatViews(views)
        
        // 从API获取点赞、收藏、评论数据（如果API返回了这些字段）
        // 注意：旧的API可能不返回这些字段，使用默认值
        const liked = false
        const likeCount = articleData?.likesCount || 0
        const favorited = false
        const favoriteCount = articleData?.favoritesCount || 0
        const comments = []
        const commentsCount = articleData?.commentsCount || 0

        this.setData({
          title: title,
          meta: meta,
          views: views,
          formattedViews: formattedViews,
          content: content,
          parsedContent: Array.isArray(parsedContentWithoutImages) ? parsedContentWithoutImages : [],
          parsedImages: Array.isArray(parsedImages) ? parsedImages : [],
          links: Array.isArray(links) ? links : [],
          images: Array.isArray(images) ? images : [],
          videos: Array.isArray(videos) ? videos : [],
          location: locationData,
          mapMarkers: Array.isArray(mapMarkers) ? mapMarkers : [],
          coverImage: coverImage, // 保存封面图片
          authorInfo: authorInfo, // 发布者信息
          currentImageIndex: 0,
          liked: liked,
          likeCount: likeCount,
          favorited: favorited,
          favoriteCount: favoriteCount,
          comments: comments,
          commentsCount: commentsCount,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取文章详情失败', err)
        this.showError('网络请求失败')
      }
    })
  },

  showError(message) {
    this.setData({
      loading: false,
      error: true,
      content: '',
      title: '',
      meta: ''
    })
    
    wx.showToast({
      title: message || '获取内容失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  retry() {
    this.fetchArticleDetail()
  },

  /**
   * 验证URL是否是图片格式
   * @param {string} url - URL字符串
   * @returns {boolean} 是否是图片URL
   */
  isValidImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return false
    }
    
    // 常见的图片格式扩展名
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico']
    // 常见的视频格式扩展名（需要排除）
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.f4v', '.m3u8']
    
    const lowerUrl = url.toLowerCase()
    
    // 先检查是否是视频格式，如果是则返回false
    for (const ext of videoExtensions) {
      if (lowerUrl.includes(ext)) {
        return false
      }
    }
    
    // 检查是否是图片格式
    for (const ext of imageExtensions) {
      if (lowerUrl.includes(ext)) {
        return true
      }
    }
    
    // 如果没有明确的扩展名，但URL包含图片相关的路径，也认为是图片
    // 例如：/uploads/images/xxx 或 /image/xxx
    if (lowerUrl.includes('/image') || lowerUrl.includes('/img') || lowerUrl.includes('/photo') || lowerUrl.includes('/picture')) {
      return true
    }
    
    // 默认情况下，如果没有明确的视频扩展名，也允许（可能是动态生成的图片）
    return true
  },

  /**
   * 解析HTML内容为节点数组，将图片、视频、链接提取为独立节点
   * @param {string} html - 原始HTML内容
   * @returns {Array} 节点数组 [{type: 'text'|'image'|'video'|'link', ...}]
   */
  parseHtmlToNodes(html) {
    if (!html || typeof html !== 'string') {
      return [{ type: 'text', content: '' }]
    }

    try {
      const nodes = []
      let lastIndex = 0
      let htmlCopy = html

      // 获取屏幕宽度用于图片样式
      const systemInfo = wx.getSystemInfoSync()
      const screenWidth = systemInfo.windowWidth || 375
      const maxWidth = screenWidth - 40

      // 1. 提取并替换视频（优先级最高，因为视频标签可能包含其他标签）
      const videoBlockRegex = /<video([^>]*)>([\s\S]*?)<\/video>/gi
      const videoSelfClosingRegex = /<video([^>]*)\/>/gi
      const iframeRegex = /<iframe([^>]*)>.*?<\/iframe>/gi
      
      const videoPlaceholders = []
      let videoIndex = 0

      // 处理 <video>...</video> 块
      htmlCopy = htmlCopy.replace(videoBlockRegex, (match, attributes, content) => {
        let src = null
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          src = srcMatch[1].trim()
        } else if (content) {
          const sourceMatch = content.match(/<source([^>]*)>/i)
          if (sourceMatch) {
            const sourceSrcMatch = sourceMatch[1].match(/src\s*=\s*["']([^"']+)["']/i)
            if (sourceSrcMatch) {
              src = sourceSrcMatch[1].trim()
            }
          }
        }

        let poster = null
        const posterMatch = attributes.match(/poster\s*=\s*["']([^"']+)["']/i)
        if (posterMatch) {
          const posterValue = posterMatch[1].trim()
          // 验证poster是否是有效的网络URL且是图片格式（不能是视频格式）
          if (posterValue && 
              (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
              this.isValidImageUrl(posterValue)) {
            poster = posterValue
          } else {
            console.warn('[parseHtmlToNodes] 忽略无效的poster URL（不是图片格式）:', posterValue)
          }
        }

        if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//'))) {
          const placeholder = `__VIDEO_PLACEHOLDER_${videoIndex}__`
          videoPlaceholders.push({ placeholder, src, poster })
          videoIndex++
          return placeholder
        }
        return ''
      })

      // 处理自闭合的 <video />
      htmlCopy = htmlCopy.replace(videoSelfClosingRegex, (match, attributes) => {
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          const src = srcMatch[1].trim()
          if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//'))) {
            let poster = null
            const posterMatch = attributes.match(/poster\s*=\s*["']([^"']+)["']/i)
            if (posterMatch) {
              const posterValue = posterMatch[1].trim()
              // 验证poster是否是有效的网络URL且是图片格式（不能是视频格式）
              if (posterValue && 
                  (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
                  this.isValidImageUrl(posterValue)) {
                poster = posterValue
              } else {
                console.warn('[parseHtmlToNodes] 忽略无效的poster URL（不是图片格式）:', posterValue)
              }
            }
            const placeholder = `__VIDEO_PLACEHOLDER_${videoIndex}__`
            videoPlaceholders.push({ placeholder, src, poster })
            videoIndex++
            return placeholder
          }
        }
        return ''
      })

      // 处理 <iframe> 中的视频
      htmlCopy = htmlCopy.replace(iframeRegex, (match, attributes) => {
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          const iframeSrc = srcMatch[1].trim()
          if (iframeSrc && (iframeSrc.includes('youtube.com') || 
                           iframeSrc.includes('youtu.be') ||
                           iframeSrc.includes('bilibili.com') ||
                           iframeSrc.includes('vimeo.com') ||
                           iframeSrc.includes('youku.com') ||
                           iframeSrc.includes('iqiyi.com') ||
                           iframeSrc.includes('qq.com/video'))) {
            const placeholder = `__VIDEO_PLACEHOLDER_${videoIndex}__`
            videoPlaceholders.push({ placeholder, src: iframeSrc, poster: null })
            videoIndex++
            return placeholder
          }
        }
        return ''
      })

      // 2. 提取并替换图片
      const imgRegex = /<img([^>]*)>/gi
      const imageRegex = /<image([^>]*)>/gi
      const imagePlaceholders = []
      let imageIndex = 0

      htmlCopy = htmlCopy.replace(imgRegex, (match, attributes) => {
        let url = null
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }

        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
          const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
          imagePlaceholders.push({ placeholder, url })
          imageIndex++
          return placeholder
        }
        return ''
      })

      htmlCopy = htmlCopy.replace(imageRegex, (match, attributes) => {
        let url = null
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }

        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//'))) {
          const placeholder = `__IMAGE_PLACEHOLDER_${imageIndex}__`
          imagePlaceholders.push({ placeholder, url })
          imageIndex++
          return placeholder
        }
        return ''
      })

      // 3. 提取并替换链接
      const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
      const linkPlaceholders = []
      let linkIndex = 0

      htmlCopy = htmlCopy.replace(linkRegex, (match, url, text) => {
        const cleanUrl = url.trim()
        const cleanText = text.replace(/<[^>]+>/g, '').trim() || cleanUrl

        if (cleanUrl && (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://'))) {
          const placeholder = `__LINK_PLACEHOLDER_${linkIndex}__`
          linkPlaceholders.push({ placeholder, url: cleanUrl, text: cleanText })
          linkIndex++
          return placeholder
        }
        return match
      })

      // 4. 分割文本并插入媒体节点
      const parts = htmlCopy.split(/(__(?:IMAGE|VIDEO|LINK)_PLACEHOLDER_\d+__)/g)

      parts.forEach(part => {
        if (part.startsWith('__IMAGE_PLACEHOLDER_')) {
          const index = parseInt(part.match(/\d+/)[0])
          const imageData = imagePlaceholders[index]
          if (imageData) {
            nodes.push({
              type: 'image',
              url: imageData.url
            })
          }
        } else if (part.startsWith('__VIDEO_PLACEHOLDER_')) {
          const index = parseInt(part.match(/\d+/)[0])
          const videoData = videoPlaceholders[index]
          if (videoData) {
            nodes.push({
              type: 'video',
              src: videoData.src,
              poster: videoData.poster || null
            })
          }
        } else if (part.startsWith('__LINK_PLACEHOLDER_')) {
          const index = parseInt(part.match(/\d+/)[0])
          const linkData = linkPlaceholders[index]
          if (linkData) {
            nodes.push({
              type: 'link',
              url: linkData.url,
              text: linkData.text
            })
          }
        } else if (part.trim()) {
          // 文本节点，处理图片样式
          let textContent = part
          // 处理剩余的图片标签，添加样式
          textContent = textContent.replace(/<img([^>]*)>/gi, (match, attributes) => {
            const hasStyle = /style\s*=/i.test(attributes)
            if (!hasStyle) {
              const styleAttr = `style="max-width: ${maxWidth}px; width: 100%; height: auto; display: block;"`
              return `<img${attributes} ${styleAttr}>`
            }
            return match
          })
          nodes.push({
            type: 'text',
            content: textContent
          })
        }
      })

      // 如果没有节点，至少返回一个空文本节点
      if (nodes.length === 0) {
        nodes.push({ type: 'text', content: '' })
      }

      console.log('[parseHtmlToNodes] 解析完成，节点数量:', nodes.length)
      const videoNodes = nodes.filter(n => n.type === 'video')
      const imageNodes = nodes.filter(n => n.type === 'image')
      console.log('[parseHtmlToNodes] 视频节点数量:', videoNodes.length, '图片节点数量:', imageNodes.length)
      return nodes
    } catch (err) {
      console.error('[parseHtmlToNodes] 解析HTML时出错:', err)
      return [{ type: 'text', content: html }]
    }
  },

  /**
   * 处理HTML内容，使图片自适应屏幕宽度
   * @param {string} html - 原始HTML内容
   * @returns {string} 处理后的HTML内容
   */
  processHtmlContent(html) {
    if (!html || typeof html !== 'string') {
      return html
    }

    try {
      // 获取屏幕宽度（单位：px）
      const systemInfo = wx.getSystemInfoSync()
      const screenWidth = systemInfo.windowWidth || 375
      // 减去容器左右padding（20px * 2 = 40px）
      const maxWidth = screenWidth - 40
      
      console.log('[processHtmlContent] 屏幕宽度:', screenWidth, '图片最大宽度:', maxWidth)

      // 处理所有 <img> 标签，添加自适应样式
      // 匹配 <img> 标签，包括自闭合标签和带属性的标签
      const imgRegex = /<img([^>]*)>/gi
      
      let processedHtml = html.replace(imgRegex, (match, attributes) => {
        // 检查是否已经有 style 属性
        const hasStyle = /style\s*=/i.test(attributes)
        
        if (hasStyle) {
          // 如果已有 style，在现有样式基础上添加 max-width
          // 提取现有的 style 值
          const styleMatch = attributes.match(/style\s*=\s*["']([^"']*)["']/i)
          if (styleMatch) {
            let existingStyle = styleMatch[1]
            // 检查是否已有 max-width
            if (!/max-width\s*:/i.test(existingStyle)) {
              existingStyle += `; max-width: ${maxWidth}px; width: 100%; height: auto;`
            }
            // 替换 style 属性
            return match.replace(/style\s*=\s*["'][^"']*["']/i, `style="${existingStyle}"`)
          }
        } else {
          // 如果没有 style 属性，添加新的 style 属性
          const styleAttr = `style="max-width: ${maxWidth}px; width: 100%; height: auto; display: block;"`
          return `<img${attributes} ${styleAttr}>`
        }
        
        return match
      })

      // 同时处理可能存在的 <image> 标签（虽然HTML标准是img，但有些内容可能用了image）
      processedHtml = processedHtml.replace(/<image([^>]*)>/gi, (match, attributes) => {
        const hasStyle = /style\s*=/i.test(attributes)
        if (!hasStyle) {
          const styleAttr = `style="max-width: ${maxWidth}px; width: 100%; height: auto; display: block;"`
          return `<image${attributes} ${styleAttr}>`
        }
        return match
      })

      // 移除 <img> 和 <image> 标签（图片只在上方显示，不在正文中显示）
      processedHtml = processedHtml.replace(/<img[^>]*>/gi, '')
      processedHtml = processedHtml.replace(/<image[^>]*>/gi, '')

      // 移除 <video> 标签（rich-text 不支持 video，我们会在单独的区域显示）
      processedHtml = processedHtml.replace(/<video[^>]*>.*?<\/video>/gi, '')
      processedHtml = processedHtml.replace(/<video[^>]*\/>/gi, '')
      
      // 移除 <iframe> 标签中的视频（如 YouTube、Bilibili 等）
      // 注意：iframe 中的视频链接会在 extractVideos 中处理
      processedHtml = processedHtml.replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')

      console.log('[processHtmlContent] HTML内容已处理，图片已添加自适应样式，视频标签已移除')
      return processedHtml
    } catch (err) {
      console.error('[processHtmlContent] 处理HTML内容时出错:', err)
      // 出错时返回原始内容
      return html
    }
  },

  /**
   * 从数据对象中提取地址信息
   * @param {Object} data - 数据对象
   * @returns {Object|null} 地址信息对象 { name, address, latitude, longitude } 或 null
   */
  extractLocation(data) {
    if (!data || typeof data !== 'object') {
      return null
    }

    try {
      // 支持多种字段名：latitude/lat, longitude/lng/lon, address/location, name/title
      const latitude = parseFloat(data.latitude || data.lat || 0)
      const longitude = parseFloat(data.longitude || data.lng || data.lon || 0)
      const address = data.address || data.location || ''
      const name = data.name || data.title || '位置'

      // 必须有有效的经纬度才返回地址信息
      if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
        return {
          name: name,
          address: address,
          latitude: latitude,
          longitude: longitude
        }
      }

      return null
    } catch (err) {
      console.error('[extractLocation] 提取地址信息时出错:', err)
      return null
    }
  },

  /**
   * 从HTML内容中提取所有图片
   * @param {string} html - HTML内容
   * @returns {Array} 图片URL数组（优先使用原图URL）
   */
  extractImages(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const images = []
      // 匹配 <img> 标签，优先提取 data-original（原图），否则使用 src
      const imgRegex = /<img([^>]*)>/gi
      
      let match
      const seenUrls = new Set() // 用于去重
      
      while ((match = imgRegex.exec(html)) !== null) {
        const attributes = match[1]
        
        // 优先查找 data-original（原图URL）
        let url = null
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          // 如果没有 data-original，使用 src
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }
        
        // 只添加有效的图片URL，并去重
        if (url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) && !seenUrls.has(url)) {
          seenUrls.add(url)
          images.push(url)
        }
      }

      // 也匹配 <image> 标签（小程序可能使用的标签）
      const imageRegex = /<image([^>]*)>/gi
      while ((match = imageRegex.exec(html)) !== null) {
        const attributes = match[1]
        let url = null
        
        const dataOriginalMatch = attributes.match(/data-original\s*=\s*["']([^"']+)["']/i)
        if (dataOriginalMatch) {
          url = dataOriginalMatch[1].trim()
        } else {
          const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
          if (srcMatch) {
            url = srcMatch[1].trim()
          }
        }
        
        if (url && !seenUrls.has(url)) {
          seenUrls.add(url)
          images.push(url)
        }
      }

      console.log('[extractImages] 提取到图片数量:', images.length)
      return images
    } catch (err) {
      console.error('[extractImages] 提取图片时出错:', err)
      return []
    }
  },

  /**
   * 从HTML内容中提取所有链接
   * @param {string} html - HTML内容
   * @returns {Array} 链接数组，每个元素包含 url 和 text
   */
  extractLinks(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const links = []
      // 匹配 <a> 标签，提取 href 和文本内容
      // 匹配格式：<a href="url">text</a> 或 <a href='url'>text</a>
      const linkRegex = /<a\s+[^>]*href\s*=\s*["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
      
      let match
      const seenUrls = new Set() // 用于去重
      
      while ((match = linkRegex.exec(html)) !== null) {
        const url = match[1].trim()
        const text = match[2].replace(/<[^>]+>/g, '').trim() || url // 移除HTML标签，如果没有文本则使用URL
        
        // 只添加有效的HTTP/HTTPS链接，并去重
        if (url && (url.startsWith('http://') || url.startsWith('https://')) && !seenUrls.has(url)) {
          seenUrls.add(url)
          links.push({
            url: url,
            text: text || url
          })
        }
      }

      console.log('[extractLinks] 提取到链接数量:', links.length)
      return links
    } catch (err) {
      console.error('[extractLinks] 提取链接时出错:', err)
      return []
    }
  },

  /**
   * 从HTML内容中提取所有视频
   * @param {string} html - HTML内容
   * @returns {Array} 视频数组，每个元素包含 { src, poster }
   */
  extractVideos(html) {
    if (!html || typeof html !== 'string') {
      return []
    }

    try {
      const videos = []
      const seenUrls = new Set() // 用于去重
      
      // 匹配完整的 <video>...</video> 块（包括嵌套的 <source>）
      // 格式1: <video src="url" poster="posterUrl">...</video>
      // 格式2: <video poster="posterUrl"><source src="url" /></video>
      const videoBlockRegex = /<video([^>]*)>([\s\S]*?)<\/video>/gi
      
      let match
      while ((match = videoBlockRegex.exec(html)) !== null) {
        const videoAttributes = match[1]
        const videoContent = match[2] || '' // video 标签内的内容
        
        // 先尝试从 <video> 标签的 src 属性中提取
        let src = null
        const videoSrcMatch = videoAttributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (videoSrcMatch) {
          src = videoSrcMatch[1].trim()
        }
        
        // 如果没有找到 src，尝试从嵌套的 <source> 标签中提取
        if (!src && videoContent) {
          const sourceRegex = /<source([^>]*)>/gi
          let sourceMatch
          while ((sourceMatch = sourceRegex.exec(videoContent)) !== null) {
            const sourceAttributes = sourceMatch[1]
            const sourceSrcMatch = sourceAttributes.match(/src\s*=\s*["']([^"']+)["']/i)
            if (sourceSrcMatch) {
              src = sourceSrcMatch[1].trim()
              break // 使用第一个找到的 source src
            }
          }
        }
        
        // 提取 poster 属性（封面图）
        let poster = null
        const posterMatch = videoAttributes.match(/poster\s*=\s*["']([^"']+)["']/i)
        if (posterMatch) {
          const posterValue = posterMatch[1].trim()
          // 验证 poster 是否是有效的网络 URL 且是图片格式（不能是视频格式）
          if (posterValue && 
              (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
              this.isValidImageUrl(posterValue)) {
            poster = posterValue
          } else {
            console.warn('[extractVideos] 忽略无效的poster URL（不是图片格式）:', posterValue)
          }
        }
        
        // 只添加有效的视频URL，并去重
        if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) && !seenUrls.has(src)) {
          seenUrls.add(src)
          // 只有当 poster 是有效的网络 URL 时才设置 poster 字段
          const videoItem = { src: src }
          if (poster) {
            videoItem.poster = poster
          }
          videos.push(videoItem)
        }
      }
      
      // 也匹配自闭合的 <video /> 标签（向后兼容）
      const videoSelfClosingRegex = /<video([^>]*)\/>/gi
      while ((match = videoSelfClosingRegex.exec(html)) !== null) {
        const attributes = match[1]
        
        let src = null
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          src = srcMatch[1].trim()
        }
        
        let poster = null
        const posterMatch = attributes.match(/poster\s*=\s*["']([^"']+)["']/i)
        if (posterMatch) {
          const posterValue = posterMatch[1].trim()
          // 验证 poster 是否是有效的网络 URL 且是图片格式（不能是视频格式）
          if (posterValue && 
              (posterValue.startsWith('http://') || posterValue.startsWith('https://') || posterValue.startsWith('//')) &&
              this.isValidImageUrl(posterValue)) {
            poster = posterValue
          } else {
            console.warn('[extractVideos] 忽略无效的poster URL（不是图片格式）:', posterValue)
          }
        }
        
        if (src && (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) && !seenUrls.has(src)) {
          seenUrls.add(src)
          // 只有当 poster 是有效的网络 URL 时才设置 poster 字段
          const videoItem = { src: src }
          if (poster) {
            videoItem.poster = poster
          }
          videos.push(videoItem)
        }
      }
      
      // 匹配 <iframe> 标签中的视频（如 YouTube、Bilibili 等）
      // 格式：<iframe src="https://www.youtube.com/embed/xxx"></iframe>
      const iframeRegex = /<iframe([^>]*)>/gi
      while ((match = iframeRegex.exec(html)) !== null) {
        const attributes = match[1]
        const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i)
        if (srcMatch) {
          const iframeSrc = srcMatch[1].trim()
          // 检查是否是视频平台的嵌入链接
          if (iframeSrc && (iframeSrc.includes('youtube.com') || 
                           iframeSrc.includes('youtu.be') ||
                           iframeSrc.includes('bilibili.com') ||
                           iframeSrc.includes('vimeo.com') ||
                           iframeSrc.includes('youku.com') ||
                           iframeSrc.includes('iqiyi.com') ||
                           iframeSrc.includes('qq.com/video'))) {
            if (!seenUrls.has(iframeSrc)) {
              seenUrls.add(iframeSrc)
              videos.push({
                src: iframeSrc,
                poster: ''
              })
            }
          }
        }
      }

      console.log('[extractVideos] 提取到视频数量:', videos.length)
      return videos
    } catch (err) {
      console.error('[extractVideos] 提取视频时出错:', err)
      return []
    }
  },

  /**
   * 复制链接到剪贴板
   * @param {Object} e - 事件对象
   */
  copyLink(e) {
    const url = e.currentTarget.dataset.url
    if (!url) {
      return
    }

    wx.setClipboardData({
      data: url,
      success: () => {
        // 先显示第一行提示
        wx.showToast({
          title: '链接已复制',
          icon: 'success',
          duration: 1500
        })
        
        // 延迟显示第二行提示
        setTimeout(() => {
          wx.showToast({
            title: '请粘贴到浏览器打开',
            icon: 'none',
            duration: 2000
          })
        }, 1600)
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 将缩略图 URL 转换为原图 URL
   * @param {string} url - 图片 URL
   * @returns {string} 原图 URL
   */
  getOriginalImageUrl(url) {
    if (!url || typeof url !== 'string') {
      return url
    }
    
    try {
      let originalUrl = url
      
      // 如果 URL 已经包含明确的原图标识，直接返回
      if (originalUrl.includes('/original/') || originalUrl.includes('/full/')) {
        return originalUrl
      }
      
      // 移除常见的缩略图查询参数
      // 例如: ?w=100, ?h=100, ?size=small, ?thumbnail=true 等
      const thumbnailParams = [
        /[?&]w=\d+/gi,
        /[?&]h=\d+/gi,
        /[?&]width=\d+/gi,
        /[?&]height=\d+/gi,
        /[?&]size=(small|medium|thumb|thumbnail)/gi,
        /[?&]thumbnail=(true|1)/gi,
        /[?&]thumb=(true|1)/gi,
        /[?&]format=(thumb|thumbnail)/gi,
        /[?&]quality=\d+/gi, // 移除质量参数，可能限制图片大小
        /[?&]compress=(true|1)/gi
      ]
      
      thumbnailParams.forEach(param => {
        originalUrl = originalUrl.replace(param, '')
      })
      
      // 移除路径中的缩略图相关路径段
      // 例如: /thumbnail/, /thumb/, /small/, /medium/ 等
      const thumbnailPaths = [
        /\/thumbnail\//gi,
        /\/thumb\//gi,
        /\/small\//gi,
        /\/medium\//gi,
        /\/preview\//gi,
        /\/resized\//gi
      ]
      
      thumbnailPaths.forEach(path => {
        originalUrl = originalUrl.replace(path, '/')
      })
      
      // 移除文件名中的缩略图后缀
      // 例如: image_thumb.jpg -> image.jpg, image-small.jpg -> image.jpg
      originalUrl = originalUrl.replace(/_thumb(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/-thumb(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/_small(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/-small(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/_medium(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      originalUrl = originalUrl.replace(/-medium(\.(jpg|jpeg|png|gif|webp))?/gi, '$1')
      
      // 如果 URL 包含 resize 或 crop 参数，尝试移除
      originalUrl = originalUrl.replace(/[?&]resize=\d+[xX]\d+/gi, '')
      originalUrl = originalUrl.replace(/[?&]crop=\d+[xX]\d+/gi, '')
      originalUrl = originalUrl.replace(/[?&]scale=\d+/gi, '')
      
      // 清理 URL 末尾的 & 或 ?
      originalUrl = originalUrl.replace(/[&?]+$/, '')
      
      // 如果处理后的 URL 与原始 URL 不同，记录日志
      if (originalUrl !== url) {
        console.log('[getOriginalImageUrl] 原URL:', url, '-> 处理后:', originalUrl)
      }
      
      return originalUrl
    } catch (err) {
      console.error('[getOriginalImageUrl] 处理URL时出错:', err)
      return url
    }
  },

  /**
   * 预览图片（点击缩略图查看大图）
   * @param {Object} e - 事件对象
   */
  previewImage(e) {
    const currentUrl = e.currentTarget.dataset.url
    const currentIndex = e.currentTarget.dataset.index || 0
    const images = this.data.images || []
    
    if (!currentUrl || images.length === 0) {
      return
    }
    
    // 将所有图片 URL 转换为原图 URL
    const originalImages = images.map(url => this.getOriginalImageUrl(url))
    const currentOriginalUrl = this.getOriginalImageUrl(currentUrl)
    
    console.log('[previewImage] 预览图片，当前索引:', currentIndex, '原图URL:', currentOriginalUrl)
    
    // 使用微信小程序的图片预览功能，使用原图 URL
    wx.previewImage({
      current: currentOriginalUrl, // 当前显示图片的原图URL
      urls: originalImages // 需要预览的图片原图URL列表
    })
  },

  /**
   * 图片滑动切换事件
   * @param {Object} e - 事件对象
   */
  onImageSwiperChange(e) {
    const current = e.detail.current || 0
    const oldIndex = this.data.currentImageIndex
    
    this.setData({
      currentImageIndex: current
    })
    
    // 如果滑动到视频，自动播放；如果离开视频，暂停播放
    const parsedImages = this.data.parsedImages || []
    const currentMedia = parsedImages[current]
    const oldMedia = parsedImages[oldIndex]
    
    // 暂停之前的视频
    if (oldMedia && oldMedia.type === 'video') {
      const oldVideoId = `gallery-video-${oldIndex}`
      const oldVideoContext = wx.createVideoContext(oldVideoId, this)
      if (oldVideoContext) {
        oldVideoContext.pause()
      }
    }
    
    // 播放当前视频
    if (currentMedia && currentMedia.type === 'video') {
      const videoId = `gallery-video-${current}`
      const videoContext = wx.createVideoContext(videoId, this)
      if (videoContext) {
        // 延迟一下，确保视频组件已渲染
        setTimeout(() => {
          videoContext.play()
        }, 100)
      }
    }
  },
  
  // 视频播放事件
  onVideoPlay(e) {
    console.log('[onVideoPlay] 视频开始播放:', e.detail)
  },
  
  // 视频暂停事件
  onVideoPause(e) {
    console.log('[onVideoPause] 视频暂停:', e.detail)
  },

  /**
   * 从图片画廊预览图片（横向滚动区域的图片）
   * @param {Object} e - 事件对象
   */
  previewImageFromGallery(e) {
    const url = e.currentTarget.dataset.url
    const index = e.currentTarget.dataset.index
    
    // 获取所有图片URL（优先使用parsedImages，否则使用images）
    const imageList = this.data.parsedImages && this.data.parsedImages.length > 0 
      ? this.data.parsedImages 
      : this.data.images.map(img => ({ url: img }))
    const imageUrls = imageList.map(img => img.url || img)
    
    if (!imageUrls || imageUrls.length === 0) {
      wx.showToast({
        title: '没有图片可预览',
        icon: 'none'
      })
      return
    }
    
    // 转换为原图URL
    const originalImages = imageUrls.map(imgUrl => this.getOriginalImageUrl(imgUrl))
    const currentOriginalUrl = this.getOriginalImageUrl(url || imageUrls[index] || imageUrls[0])
    
    wx.previewImage({
      current: currentOriginalUrl,
      urls: originalImages,
      success: () => {
        this.setData({ currentImageIndex: index || 0 })
      }
    })
  },

  /**
   * 从节点预览图片（内联图片）
   * @param {Object} e - 事件对象
   */
  previewImageFromNode(e) {
    const currentUrl = e.currentTarget.dataset.url
    const nodeIndex = e.currentTarget.dataset.index || 0
    const parsedContent = this.data.parsedContent || []
    
    if (!currentUrl) {
      return
    }
    
    // 从 parsedContent 中提取所有图片 URL
    const imageUrls = []
    let currentImageIndex = 0
    let targetIndex = 0
    
    parsedContent.forEach((node, index) => {
      if (node.type === 'image') {
        imageUrls.push(node.url)
        if (index === nodeIndex) {
          targetIndex = currentImageIndex
        }
        currentImageIndex++
      }
    })
    
    if (imageUrls.length === 0) {
      return
    }
    
    // 将所有图片 URL 转换为原图 URL
    const originalImages = imageUrls.map(url => this.getOriginalImageUrl(url))
    const currentOriginalUrl = this.getOriginalImageUrl(currentUrl)
    
    console.log('[previewImageFromNode] 预览图片，节点索引:', nodeIndex, '图片索引:', targetIndex, '原图URL:', currentOriginalUrl)
    
    // 使用微信小程序的图片预览功能
    wx.previewImage({
      current: currentOriginalUrl,
      urls: originalImages
    })
  },

  /**
   * 从节点保存图片（内联图片）
   * @param {Object} e - 事件对象
   */
  saveImageFromNode(e) {
    const imageUrl = e.currentTarget.dataset.url
    if (!imageUrl) {
      return
    }
    // 复用现有的保存图片逻辑
    this.saveImage({ currentTarget: { dataset: { url: imageUrl } } })
  },

  /**
   * 保存图片到相册
   * @param {Object} e - 事件对象
   */
  saveImage(e) {
    const imageUrl = e.currentTarget.dataset.url
    if (!imageUrl) {
      return
    }

    // 检查授权状态
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.writePhotosAlbum']) {
          // 已授权，直接保存
          this.downloadAndSaveImage(imageUrl)
        } else if (res.authSetting['scope.writePhotosAlbum'] === false) {
          // 用户之前拒绝了授权，需要引导用户打开设置
          wx.showModal({
            title: '需要授权',
            content: '需要您授权保存图片到相册',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (settingRes) => {
                    if (settingRes.authSetting['scope.writePhotosAlbum']) {
                      this.downloadAndSaveImage(imageUrl)
                    }
                  }
                })
              }
            }
          })
        } else {
          // 未授权，请求授权
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.downloadAndSaveImage(imageUrl)
            },
            fail: () => {
              wx.showToast({
                title: '需要授权才能保存',
                icon: 'none',
                duration: 2000
              })
            }
          })
        }
      }
    })
  },

  /**
   * 下载并保存图片
   * @param {string} imageUrl - 图片URL
   */
  downloadAndSaveImage(imageUrl) {
    wx.showLoading({
      title: '保存中...',
      mask: true
    })

    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        if (res.statusCode === 200) {
          wx.saveImageToPhotosAlbum({
            filePath: res.tempFilePath,
            success: () => {
              wx.hideLoading()
              wx.showToast({
                title: '图片已保存',
                icon: 'success',
                duration: 2000
              })
            },
            fail: (err) => {
              wx.hideLoading()
              console.error('保存图片失败', err)
              wx.showToast({
                title: '保存失败',
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else {
          wx.hideLoading()
          wx.showToast({
            title: '下载失败',
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('下载图片失败', err)
        wx.showToast({
          title: '下载失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 打开地图导航
   */
  openLocation() {
    const location = this.data.location
    if (!location) {
      return
    }

    wx.openLocation({
      latitude: location.latitude,
      longitude: location.longitude,
      name: location.name || '位置',
      address: location.address || '',
      scale: 18,
      success: () => {
        console.log('打开地图成功')
      },
      fail: (err) => {
        console.error('打开地图失败', err)
        wx.showToast({
          title: '打开地图失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 拨打手机号
   * @param {Object} e - 事件对象
   */
  makePhoneCall(e) {
    const phone = e.currentTarget.dataset.phone
    if (!phone) {
      return
    }
    
    // 清理手机号，移除空格、横线等字符
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '')
    
    if (!cleanPhone) {
      wx.showToast({
        title: '手机号无效',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    wx.makePhoneCall({
      phoneNumber: cleanPhone,
      success: () => {
        console.log('[makePhoneCall] 拨打成功:', cleanPhone)
      },
      fail: (err) => {
        console.error('[makePhoneCall] 拨打失败:', err)
        wx.showToast({
          title: '拨打失败',
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 视频播放错误处理
   * @param {Object} e - 事件对象
   */
  onVideoError(e) {
    const nodeIndex = e.currentTarget.dataset.index || 0
    const parsedContent = this.data.parsedContent || []
    const videos = this.data.videos || []
    
    // 优先从 parsedContent 中获取视频信息（内联渲染）
    let video = null
    if (parsedContent.length > 0 && parsedContent[nodeIndex] && parsedContent[nodeIndex].type === 'video') {
      video = parsedContent[nodeIndex]
    } else if (videos.length > 0) {
      // 向后兼容：从 videos 数组中获取（底部显示）
      video = videos[nodeIndex]
    }
    
    const errorDetail = e.detail || {}
    const errorMsg = errorDetail.errMsg || errorDetail.message || JSON.stringify(errorDetail)
    const videoUrl = video?.src || ''
    
    // ERR_FAILED 通常是网络错误，但如果视频能播放，可能是预加载失败
    // 这种情况在开发工具中很常见，实际播放时能成功
    if (errorMsg.includes('ERR_FAILED') || errorMsg.includes('net::ERR')) {
      // 如果是网络错误，只在控制台记录警告，不显示用户提示
      // 因为视频播放器可能会自动重试，最终可能成功播放
      console.warn('[onVideoError] 视频预加载网络错误（可能不影响播放）:', {
        error: errorMsg,
        videoURL: videoUrl,
        note: '如果视频能正常播放，可以忽略此错误'
      })
      return // 不显示错误提示，让播放器自动重试
    }
    
    console.error('[onVideoError] 视频播放失败:', {
      error: errorDetail,
      errorMsg: errorMsg,
      videoURL: videoUrl,
      nodeIndex: nodeIndex
    })
    
    // 检查视频格式
    const videoExt = videoUrl.split('.').pop()?.toLowerCase()
    
    // 微信小程序支持的视频格式：mp4, m3u8, flv, f4v
    const supportedFormats = ['mp4', 'm3u8', 'flv', 'f4v']
    
    if (videoExt && !supportedFormats.includes(videoExt)) {
      wx.showModal({
        title: '视频格式不支持',
        content: `当前视频格式（${videoExt}）可能不被支持。微信小程序支持 mp4、m3u8 等格式。`,
        showCancel: false,
        confirmText: '知道了'
      })
    } else {
      // 只有在非网络错误时才显示提示
      wx.showToast({
        title: '视频加载失败',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 获取用户互动状态（是否已点赞/收藏）
  async fetchUserInteractions(postId) {
    if (!postId) return
    
    try {
      const blogApi = require('../../utils/blogApi.js')
      const result = await blogApi.blogInteractionApi.getInteractions(postId)
      
      if (result.success && result.data) {
        // API返回的字段是 isLiked 和 isFavorited，需要转换为 liked 和 favorited
        const liked = result.data.isLiked === true || result.data.isLiked === 1 || result.data.isLiked === 'true' || 
                      result.data.liked === true || result.data.liked === 1 || result.data.liked === 'true'
        const favorited = result.data.isFavorited === true || result.data.isFavorited === 1 || result.data.isFavorited === 'true' ||
                          result.data.favorited === true || result.data.favorited === 1 || result.data.favorited === 'true'
        
        console.log('[article-detail] 从getInteractions API获取到用户互动状态:', { 
          liked, 
          favorited, 
          isLiked: result.data.isLiked, 
          isFavorited: result.data.isFavorited,
          rawLiked: result.data.liked, 
          rawFavorited: result.data.favorited,
          allData: result.data
        })
        
        this.setData({
          liked: liked,
          favorited: favorited
        })
      } else {
        console.warn('[article-detail] 获取互动状态失败: API返回失败', result)
      }
    } catch (error) {
      // 如果用户未登录，静默失败（不显示错误）
      if (error.message && error.message.includes('认证')) {
        console.log('[article-detail] 用户未登录，无法获取互动状态')
      } else {
        console.warn('[article-detail] 获取互动状态失败:', error.message)
      }
    }
  },

  // 切换点赞状态
  async toggleLike() {
    const postId = this.data.articleId
    if (!postId) {
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }
    
    const currentLiked = this.data.liked
    const currentLikeCount = this.data.likeCount
    
    // 乐观更新UI
    this.setData({
      liked: !currentLiked,
      likeCount: Math.max(0, currentLikeCount + (currentLiked ? -1 : 1))
    })
    
    try {
      const blogApi = require('../../utils/blogApi.js')
      
      if (currentLiked) {
        // 取消点赞
        await blogApi.blogInteractionApi.unlikePost(postId)
      } else {
        // 点赞
        await blogApi.blogInteractionApi.likePost(postId)
      }
      
      // 更新点赞数（从服务器获取最新数据）
      const articleResult = await blogApi.articleApi.getDetail(postId)
      if (articleResult.success && articleResult.data) {
        this.setData({
          likeCount: articleResult.data.likesCount || 0
        })
      }
    } catch (error) {
      // 回滚UI状态
      this.setData({
        liked: currentLiked,
        likeCount: currentLikeCount
      })
      
      if (error.message && error.message.includes('认证')) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500
        })
      } else {
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none',
          duration: 1500
        })
      }
    }
  },

  // 切换收藏状态
  async toggleFavorite() {
    const postId = this.data.articleId
    if (!postId) {
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }
    
    const currentFavorited = this.data.favorited
    const currentFavoriteCount = this.data.favoriteCount
    
    // 乐观更新UI
    this.setData({
      favorited: !currentFavorited,
      favoriteCount: Math.max(0, currentFavoriteCount + (currentFavorited ? -1 : 1))
    })
    
    try {
      const blogApi = require('../../utils/blogApi.js')
      
      if (currentFavorited) {
        // 取消收藏
        await blogApi.blogInteractionApi.unfavoritePost(postId)
      } else {
        // 收藏
        await blogApi.blogInteractionApi.favoritePost(postId)
      }
      
      // 更新收藏数（从服务器获取最新数据，不需要评论）
      const articleResult = await blogApi.articleApi.getDetail(postId, {
        includeComments: false
      })
      if (articleResult.success && articleResult.data) {
        this.setData({
          favoriteCount: articleResult.data.favoritesCount || 0
        })
      }
    } catch (error) {
      // 回滚UI状态
      this.setData({
        favorited: currentFavorited,
        favoriteCount: currentFavoriteCount
      })
      
      if (error.message && error.message.includes('认证')) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500
        })
      } else {
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none',
          duration: 1500
        })
      }
    }
  },

  // 聚焦评论输入框
  focusCommentInput() {
    this.setData({
      showCommentInput: true,
      commentInputFocus: true // 设置焦点状态，让输入框自动获得焦点
    })
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    })
  },

  // 评论输入框聚焦
  onCommentFocus() {
    // 确保焦点状态正确
    this.setData({
      commentInputFocus: true
    })
  },

  // 评论输入框失焦
  onCommentBlur() {
    // 清除焦点状态
    this.setData({
      commentInputFocus: false
    })
    // 如果用户点击其他位置，直接取消评论（清空输入内容并隐藏输入框）
    setTimeout(() => {
      this.setData({
        showCommentInput: false,
        commentText: '',
        replyingTo: null
      })
    }, 200)
  },

  /**
   * 格式化单个评论（递归处理回复）
   * @param {Object} comment - API返回的评论对象
   * @returns {Object} 格式化后的评论对象
   */
  formatSingleComment(comment) {
    // 获取评论者的用户ID（可能是 authorId、userId、author.id 等）
    const authorId = comment.authorId || comment.userId || comment.author?.id || comment.user?.id || null
    
    // 根据用户ID生成固定的可爱头像emoji
    const avatarEmoji = getCuteAvatar(authorId)
    
    const formatted = {
      id: comment.id || '',
      author: comment.authorName || comment.author || '匿名用户',
      content: comment.content || '',
      time: formatRelativeTime(comment.createdAt || ''),
      likes: comment.likesCount || comment.likes || 0,
      liked: comment.isLiked === true || comment.isLiked === 1 || comment.isLiked === 'true' ||
             comment.liked === true || comment.liked === 1 || comment.liked === 'true',
      avatarEmoji: avatarEmoji, // 使用可爱动物头像emoji
      email: comment.authorEmail || '',
      parentId: comment.parentId || null, // 用于回复功能
      replies: [] // 回复列表
    }
    
    // 递归处理回复（如果有）
    if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
      formatted.replies = comment.replies
        .map(reply => this.formatSingleComment(reply))
        .filter(reply => reply !== null) // 过滤掉无效的回复
      console.log(`[formatSingleComment] 评论 ${formatted.id} 有 ${formatted.replies.length} 条回复`)
    }
    
    return formatted
  },

  /**
   * 格式化评论数据（将API返回的格式转换为前端需要的格式，支持树形结构）
   * @param {Array} apiComments - API返回的评论列表（树形结构）
   * @returns {Array} 格式化后的评论列表
   */
  formatComments(apiComments) {
    if (!Array.isArray(apiComments)) {
      console.warn('[formatComments] 评论数据不是数组:', apiComments)
      return []
    }
    
    const formatted = apiComments
      .map(comment => this.formatSingleComment(comment))
      .filter(comment => comment !== null) // 过滤掉无效的评论
    
    console.log('[formatComments] 格式化完成，根评论数量:', formatted.length)
    formatted.forEach((comment, index) => {
      console.log(`[formatComments] 根评论 ${index + 1}: ID=${comment.id}, 回复数=${comment.replies ? comment.replies.length : 0}`)
    })
    
    return formatted
  },

  // 提交评论
  async submitComment() {
    // 防止重复提交
    if (this.data.submittingComment) {
      return
    }

    const commentText = this.data.commentText.trim()
    if (!commentText) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none',
        duration: 1500
      })
      return
    }

    const postId = this.data.articleId
    if (!postId) {
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }

    // 设置提交状态，显示加载反馈
    this.setData({
      submittingComment: true
    })

    const replyingTo = this.data.replyingTo
    const commentData = {
      content: commentText,
      parentId: replyingTo || null // 1级评论：parentId为null；2级回复：parentId为1级评论ID
    }

    try {
      const blogApi = require('../../utils/blogApi.js')
      const result = await blogApi.blogInteractionApi.createComment(postId, commentData)
      
      if (result.success) {
        // 重新获取文章详情（包含最新的评论列表）
        const articleResult = await blogApi.articleApi.getDetail(postId, {
          includeComments: true,
          commentsPage: 1,
          commentsPageSize: 10
        })
        
        if (articleResult.success && articleResult.data) {
          // 更新互动数据
          this.setData({
            favoriteCount: articleResult.data.favoritesCount || this.data.favoriteCount,
            likeCount: articleResult.data.likesCount || this.data.likeCount,
            commentsCount: articleResult.data.commentsCount || 0
          })
          
          // 更新评论列表
          if (articleResult.comments && articleResult.comments.comments && Array.isArray(articleResult.comments.comments)) {
            const comments = this.formatComments(articleResult.comments.comments)
            this.setData({
              comments: comments
            })
          }
        }
        
        // 清空输入框
        this.setData({
          commentText: '',
          showCommentInput: false,
          replyingTo: null,
          commentInputFocus: false,
          submittingComment: false // 清除提交状态
        })
        
        wx.showToast({
          title: '评论成功',
          icon: 'success',
          duration: 1500
        })
      }
    } catch (error) {
      // 提交失败时也要清除提交状态
      this.setData({
        submittingComment: false
      })
      
      wx.showToast({
        title: error.message || '评论失败',
        icon: 'none',
        duration: 2000
      })
      if (error.message && error.message.includes('认证')) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500
        })
      } else {
        wx.showToast({
          title: error.message || '评论失败',
          icon: 'none',
          duration: 1500
        })
      }
    }
  },

  /**
   * 在评论列表中查找评论（支持嵌套查找）
   * @param {Array} comments - 评论列表
   * @param {string} commentId - 评论ID
   * @returns {Object|null} 找到的评论对象和其父数组，格式：{ comment, parentArray, index }
   */
  findCommentInList(comments, commentId) {
    for (let i = 0; i < comments.length; i++) {
      const comment = comments[i]
      
      // 检查当前评论
      if (comment.id === commentId) {
        return { comment, parentArray: comments, index: i }
      }
      
      // 递归检查回复
      if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
        const found = this.findCommentInList(comment.replies, commentId)
        if (found) {
          return found
        }
      }
    }
    
    return null
  },

  /**
   * 更新评论列表中的某个评论（支持嵌套更新）
   * @param {Array} comments - 评论列表
   * @param {string} commentId - 评论ID
   * @param {Function} updater - 更新函数，接收评论对象并返回更新后的对象
   * @returns {Array} 更新后的评论列表
   */
  updateCommentInList(comments, commentId, updater) {
    return comments.map(comment => {
      if (comment.id === commentId) {
        // 找到目标评论，更新它
        return updater(comment)
      }
      
      // 递归更新回复
      if (comment.replies && Array.isArray(comment.replies) && comment.replies.length > 0) {
        return {
          ...comment,
          replies: this.updateCommentInList(comment.replies, commentId, updater)
        }
      }
      
      return comment
    })
  },

  // 点赞评论
  async likeComment(e) {
    const commentId = e.currentTarget.dataset.commentId
    const isReply = e.currentTarget.dataset.isReply === 'true'
    const parentId = e.currentTarget.dataset.parentId
    
    if (!commentId) {
      wx.showToast({
        title: '评论ID不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }

    // 查找评论
    const found = this.findCommentInList(this.data.comments, commentId)
    if (!found) {
      wx.showToast({
        title: '评论不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }

    const currentLiked = found.comment.liked
    const currentLikes = found.comment.likes

    // 乐观更新UI
    const updatedComments = this.updateCommentInList(this.data.comments, commentId, (comment) => ({
      ...comment,
      liked: !currentLiked,
      likes: Math.max(0, currentLikes + (currentLiked ? -1 : 1))
    }))
    
    this.setData({
      comments: updatedComments
    })

    try {
      const blogApi = require('../../utils/blogApi.js')
      
      console.log('[likeComment] 开始点赞/取消点赞评论，commentId:', commentId, 'currentLiked:', currentLiked)
      
      if (currentLiked) {
        // 取消点赞
        console.log('[likeComment] 调用 unlikeComment API，路径: /api/blog/comments/' + commentId + '/like')
        await blogApi.blogInteractionApi.unlikeComment(commentId)
      } else {
        // 点赞
        console.log('[likeComment] 调用 likeComment API，路径: /api/blog/comments/' + commentId + '/like')
        await blogApi.blogInteractionApi.likeComment(commentId)
      }
      
      console.log('[likeComment] 点赞/取消点赞成功')
      
      // 可选：重新获取评论的点赞状态（确保数据同步）
      // const interactionsResult = await blogApi.blogInteractionApi.getCommentInteractions(commentId)
      // if (interactionsResult.success && interactionsResult.data) {
      //   // 更新点赞状态
      // }
    } catch (error) {
      // 回滚UI状态
      const rolledBackComments = this.updateCommentInList(this.data.comments, commentId, (comment) => ({
        ...comment,
        liked: currentLiked,
        likes: currentLikes
      }))
      
      this.setData({
        comments: rolledBackComments
      })
      
      if (error.message && error.message.includes('认证')) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500
        })
      } else {
        wx.showToast({
          title: error.message || '操作失败',
          icon: 'none',
          duration: 1500
        })
      }
    }
  },

  // 回复评论
  replyComment(e) {
    const commentId = e.currentTarget.dataset.commentId
    const parentId = e.currentTarget.dataset.parentId
    
    if (!commentId) {
      return
    }

    // 查找评论（支持根评论和回复）
    const found = this.findCommentInList(this.data.comments, commentId)
    if (!found) {
      wx.showToast({
        title: '评论不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }

    const comment = found.comment
    // 确定回复目标ID：
    // 1. 如果comment.parentId存在，说明这是2级评论，回复时应该使用1级评论ID（comment.parentId）
    // 2. 如果comment.parentId不存在，说明这是1级评论，回复时使用当前评论ID
    // 3. 如果从dataset传入了parentId（WXML中传递的），优先使用它（这是1级评论ID）
    let replyToId
    if (parentId) {
      // WXML中传递的parentId（1级评论ID）
      replyToId = parentId
    } else if (comment.parentId) {
      // 2级评论，使用其parentId（1级评论ID）
      replyToId = comment.parentId
    } else {
      // 1级评论，使用当前评论ID
      replyToId = commentId
    }
    
    this.setData({
      showCommentInput: true,
      replyingTo: replyToId, // 设置为1级评论ID（用于创建2级回复）
      commentText: `@${comment.author || '匿名用户'} `,
      commentInputFocus: true // 设置焦点状态，让输入框自动获得焦点
    })
  },

  // 删除评论
  async deleteComment(commentId) {
    const postId = this.data.articleId
    if (!postId || !commentId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none',
        duration: 1500
      })
      return
    }

    try {
      const blogApi = require('../../utils/blogApi.js')
      const result = await blogApi.blogInteractionApi.deleteComment(postId, commentId)
      
      if (result.success) {
        // 重新获取文章详情（包含最新的评论列表）
        const articleResult = await blogApi.articleApi.getDetail(postId, {
          includeComments: true,
          commentsPage: 1,
          commentsPageSize: 10
        })
        
        if (articleResult.success && articleResult.data) {
          const commentsCount = articleResult.data.commentsCount || 0
          
          // 更新评论列表
          let comments = []
          if (articleResult.comments && articleResult.comments.comments && Array.isArray(articleResult.comments.comments)) {
            comments = this.formatComments(articleResult.comments.comments)
          }
          
          this.setData({
            comments: comments,
            commentsCount: commentsCount
          })
        }
        
        wx.showToast({
          title: '删除成功',
          icon: 'success',
          duration: 1500
        })
      }
    } catch (error) {
      if (error.message && error.message.includes('认证')) {
        wx.showToast({
          title: '请先登录',
          icon: 'none',
          duration: 1500
        })
      } else if (error.message && error.message.includes('权限')) {
        wx.showToast({
          title: '无权删除此评论',
          icon: 'none',
          duration: 1500
        })
      } else {
        wx.showToast({
          title: error.message || '删除失败',
          icon: 'none',
          duration: 1500
        })
      }
    }
  },

  // 加载更多评论
  async loadMoreComments() {
    const postId = this.data.articleId
    if (!postId) {
      wx.showToast({
        title: '文章ID不存在',
        icon: 'none',
        duration: 1500
      })
      return
    }

    const nextPage = this.data.commentsPage + 1
    
    this.setData({
      loadingComments: true
    })

    try {
      const blogApi = require('../../utils/blogApi.js')
      const result = await blogApi.articleApi.getDetail(postId, {
        includeComments: true,
        commentsPage: nextPage,
        commentsPageSize: this.data.commentsPageSize || 10
      })

      if (result.success && result.comments && result.comments.comments && Array.isArray(result.comments.comments)) {
        const newComments = this.formatComments(result.comments.comments)
        const currentComments = this.data.comments || []
        
        // 合并评论列表（追加到现有列表）
        const updatedComments = [...currentComments, ...newComments]
        
        // 判断是否还有更多评论
        const totalPages = result.comments.totalPages || 1
        const hasMoreComments = nextPage < totalPages
        
        this.setData({
          comments: updatedComments,
          commentsPage: nextPage,
          hasMoreComments: hasMoreComments,
          loadingComments: false
        })
        
        console.log('[loadMoreComments] 加载更多评论成功，当前页:', nextPage, '总页数:', totalPages, '是否还有更多:', hasMoreComments)
      } else {
        this.setData({
          loadingComments: false
        })
      }
    } catch (error) {
      console.error('[loadMoreComments] 加载更多评论失败:', error)
      this.setData({
        loadingComments: false
      })
      
      wx.showToast({
        title: error.message || '加载失败',
        icon: 'none',
        duration: 1500
      })
    }
  }
})
