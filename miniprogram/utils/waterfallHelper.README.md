# 瀑布流页面代码复用方案

## 概述

为了减少瀑布流页面代码的重复，我们提取了公共的工具函数、组件和样式。

## 文件说明

### 1. `utils/waterfallHelper.js` - 工具函数

提供以下函数：

- `formatViews(views)` - 格式化浏览量（如：1.2k、1.5w）
- `extractAuthorInfo(item)` - 从文章对象中提取发布者信息
- `enrichItemWithMeta(item, logPrefix)` - 为单个文章对象添加浏览量和发布者信息
- `enrichItemsWithMeta(items, logPrefix)` - 批量处理文章列表

### 2. `components/article-meta/index.*` - 文章元信息组件

可复用的组件，用于显示浏览量和发布者信息。

### 3. `utils/waterfallCommon.wxss` - 公共样式

浏览量和发布者信息的公共样式。

## 使用示例

### 方式一：使用工具函数（推荐）

在页面的 JS 文件中：

```javascript
const waterfallHelper = require('../../utils/waterfallHelper.js')

Page({
  // ... 其他代码

  // 在数据处理时使用
  fetchArticles() {
    // ... API 调用
    
    // 处理数据
    items = items.map(item => ({
      ...item,
      // ... 其他字段处理
      // 使用工具函数添加浏览量和发布者信息
      ...waterfallHelper.enrichItemWithMeta(item, '[fetchArticles]')
    }))
    
    // 或者批量处理
    items = waterfallHelper.enrichItemsWithMeta(items, '[fetchArticles]')
  },

  // formatViews 方法可以直接使用工具函数
  formatViews: waterfallHelper.formatViews
})
```

### 方式二：使用组件（推荐用于 WXML）

在页面的 JSON 文件中注册组件：

```json
{
  "usingComponents": {
    "article-meta": "/components/article-meta/index"
  }
}
```

在 WXML 中使用：

```xml
<view class="item-content">
  <view class="item-title">{{item.name}}</view>
  <view wx:if="{{item.description}}" class="item-description">{{item.description}}</view>
  
  <!-- 使用组件显示浏览量和发布者信息 -->
  <article-meta 
    formattedViews="{{item.formattedViews}}"
    authorInfo="{{item.authorInfo}}"
  />
  
  <!-- 其他内容 -->
</view>
```

### 方式三：使用公共样式

在页面的 WXSS 文件中导入：

```css
@import "../../utils/waterfallCommon.wxss";
```

然后在 WXML 中使用内联方式：

```xml
<!-- 浏览量和发布者信息（紧凑显示） -->
<view wx:if="{{item.formattedViews || item.authorInfo}}" class="item-meta-compact">
  <view wx:if="{{item.formattedViews}}" class="meta-views-compact">
    <text class="meta-icon">👁️</text>
    <text class="meta-text">{{item.formattedViews}}</text>
  </view>
  <view wx:if="{{item.authorInfo && item.authorInfo.nickname}}" class="meta-author-compact">
    <text class="meta-icon">👤</text>
    <text class="meta-text">{{item.authorInfo.nickname}}</text>
  </view>
</view>
```

## 迁移建议

### 步骤 1：引入工具函数

在页面 JS 文件顶部添加：

```javascript
const waterfallHelper = require('../../utils/waterfallHelper.js')
```

### 步骤 2：替换 formatViews 方法

将页面中的 `formatViews` 方法替换为：

```javascript
formatViews: waterfallHelper.formatViews
```

### 步骤 3：简化数据处理逻辑

将数据处理中的浏览量和发布者信息提取逻辑替换为：

```javascript
items = items.map(item => ({
  ...item,
  // ... 其他字段处理
  ...waterfallHelper.enrichItemWithMeta(item, '[页面名称]')
}))
```

### 步骤 4：使用组件或公共样式

- **推荐使用组件**：更简洁，易于维护
- **或使用公共样式**：保持现有 WXML 结构，只需导入样式文件

## 优势

1. **代码复用**：避免在每个页面重复相同的代码
2. **易于维护**：修改一处即可影响所有页面
3. **统一性**：确保所有页面的显示逻辑一致
4. **可扩展性**：未来添加新功能时只需修改公共代码

## 注意事项

- 使用工具函数时，确保传入的 `item` 对象包含 `views` 和 `custom_fields` 字段
- 组件需要在小程序开发者工具中正确注册
- 公共样式文件需要在 WXSS 中正确导入

