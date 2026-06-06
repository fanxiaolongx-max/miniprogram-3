const app = getApp()
const authApi = require('../../utils/authApi.js')
const authHelper = require('../../utils/authHelper.js')
const blogApi = require('../../utils/blogApi.js')

/**
 * 生成随机可爱的名字
 * @returns {string} 随机名字
 */
function generateRandomCuteName() {
  // 可爱的名字前缀
  const prefixes = ['小', '萌', '甜', '暖', '星', '月', '花', '云', '风', '雨', '阳', '光', '梦', '心', '爱', '乐', '笑', '喜', '欢', '美']
  
  // 可爱的名字后缀
  const suffixes = ['宝', '贝', '兔', '猫', '熊', '鹿', '鸟', '鱼', '蝶', '花', '叶', '果', '糖', '豆', '球', '星', '月', '光', '心', '爱']
  
  // 随机选择前缀和后缀
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
  
  // 添加时间戳的后4位确保唯一性
  const timestamp = Date.now().toString().slice(-4)
  
  // 组合成名字：前缀 + 后缀 + 数字（确保不重复）
  return `${prefix}${suffix}${timestamp}`
}

/**
 * 根据用户ID生成固定的可爱头像图案
 * @param {string|number} userId - 用户ID
 * @returns {string} 可爱图案emoji
 */
