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
    onMaskTap() {
      // 点击遮罩层时关闭键盘
      this.triggerEvent('close')
    },

    // 阻止滑动穿透
    preventMove() {
      return false
    },

    // 阻止键盘内容区域的点击事件冒泡到遮罩层
    preventClose() {
      // 不执行任何操作，只是阻止事件冒泡
    }
  }
})

