# 登录状态管理使用指南

## 📋 概述

按照微信小程序最佳实践实现的登录状态保持机制，确保用户登录后切换页面或重新打开小程序时保持登录状态。

## 🎯 核心特性

1. **本地存储持久化**：使用 `wx.setStorageSync` 保存用户信息
2. **全局状态管理**：在 `app.globalData` 中维护登录状态
3. **服务器验证**：定期验证服务器端登录状态
4. **快速恢复**：从本地存储快速恢复登录状态，提升用户体验
5. **自动同步**：页面显示时自动检查并更新登录状态

## 🔧 实现原理

### 1. 登录状态存储

- **本地存储**：使用 `wx.setStorageSync` 持久化保存用户信息
- **全局数据**：在 `app.globalData` 中保存当前登录用户
- **登录时间**：记录登录时间，可用于判断登录有效期

### 2. 状态恢复流程

```
小程序启动 (App.onLaunch)
  ↓
从本地存储恢复登录状态 (快速)
  ↓
静默验证服务器端登录状态 (后台)
  ↓
更新全局和页面状态
```

### 3. 页面状态检查

```
页面显示 (Page.onShow)
  ↓
检查本地登录状态 (快速)
  ↓
验证服务器端登录状态 (异步)
  ↓
更新页面状态
```

## 📖 使用方法

### 1. 在页面中使用登录状态

```javascript
const app = getApp()
const authHelper = require('../../utils/authHelper.js')

Page({
  onLoad() {
    // 快速从本地恢复登录状态
    const localUser = authHelper.getLoginInfo()
    if (localUser) {
      this.setData({
        isLoggedIn: true,
        user: localUser
      })
    }
    
    // 验证服务器端登录状态
    authHelper.checkAndUpdateLoginStatus(app, this)
  },
  
  onShow() {
    // 每次显示页面时检查登录状态
    authHelper.checkAndUpdateLoginStatus(app, this)
  },
  
  // 检查是否已登录
  checkAuth() {
    if (!authHelper.isLoggedInLocally()) {
      wx.showModal({
        title: '需要登录',
        content: '此功能需要登录，是否前往登录？',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/page/my/index'
            })
          }
        }
      })
      return false
    }
    return true
  }
})
```

### 2. 登录成功后的处理

```javascript
// 登录成功后
authHelper.handleLoginSuccess(user, app, this)
```

### 3. 登出处理

```javascript
// 登出
authHelper.handleLogout(app, this)
```

### 4. 获取当前用户

```javascript
// 从全局数据获取
const user = app.globalData.user

// 或从本地存储获取
const user = authHelper.getLoginInfo()

// 或验证服务器端状态
const user = await authHelper.verifyLoginStatus()
```

## 🔍 API 说明

### authHelper 方法

#### `saveLoginInfo(user)`
保存登录信息到本地存储

#### `getLoginInfo()`
从本地存储获取登录信息

#### `clearLoginInfo()`
清除登录信息

#### `isLoggedInLocally()`
检查是否已登录（仅检查本地存储）

#### `verifyLoginStatus()`
验证服务器端登录状态

#### `initLoginStatus(app)`
初始化登录状态（从本地存储恢复）

#### `checkAndUpdateLoginStatus(app, page)`
检查并更新登录状态（先检查本地，再验证服务器）

#### `handleLoginSuccess(user, app, page)`
登录成功后的统一处理

#### `handleLogout(app, page)`
登出统一处理

## ⚠️ 注意事项

1. **Session Cookie**：小程序会自动处理 Cookie，无需手动设置 `withCredentials`
2. **网络异常**：网络异常时保持本地登录状态，避免频繁提示登录
3. **状态同步**：页面切换时会自动检查登录状态，确保状态一致
4. **性能优化**：先使用本地存储快速恢复，再异步验证服务器状态

## 🎨 最佳实践

1. **页面加载时**：快速从本地恢复登录状态，提升用户体验
2. **页面显示时**：检查并更新登录状态，确保状态准确
3. **需要登录的功能**：先检查本地登录状态，再验证服务器状态
4. **登录成功**：使用 `handleLoginSuccess` 统一处理
5. **登出**：使用 `handleLogout` 统一处理

## 📝 示例

### 需要登录才能访问的页面

```javascript
const app = getApp()
const authHelper = require('../../utils/authHelper.js')

Page({
  async onLoad() {
    // 检查登录状态
    const user = await authHelper.checkAndUpdateLoginStatus(app, this)
    
    if (!user) {
      wx.showModal({
        title: '需要登录',
        content: '此页面需要登录后才能访问',
        showCancel: false,
        success: () => {
          wx.navigateBack()
        }
      })
      return
    }
    
    // 已登录，继续加载页面数据
    this.loadData()
  }
})
```

### 在页面中显示用户信息

```javascript
Page({
  data: {
    user: null,
    isLoggedIn: false
  },
  
  onShow() {
    const app = getApp()
    authHelper.checkAndUpdateLoginStatus(app, this)
  }
})
```

```xml
<view wx:if="{{isLoggedIn && user}}">
  <text>欢迎，{{user.name || user.phone}}</text>
</view>
```