function getCuteAvatar(userId) {
  // 可爱的emoji图案列表
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
    '🍼', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃',
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
    return {
      title: '我的',
      path: 'page/my/index'
    }
  },

  data: {
    theme: 'light',
    // 登录状态
    isLoggedIn: false,
    user: null,
    // 写权限（读写权限）
    hasWritePermission: false,
    // 我的喜欢和收藏相关
    currentView: '', // 'likes' | 'favorites' | 'comments' | 'messages' | ''（空字符串表示显示反馈建议）
    articlesList: [], // 文章列表（也用于评论和消息）
    articlesLoading: false, // 加载状态
    articlesError: false, // 错误状态
    articlesErrorMessage: '', // 错误消息
    currentPage: 1, // 当前页码
    pageSize: 6, // 每页数量（文章）
    commentsPageSize: 10, // 评论每页数量
    messagesPageSize: 10, // 消息每页数量
    hasMoreArticles: false, // 是否还有更多文章
    likesCount: 0, // 喜欢数量
    favoritesCount: 0, // 收藏数量
    commentsCount: 0, // 评论数量
    messagesUnreadCount: 0, // 未读消息数量
    hasUnreadMessage: false, // 是否有未读消息（用于显示红点）
    showSettingsMenu: false, // 是否显示设置菜单
    showFeedbackForm: false, // 是否显示反馈表单
    feedbackButtonActive: false, // 功能反馈按钮是否高亮
    // 修改PIN相关
    showPinInputModal: false, // 是否显示PIN输入弹窗
    pinInputType: '', // 'oldPin' | 'newPin' | 'confirmPin'
    pinInputValue: '', // PIN输入值
    pinInputTitle: '', // PIN输入弹窗标题
    pinInputPlaceholder: '', // PIN输入提示文字
    oldPinForChange: '', // 保存旧PIN码
    newPinForChange: '', // 保存新PIN码
    // 登录表单
    loginMode: 'pin', // 'pin' 或 'code'
    phone: '',
    pin: '',
    code: '',
    name: '',
    pinFocused: false, // PIN输入框是否聚焦
    pinCursor: 0, // PIN输入框光标位置
    showKeyboard: false, // 是否显示自定义数字键盘
    // 验证码相关
    codeCountdown: 0,
    codeTimer: null,
    sendingCode: false,
    // 登录状态
    loggingIn: false,
    // 反馈表单
    feedbackContent: '',
    feedbackCategory: '',
    feedbackCategoryIndex: 0,
    feedbackType: 'feedback', // 'feedback' 或 'complaint'
    feedbackCategories: [
      { value: '', label: '请选择功能分类' },
      { value: '问路卡片', label: '问路卡片' },
      { value: '尼罗河热映', label: '尼罗河热映' },
      { value: '寻味中国', label: '寻味中国' },
      { value: '常用导航', label: '常用导航' },
      { value: '租房/酒店', label: '租房/酒店' },
      { value: '二手集市', label: '二手集市' },
      { value: '紧急求助', label: '紧急求助' },
      { value: '签证攻略', label: '签证攻略' },
      { value: '小费指南', label: '小费指南' },
      { value: '热门打卡', label: '热门打卡' },
      { value: '汇率转换', label: '汇率转换' },
      { value: '天气预警', label: '天气预警' },
      { value: '热门活动', label: '热门活动' },
      { value: '其他', label: '其他' }
    ] || [], // 确保始终是数组
    submitting: false
  },

  onLoad() {
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

    // 初始化登录状态（从本地存储快速恢复，提升用户体验）
    const localUser = authHelper.getLoginInfo()
    if (localUser) {
      const avatarEmoji = getCuteAvatar(localUser.id)
      const hasWritePermission = authHelper.hasWritePermission()
      this.setData({
        isLoggedIn: true,
        user: localUser,
        avatarEmoji: avatarEmoji,
        hasWritePermission: hasWritePermission
      })
      app.globalData.user = localUser
      app.globalData.isLoggedIn = true
    }

    // 然后验证服务器端登录状态（首次加载，总是加载统计数据）
    this.checkLoginStatus(true)
  },

  onShow() {
    // 每次显示页面时检查登录状态
    this.checkLoginStatus(false)
    
    // 如果已登录，总是刷新统计数据（特别是未读消息数量）
    // loadStats() 内部有防重复调用机制，不会重复请求
    if (this.data.isLoggedIn && this.data.user) {
      console.log('[onShow] 刷新统计数据')
      this.loadStats()
    }
  },

  onUnload() {
    // 清除验证码倒计时
    if (this.data.codeTimer) {
      clearInterval(this.data.codeTimer)
    }
  },

  // 检查登录状态（使用统一的登录状态管理）
  // @param {boolean} shouldLoadStats - 是否应该加载统计数据（首次加载时为true，onShow时为false）
  async checkLoginStatus(shouldLoadStats = false) {
    // 记录登录前的状态
    const wasLoggedIn = this.data.isLoggedIn
    const previousUserId = this.data.user?.id
    
    // 如果本地有登录信息，主动验证服务器端状态（认证错误时清除）
    const localUser = authHelper.getLoginInfo()
    if (localUser) {
      try {
        // 主动验证服务器端登录状态，如果认证失败则清除
        const serverUser = await authHelper.verifyLoginStatus(true)
        if (!serverUser) {
          // 服务器验证失败（可能是认证错误），触发自动退出登录
          console.log('[checkLoginStatus] 服务器验证失败，触发自动退出登录')
          this.handleUnauthorizedError()
          return
        }
        // 验证成功，更新状态和权限
        app.globalData.user = serverUser
        app.globalData.isLoggedIn = true
        const hasWritePermission = authHelper.hasWritePermission()
        this.setData({
          isLoggedIn: true,
          user: serverUser,
          hasWritePermission: hasWritePermission
        })
      } catch (error) {
        // 如果是认证错误，触发自动退出登录
        if (error.isAuthError || error.statusCode === 401) {
          console.log('[checkLoginStatus] 检测到认证错误，触发自动退出登录')
          this.handleUnauthorizedError()
          return
        }
        // 其他错误，继续使用本地状态
        console.warn('[checkLoginStatus] 验证登录状态异常:', error)
      }
    } else {
      // 本地没有登录信息，使用标准方法检查
    await authHelper.checkAndUpdateLoginStatus(app, this)
    // 更新权限状态
    if (this.data.isLoggedIn) {
      const hasWritePermission = authHelper.hasWritePermission()
      this.setData({
        hasWritePermission: hasWritePermission
      })
    }
    }
    
    // 检查登录状态是否发生变化
    const isNowLoggedIn = this.data.isLoggedIn
    const currentUserId = this.data.user?.id
    
    // 如果从已登录变为未登录，或用户ID发生变化（重新登录），重置页面状态
    const loginStatusChanged = wasLoggedIn !== isNowLoggedIn
    const userChanged = previousUserId && currentUserId && previousUserId !== currentUserId
    
    if (loginStatusChanged || userChanged) {
      console.log('[checkLoginStatus] 登录状态发生变化，重置页面状态', {
        wasLoggedIn,
        isNowLoggedIn,
        previousUserId,
        currentUserId
      })
      
      // 重置页面到初始状态
      this.setData({
        currentView: '', // 重置视图，显示菜单
        articlesList: [],
        articlesError: false,
        articlesErrorMessage: '',
        articlesLoading: false,
        currentPage: 1,
        hasMoreArticles: false,
        likesCount: 0,
        favoritesCount: 0,
        commentsCount: 0,
        messagesUnreadCount: 0,
        hasUnreadMessage: false,
        showSettingsMenu: false,
        showFeedbackForm: false,
        showPinInputModal: false
      })
    }
    
    // 如果已登录，设置头像图案
    if (isNowLoggedIn && this.data.user) {
      const avatarEmoji = getCuteAvatar(this.data.user.id)
      this.setData({
        avatarEmoji: avatarEmoji,
        showSettingsMenu: false, // 确保设置菜单关闭
        showPinInputModal: false // 确保PIN输入弹窗关闭
      })
      
      // 只在以下情况加载统计数据：
      // 1. 首次加载（shouldLoadStats = true）
      // 2. 登录状态发生变化（loginStatusChanged = true）
      // 3. 用户ID发生变化（userChanged = true）
      if (shouldLoadStats || loginStatusChanged || userChanged) {
        console.log('[checkLoginStatus] 加载统计数据', {
          shouldLoadStats,
          loginStatusChanged,
          userChanged,
          wasLoggedIn,
          isNowLoggedIn,
          previousUserId,
          currentUserId
        })
      this.loadStats()
      } else {
        console.log('[checkLoginStatus] 跳过加载统计数据（状态未变化）', {
          shouldLoadStats,
          loginStatusChanged,
          userChanged
        })
      }
    } else {
      // 未登录时清空头像图案和统计数据
      this.setData({
        avatarEmoji: '',
        likesCount: 0,
        favoritesCount: 0,
        commentsCount: 0,
        messagesUnreadCount: 0,
        hasUnreadMessage: false,
        showSettingsMenu: false, // 确保设置菜单关闭
        showPinInputModal: false // 确保PIN输入弹窗关闭
      })
    }
  },

  // 切换登录方式
  switchLoginMode(e) {
    const mode = e.currentTarget.dataset.mode
    this.setData({
      loginMode: mode,
      code: '', // 切换时清空验证码
      pin: '', // 切换时清空PIN码
      pinFocused: false, // 切换时清除聚焦状态
      pinCursor: 0, // 切换时重置光标位置
      showKeyboard: false // 切换时隐藏键盘
    })
  },

  // 手机号输入 - 自动补0（确保以0开头）
  onPhoneInput(e) {
    let value = e.detail.value.replace(/\D/g, '') // 只保留数字
    
    // 如果输入的不是以0开头，自动在前面补0
    if (value && !value.startsWith('0')) {
      value = '0' + value
    }
    
    // 限制长度为11位（0 + 10位数字）
    if (value.length > 11) {
      value = value.slice(0, 11)
    }
    
    this.setData({
      phone: value
    })
  },

  // PIN码输入
  onPinInput(e) {
    let value = e.detail.value.replace(/\D/g, '').slice(0, 4) // 只允许4位数字
    const cursor = value.length // 光标位置等于当前输入长度
    
    this.setData({
      pin: value,
      pinCursor: cursor // 设置光标位置到当前输入位置
    })
    
    // 如果输入满4位，且手机号已输入，自动触发登录
    if (value.length === 4) {
      const phone = this.data.phone.trim()
      
      // 检查是否已经在登录中，防止重复提交
      if (this.data.loggingIn) {
        console.log('[onPinInput] 正在登录中，跳过自动登录')
        return
      }
      
      // 检查手机号是否已输入
      if (phone && phone.length >= 8) {
        console.log('[onPinInput] PIN码输入完成，自动触发登录')
        // 延迟一小段时间，让用户看到最后一个数字输入完成
        setTimeout(() => {
          this.loginWithPin()
        }, 300)
      } else {
        console.log('[onPinInput] PIN码输入完成，但手机号未输入，等待用户输入手机号')
      }
    }
  },

  // PIN码输入框聚焦 - 显示自定义键盘
  onPinFocus(e) {
    // 阻止系统键盘弹出
    e.detail.value = this.data.pin
    // 聚焦时设置聚焦状态，用于高亮当前输入框
    const cursor = this.data.pin.length
    this.setData({
      pinFocused: true,
      pinCursor: cursor,
      showKeyboard: true // 直接显示键盘，不需要滚动
    })
    console.log('[onPinFocus] PIN码输入框已聚焦，显示自定义键盘，当前PIN长度:', this.data.pin.length)
  },

  // PIN码输入框失焦 - 延迟隐藏键盘（避免点击键盘按钮时失焦）
  onPinBlur(e) {
    // 由于输入框是 disabled，不会触发 blur，这个方法保留作为备用
  },

  // 隐藏键盘
  hideKeyboard() {
    this.setData({
      showKeyboard: false,
      pinFocused: false
    })
  },

  // 点击PIN码输入框区域 - 显示自定义键盘
  onPinBoxTap() {
    this.setData({
      pinFocused: true,
      showKeyboard: true // 直接显示键盘，不需要滚动
    })
    console.log('[onPinBoxTap] 点击PIN输入框，显示自定义键盘')
  },

  // 注意：已移除所有滚动相关的方法，因为新设计使用固定定位，不需要滚动

  // 自定义键盘输入数字
  onKeyboardInput(e) {
    const key = e.detail.value
    if (this.data.pin.length < 4) {
      const newPin = this.data.pin + key
      this.setData({
        pin: newPin,
        pinCursor: newPin.length
      })
      
      // 如果输入满4位，且手机号已输入，自动触发登录
      if (newPin.length === 4) {
        const phone = this.data.phone.trim()
        
        // 检查是否已经在登录中，防止重复提交
        if (this.data.loggingIn) {
          console.log('[onKeyboardInput] 正在登录中，跳过自动登录')
          return
        }
        
        // 检查手机号是否已输入
        if (phone && phone.length >= 8) {
          console.log('[onKeyboardInput] PIN码输入完成，自动触发登录')
          // 延迟一小段时间，让用户看到最后一个数字输入完成
          setTimeout(() => {
            this.loginWithPin()
          }, 300)
        } else {
          console.log('[onKeyboardInput] PIN码输入完成，但手机号未输入，等待用户输入手机号')
        }
      }
    }
  },

  // 自定义键盘删除
  onKeyboardDelete() {
    if (this.data.pin.length > 0) {
      const newPin = this.data.pin.slice(0, -1)
      this.setData({
        pin: newPin,
        pinCursor: newPin.length
      })
    }
  },

  // 验证码输入
  onCodeInput(e) {
    const value = e.detail.value.replace(/\D/g, '').slice(0, 6) // 只允许6位数字
    this.setData({
      code: value
    })
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({
      name: e.detail.value
    })
  },

  // 发送验证码
  async sendCode() {
    let phone = this.data.phone.trim()
    
    // 验证手机号
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    // 确保手机号以0开头
    if (!phone.startsWith('0')) {
      phone = '0' + phone
      this.setData({ phone: phone })
    }

    // 验证手机号格式（0开头，总共11位）
    if (!/^0\d{10}$/.test(phone)) {
      wx.showToast({
        title: '请输入0开头的11位埃及手机号',
        icon: 'none'
      })
      return
    }

    // 如果正在倒计时，不允许重复发送
    if (this.data.codeCountdown > 0) {
      return
    }

    this.setData({
      sendingCode: true
    })

    try {
      // 格式化手机号：删除开头的0，添加0前缀
      // 例如：01017739088 -> 01017739088
      const formattedPhone = phone.startsWith('0') 
        ? '0' + phone.substring(1) 
        : '0' + phone
      
      console.log('[sendCode] 原始手机号:', phone, '格式化后:', formattedPhone)
      console.log('[sendCode] 准备发送验证码请求，手机号:', formattedPhone, '类型: login')
      const result = await authApi.sendCode(formattedPhone, 'login')
      
      console.log('[sendCode] 验证码发送成功:', result)
      wx.showToast({
        title: '验证码已发送',
        icon: 'success'
      })

      // 开发环境显示验证码
      if (result.code) {
        console.log('验证码:', result.code)
        wx.showModal({
          title: '开发环境验证码',
          content: `验证码：${result.code}`,
          showCancel: false
        })
      }

      // 开始倒计时
      this.startCodeCountdown()
    } catch (error) {
      console.error('[sendCode] 发送验证码异常:', error)
      console.error('[sendCode] 错误详情:', {
        message: error.message,
        phone: phone,
        formattedPhone: phone.startsWith('0') ? '0' + phone.substring(1) : '0' + phone
      })
      wx.showToast({
        title: error.message || '发送失败',
        icon: 'none',
        duration: 3000
      })
    } finally {
      this.setData({
        sendingCode: false
      })
    }
  },

  // 开始验证码倒计时
  startCodeCountdown() {
    let countdown = 60
    this.setData({
      codeCountdown: countdown
    })

    const timer = setInterval(() => {
      countdown--
      if (countdown <= 0) {
        clearInterval(timer)
        this.setData({
          codeCountdown: 0,
          codeTimer: null
        })
      } else {
        this.setData({
          codeCountdown: countdown
        })
      }
    }, 1000)

    this.setData({
      codeTimer: timer
    })
  },

  // PIN码登录
  async loginWithPin() {
    let phone = this.data.phone.trim()
    const pin = this.data.pin.trim()
    let name = this.data.name.trim()

    // 验证输入
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    // 确保手机号以0开头
    if (!phone.startsWith('0')) {
      phone = '0' + phone
      this.setData({ phone: phone })
    }

    // 验证手机号格式（0开头，总共11位）
    if (!/^0\d{10}$/.test(phone)) {
      wx.showToast({
        title: '请输入0开头的11位埃及手机号',
        icon: 'none'
      })
      return
    }

    if (!pin || pin.length !== 4) {
      wx.showToast({
        title: '请输入4位PIN码',
        icon: 'none'
      })
      return
    }

    // 如果用户没有输入昵称，先尝试登录，如果服务器返回了name就不需要随机生成
    // 只有在服务器没有返回name且用户也没有输入name时，才生成随机名字
    let nameToSend = name || undefined

    this.setData({
      loggingIn: true
    })

    try {
      console.log('[loginWithPin] 开始登录')
      console.log('[loginWithPin] 手机号:', phone, '手机号长度:', phone.length, '手机号格式:', /^0\d{10}$/.test(phone) ? '正确' : '错误')
      console.log('[loginWithPin] PIN码:', pin, 'PIN长度:', pin.length)
      console.log('[loginWithPin] 昵称:', nameToSend || '未输入')
      const result = await authApi.loginWithPin(phone, pin, nameToSend)
      console.log('[loginWithPin] 登录成功:', result)
      
      // 检查是否是新用户注册
      // 注意：需要服务器在登录 API 响应中返回 isNewUser 字段来准确判断
      // 建议服务器返回格式：{ success: true, user: {...}, token: "...", isNewUser: true/false }
      const isNewUser = result.isNewUser || result.isNew || false
      
      if (!isNewUser) {
        // 如果没有 isNewUser 字段，记录日志提示（但不影响功能）
        console.warn('[loginWithPin] ⚠️ 服务器未返回 isNewUser 字段，无法准确判断是否为新用户注册')
        console.warn('[loginWithPin] 建议：请让后端在登录 API 响应中添加 isNewUser 字段')
      }
      
      // 使用服务器返回的 isNewUser 字段（如果服务器支持）
      const isNewUserRegistered = isNewUser
      
      // 验证返回结果
      if (!result || !result.user) {
        throw new Error('登录响应数据无效')
      }
      
      // 检查服务器返回的用户信息中是否有name
      const serverName = result.user.name || result.user.nickname || ''
      const userInputName = name.trim()
      
      // 如果服务器没有返回name，且用户也没有输入name，则生成随机名字
      // 但这种情况通常不会发生，因为服务器应该会返回name（即使是默认的）
      // 这里主要是为了处理新用户注册的情况
      if (!serverName && !userInputName) {
        console.log('[loginWithPin] 服务器未返回昵称且用户未输入，生成随机昵称')
        // 注意：这里生成的名字不会更新到服务器，只是本地显示
        // 如果需要更新到服务器，需要调用更新用户信息的API
      }
      
      // 使用统一的登录成功处理，传递token（添加错误处理）
      try {
        authHelper.handleLoginSuccess(result.user, app, this, result.token)
        // 设置头像图案和权限状态
        const avatarEmoji = getCuteAvatar(result.user.id)
        const hasWritePermission = authHelper.hasWritePermission()
        // 登录成功后重置页面状态
        this.setData({
          avatarEmoji: avatarEmoji,
          hasWritePermission: hasWritePermission,
          currentView: '', // 重置视图，显示菜单
          articlesList: [],
          articlesError: false,
          articlesErrorMessage: '',
          articlesLoading: false,
          currentPage: 1,
          hasMoreArticles: false,
          likesCount: 0,
          favoritesCount: 0,
          commentsCount: 0,
          messagesUnreadCount: 0,
          lastMessagesTotal: 0,
          showSettingsMenu: false, // 确保设置菜单关闭
          showPinInputModal: false, // 确保PIN输入弹窗关闭
          showFeedbackForm: false
        })
        // 登录成功后立即刷新统计数据
        this.loadStats()
      } catch (handleError) {
        console.error('[loginWithPin] 处理登录成功时出错:', handleError)
        // 即使处理出错，也尝试清空表单
      }
      
      // 保存 PIN 码用于新用户提示（在清空表单前）
      const savedPin = pin

      // 清空表单
      try {
        this.setData({
          phone: '',
          pin: '',
          name: '',
          pinCursor: 0, // 重置光标位置
          showKeyboard: false // 隐藏键盘
        })
      } catch (setDataError) {
        console.error('[loginWithPin] 清空表单失败:', setDataError)
      }

      // 如果是新用户注册，显示注册成功提示并显示 PIN 码
      if (isNewUserRegistered) {
        wx.showModal({
          title: '注册成功',
          content: `恭喜您注册成功！\n\n您的 PIN 码是：${savedPin}\n\n请牢记您的 PIN 码，这是您登录的重要凭证。`,
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#333333',
          success: () => {
            // 用户确认后，显示登录成功提示
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      } else {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('[loginWithPin] 登录异常:', error)
      console.error('[loginWithPin] 错误详情:', {
        message: error.message,
        requiresPinSetup: error.requiresPinSetup,
        requiresCode: error.requiresCode,
        lockedUntil: error.lockedUntil,
        phone: phone,
        phoneLength: phone.length,
        pin: pin,
        pinLength: pin.length
      })
      
      // 根据API文档，PIN码登录现在可以单独使用，不会再出现 requiresCode 错误
      // 如果仍然出现，可能是服务器端的临时问题或特殊账户设置
      this.handleLoginError(error)
    } finally {
      try {
        this.setData({
          loggingIn: false
        })
      } catch (finallyError) {
        console.error('[loginWithPin] 更新登录状态失败:', finallyError)
      }
    }
  },

  // 验证码登录
  async loginWithCode() {
    let phone = this.data.phone.trim()
    const code = this.data.code.trim()
    let name = this.data.name.trim()

    // 验证输入
    if (!phone) {
      wx.showToast({
        title: '请输入手机号',
        icon: 'none'
      })
      return
    }

    // 确保手机号以0开头
    if (!phone.startsWith('0')) {
      phone = '0' + phone
      this.setData({ phone: phone })
    }

    // 验证手机号格式（0开头，总共11位）
    if (!/^0\d{10}$/.test(phone)) {
      console.error('[loginWithCode] 手机号格式验证失败:', phone, '长度:', phone.length)
      wx.showToast({
        title: '请输入0开头的11位埃及手机号',
        icon: 'none'
      })
      return
    }

    if (!code || code.length !== 6) {
      console.error('[loginWithCode] 验证码格式验证失败:', code, '长度:', code ? code.length : 0)
      wx.showToast({
        title: '请输入6位验证码',
        icon: 'none'
      })
      return
    }

    // const pin = this.data.pin.trim()
    // if (!pin || pin.length !== 4) {
    //   wx.showToast({
    //     title: '请输入4位PIN码',
    //     icon: 'none'
    //   })
    //   return
    // }
    
    console.log('[loginWithCode] 输入验证通过 - 手机号:', phone, '验证码:', code, '验证码长度:', code.length)

    // 验证码+PIN码登录（根据API文档，验证码登录需要PIN码）- 现在不需要PIN码2025 年 12 月 27 日
    // 如果用户没有输入昵称，先尝试登录，如果服务器返回了name就不需要随机生成
    // 只有在服务器没有返回name且用户也没有输入name时，才生成随机名字
    let nameToSend = name || undefined

    this.setData({
      loggingIn: true
    })

    try {
      // 登录验证时使用0开头的原始格式，不格式化
      // 发送验证码时不改变前缀
      console.log('[loginWithCode] 开始登录，手机号（原始格式）:', phone, '验证码长度:', code.length, '昵称:', nameToSend || '未输入')
      // 验证码+PIN码登录（根据API文档，需要PIN码）- 现在不需要PIN码2025 年 12 月 27 日
      const result = await authApi.loginWithCode(phone, code, nameToSend)
      console.log('[loginWithCode] 登录成功:', result)
      
      // 检查是否是新用户注册
      // 注意：需要服务器在登录 API 响应中返回 isNewUser 字段来准确判断
      // 建议服务器返回格式：{ success: true, user: {...}, token: "...", isNewUser: true/false }
      const isNewUser = result.isNewUser || result.isNew || false
      
      if (!isNewUser) {
        // 如果没有 isNewUser 字段，记录日志提示（但不影响功能）
        console.warn('[loginWithCode] ⚠️ 服务器未返回 isNewUser 字段，无法准确判断是否为新用户注册')
        console.warn('[loginWithCode] 建议：请让后端在登录 API 响应中添加 isNewUser 字段')
      }
      
      // 使用服务器返回的 isNewUser 字段（如果服务器支持）
      const isNewUserRegistered = isNewUser
      
      // 检查服务器返回的用户信息中是否有name
      const serverName = result.user.name || result.user.nickname || ''
      const userInputName = name.trim()
      
      // 如果服务器没有返回name，且用户也没有输入name，则生成随机名字
      // 但这种情况通常不会发生，因为服务器应该会返回name（即使是默认的）
      if (!serverName && !userInputName) {
        console.log('[loginWithCode] 服务器未返回昵称且用户未输入，生成随机昵称')
        // 注意：这里生成的名字不会更新到服务器，只是本地显示
        // 如果需要更新到服务器，需要调用更新用户信息的API
      }
      
      // 使用统一的登录成功处理，传递token
      authHelper.handleLoginSuccess(result.user, app, this, result.token)
      // 设置头像图案和权限状态
      const avatarEmoji = getCuteAvatar(result.user.id)
      const hasWritePermission = authHelper.hasWritePermission()
      // 登录成功后重置页面状态
      this.setData({
        avatarEmoji: avatarEmoji,
        hasWritePermission: hasWritePermission,
        currentView: '', // 重置视图，显示菜单
        articlesList: [],
        articlesError: false,
        articlesErrorMessage: '',
        articlesLoading: false,
        currentPage: 1,
        hasMoreArticles: false,
        likesCount: 0,
        favoritesCount: 0,
        commentsCount: 0,
        messagesUnreadCount: 0,
        hasUnreadMessage: false,
        showSettingsMenu: false, // 确保设置菜单关闭
        showPinInputModal: false, // 确保PIN输入弹窗关闭
        showFeedbackForm: false
      })
      // 登录成功后立即刷新统计数据
      this.loadStats()
      
      // 清空表单
      this.setData({
        phone: '',
        code: '',
        pin: '',
        name: '',
        pinCursor: 0, // 重置光标位置
        showKeyboard: false // 隐藏键盘
      })

      // 如果是新用户注册，显示注册成功提示
      if (isNewUserRegistered) {
        wx.showModal({
          title: '注册成功',
          content: '恭喜您注册成功！\n\n请使用 PIN 码登录功能设置您的 PIN 码，以便下次快速登录。',
          showCancel: false,
          confirmText: '我知道了',
          confirmColor: '#333333',
          success: () => {
            wx.showToast({
              title: '登录成功',
              icon: 'success',
              duration: 2000
            })
          }
        })
      } else {
        wx.showToast({
          title: '登录成功',
          icon: 'success'
        })
      }
    } catch (error) {
      console.error('[loginWithCode] 登录异常:', error)
      console.error('[loginWithCode] 错误详情:', {
        message: error.message,
        requiresPinSetup: error.requiresPinSetup,
        phone: phone,
        code: code,
        codeLength: code ? code.length : 0
      })
      this.handleLoginError(error)
    } finally {
      this.setData({
        loggingIn: false
      })
    }
  },

  // 处理登录错误
  handleLoginError(error) {
    console.error('[handleLoginError] 错误对象:', error)
    console.error('[handleLoginError] 错误消息:', error.message)
    
    // 检查是否是PIN码错误
    const errorMessage = error.message || ''
    const isPinError = errorMessage.includes('PIN') || 
                       errorMessage.includes('pin') || 
                       errorMessage.includes('密码') || 
                       errorMessage.includes('错误') ||
                       errorMessage.includes('不正确') ||
                       errorMessage.includes('失败') ||
                       errorMessage.includes('invalid') ||
                       errorMessage.includes('wrong')
    
    if (error.requiresPinSetup) {
      wx.showModal({
        title: '设置PIN码',
        content: '新用户需要设置4位数字PIN码',
        showCancel: false
      })
      // PIN码错误时，清空PIN码输入框，让用户重新输入
      this.setData({
        pin: '',
        pinCursor: 0 // 重置光标位置
      })
    } else if (error.requiresCode) {
      // 根据API文档，PIN码登录现在可以单独使用，不应该再出现 requiresCode 错误
      // 如果仍然出现，可能是服务器端的临时问题或特殊账户设置
      wx.showModal({
        title: '提示',
        content: '当前账户需要使用验证码登录，是否切换到验证码登录？',
        showCancel: true,
        confirmText: '切换',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 用户确认切换
            this.setData({
              loginMode: 'code'
            })
          }
          // 用户取消则不切换，保持PIN码登录模式
        }
      })
    } else if (isPinError) {
      // PIN码错误，显示错误提示并清空PIN码输入框
      wx.showToast({
        title: errorMessage || 'PIN码错误，请重新输入',
        icon: 'none',
        duration: 2000
      })
      // 清空PIN码输入框，让用户重新输入
      setTimeout(() => {
        this.setData({
          pin: '',
          pinCursor: 0 // 重置光标位置
        })
      }, 500)
    } else if (error.lockedUntil) {
      const lockedUntil = new Date(error.lockedUntil)
      const now = new Date()
      const minutes = Math.ceil((lockedUntil - now) / 60000)
      
      wx.showModal({
        title: '账户已锁定',
        content: `账户已被锁定，请在${minutes}分钟后重试`,
        showCancel: false
      })
    } else {
      // 显示详细的错误信息
      const errorMsg = error.message || '登录失败'
      console.error('[handleLoginError] 显示错误提示:', errorMsg)
      
      // 如果错误信息太长，截断
      const displayMsg = errorMsg.length > 50 ? errorMsg.substring(0, 50) + '...' : errorMsg
      
      wx.showModal({
        title: '登录失败',
        content: displayMsg + '\n\n请检查：\n1. 手机号格式是否正确\n2. PIN码是否为4位数字\n3. 网络连接是否正常\n4. 服务器是否可访问',
        showCancel: true,
        confirmText: '查看详情',
        cancelText: '知道了',
        success: (res) => {
          if (res.confirm) {
            // 显示完整错误信息
            wx.showModal({
              title: '错误详情',
              content: `错误信息：${errorMsg}\n\n完整错误对象请查看控制台日志`,
              showCancel: false
            })
          }
        }
      })
    }
  },
  
  // 测试API连接和认证状态
  async testApiConnection() {
    const authApi = require('../../utils/authApi.js')
    const config = require('../../config.js')
    const testUrl = `${config.apiBaseDomain}/api/auth/user/me`
    
    wx.showLoading({
      title: '测试中...',
      mask: true
    })
    
    console.log('[testApiConnection] 测试URL:', testUrl)
    console.log('[testApiConnection] 使用 authApi.getCurrentUser() 进行测试（会自动携带Token）')
    
    try {
      // 使用 authApi.getCurrentUser() 进行测试，它会自动携带Token
      const user = await authApi.getCurrentUser()
      
      wx.hideLoading()
      console.log('[testApiConnection] ✅ API测试成功，用户信息:', user)
      
      wx.showModal({
        title: '✅ API测试成功',
        content: `认证状态：已登录\n\n用户信息：\n${JSON.stringify(user, null, 2).substring(0, 300)}`,
        showCancel: false,
        confirmText: '知道了'
      })
    } catch (error) {
      wx.hideLoading()
      console.error('[testApiConnection] ❌ API测试失败:', error)
      
      let errorMsg = error.message || '未知错误'
      let errorDetail = `错误：${errorMsg}\n\nURL：${testUrl}\n\n`
      
      if (error.isAuthError || error.statusCode === 401) {
        errorDetail += '认证失败，可能原因：\n'
        errorDetail += '1. 未登录或Token已过期\n'
        errorDetail += '2. Token未正确保存\n'
        errorDetail += '3. 服务器端Token验证失败\n\n'
        errorDetail += '建议：请先登录后再测试'
      } else if (error.isNetworkError) {
        errorDetail += '网络错误，请检查：\n'
        errorDetail += '1. 网络连接是否正常\n'
        errorDetail += '2. 服务器地址是否正确\n'
        errorDetail += '3. 服务器是否可访问'
      } else {
        errorDetail += '请检查：\n'
        errorDetail += '1. 网络连接\n'
        errorDetail += '2. 服务器地址是否正确\n'
        errorDetail += '3. 服务器是否可访问'
      }
      
      wx.showModal({
        title: '❌ API测试失败',
        content: errorDetail,
        showCancel: false,
        confirmText: '知道了'
      })
    }
  },

  // 登出
  async logout() {
    wx.showModal({
      title: '确认登出',
      content: '确定要登出吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await authApi.logout()
          } catch (error) {
            console.error('[logout] 服务器登出失败:', error)
            // 即使服务器登出失败，也清除本地状态
          } finally {
            // 使用统一的登出处理
            authHelper.handleLogout(app, this)
            
            // 清空表单
            this.setData({
              phone: '',
              pin: '',
              code: '',
              name: '',
              pinCursor: 0, // 重置光标位置
              avatarEmoji: '' // 清空头像图案
            })

            wx.showToast({
              title: '已登出',
              icon: 'success'
            })
          }
        }
      }
    })
  },

  // 输入反馈内容
  onFeedbackInput(e) {
    this.setData({
      feedbackContent: e.detail.value
    })
  },

  // 选择功能分类
  onCategoryChange(e) {
    const index = parseInt(e.detail.value)
    this.setData({
      feedbackCategory: this.data.feedbackCategories[index].value,
      feedbackCategoryIndex: index
    })
  },

  // 选择反馈类型
  onFeedbackTypeChange(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      feedbackType: type
    })
  },

  // 提交反馈
  submitFeedback() {
    // 检查用户是否已登录
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '提交反馈需要先登录，是否立即登录？',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            // 滚动到登录区域
            wx.pageScrollTo({
              scrollTop: 0,
              duration: 300
            })
          }
        }
      })
      return
    }

    const content = this.data.feedbackContent.trim()
    const category = this.data.feedbackCategory
    const type = this.data.feedbackType || 'feedback' // 默认为 'feedback'

    // 验证反馈内容
    if (!content) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (content.length < 1) {
      wx.showToast({
        title: '反馈内容不能为空',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (content.length > 100) {
      wx.showToast({
        title: '反馈内容不能超过100个字符',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({
      submitting: true
    })

    const config = require('../../config.js')
    const authApi = require('../../utils/authApi.js')
    const apiUrl = config.feedbackApi || `${config.apiBaseDomain}/api/user/feedback`

    // 准备用户信息
    const user = this.data.user || {}
    const requestData = {
      type: type, // 'feedback' 或 'complaint'
      content: content,
      category: category || undefined,
      // 用户信息
      userInfo: {
        userId: user.id || '',
        phone: user.phone || '',
        name: user.name || ''
      }
    }

    // 获取认证请求头（包含Token）
    // 会自动添加 x-user-token 和 Authorization 头（如果用户已登录）
    const authHeaders = authApi.getAuthHeaders()
    
    wx.request({
      url: apiUrl,
      method: 'POST',
      header: {
        'content-type': 'application/json',
        ...authHeaders  // 添加认证头（x-user-token、X-User-Token 和 Authorization）
      },
      withCredentials: true, // 携带Cookie，用于Session认证（备用）
      data: requestData,
      success: (res) => {
        console.log('提交反馈响应', res)
        
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)

        if (res.statusCode === 200 && res.data && (res.data.success === true || res.data.success === undefined)) {
          wx.showToast({
            title: '提交成功，感谢您的反馈！',
            icon: 'success',
            duration: 2000
          })
          
          // 清空表单并隐藏
          this.setData({
            feedbackContent: '',
            feedbackCategory: '',
            feedbackCategoryIndex: 0,
            feedbackType: 'feedback', // 重置为默认值
            submitting: false,
            showFeedbackForm: false
          })
        } else {
          const errorMsg = res.data?.message || '提交失败，请稍后重试'
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 3000
          })
          this.setData({
            submitting: false
          })
        }
      },
      fail: (err) => {
        console.error('提交反馈失败', err)
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
          duration: 3000
        })
        this.setData({
          submitting: false
        })
      }
    })
  },

  // 跳转到我的喜欢页面
  navigateToMyLikes() {
    wx.navigateTo({
      url: '/page/my-likes/index'
    })
  },

  // 跳转到我的收藏页面
  navigateToMyFavorites() {
    wx.navigateTo({
      url: '/page/my-favorites/index'
    })
  },

  // 跳转到我的评论页面
  navigateToMyComments() {
    wx.navigateTo({
      url: '/page/my-comments/index'
    })
  },

  // 跳转到我的消息页面
  navigateToMyMessages() {
    wx.navigateTo({
      url: '/page/my-messages/index'
    })
  },

  // 检查是否为未登录错误
  isUnauthorizedError(error) {
    if (!error) return false
    
    const errorMessage = String(error.message || '').toLowerCase()
    const isAuthError = errorMessage.includes('未登录') || 
                       errorMessage.includes('未认证') || 
                       errorMessage.includes('unauthorized') ||
                       errorMessage.includes('请先登录') ||
                       errorMessage.includes('需要登录') ||
                       errorMessage.includes('认证失败') ||
                       errorMessage.includes('登录过期') ||
                       errorMessage.includes('token') ||
                       errorMessage.includes('token已过期') ||
                       errorMessage.includes('token expired') ||
                       errorMessage.includes('expired') ||
                       errorMessage.includes('401') ||
                       error.statusCode === 401
    
    return isAuthError
  },

  // 处理未登录错误
  handleUnauthorizedError() {
    console.log('[handleUnauthorizedError] 检测到未登录错误，自动退出登录')
    
    // 使用统一的登出处理，确保完整清除所有状态
    authHelper.handleLogout(app, this)
    
    // 重置页面到初始状态
    this.setData({
      avatarEmoji: '',
      currentView: '', // 隐藏文章列表，显示反馈建议
      articlesList: [],
      articlesError: false,
      articlesErrorMessage: '',
      articlesLoading: false,
      currentPage: 1,
      hasMoreArticles: false,
      likesCount: 0,
      favoritesCount: 0,
      commentsCount: 0,
      messagesUnreadCount: 0,
      hasUnreadMessage: false,
      showSettingsMenu: false,
      showFeedbackForm: false,
      showPinInputModal: false
    })
    
    // 提示用户
    wx.showToast({
      title: '登录已过期，请重新登录',
      icon: 'none',
      duration: 2000
    })
  },

  // 加载我的喜欢
  async loadMyLikes(page = 1) {
    if (this.data.articlesLoading) return

    this.setData({
      articlesLoading: true,
      articlesError: false,
      articlesErrorMessage: ''
    })

    try {
      const result = await blogApi.blogInteractionApi.getMyLikes({
        page: page,
        pageSize: this.data.pageSize
      })

      // 检查业务状态中的未登录错误
      if (result && result.success === false) {
        const errorMessage = result.message || ''
        if (this.isUnauthorizedError({ message: errorMessage })) {
          this.handleUnauthorizedError()
          return
        }
        throw new Error(errorMessage || '获取数据失败')
      }

      if (result && result.success && result.data) {
        // 如果是第一页，替换整个列表；否则追加到现有列表
        const currentList = this.data.articlesList || []
        const newArticles = page === 1 ? result.data : [...currentList, ...result.data]
        const pagination = result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        console.log(`[loadMyLikes] 加载第${page}页，当前列表长度: ${currentList.length}，新数据长度: ${result.data.length}，追加后长度: ${newArticles.length}`)

        // 更新统计数量（如果是第一页）
        const updateData = {
          articlesList: newArticles,
          currentPage: page,
          hasMoreArticles: hasMore,
          articlesLoading: false,
          articlesError: false
        }
        if (page === 1) {
          updateData.likesCount = pagination.total || 0
          console.log(`[loadMyLikes] 更新喜欢数量: ${pagination.total}`)
        }

        // 使用 setData 更新，小程序会自动保持滚动位置（追加数据时）
        this.setData(updateData)
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[loadMyLikes] 加载失败:', error)
      
      // 检查是否为未登录错误
      if (this.isUnauthorizedError(error)) {
        this.handleUnauthorizedError()
        return
      }
      
      this.setData({
        articlesError: true,
        articlesErrorMessage: error.message || '获取数据失败，请稍后重试',
        articlesLoading: false
      })
    }
  },

  // 加载我的收藏
  async loadMyFavorites(page = 1) {
    if (this.data.articlesLoading) return

    this.setData({
      articlesLoading: true,
      articlesError: false,
      articlesErrorMessage: ''
    })

    try {
      const result = await blogApi.blogInteractionApi.getMyFavorites({
        page: page,
        pageSize: this.data.pageSize
      })

      // 检查业务状态中的未登录错误
      if (result && result.success === false) {
        const errorMessage = result.message || ''
        if (this.isUnauthorizedError({ message: errorMessage })) {
          this.handleUnauthorizedError()
          return
        }
        throw new Error(errorMessage || '获取数据失败')
      }

      if (result && result.success && result.data) {
        // 如果是第一页，替换整个列表；否则追加到现有列表
        const currentList = this.data.articlesList || []
        const newArticles = page === 1 ? result.data : [...currentList, ...result.data]
        const pagination = result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        console.log(`[loadMyFavorites] 加载第${page}页，当前列表长度: ${currentList.length}，新数据长度: ${result.data.length}，追加后长度: ${newArticles.length}`)

        // 更新统计数量（如果是第一页）
        const updateData = {
          articlesList: newArticles,
          currentPage: page,
          hasMoreArticles: hasMore,
          articlesLoading: false,
          articlesError: false
        }
        if (page === 1) {
          updateData.favoritesCount = pagination.total || 0
          console.log(`[loadMyFavorites] 更新收藏数量: ${pagination.total}`)
        }

        // 使用 setData 更新，小程序会自动保持滚动位置（追加数据时）
        this.setData(updateData)
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[loadMyFavorites] 加载失败:', error)
      
      // 检查是否为未登录错误
      if (this.isUnauthorizedError(error)) {
        this.handleUnauthorizedError()
        return
      }
      
      this.setData({
        articlesError: true,
        articlesErrorMessage: error.message || '获取数据失败，请稍后重试',
        articlesLoading: false
      })
    }
  },

  // 加载更多文章
  loadMoreArticles() {
    if (this.data.currentView === 'likes') {
      this.loadMyLikes(this.data.currentPage + 1)
    } else if (this.data.currentView === 'favorites') {
      this.loadMyFavorites(this.data.currentPage + 1)
    } else if (this.data.currentView === 'comments') {
      this.loadMyComments(this.data.currentPage + 1)
    } else if (this.data.currentView === 'messages') {
      this.loadMyMessages(this.data.currentPage + 1)
    }
  },

  // 重试加载文章
  retryLoadArticles() {
    if (this.data.currentView === 'likes') {
      this.loadMyLikes(1)
    } else if (this.data.currentView === 'favorites') {
      this.loadMyFavorites(1)
    } else if (this.data.currentView === 'comments') {
      this.loadMyComments(1)
    } else if (this.data.currentView === 'messages') {
      this.loadMyMessages(1)
    }
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
    // 可以设置默认图片
  },

  // 显示/隐藏设置菜单
  toggleSettingsMenu() {
    this.setData({
      showSettingsMenu: !this.data.showSettingsMenu
    })
  },

  // 关闭设置菜单
  closeSettingsMenu() {
    this.setData({
      showSettingsMenu: false
    })
  },

  // 阻止事件冒泡（用于设置菜单内容区域）
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡，不执行任何操作
  },

  // 修改昵称
  changeNickname() {
    // 关闭设置菜单
    this.setData({
      showSettingsMenu: false
    })

    // 获取当前昵称
    const currentName = this.data.user?.name || this.data.user?.phone || ''

    wx.showModal({
      title: '修改昵称',
      editable: true,
      placeholderText: '请输入新昵称',
      content: currentName,
      success: async (res) => {
        if (res.confirm && res.content) {
          const newName = res.content.trim()
          if (!newName) {
            wx.showToast({
              title: '昵称不能为空',
              icon: 'none'
            })
            return
          }

          if (newName.length > 50) {
            wx.showToast({
              title: '昵称不能超过50个字符',
              icon: 'none'
            })
            return
          }

          // 调用API更新昵称
          try {
            wx.showLoading({
              title: '更新中...',
              mask: true
            })

            const authApi = require('../../utils/authApi.js')
            const config = require('../../config.js')
            const authHeaders = authApi.getAuthHeaders()

            const result = await new Promise((resolve, reject) => {
              wx.request({
                url: `${config.apiBaseDomain}/api/auth/user/profile`,
                method: 'PUT',
                header: authHeaders,
                data: {
                  name: newName
                },
                success: (res) => {
                  if (res.statusCode === 200 && res.data && res.data.success !== false) {
                    resolve(res.data)
                  } else {
                    reject(new Error(res.data?.message || '更新失败'))
                  }
                },
                fail: (err) => {
                  reject(new Error(err.errMsg || '网络错误'))
                }
              })
            })

            wx.hideLoading()

            // 更新本地用户信息
            if (result && result.user) {
              this.setData({
                user: result.user
              })
              // 更新全局用户信息
              app.globalData.user = result.user
              // 更新本地存储
              wx.setStorageSync('userInfo', result.user)

              wx.showToast({
                title: '昵称已更新',
                icon: 'success'
              })
            } else {
              throw new Error('更新响应数据无效')
            }
          } catch (error) {
            wx.hideLoading()
            console.error('[changeNickname] 更新昵称失败:', error)
            wx.showToast({
              title: error.message || '更新失败，请稍后重试',
              icon: 'none',
              duration: 2000
            })
          }
        }
      }
    })
  },

  // 修改PIN
  changePin() {
    // 关闭设置菜单
    this.setData({
      showSettingsMenu: false
    })

    // 第一步：输入旧PIN码
    this.showPinInputModal('oldPin', '修改PIN', '请输入当前PIN码')
  },

  // 显示PIN输入弹窗
  showPinInputModal(type, title, placeholder) {
    this.setData({
      showPinInputModal: true,
      pinInputType: type,
      pinInputTitle: title,
      pinInputPlaceholder: placeholder,
      pinInputValue: '' // 清空输入值
    })
  },

  // 关闭PIN输入弹窗
  closePinInputModal() {
    this.setData({
      showPinInputModal: false,
      pinInputType: '',
      pinInputValue: '',
      pinInputTitle: '',
      pinInputPlaceholder: ''
    })
  },

  // PIN输入框聚焦时清除内容
  onPinInputFocus() {
    this.setData({
      pinInputValue: ''
    })
  },

  // PIN输入框输入处理
  onPinInputChange(e) {
    let value = e.detail.value
    
    // 只保留数字
    value = value.replace(/\D/g, '')
    
    // 限制为4位
    if (value.length > 4) {
      value = value.slice(0, 4)
    }
    
    this.setData({
      pinInputValue: value
    })
  },

  // 确认PIN输入
  async confirmPinInput() {
    const { pinInputType, pinInputValue } = this.data
    
    // 验证PIN码格式
    if (!/^\d{4}$/.test(pinInputValue)) {
      wx.showToast({
        title: 'PIN码必须是4位数字',
        icon: 'none'
      })
      return
    }

    if (pinInputType === 'oldPin') {
      // 保存旧PIN码，进入下一步：输入新PIN码
      this.setData({
        oldPinForChange: pinInputValue,
        showPinInputModal: false
      })
      this.showPinInputModal('newPin', '输入新PIN码', '请输入新的4位数字PIN码')
    } else if (pinInputType === 'newPin') {
      // 检查新旧PIN码是否相同
      if (pinInputValue === this.data.oldPinForChange) {
        wx.showToast({
          title: '新PIN码不能与旧PIN码相同',
          icon: 'none'
        })
        return
      }
      
      // 保存新PIN码，进入下一步：确认新PIN码
      this.setData({
        newPinForChange: pinInputValue,
        showPinInputModal: false
      })
      this.showPinInputModal('confirmPin', '确认新PIN码', '请再次输入新PIN码以确认')
    } else if (pinInputType === 'confirmPin') {
      // 验证两次输入的新PIN码是否一致
      if (pinInputValue !== this.data.newPinForChange) {
        wx.showToast({
          title: '两次输入的新PIN码不一致',
          icon: 'none'
        })
        return
      }

      // 关闭弹窗和设置菜单
      this.closePinInputModal()
      this.setData({
        showSettingsMenu: false
      })

      // 调用API更新PIN码
      try {
        wx.showLoading({
          title: '更新中...',
          mask: true
        })

        const authApi = require('../../utils/authApi.js')
        const config = require('../../config.js')
        const authHeaders = authApi.getAuthHeaders()

        const result = await new Promise((resolve, reject) => {
          wx.request({
            url: `${config.apiBaseDomain}/api/auth/user/pin`,
            method: 'PUT',
            header: authHeaders,
            data: {
              pin: this.data.newPinForChange,
              oldPin: this.data.oldPinForChange
            },
            success: (res) => {
              if (res.statusCode === 200 && res.data && res.data.success !== false) {
                resolve(res.data)
              } else {
                reject(new Error(res.data?.message || '更新失败'))
              }
            },
            fail: (err) => {
              reject(new Error(err.errMsg || '网络错误'))
            }
          })
        })

        wx.hideLoading()

        // 保存新PIN码用于显示
        const newPin = this.data.newPinForChange

        // 清空临时数据
        this.setData({
          oldPinForChange: '',
          newPinForChange: ''
        })

        wx.showModal({
          title: 'PIN码已更新',
          content: `您的新PIN码是：${newPin}\n\n请牢记您的PIN码，这是您登录的重要凭证。`,
          showCancel: false,
          confirmText: '我知道了',
          success: () => {
            wx.showToast({
              title: 'PIN码已更新',
              icon: 'success'
            })
          }
        })
      } catch (error) {
        wx.hideLoading()
        console.error('[changePin] 更新PIN码失败:', error)
        wx.showToast({
          title: error.message || '更新失败，请稍后重试',
          icon: 'none',
          duration: 2000
        })
      }
    }
  },

  // 显示/隐藏反馈表单（切换）
  showFeedbackForm() {
    const newState = !this.data.showFeedbackForm
    this.setData({
      showFeedbackForm: newState,
      feedbackButtonActive: newState,
      currentView: '' // 确保不在列表视图
    })
  },

  // 加载我的评论
  async loadMyComments(page = 1) {
    if (this.data.articlesLoading) return

    this.setData({
      articlesLoading: true,
      articlesError: false,
      articlesErrorMessage: ''
    })

    try {
      const result = await blogApi.blogInteractionApi.getMyComments({
        page: page,
        pageSize: this.data.commentsPageSize
      })

      // 检查业务状态中的未登录错误
      if (result && result.success === false) {
        const errorMessage = result.message || ''
        if (this.isUnauthorizedError({ message: errorMessage })) {
          this.handleUnauthorizedError()
          return
        }
        throw new Error(errorMessage || '获取数据失败')
      }

      if (result && result.success && result.data) {
        // 如果是第一页，替换整个列表；否则追加到现有列表
        const currentList = this.data.articlesList || []
        const newComments = page === 1 ? result.data : [...currentList, ...result.data]
        const pagination = result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        console.log(`[loadMyComments] 加载第${page}页，当前列表长度: ${currentList.length}，新数据长度: ${result.data.length}，追加后长度: ${newComments.length}`)

        // 更新统计数量（如果是第一页）
        const updateData = {
          articlesList: newComments,
          currentPage: page,
          hasMoreArticles: hasMore,
          articlesLoading: false,
          articlesError: false
        }
        if (page === 1) {
          updateData.commentsCount = pagination.total || result.total || 0
          console.log(`[loadMyComments] 更新评论数量: ${updateData.commentsCount}`)
        }

        this.setData(updateData)
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[loadMyComments] 加载失败:', error)
      
      // 检查是否为未登录错误
      if (this.isUnauthorizedError(error)) {
        this.handleUnauthorizedError()
        return
      }
      
      this.setData({
        articlesError: true,
        articlesErrorMessage: error.message || '获取数据失败，请稍后重试',
        articlesLoading: false
      })
    }
  },

  // 加载我的消息
  async loadMyMessages(page = 1) {
    if (this.data.articlesLoading) return

    this.setData({
      articlesLoading: true,
      articlesError: false,
      articlesErrorMessage: ''
    })

    try {
      const result = await blogApi.blogInteractionApi.getMyPostsInteractions({
        page: page,
        pageSize: this.data.messagesPageSize,
        type: 'all'
      })

      // 检查业务状态中的未登录错误
      if (result && result.success === false) {
        const errorMessage = result.message || ''
        if (this.isUnauthorizedError({ message: errorMessage })) {
          this.handleUnauthorizedError()
          return
        }
        throw new Error(errorMessage || '获取数据失败')
      }

      if (result && result.success && result.data) {
        // 合并所有类型的消息
        const allMessages = []
        if (result.data.comments && Array.isArray(result.data.comments)) {
          result.data.comments.forEach(item => {
            allMessages.push({ ...item, type: 'comment' })
          })
        }
        if (result.data.likes && Array.isArray(result.data.likes)) {
          result.data.likes.forEach(item => {
            allMessages.push({ ...item, type: 'like' })
          })
        }
        if (result.data.favorites && Array.isArray(result.data.favorites)) {
          result.data.favorites.forEach(item => {
            allMessages.push({ ...item, type: 'favorite' })
          })
        }

        // 按时间排序（最新的在前）
        allMessages.sort((a, b) => {
          const timeA = new Date(a.createdAt || a.created_at || 0).getTime()
          const timeB = new Date(b.createdAt || b.created_at || 0).getTime()
          return timeB - timeA
        })

        // 如果是第一页，替换整个列表；否则追加到现有列表
        const currentList = this.data.articlesList || []
        const newMessages = page === 1 ? allMessages : [...currentList, ...allMessages]
        const pagination = result.pagination || {}
        const hasMore = pagination.currentPage < pagination.totalPages

        console.log(`[loadMyMessages] 加载第${page}页，当前列表长度: ${currentList.length}，新数据长度: ${allMessages.length}，追加后长度: ${newMessages.length}`)

        // 更新统计信息和未读数量
        const statistics = result.data.statistics || {}
        const totalMessages = (statistics.totalComments || 0) + (statistics.totalLikes || 0) + (statistics.totalFavorites || 0)
        const lastTotal = this.data.lastMessagesTotal || 0
        const unreadCount = totalMessages > lastTotal ? totalMessages - lastTotal : 0

        const updateData = {
          articlesList: newMessages,
          currentPage: page,
          hasMoreArticles: hasMore,
          articlesLoading: false,
          articlesError: false
        }
        
        // 只在第一页时更新总数和未读数量
        if (page === 1) {
          updateData.lastMessagesTotal = totalMessages
          // 如果当前正在查看消息页面，重置未读数量为0
          if (this.data.currentView === 'messages') {
            updateData.messagesUnreadCount = 0
            updateData.hasUnreadMessage = false
          } else {
            // 如果不在消息页面，更新未读数量
            updateData.messagesUnreadCount = unreadCount
            updateData.hasUnreadMessage = unreadCount > 0
          }
        }

        this.setData(updateData)
      } else {
        throw new Error(result?.message || '获取数据失败')
      }
    } catch (error) {
      console.error('[loadMyMessages] 加载失败:', error)
      
      // 检查是否为未登录错误
      if (this.isUnauthorizedError(error)) {
        this.handleUnauthorizedError()
        return
      }
      
      this.setData({
        articlesError: true,
        articlesErrorMessage: error.message || '获取数据失败，请稍后重试',
        articlesLoading: false
      })
    }
  },

  // 加载统计数据（在登录后调用）
  async loadStats() {
    if (!this.data.isLoggedIn) {
      console.log('[loadStats] 用户未登录，跳过')
      return
    }
    
    // 防止重复调用
    if (this._loadingStats) {
      console.log('[loadStats] 正在加载中，跳过重复调用')
      return
    }
    
    // 记录调用堆栈，便于调试
    console.log('[loadStats] 开始加载统计数据，调用堆栈:', new Error().stack)
    
    this._loadingStats = true

    try {
      // 并行加载喜欢、收藏、评论和消息的第一页数据来获取总数
      // 使用 pageSize=1 只获取第一页，但会返回完整的 pagination 信息（包括 total）
      const [likesResult, favoritesResult, commentsResult, messagesResult] = await Promise.all([
        blogApi.blogInteractionApi.getMyLikes({ page: 1, pageSize: 1 }).catch((err) => {
          console.error('[loadStats] 获取喜欢数量失败:', err)
          return { success: false }
        }),
        blogApi.blogInteractionApi.getMyFavorites({ page: 1, pageSize: 1 }).catch((err) => {
          console.error('[loadStats] 获取收藏数量失败:', err)
          return { success: false }
        }),
        blogApi.blogInteractionApi.getMyComments({ page: 1, pageSize: 1 }).catch((err) => {
          console.error('[loadStats] 获取评论数量失败:', err)
          return { success: false }
        }),
        blogApi.blogInteractionApi.getMyPostsInteractions({ page: 1, pageSize: 1, type: 'all' }).catch((err) => {
          console.error('[loadStats] 获取消息数量失败:', err)
          return { success: false }
        })
      ])

      // 更新喜欢数量
      if (likesResult && likesResult.success && likesResult.pagination) {
        const total = likesResult.pagination.total || 0
        console.log('[loadStats] 更新喜欢数量:', total)
        this.setData({
          likesCount: total
        })
      } else if (likesResult && likesResult.success === false) {
        console.warn('[loadStats] 获取喜欢数量失败:', likesResult.message)
      }

      // 更新收藏数量
      if (favoritesResult && favoritesResult.success && favoritesResult.pagination) {
        const total = favoritesResult.pagination.total || 0
        console.log('[loadStats] 更新收藏数量:', total)
        this.setData({
          favoritesCount: total
        })
      } else if (favoritesResult && favoritesResult.success === false) {
        console.warn('[loadStats] 获取收藏数量失败:', favoritesResult.message)
      }

      // 更新评论数量
      if (commentsResult && commentsResult.success && commentsResult.pagination) {
        const total = commentsResult.pagination.total || commentsResult.total || 0
        console.log('[loadStats] 更新评论数量:', total)
        this.setData({
          commentsCount: total
        })
      } else if (commentsResult && commentsResult.success === false) {
        console.warn('[loadStats] 获取评论数量失败:', commentsResult.message)
      }

      // 更新消息数量和未读提示（使用服务器返回的 notifications 对象）
      console.log('[loadStats] messagesResult 完整数据:', messagesResult)
      console.log('[loadStats] messagesResult.success:', messagesResult?.success)
      console.log('[loadStats] messagesResult.data:', messagesResult?.data)
      console.log('[loadStats] messagesResult.notifications:', messagesResult?.notifications)
      console.log('[loadStats] messagesResult.data.notifications:', messagesResult?.data?.notifications)
      
      if (messagesResult && messagesResult.success) {
        // 尝试从多个位置获取 notifications
        // 1. 优先从 data.notifications 获取
        // 2. 如果不存在，从顶层 notifications 获取
        let notifications = null
        if (messagesResult.data && messagesResult.data.notifications) {
          notifications = messagesResult.data.notifications
          console.log('[loadStats] 从 data.notifications 获取')
        } else if (messagesResult.notifications) {
          notifications = messagesResult.notifications
          console.log('[loadStats] 从顶层 notifications 获取')
        } else {
          console.warn('[loadStats] notifications 不存在，检查数据结构:')
          console.warn('[loadStats] messagesResult 键:', Object.keys(messagesResult))
          if (messagesResult.data) {
            console.warn('[loadStats] messagesResult.data 键:', Object.keys(messagesResult.data))
          }
          notifications = {}
        }
        
        const notificationsObj = notifications || {}
        
        console.log('[loadStats] notifications 对象:', notificationsObj)
        console.log('[loadStats] notifications 类型:', typeof notificationsObj)
        console.log('[loadStats] notifications 键:', Object.keys(notificationsObj))
        
        // 计算未读数量：使用三个值的和
        const unreadCommentsCount = Number(notificationsObj.unreadCommentsCount) || 0
        const unreadLikesCount = Number(notificationsObj.unreadLikesCount) || 0
        const unreadFavoritesCount = Number(notificationsObj.unreadFavoritesCount) || 0
        const unreadCount = unreadCommentsCount + unreadLikesCount + unreadFavoritesCount
        
        console.log('[loadStats] 计算过程:', {
          unreadCommentsCount_raw: notificationsObj.unreadCommentsCount,
          unreadLikesCount_raw: notificationsObj.unreadLikesCount,
          unreadFavoritesCount_raw: notificationsObj.unreadFavoritesCount,
          unreadCommentsCount: unreadCommentsCount,
          unreadLikesCount: unreadLikesCount,
          unreadFavoritesCount: unreadFavoritesCount,
          sum: unreadCount
        })
        
        // 优先使用服务器返回的 hasUnreadMessage，如果不存在则根据计算的总数判断
        const hasUnread = notificationsObj.hasUnreadMessage === true || (notificationsObj.hasUnreadMessage === undefined && unreadCount > 0)
        
        console.log('[loadStats] 更新消息通知状态:', {
          hasUnreadMessage: hasUnread,
          unreadCount: unreadCount,
          unreadCommentsCount: unreadCommentsCount,
          unreadLikesCount: unreadLikesCount,
          unreadFavoritesCount: unreadFavoritesCount,
          calculatedTotal: unreadCount,
          rawNotifications: notificationsObj,
          notificationsHasUnreadMessage: notificationsObj.hasUnreadMessage,
          notificationsUnreadCount: notificationsObj.unreadCount
        })
        
        // 总是更新未读数量（即使为0也要更新，以清除之前的未读状态）
        this.setData({
          messagesUnreadCount: unreadCount,
          hasUnreadMessage: hasUnread
        })
        
        console.log('[loadStats] 已更新页面数据:', {
          messagesUnreadCount: unreadCount,
          hasUnreadMessage: hasUnread
        })
      } else if (messagesResult && messagesResult.success === false) {
        console.warn('[loadStats] 获取消息数量失败:', messagesResult.message)
        // 如果获取失败，不清除未读状态（保持之前的状态）
      } else {
        console.warn('[loadStats] 消息结果格式异常:', {
          hasMessagesResult: !!messagesResult,
          success: messagesResult?.success,
          hasData: !!messagesResult?.data,
          messagesResult: messagesResult
        })
      }
    } catch (error) {
      console.error('[loadStats] 加载统计数据失败:', error)
      // 静默失败，不影响用户体验
    } finally {
      // 清除加载标志
      this._loadingStats = false
    }
  }
})
