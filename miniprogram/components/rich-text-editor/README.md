# 富文本编辑器组件

基于微信小程序官方 `editor` 组件实现的富文本编辑器，支持可视化编辑和HTML代码编辑两种模式。

## 功能特性

- ✅ 可视化富文本编辑（基于官方 editor 组件）
- ✅ HTML代码编辑模式
- ✅ 双模式切换（可视化 ↔ HTML代码）
- ✅ 基础格式化工具（加粗、斜体、下划线、标题、对齐、列表）
- ✅ 插入图片
- ✅ 自动同步HTML内容
- ✅ 支持暗色模式

## 使用方法

### 1. 在页面中引入组件

在页面的 `index.json` 中注册组件：

```json
{
  "usingComponents": {
    "rich-text-editor": "/components/rich-text-editor/index"
  }
}
```

### 2. 在页面中使用

```xml
<rich-text-editor
  html-content="{{htmlContent}}"
  placeholder="请输入内容..."
  bind:change="onEditorChange"
/>
```

### 3. 在页面JS中处理事件

```javascript
Page({
  data: {
    htmlContent: ''
  },

  // 编辑器内容变化
  onEditorChange(e) {
    const html = e.detail.html
    this.setData({
      htmlContent: html
    })
  }
})
```

## 组件属性

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| htmlContent | String | '' | HTML内容（双向绑定） |
| placeholder | String | '请输入内容...' | 占位符文本 |

## 组件事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| change | 编辑器内容变化时触发 | `{html: string, text: string, delta: object}` |

## 编辑器模式

### 可视化编辑模式

- 使用工具栏进行格式化
- 支持所见即所得编辑
- 自动生成HTML代码

### HTML代码模式

- 直接编辑HTML代码
- 适合熟悉HTML的用户
- 支持所有HTML标签

## 工具栏功能

- **文本格式**：加粗(B)、斜体(I)、下划线(U)
- **标题**：H1、H2、H3
- **对齐**：左对齐、居中、右对齐
- **列表**：无序列表、有序列表
- **图片**：插入图片（需要输入图片URL）

## 注意事项

1. **图片插入**：目前需要手动输入图片URL，建议先上传图片到服务器获取URL
2. **HTML标签支持**：小程序 `rich-text` 组件支持的标签有限，建议使用基础标签
3. **内容同步**：可视化编辑和HTML代码编辑会自动同步
4. **性能**：大量内容时建议使用HTML代码模式编辑

## 支持的HTML标签

小程序 `rich-text` 组件支持以下标签：

- 文本：`<p>`, `<h1>`-`<h6>`, `<span>`, `<div>`
- 格式：`<strong>`, `<b>`, `<em>`, `<i>`
- 列表：`<ul>`, `<ol>`, `<li>`
- 媒体：`<img>`, `<video>`
- 链接：`<a>`
- 其他：`<br>`, `<hr>`

## 最佳实践

1. **简单内容**：使用可视化编辑模式
2. **复杂HTML**：使用HTML代码模式直接编辑
3. **图片处理**：先上传图片获取URL，再插入编辑器
4. **内容预览**：保存前切换到HTML模式检查代码

## 示例

### 基础使用

```xml
<view class="editor-section">
  <rich-text-editor
    html-content="{{articleContent}}"
    placeholder="请输入文章内容..."
    bind:change="onContentChange"
  />
</view>
```

```javascript
Page({
  data: {
    articleContent: '<p>初始内容</p>'
  },

  onContentChange(e) {
    this.setData({
      articleContent: e.detail.html
    })
  }
})
```

### 在文章编辑页面中使用

文章编辑页面已集成此组件，支持两种编辑模式切换：

- 可视化编辑：适合不熟悉HTML的用户
- HTML代码编辑：适合熟悉HTML的用户

两种模式内容会自动同步。

