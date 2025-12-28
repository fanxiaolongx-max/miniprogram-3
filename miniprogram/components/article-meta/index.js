/**
 * 文章元信息组件（浏览量和发布者信息）
 */
Component({
  properties: {
    // 格式化后的浏览量
    formattedViews: {
      type: String,
      value: ''
    },
    // 发布者信息
    authorInfo: {
      type: Object,
      value: null
    }
  }
})

