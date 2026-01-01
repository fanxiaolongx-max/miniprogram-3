Component({
  // ---在这里添加 options 配置---
  options: {
    styleIsolation: 'shared'  // 允许组件样式与全局样式相互影响，解决属性选择器报错
  },
  // -------------------------
  
  properties: {
    // 是否显示键盘
    show: {
      type: Boolean,
      value: false
    }
  },

  data: {},

  methods: {
    // 点击数字键
    onKeyTap(e) {
      const key = e.currentTarget.dataset.key
      if (key) {
        this.triggerEvent('input', { value: key })
      }
    },

    // 点击删除键
    onDeleteTap() {
      this.triggerEvent('delete')
    },

    // 点击遮罩层
    onMaskTap(e) {
      // 阻止事件冒泡，确保不会触发下层元素的点击
      e.stopPropagation && e.stopPropagation()
      // 点击遮罩层时关闭键盘
      this.triggerEvent('close')
    },

    // 阻止滑动穿透
    preventMove(e) {
      e.preventDefault && e.preventDefault()
      e.stopPropagation && e.stopPropagation()
      return false
    },

    // 阻止键盘内容区域的点击事件冒泡到遮罩层
    preventClose(e) {
      // 阻止事件冒泡，防止触发遮罩层的关闭事件
      e.stopPropagation && e.stopPropagation()
    }
  }
})

