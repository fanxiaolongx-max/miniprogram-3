const app = getApp()
const authApi = require('../../utils/authApi.js')
const authHelper = require('../../utils/authHelper.js')

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
      { value: '热门打卡地', label: '热门打卡地' },
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
      this.setData({
        isLoggedIn: true,
        user: localUser,
        avatarEmoji: avatarEmoji
      })
      app.globalData.user = localUser
      app.globalData.isLoggedIn = true
    }

    // 然后验证服务器端登录状态
    this.checkLoginStatus()
  },

  onShow() {
    // 每次显示页面时检查并更新登录状态
    this.checkLoginStatus()
  },

  onUnload() {
    // 清除验证码倒计时
    if (this.data.codeTimer) {
      clearInterval(this.data.codeTimer)
    }
  },

  // 检查登录状态（使用统一的登录状态管理）
  async checkLoginStatus() {
    await authHelper.checkAndUpdateLoginStatus(app, this)
    // 如果已登录，设置头像图案
    if (this.data.isLoggedIn && this.data.user) {
      const avatarEmoji = getCuteAvatar(this.data.user.id)
      this.setData({
        avatarEmoji: avatarEmoji
      })
    } else {
      // 未登录时清空头像图案
      this.setData({
        avatarEmoji: ''
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
      showKeyboard: true // 显示自定义键盘
    })
    console.log('[onPinFocus] PIN码输入框已聚焦，显示自定义键盘，当前PIN长度:', this.data.pin.length)
    // 延迟滚动，确保键盘已显示
    setTimeout(() => {
      this.scrollToPinInput()
    }, 300)
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
      showKeyboard: true
    })
    // 延迟滚动，确保键盘已显示
    setTimeout(() => {
      this.scrollToPinInput()
    }, 300)
  },

  // 滚动到PIN输入框位置
  scrollToPinInput() {
    const query = wx.createSelectorQuery().in(this)
    // 同时获取PIN输入框和键盘的位置信息
    query.select('.pin-input-wrapper').boundingClientRect()
    query.select('.number-keyboard').boundingClientRect()
    query.exec((res) => {
      const pinRect = res[0]
      const keyboardRect = res[1]
      
      if (pinRect) {
        // 获取系统信息
        wx.getSystemInfo({
          success: (sysInfo) => {
            const windowHeight = sysInfo.windowHeight
            // 计算键盘高度（如果获取到了键盘位置）
            // 键盘高度 = 4行按键(100rpx*4) + 间距(20rpx*3) + padding(20rpx+40rpx) ≈ 520rpx
            // 转换为px：520rpx * (windowWidth / 750)
            const pixelRatio = sysInfo.windowWidth / 750
            const keyboardHeight = 520 * pixelRatio // 大约 260px (在375px宽度的设备上)
            
            // 可用高度 = 窗口高度 - 键盘高度 - 安全边距
            const safeMargin = 50 // 预留一些边距
            const availableHeight = windowHeight - keyboardHeight - safeMargin
            
            // 获取当前滚动位置
            wx.createSelectorQuery().selectViewport().scrollOffset((scrollRes) => {
              const currentScrollTop = scrollRes ? scrollRes.scrollTop : 0
              
              // 计算输入框在页面中的绝对位置（相对于页面顶部）
              const pinAbsoluteTop = pinRect.top + currentScrollTop
              
              // 如果输入框在可用区域下方，需要滚动
              if (pinRect.top > availableHeight) {
                // 目标滚动位置：让输入框显示在可用区域的合适位置（距离顶部100px）
                const targetScrollTop = pinAbsoluteTop - 100
                
                wx.pageScrollTo({
                  scrollTop: Math.max(0, targetScrollTop), // 确保不小于0
                  duration: 300 // 300ms 平滑滚动动画
                })
                console.log('[scrollToPinInput] 滚动到PIN输入框', {
                  currentScrollTop,
                  pinRectTop: pinRect.top,
                  pinAbsoluteTop,
                  targetScrollTop: Math.max(0, targetScrollTop),
                  availableHeight,
                  keyboardHeight
                })
              } else {
                console.log('[scrollToPinInput] PIN输入框已在可见区域，无需滚动', {
                  pinRectTop: pinRect.top,
                  availableHeight
                })
              }
            }).exec()
          }
        })
      }
    })
  },

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
        // 设置头像图案
        const avatarEmoji = getCuteAvatar(result.user.id)
        this.setData({
          avatarEmoji: avatarEmoji
        })
      } catch (handleError) {
        console.error('[loginWithPin] 处理登录成功时出错:', handleError)
        // 即使处理出错，也尝试清空表单
      }
      
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

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
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
      // 设置头像图案
      const avatarEmoji = getCuteAvatar(result.user.id)
      this.setData({
        avatarEmoji: avatarEmoji
      })
      
      // 清空表单
      this.setData({
        phone: '',
        code: '',
        pin: '',
        name: '',
        pinCursor: 0, // 重置光标位置
        showKeyboard: false // 隐藏键盘
      })

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })
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

    // 验证反馈内容
    if (!content) {
      wx.showToast({
        title: '请输入反馈内容',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (content.length < 5) {
      wx.showToast({
        title: '反馈内容至少5个字符',
        icon: 'none',
        duration: 2000
      })
      return
    }

    if (content.length > 500) {
      wx.showToast({
        title: '反馈内容不能超过500个字符',
        icon: 'none',
        duration: 2000
      })
      return
    }

    this.setData({
      submitting: true
    })

    const config = require('../../config.js')
    const apiUrl = config.feedbackApi || `${config.apiBaseUrl}/feedback`

    // 准备用户信息
    const user = this.data.user || {}
    const requestData = {
      content: content,
      category: category || undefined,
      // 用户信息
      userInfo: {
        userId: user.id || '',
        phone: user.phone || '',
        name: user.name || ''
      }
    }

    wx.request({
      url: apiUrl,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
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
          
          // 清空表单
          this.setData({
            feedbackContent: '',
            feedbackCategory: '',
            feedbackCategoryIndex: 0,
            submitting: false
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
  }
})
