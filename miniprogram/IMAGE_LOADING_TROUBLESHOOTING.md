# 图片加载问题排查指南

## 错误信息
```
Failed to load image https://boba.app/uploads/custom-api-images/xxx.png
net::ERR_BLOCKED_BY_RESPONSE
```

## 重要说明

**`ERR_BLOCKED_BY_RESPONSE` 错误通常不是域名白名单问题**，而是**服务器端拒绝了请求**。

如果已经设置了"不校验合法域名"，但仍然出现此错误，说明问题在服务器端配置。

## 可能原因和解决方案

### 1. 服务器未配置正确的 CORS 响应头（最常见）

**问题**：服务器需要允许来自微信小程序的跨域请求。

**解决方案**：在服务器端（`boba.app` 和 `bobapro.life`）配置以下响应头：

#### Nginx 配置示例：
```nginx
location /uploads/ {
    # 允许所有来源（开发环境）
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, HEAD, OPTIONS';
    add_header Access-Control-Allow-Headers '*';
    
    # 或者只允许微信小程序（生产环境）
    # add_header Access-Control-Allow-Origin https://servicewechat.com;
    
    # 处理 OPTIONS 预检请求
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods 'GET, HEAD, OPTIONS';
        add_header Access-Control-Allow-Headers '*';
        add_header Access-Control-Max-Age 1728000;
        add_header Content-Type 'text/plain; charset=utf-8';
        add_header Content-Length 0;
        return 204;
    }
}
```

#### Node.js/Express 配置示例：
```javascript
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.header('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
```

#### PHP 配置示例：
```php
<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: *');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
?>
```

### 2. 服务器有防盗链限制

**问题**：服务器可能检查 Referer 或其他请求头，拒绝了来自微信小程序的请求。

**解决方案**：
- 检查服务器的防盗链配置（如 Nginx 的 `valid_referers`）
- 允许来自微信小程序的请求（Referer 可能为空或 `https://servicewechat.com/*`）
- 或者临时禁用防盗链检查（仅用于测试）

#### Nginx 防盗链配置示例：
```nginx
location /uploads/ {
    # 允许空 Referer（微信小程序可能没有 Referer）
    valid_referers none blocked server_names *.boba.app *.bobapro.life;
    if ($invalid_referer) {
        return 403;
    }
    
    # 或者完全禁用防盗链（仅用于测试）
    # valid_referers none;
}
```

### 3. 服务器返回的 Content-Type 不正确

**问题**：图片资源的 Content-Type 必须是正确的图片类型（如 `image/png`, `image/jpeg` 等）。

**解决方案**：确保服务器返回正确的 Content-Type 头。

#### Nginx 配置示例：
```nginx
location ~* \.(jpg|jpeg|png|gif|webp)$ {
    add_header Content-Type image/png;  # 或根据实际文件类型设置
    # 或者让 Nginx 自动识别
    # types { image/png png; image/jpeg jpg jpeg; }
}
```

### 4. 服务器安全策略限制

**问题**：服务器可能有安全策略（如 Cloudflare、防火墙等）阻止了请求。

**解决方案**：
- 检查 Cloudflare 或其他 CDN 的安全设置
- 检查服务器防火墙规则
- 检查是否有 IP 白名单限制

### 5. 域名未添加到微信公众平台白名单（仅真机需要）

**问题**：微信小程序要求所有外部图片域名必须在微信公众平台配置为 `downloadFile` 合法域名。

**注意**：如果设置了"不校验合法域名"，开发工具中不需要配置，但真机上仍然需要。

**解决方案**：
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入小程序后台 -> 开发 -> 开发管理 -> 开发设置
3. 找到 "服务器域名" -> "downloadFile 合法域名"
4. 添加以下域名：
   - `boba.app` （开发环境，不要带 `https://`）
   - `bobapro.life` （生产环境，不要带 `https://`）
5. 保存配置后，需要重新编译小程序才能生效

### 6. 图片 URL 格式不正确

**问题**：图片 URL 必须是 HTTPS 协议。

**解决方案**：确保所有图片 URL 使用 HTTPS 协议。

## 当前代码的处理

代码已经实现了图片加载失败时的降级处理：
- 当图片加载失败时，会自动使用默认占位图 `/page/component/resources/pic/1.jpg`
- 不会影响页面的正常显示和功能

## 验证步骤

### 1. 测试图片 URL 是否可访问
在浏览器中直接访问图片 URL，确认：
- 图片可以正常显示
- 检查浏览器开发者工具的 Network 标签，查看响应头

### 2. 检查服务器响应头
使用 curl 命令检查响应头：
```bash
curl -I https://boba.app/uploads/custom-api-images/1765574006728-uyg42pxe.png
```

应该看到以下响应头：
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD, OPTIONS
Access-Control-Allow-Headers: *
Content-Type: image/png
```

### 3. 检查服务器日志
查看服务器访问日志，确认：
- 请求是否到达服务器
- 服务器返回的状态码
- 是否有错误信息

### 4. 临时解决方案（仅用于测试）
如果暂时无法修改服务器配置，可以考虑：
- 使用图片代理服务
- 将图片上传到支持 CORS 的图床（如七牛云、阿里云 OSS 等）
- 使用微信小程序的云存储功能

## 注意事项

- 开发环境和生产环境使用不同的域名，需要分别配置
- 修改域名配置后，需要重新编译小程序才能生效
- 如果使用本地开发工具，可能不会检查域名白名单，但真机上会检查
