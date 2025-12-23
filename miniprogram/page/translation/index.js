Page({
  onShareAppMessage() {
    return {
      title: '问路卡片 - 中阿互译',
      path: 'page/translation/index'
    }
  },

  data: {
    theme: 'light',
    phrases: [],
    loading: false,
    categories: [],
    selectedCategory: 'all',
    error: false,
    showModal: false,
    currentPhrase: {},
    audioContext: null,
    isPlaying: false,
    playingLang: null // 'zh' | 'ar' | null
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

    // 初始化音频上下文
    this.initAudioContext()

    // 加载翻译数据
    this.fetchTranslation()
  },

  onUnload() {
    // 页面卸载时停止播放并销毁音频上下文
    this.stopAudio()
  },

  // 初始化音频上下文
  initAudioContext() {
    const audioContext = wx.createInnerAudioContext()
    audioContext.onPlay(() => {
      this.setData({ isPlaying: true })
    })
    audioContext.onEnded(() => {
      this.setData({ isPlaying: false, playingLang: null })
    })
    audioContext.onError((err) => {
      console.error('音频播放失败', err)
      this.setData({ isPlaying: false, playingLang: null })
      wx.showToast({
        title: '播放失败，请重试',
        icon: 'none',
        duration: 2000
      })
    })
    this.setData({ audioContext })
  },

  // 停止音频播放
  stopAudio() {
    if (this.data.audioContext) {
      this.data.audioContext.stop()
      this.data.audioContext.destroy()
      this.setData({ audioContext: null, isPlaying: false })
    }
  },

  // 从 API 获取翻译数据
  fetchTranslation() {
    const config = require('../../config.js')
    const apiUrl = config.translationApi || `${config.apiBaseUrl}/translation`
    
    this.setData({
      loading: true
    })

    wx.request({
      url: apiUrl,
      method: 'GET',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        console.log('获取翻译数据响应', res)
        
        // 处理API响应数据，自动替换URL（将 boba.app 替换为 bobapro.life）
        const envHelper = require('../../utils/envHelper.js')
        res.data = envHelper.processApiResponse(res.data)
        
        // 检查状态码和 success 字段
        if (res.statusCode !== 200 || (res.data && res.data.success === false)) {
          console.error('获取翻译数据失败', res.statusCode, res.data)
          this.showError()
          return
        }

        if (!res.data) {
          console.error('获取翻译数据失败：返回数据为空')
          this.showError()
          return
        }

        let phrases = []
        
        // 处理不同的返回格式
        if (Array.isArray(res.data)) {
          phrases = res.data
        } else if (res.data.data && Array.isArray(res.data.data)) {
          phrases = res.data.data
        } else if (res.data.phrases && Array.isArray(res.data.phrases)) {
          phrases = res.data.phrases
        }

        // 检查是否有有效数据
        if (!Array.isArray(phrases) || phrases.length === 0) {
          console.error('获取翻译数据失败：返回格式不正确或数据为空')
          this.showError()
          return
        }

        // 标准化数据格式
        phrases = phrases.map(item => ({
          id: item.id || item._id || Math.random(),
          chinese: item.chinese || item.zh || item.text || '',
          arabic: item.arabic || item.ar || item.translation || '',
          category: item.category || item.type || '其他'
        }))

        // 提取分类
        const categories = ['all', ...new Set(phrases.map(p => p.category))]

        this.setData({
          phrases: phrases,
          categories: categories,
          loading: false,
          error: false
        })
      },
      fail: (err) => {
        console.error('获取翻译数据失败', err)
        this.showError()
      }
    })
  },

  // 显示错误提示
  showError() {
    this.setData({
      loading: false,
      error: true,
      phrases: [],
      categories: []
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  },

  // 重试
  retry() {
    this.fetchTranslation()
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category
    })
  },

  // 显示短语（全屏弹窗）
  showPhrase(e) {
    const phrase = e.currentTarget.dataset.phrase
    this.setData({
      showModal: true,
      currentPhrase: phrase
    })
  },

  // 隐藏弹窗
  hidePhrase() {
    this.setData({
      showModal: false,
      playingLang: null,
      isPlaying: false
    })
    // 停止音频播放
    this.stopAudio()
  },

  // 阻止事件冒泡（用于 modal-content）
  stopPropagation() {
    // 空函数，仅用于阻止事件冒泡
  },

  // 复制阿拉伯文
  copyArabic(e) {
    const text = e.currentTarget.dataset.text || this.data.currentPhrase.arabic
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制阿语',
          icon: 'success'
        })
      }
    })
  },

  // 复制中文
  copyChinese(e) {
    const text = e.currentTarget.dataset.text || this.data.currentPhrase.chinese
    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({
          title: '已复制中文',
          icon: 'success'
        })
      }
    })
  },

  // 朗读中文
  speakChinese(e) {
    e.stopPropagation && e.stopPropagation()
    const text = e.currentTarget.dataset.text || this.data.currentPhrase.chinese
    if (!text) {
      wx.showToast({
        title: '文本为空',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 如果正在播放，先停止
    if (this.data.isPlaying) {
      this.stopAudio()
      this.initAudioContext()
    }
    
    this.setData({ playingLang: 'zh' })
    this.playTTS(text, 'zh')
  },

  // 朗读阿拉伯语
  speakArabic(e) {
    e.stopPropagation && e.stopPropagation()
    const text = e.currentTarget.dataset.text || this.data.currentPhrase.arabic
    if (!text) {
      wx.showToast({
        title: '文本为空',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 如果正在播放，先停止
    if (this.data.isPlaying) {
      this.stopAudio()
      this.initAudioContext()
    }
    
    this.setData({ playingLang: 'ar' })
    this.playTTS(text, 'ar')
  },

  // 播放TTS音频
  playTTS(text, lang = 'zh') {
    const config = require('../../config.js')
    const ttsApiUrl = config.ttsApi || `${config.apiBaseDomain}/api/tts`
    
    // 微信小程序没有内置TTS功能，需要后端API支持
    // 如果后端配置了TTS API，尝试调用；否则使用降级方案
    
    // 检查是否配置了TTS API
    if (!ttsApiUrl || ttsApiUrl.includes('/api/tts') && !config.ttsApi) {
      // 没有配置TTS API，直接使用降级方案
      this.useClientTTS(text, lang)
      return
    }
    
    wx.showLoading({
      title: '正在生成语音...',
      mask: true
    })
    
    // 尝试调用后端TTS API
    wx.request({
      url: ttsApiUrl,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        text: text,
        lang: lang,
        format: 'mp3'  // 请求 MP3 格式音频（兼容性最好）
      },
      success: (res) => {
        wx.hideLoading()
        if (res.statusCode === 200 && res.data && res.data.audioUrl) {
          const audioUrl = res.data.audioUrl
          // 验证 audioUrl 是否为有效的 HTTPS URL（不能是 Base64）
          if (typeof audioUrl === 'string' && audioUrl.startsWith('http')) {
            // 后端返回音频URL，直接播放
            this.playAudio(audioUrl)
          } else {
            console.error('TTS API返回的audioUrl格式不正确，必须是HTTPS URL', audioUrl)
            wx.showToast({
              title: '音频格式不支持',
              icon: 'none',
              duration: 2000
            })
            // 使用降级方案
            this.useClientTTS(text, lang)
          }
        } else {
          // 后端不支持，使用降级方案
          this.useClientTTS(text, lang)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.log('TTS API调用失败，使用降级方案', err)
        // 后端请求失败，使用降级方案
        this.useClientTTS(text, lang)
      }
    })
  },

  // 使用客户端TTS（降级方案）
  useClientTTS(text, lang) {
    // 微信小程序没有内置TTS功能，需要后端API支持
    // 降级方案：自动复制文本，提示用户使用系统朗读功能
    
    // 先复制文本
    const copyText = lang === 'zh' 
      ? this.data.currentPhrase.chinese 
      : this.data.currentPhrase.arabic
    
    wx.setClipboardData({
      data: copyText,
      success: () => {
        wx.showModal({
          title: '语音朗读',
          content: lang === 'zh' 
            ? '文本已复制到剪贴板。\n\n请使用手机自带的语音朗读功能：\n• iOS：设置 > 辅助功能 > 朗读内容 > 朗读所选项\n• Android：长按文本后选择"朗读"'
            : '文本已复制到剪贴板。\n\n请使用手机自带的语音朗读功能：\n• iOS：设置 > 辅助功能 > 朗读内容 > 朗读所选项\n• Android：长按文本后选择"朗读"',
          showCancel: false,
          confirmText: '知道了',
          success: () => {
            this.setData({ playingLang: null })
          }
        })
      },
      fail: () => {
        wx.showToast({
          title: '复制失败，请重试',
          icon: 'none',
          duration: 2000
        })
        this.setData({ playingLang: null })
      }
    })
  },

  // 播放音频
  playAudio(audioUrl) {
    if (!this.data.audioContext) {
      this.initAudioContext()
    }

    const audioContext = this.data.audioContext
    audioContext.src = audioUrl
    audioContext.play()

    wx.showToast({
      title: '正在播放...',
      icon: 'none',
      duration: 1000
    })
  }
})

