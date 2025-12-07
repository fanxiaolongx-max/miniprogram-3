/**
 * 防抖函数工具
 * @param {Function} func 要防抖的函数
 * @param {Number} wait 等待时间（毫秒）
 * @param {Boolean} immediate 是否立即执行
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait = 300, immediate = false) {
  let timeout
  
  return function executedFunction(...args) {
    const context = this
    
    const later = function() {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    
    const callNow = immediate && !timeout
    
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    
    if (callNow) func.apply(context, args)
  }
}

module.exports = {
  debounce
}

