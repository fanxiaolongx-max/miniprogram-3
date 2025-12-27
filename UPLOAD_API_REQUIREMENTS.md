# 文件上传API需求文档

## 概述

小程序文章编辑功能需要支持图片和视频上传，需要服务端提供文件上传API接口。

## API需求

### 1. 上传接口

**端点**：`POST /api/blog-admin/upload`

**请求方式**：`POST`（multipart/form-data）

**请求头**：
```
Content-Type: multipart/form-data
X-API-Token: {API_TOKEN}  // 与文章管理API使用相同的Token认证
```

**请求参数**：
- `file`：文件（必填，FormData格式）
  - 支持类型：图片（jpg, jpeg, png, gif, webp）和视频（mp4, mov）
  - 文件大小限制：
    - 图片：建议最大 10MB
    - 视频：建议最大 50MB
- `type`：文件类型（可选，字符串）
  - 可选值：`image`（图片）、`video`（视频）
  - 默认值：`image`

**返回格式**：
```json
{
  "success": true,
  "url": "https://bobapro.life/uploads/images/2025/01/xxx.jpg",
  "message": "上传成功"
}
```

**错误返回格式**：
```json
{
  "success": false,
  "message": "错误信息"
}
```

### 2. 响应字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `success` | Boolean | 是 | 是否成功 |
| `url` | String | 是 | 上传后的文件URL（HTTPS） |
| `message` | String | 否 | 提示信息 |

### 3. 文件存储要求

1. **URL格式**：
   - 必须是完整的HTTPS URL
   - 例如：`https://bobapro.life/uploads/images/2025/01/xxx.jpg`
   - 或：`https://bobapro.life/uploads/videos/2025/01/xxx.mp4`

2. **文件路径建议**：
   - 图片：`/uploads/images/{YYYY}/{MM}/{filename}`
   - 视频：`/uploads/videos/{YYYY}/{MM}/{filename}`
   - 使用日期目录便于管理

3. **文件命名**：
   - 建议使用唯一文件名（UUID或时间戳+随机字符串）
   - 保留原始文件扩展名

### 4. 安全要求

1. **认证**：
   - 必须验证 `X-API-Token` 请求头
   - Token与文章管理API使用相同的认证机制

2. **文件类型验证**：
   - 验证文件MIME类型
   - 验证文件扩展名
   - 拒绝不安全的文件类型

3. **文件大小限制**：
   - 图片：建议最大 10MB
   - 视频：建议最大 50MB
   - 超出限制返回错误

4. **CORS配置**：
   - 需要配置正确的CORS响应头，允许小程序访问
   - 响应头示例：
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: POST, OPTIONS
     Access-Control-Allow-Headers: X-API-Token, Content-Type
     ```

### 5. 错误处理

**HTTP状态码**：
- `200`：成功
- `400`：请求参数错误（文件类型不支持、文件过大等）
- `401`：认证失败（Token无效）
- `413`：文件过大
- `500`：服务器错误

**错误响应示例**：
```json
{
  "success": false,
  "message": "文件大小超过限制（最大10MB）"
}
```

或

```json
{
  "success": false,
  "message": "不支持的文件类型，仅支持 jpg, jpeg, png, gif, webp, mp4, mov"
}
```

### 6. 请求示例

**小程序端请求代码**：
```javascript
wx.uploadFile({
  url: 'https://bobapro.life/api/blog-admin/upload',
  filePath: '/tmp/image.jpg',
  name: 'file',
  formData: {
    type: 'image'
  },
  header: {
    'X-API-Token': '210311199405041819'
  },
  success: (res) => {
    const data = JSON.parse(res.data)
    if (data.success) {
      console.log('上传成功，URL:', data.url)
    }
  }
})
```

### 7. 支持的格式

**图片格式**：
- `.jpg` / `.jpeg`
- `.png`
- `.gif`
- `.webp`

**视频格式**：
- `.mp4`（推荐，兼容性最好）
- `.mov`

### 8. 注意事项

1. **域名配置**：
   - 上传后的文件URL域名需要在微信公众平台配置 `downloadFile` 合法域名
   - 例如：`bobapro.life`

2. **图片处理**（可选）：
   - 建议自动压缩大图片
   - 生成缩略图（可选）
   - 保持图片质量的同时减小文件大小

3. **视频处理**（可选）：
   - 视频转码（可选）
   - 生成视频封面图（可选）

4. **存储位置**：
   - 可以使用本地存储或云存储（OSS、COS等）
   - 确保文件可公开访问（HTTPS）

## 实现建议

### Node.js/Express 示例

```javascript
const multer = require('multer')
const path = require('path')
const fs = require('fs')

// 配置存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.body.type || 'image'
    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dir = `uploads/${type}s/${year}/${month}`
    
    // 创建目录
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    cb(null, dir)
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname)
    const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}${ext}`
    cb(null, filename)
  }
})

// 文件过滤
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    video: ['video/mp4', 'video/quicktime']
  }
  
  const type = req.body.type || 'image'
  const allowed = allowedTypes[type] || allowedTypes.image
  
  if (allowed.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('不支持的文件类型'))
  }
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: fileFilter
})

// 上传接口
app.post('/api/blog-admin/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '未选择文件'
    })
  }
  
  const fileUrl = `https://bobapro.life/${req.file.path}`
  
  res.json({
    success: true,
    url: fileUrl,
    message: '上传成功'
  })
})
```

## 测试建议

1. **测试图片上传**：
   - 测试各种图片格式
   - 测试不同大小的图片
   - 测试超大图片（应返回错误）

2. **测试视频上传**：
   - 测试mp4格式
   - 测试不同大小的视频
   - 测试超大视频（应返回错误）

3. **测试认证**：
   - 测试无Token请求（应返回401）
   - 测试错误Token（应返回401）

4. **测试错误处理**：
   - 测试不支持的文件类型
   - 测试文件大小超限

## 联系信息

如有问题或需要调整，请联系开发团队。

---

**最后更新**：2025-01-24

