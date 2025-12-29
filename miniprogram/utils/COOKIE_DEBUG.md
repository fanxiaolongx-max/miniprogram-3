# Cookie/Session 问题排查指南

## 问题现象

登录成功后，调用 `/api/auth/user/me` 返回 401，错误信息：`Session中没有userId`

## 原因分析

401错误说明服务器端的Session中没有`userId`，可能的原因：

1. **登录时Cookie未正确设置**
   - 服务器端登录API返回时，Set-Cookie头可能未正确设置
   - Cookie的SameSite、Secure等属性可能配置不当

2. **Cookie未正确发送**
   - 小程序请求时Cookie可能未自动携带
   - 域名不匹配导致Cookie被阻止

3. **Session配置问题**
   - 服务器端Session配置可能有问题
   - Session存储可能未正确保存

## 排查步骤

### 1. 检查登录API响应头

在登录成功后，查看控制台日志：
```
[authApi.loginWithPin] Set-Cookie: ...
```

如果没有Set-Cookie，说明服务器端未设置Cookie。

### 2. 检查服务器端Cookie配置

服务器端需要正确设置Cookie，示例（Node.js/Express）：

```javascript
// 登录成功后设置Session
req.session.userId = user.id;
req.session.phone = user.phone;

// 确保Cookie正确设置
res.cookie('connect.sid', req.sessionID, {
  httpOnly: true,
  secure: true,  // HTTPS必须
  sameSite: 'none',  // 跨域必须
  maxAge: 24 * 60 * 60 * 1000  // 24小时
});

res.json({
  success: true,
  user: user
});
```

### 3. 检查小程序请求

小程序会自动处理Cookie，但需要确保：
- 请求的域名与Cookie的domain匹配
- 使用HTTPS（如果Cookie设置了Secure）

### 4. 验证Session

登录成功后，立即调用 `/api/auth/user/me` 验证Session是否生效。

## 解决方案

### 方案1：修复服务器端Cookie设置（推荐）

确保服务器端登录API正确设置Cookie：

```javascript
// Express + express-session 示例
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,  // HTTPS必须
    httpOnly: true,
    sameSite: 'none',  // 跨域必须
    maxAge: 24 * 60 * 60 * 1000  // 24小时
  }
}));

// 登录API
router.post('/user/login', async (req, res) => {
  // ... 验证逻辑
  
  // 设置Session
  req.session.userId = user.id;
  req.session.phone = user.phone;
  
  // 确保Session保存
  req.session.save((err) => {
    if (err) {
      console.error('Session保存失败:', err);
      return res.status(500).json({ success: false, message: '登录失败' });
    }
    
    res.json({
      success: true,
      user: user
    });
  });
});
```

### 方案2：使用Token认证（备选）

如果Cookie/Session有问题，可以考虑使用Token认证：

1. 登录成功后返回Token
2. 小程序保存Token到本地存储
3. 每次请求在Header中携带Token

```javascript
// 登录API返回Token
res.json({
  success: true,
  user: user,
  token: generateToken(user.id)
});

// 小程序请求时携带Token
wx.request({
  url: url,
  header: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 方案3：临时解决方案（当前实现）

当前代码已经实现了临时解决方案：
- 服务器验证失败时，保持本地登录状态
- 用户可以继续使用，直到真正需要服务器验证的操作失败
- 这样可以避免频繁的登录提示

## 调试建议

1. **查看控制台日志**
   - 登录时查看是否有Set-Cookie响应头
   - 验证Session时查看401错误的详细信息

2. **使用网络抓包工具**
   - 查看登录请求的响应头
   - 查看后续请求是否携带Cookie

3. **检查服务器日志**
   - 查看Session是否被正确保存
   - 查看后续请求的Session中是否有userId

## 常见问题

### Q: 为什么登录成功但Session中没有userId？

A: 可能原因：
1. 服务器端Session保存失败
2. Cookie未正确设置或发送
3. Session配置有问题（如domain、path不匹配）

### Q: 小程序中Cookie会自动处理吗？

A: 是的，小程序会自动处理同域名的Cookie，但需要：
- 服务器端正确设置Cookie
- Cookie的SameSite属性设置为'none'（跨域）
- 使用HTTPS（如果Cookie设置了Secure）

### Q: 如何验证Cookie是否正确设置？

A: 登录成功后，立即调用 `/api/auth/user/me`，如果返回200说明Cookie正确，如果返回401说明Cookie有问题。




