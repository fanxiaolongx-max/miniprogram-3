/**
 * 富文本编辑器组件
 * 基于微信小程序官方 editor 组件
 */

Component({
  properties: {
    // HTML内容（输入）
    htmlContent: {
      type: String,
      value: '',
      observer: function(newVal) {
        // 只在编辑器就绪且内容真正变化时更新
        if (this.data.editorReady && newVal !== this.data.currentHtml && this.editorCtx) {
          this.setEditorContent(newVal)
        }
      }
    },
    // 占位符
    placeholder: {
      type: String,
      value: '请输入内容...'
    }
  },

  data: {
    editorReady: false,
    currentHtml: '',
    showToolbar: true,
    formats: {}
  },

  lifetimes: {
    attached() {
      // 组件挂载后，等待编辑器ready
    }
  },

  methods: {
    // 设置编辑器内容
    setEditorContent(html) {
      if (!this.editorCtx) return
      
      try {
        this.editorCtx.setContents({
          html: html || ''
        })
        this.setData({
          currentHtml: html || ''
        })
      } catch (error) {
        console.error('设置编辑器内容失败:', error)
      }
    },

    // 编辑器准备就绪
    onEditorReady() {
      const that = this
      wx.createSelectorQuery().in(this).select('#editor').context((res) => {
        if (res.context) {
          that.editorCtx = res.context
          that.setData({ editorReady: true })
          
          // 如果有初始内容，设置到编辑器
          if (that.properties.htmlContent) {
            that.setEditorContent(that.properties.htmlContent)
          }
        }
      }).exec()
    },

    // 编辑器状态变化
    onStatusChange(e) {
      const formats = e.detail
      this.setData({
        formats: formats
      })
    },

    // 编辑器内容变化
    onEditorInput(e) {
      // 获取编辑器内容
      if (!this.editorCtx) return
      
      this.editorCtx.getContents({
        success: (res) => {
          const html = res.html || ''
          const text = res.text || ''
          
          // 避免重复触发
          if (html !== this.data.currentHtml) {
            this.setData({
              currentHtml: html
            })
            
            // 通知父组件内容变化
            this.triggerEvent('change', {
              html: html,
              text: text,
              delta: res.delta
            })
          }
        },
        fail: (err) => {
          console.error('获取编辑器内容失败:', err)
        }
      })
    },

    // 插入图片
    insertImage() {
      const that = this
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: function(res) {
          const tempFilePath = res.tempFilePaths[0]
          
          // 这里应该上传图片到服务器，获取URL
          // 暂时使用本地路径（实际使用时需要上传）
          wx.showToast({
            title: '请先上传图片到服务器，然后输入图片URL',
            icon: 'none',
            duration: 2000
          })
          
          // 示例：如果已有图片URL
          // that.editorCtx.insertImage({
          //   src: 'https://example.com/image.jpg',
          //   alt: '图片',
          //   width: '100%',
          //   height: 'auto'
          // })
        }
      })
    },

    // 格式化文本
    format(e) {
      const { name, value } = e.currentTarget.dataset
      if (!name || !this.editorCtx) return
      
      // 切换格式（如果已应用则取消）
      const currentValue = this.data.formats[name]
      const newValue = currentValue === value ? undefined : value
      
      this.editorCtx.format(name, newValue)
    },

    // 插入链接（editor组件限制，需要手动输入HTML）
    insertLink() {
      if (!this.editorCtx) return
      
      const that = this
      wx.showModal({
        title: '插入链接',
        editable: true,
        placeholderText: '请输入链接URL和文本，格式：URL|文本',
        success: function(res) {
          if (res.confirm && res.content) {
            const parts = res.content.split('|')
            const url = parts[0].trim()
            const text = parts[1] ? parts[1].trim() : url
            
            // 插入HTML格式的链接
            const linkHtml = `<a href="${url}">${text}</a>`
            that.editorCtx.insertText({
              text: linkHtml
            })
          }
        }
      })
    },

    // 获取编辑器内容（HTML格式）
    getHtmlContent() {
      return new Promise((resolve, reject) => {
        if (!this.editorCtx) {
          reject(new Error('编辑器未就绪'))
          return
        }
        
        this.editorCtx.getContents({
          success: (res) => {
            resolve(res.html || '')
          },
          fail: reject
        })
      })
    },

    // 清空内容
    clear() {
      if (this.editorCtx) {
        this.editorCtx.clear({
          success: () => {
            this.setData({ currentHtml: '' })
            this.triggerEvent('change', { html: '', text: '' })
          }
        })
      }
    }
  }
})

