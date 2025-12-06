Page({
  data: {
    theme: 'light',
    webViewUrl: 'https://boda-0mqtrq.fly.dev/'
  },
  onShareAppMessage() {
    return {
      title: this.data.pageTitle || 'webview',
      path: 'packageComponent/pages/open/web-view/web-view'
    }
  },
  onLoad(options) {
    this.setData({
      theme: wx.getSystemInfoSync().theme || 'light'
    })

    // 从 URL 参数获取 web-view 的地址和标题
    if (options.url) {
      this.setData({
        webViewUrl: decodeURIComponent(options.url)
      })
    }
    if (options.title) {
      this.setData({
        pageTitle: decodeURIComponent(options.title)
      })
      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: decodeURIComponent(options.title)
      })
    }

    if (wx.onThemeChange) {
      wx.onThemeChange(({theme}) => {
        this.setData({theme})
      })
    }
  }
})
