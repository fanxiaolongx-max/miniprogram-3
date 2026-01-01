function formatTime(time) {
  if (typeof time !== 'number' || time < 0) {
    return time
  }

  const hour = parseInt(time / 3600, 10)
  time %= 3600
  const minute = parseInt(time / 60, 10)
  time = parseInt(time % 60, 10)
  const second = time

  return ([hour, minute, second]).map(function (n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  }).join(':')
}

function formatLocation(longitude, latitude) {
  if (typeof longitude === 'string' && typeof latitude === 'string') {
    longitude = parseFloat(longitude)
    latitude = parseFloat(latitude)
  }

  longitude = longitude.toFixed(2)
  latitude = latitude.toFixed(2)

  return {
    longitude: longitude.toString().split('.'),
    latitude: latitude.toString().split('.')
  }
}

function fib(n) {
  if (n < 1) return 0
  if (n <= 2) return 1
  return fib(n - 1) + fib(n - 2)
}

function formatLeadingZeroNumber(n, digitNum = 2) {
  n = n.toString()
  const needNum = Math.max(digitNum - n.length, 0)
  return new Array(needNum).fill(0).join('') + n
}

function formatDateTime(date, withMs = false) {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()
  const ms = date.getMilliseconds()

  let ret = [year, month, day].map(value => formatLeadingZeroNumber(value, 2)).join('-') +
    ' ' + [hour, minute, second].map(value => formatLeadingZeroNumber(value, 2)).join(':')
  if (withMs) {
    ret += '.' + formatLeadingZeroNumber(ms, 3)
  }
  return ret
}

/**
 * 格式化时间戳为 "YYYY-MM-DD HH:mm:ss" 格式
 * @param {string|Date|number} timestamp - 时间戳（ISO字符串、Date对象或时间戳数字）
 * @returns {string} 格式化后的时间字符串 "YYYY-MM-DD HH:mm:ss"
 */
function formatTimestamp(timestamp) {
  if (!timestamp) {
    return ''
  }
  
  let date
  if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'string') {
    // 处理ISO格式字符串，如 "2025-12-25T19:12:29.950+02:00"
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    // 处理时间戳数字
    date = new Date(timestamp)
  } else {
    return String(timestamp)
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return String(timestamp)
  }
  
  return formatDateTime(date, false)
}

/**
 * 格式化时间戳为相对时间（人性化显示）
 * @param {string|Date|number} timestamp - 时间戳（ISO字符串、Date对象或时间戳数字）
 * @returns {string} 相对时间字符串，如 "刚刚"、"5分钟前"、"2小时前"、"3天前"、"2024-01-01"
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) {
    return ''
  }
  
  let date
  if (timestamp instanceof Date) {
    date = timestamp
  } else if (typeof timestamp === 'string') {
    // 处理ISO格式字符串，如 "2025-12-25T19:12:29.950+02:00"
    date = new Date(timestamp)
  } else if (typeof timestamp === 'number') {
    // 处理时间戳数字
    date = new Date(timestamp)
  } else {
    return String(timestamp)
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return String(timestamp)
  }
  
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  // 如果时间在未来（可能是服务器时间比客户端快，或者时区问题），返回具体日期
  // 但允许小的时间差（5分钟内），可能是时钟不同步导致的
  if (diff < -5 * 60 * 1000) {
    // 时间在未来超过5分钟，返回具体日期
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return [year, month, day].map(value => formatLeadingZeroNumber(value, 2)).join('-')
  }
  
  // 如果时间在未来但在5分钟内，当作"刚刚"处理（可能是时钟不同步）
  if (diff < 0) {
    return '刚刚'
  }
  
  // 计算时间差（毫秒）
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  // 1分钟内：刚刚
  if (seconds < 60) {
    return '刚刚'
  }
  
  // 1-59分钟：xx分钟前
  if (minutes < 60) {
    return `${minutes}分钟前`
  }
  
  // 1-23小时：xx小时前
  if (hours < 24) {
    return `${hours}小时前`
  }
  
  // 1-6天：x天前
  if (days < 7) {
    return `${days}天前`
  }
  
  // 超过7天：显示具体日期 YYYY-MM-DD
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year, month, day].map(value => formatLeadingZeroNumber(value, 2)).join('-')
}

function compareVersion(v1, v2) {
  v1 = v1.split('.')
  v2 = v2.split('.')
  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i], 10)
    const num2 = parseInt(v2[i], 10)

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }

  return 0
}

/**
 * 提取分类名称中的中文部分
 * 支持格式：中文/English、中文(English)、中文 - English、中文 English、纯中文
 * @param {string} name - 分类名称（可能包含中英文）
 * @returns {string} 中文部分，如果没有中文则返回原名称
 */
function extractChineseName(name) {
  if (!name || typeof name !== 'string') {
    return name || ''
  }
  
  // 先尝试匹配开头的连续中文字符（最常见的情况）
  const chineseMatch = name.match(/^[\u4e00-\u9fa5]+/)
  
  if (chineseMatch && chineseMatch[0]) {
    return chineseMatch[0]
  }
  
  // 如果没有匹配到开头的中文，尝试提取所有中文字符（处理中间有中文的情况）
  const allChineseMatch = name.match(/[\u4e00-\u9fa5]+/g)
  if (allChineseMatch && allChineseMatch.length > 0) {
    // 返回第一个中文片段
    return allChineseMatch[0]
  }
  
  // 如果完全没有中文，返回原名称（可能是纯英文分类）
  return name
}

module.exports = {
  formatTime,
  formatLocation,
  fib,
  formatDateTime,
  formatTimestamp,
  formatRelativeTime,
  compareVersion,
  extractChineseName
}
