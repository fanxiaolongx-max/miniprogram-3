Page({
  onShareAppMessage() {
    return {
      title: '汇率转换工具',
      path: 'page/exchange-rate/index'
    }
  },

  data: {
    theme: 'light',
    exchangeRate: 6.7, // 默认汇率，可以根据实际情况更新
    reverseRate: parseFloat((1 / 6.7).toFixed(4)), // 反向汇率（1/exchangeRate），保留4位小数
    rates: {}, // 多币种汇率对象，格式：{ CNY: { EGP: 6.7 }, USD: { EGP: 30.5 }, ... }
    cnyAmount: '1', // 默认值：1 CNY
    egpAmount: '',
    rateLoading: false, // 加载状态
    lastUpdated: '', // 最后更新时间
    isReversed: false, // 是否反转（EGP -> CNY）
    purchasingPower: '', // 购买力参考
    otherCurrencies: [], // 其他货币换算结果列表（必须始终是数组，不能是 null）
    safeOtherCurrencies: [], // 安全的货币列表副本，用于 WXML 渲染（防御性编程）
    failedCurrencies: [], // 获取失败的货币列表
    failedCurrenciesText: '', // 失败货币的文本提示
    isInitialLoad: true // 标记是否为首次加载
  },

  onLoad() {
    // 移除主题监听，强制使用浅色主题
    // 确保所有数组和对象初始化为非 null 值（防御性编程）
    this.setData({
      theme: 'light',
      otherCurrencies: [], // 确保是空数组，不是 null
      safeOtherCurrencies: [], // 安全的副本，用于 WXML 渲染
      failedCurrencies: [], // 确保是空数组，不是 null
      failedCurrenciesText: '',
      rates: {} // 确保是空对象，不是 null
    })
    
    // 先检查全局缓存中是否有汇率数据
    const app = getApp()
    const cache = app.globalData.exchangeRateCache
    
    if (cache && cache.rate && cache.timestamp) {
      // 缓存有效（5分钟内有效，可根据需要调整）
      const cacheAge = Date.now() - cache.timestamp
      const cacheValidTime = 5 * 60 * 1000 // 5分钟
      
      if (cacheAge < cacheValidTime) {
        console.log('[onLoad] 使用缓存的汇率数据，缓存时间:', cacheAge, 'ms')
        // 使用缓存数据
        this.setData({
          exchangeRate: cache.rate,
          reverseRate: cache.reverseRate,
          rates: cache.rates || {},
          lastUpdated: cache.lastUpdated || '',
          rateLoading: false,
          isInitialLoad: false
        }, () => {
          // 使用默认值 1 CNY 进行计算
          this.calculateAmount('1', 'cny')
        })
        return
      } else {
        console.log('[onLoad] 缓存已过期，重新获取汇率数据')
      }
    } else {
      console.log('[onLoad] 没有缓存数据，重新获取汇率数据')
    }
    
    // 如果没有缓存或缓存过期，则加载汇率数据（数据加载完成后会自动计算默认值）
    this.fetchExchangeRate()
  },

  onCNYInput(e) {
    const cnyAmount = e.detail.value
    this.calculateAmount(cnyAmount, 'cny')
  },

  onEGPInput(e) {
    const egpAmount = e.detail.value
    this.calculateAmount(egpAmount, 'egp')
  },

  calculateAmount(amount, source) {
    if (!amount || amount === '' || amount === '0' || amount === '0.') {
      this.setData({
        cnyAmount: '',
        egpAmount: '',
        purchasingPower: '',
        otherCurrencies: [],
        safeOtherCurrencies: [], // 必须同步清空安全副本
        failedCurrencies: [],
        failedCurrenciesText: ''
      })
      return
    }

    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount < 0) {
        this.setData({
          cnyAmount: '',
          egpAmount: '',
          purchasingPower: '',
          otherCurrencies: [],
          safeOtherCurrencies: [], // 必须同步清空安全副本
          failedCurrencies: [],
          failedCurrenciesText: ''
        })
      return
    }

    const rate = this.data.exchangeRate
    let cnyAmount, egpAmount

    if (this.data.isReversed) {
      // EGP -> CNY
      if (source === 'egp') {
        egpAmount = amount
        cnyAmount = (numAmount / rate).toFixed(2)
      } else {
        cnyAmount = amount
        egpAmount = (numAmount * rate).toFixed(2)
      }
    } else {
      // CNY -> EGP
      if (source === 'cny') {
        cnyAmount = amount
        egpAmount = (numAmount * rate).toFixed(2)
      } else {
        egpAmount = amount
        cnyAmount = (numAmount / rate).toFixed(2)
      }
    }

    // 计算购买力参考（始终基于 EGP 金额）
    const purchasingPower = this.getPurchasingPower(parseFloat(egpAmount))

      // 计算其他货币换算结果
      let otherCurrencies = []
      let failedCurrencies = []
      let failedCurrenciesText = ''
      
      console.log('[calculateAmount] 开始计算其他货币，rates:', this.data.rates, 'rates类型:', typeof this.data.rates, 'rates是否为数组:', Array.isArray(this.data.rates))
      
      try {
        const result = this.calculateOtherCurrencies(
          this.data.isReversed ? parseFloat(egpAmount) : parseFloat(cnyAmount),
          this.data.isReversed ? 'egp' : 'cny'
        )
        
        console.log('[calculateAmount] calculateOtherCurrencies 返回结果:', result, '结果类型:', typeof result)
        
        // 确保 result 是有效对象
        if (result && typeof result === 'object' && result !== null) {
          console.log('[calculateAmount] result 是有效对象，currencies:', result.currencies, 'failed:', result.failed)
          
          // 确保 currencies 是数组
          if (Array.isArray(result.currencies)) {
            otherCurrencies = result.currencies
            console.log('[calculateAmount] currencies 是数组，长度:', otherCurrencies.length)
          } else {
            console.warn('[calculateAmount] currencies 不是数组:', result.currencies, '类型:', typeof result.currencies)
            otherCurrencies = []
          }
          
          // 确保 failed 是数组
          if (Array.isArray(result.failed)) {
            failedCurrencies = result.failed
            if (failedCurrencies.length > 0) {
              failedCurrenciesText = failedCurrencies.join('、')
            }
            console.log('[calculateAmount] failed 是数组，长度:', failedCurrencies.length, '文本:', failedCurrenciesText)
          } else {
            console.warn('[calculateAmount] failed 不是数组:', result.failed, '类型:', typeof result.failed)
            failedCurrencies = []
          }
        } else {
          console.warn('[calculateAmount] result 不是有效对象:', result, '类型:', typeof result)
          // 如果返回的不是对象，可能是旧格式的数组
          if (Array.isArray(result)) {
            otherCurrencies = result
          } else {
            otherCurrencies = []
          }
          failedCurrencies = []
        }
      } catch (err) {
        console.error('[calculateAmount] 计算其他货币出错', err)
        console.error('[calculateAmount] 错误堆栈:', err.stack)
        otherCurrencies = []
        failedCurrencies = []
        failedCurrenciesText = ''
      }

      // 最终确保所有值都是数组（防御性编程）
      if (!Array.isArray(otherCurrencies)) {
        console.error('[calculateAmount] otherCurrencies 不是数组，强制转换为空数组，当前值:', otherCurrencies, '类型:', typeof otherCurrencies)
        otherCurrencies = []
      }
      if (!Array.isArray(failedCurrencies)) {
        console.error('[calculateAmount] failedCurrencies 不是数组，强制转换为空数组，当前值:', failedCurrencies, '类型:', typeof failedCurrencies)
        failedCurrencies = []
        failedCurrenciesText = ''
      }

      // 过滤掉任何 null 或无效的项，确保 result.currencies 永远是纯数组（没有 null）
      otherCurrencies = otherCurrencies.filter(item => {
        return item !== null && item !== undefined && typeof item === 'object' && item.code && item.name && item.flag && item.symbol && item.amount
      })

      // 最终确保 otherCurrencies 绝对不是 null 或 undefined
      if (otherCurrencies == null || !Array.isArray(otherCurrencies)) {
        console.warn('[calculateAmount] otherCurrencies 最终检查失败，强制设为空数组')
        otherCurrencies = []
      }

      // 创建一个安全的副本，确保 WXML 渲染时不会遇到 null
      // 多重保护：确保 safeOtherCurrencies 绝对是一个数组
      let safeOtherCurrencies = []
      try {
        if (Array.isArray(otherCurrencies) && otherCurrencies.length > 0) {
          // 深拷贝数组，并过滤掉任何 null 或无效项
          safeOtherCurrencies = otherCurrencies
            .filter(item => item !== null && item !== undefined && typeof item === 'object' && item.code && item.name && item.flag && item.symbol && item.amount)
            .map(item => ({
              code: String(item.code || ''),
              name: String(item.name || ''),
              flag: String(item.flag || ''),
              symbol: String(item.symbol || ''),
              amount: String(item.amount || '0.00')
            }))
        }
      } catch (err) {
        console.error('[calculateAmount] 创建 safeOtherCurrencies 时出错', err)
        safeOtherCurrencies = []
      }
      
      // 最终确保 safeOtherCurrencies 绝对不是 null 或 undefined，且必须是数组
      if (safeOtherCurrencies == null || !Array.isArray(safeOtherCurrencies)) {
        console.warn('[calculateAmount] safeOtherCurrencies 最终检查失败，强制设为空数组，当前值:', safeOtherCurrencies, '类型:', typeof safeOtherCurrencies)
        safeOtherCurrencies = []
      }

      // 最终确保 safeOtherCurrencies 绝对不是 null 或 undefined，且必须是数组
      // 在 setData 之前再次检查
      if (safeOtherCurrencies == null || !Array.isArray(safeOtherCurrencies)) {
        console.warn('[calculateAmount] setData 前 safeOtherCurrencies 最终检查失败，强制设为空数组，当前值:', safeOtherCurrencies, '类型:', typeof safeOtherCurrencies)
        safeOtherCurrencies = []
      }

      console.log('[calculateAmount] 准备 setData，otherCurrencies:', otherCurrencies, 'safeOtherCurrencies:', safeOtherCurrencies, 'safeOtherCurrencies类型:', typeof safeOtherCurrencies, 'safeOtherCurrencies是否为数组:', Array.isArray(safeOtherCurrencies), 'safeOtherCurrencies长度:', safeOtherCurrencies ? safeOtherCurrencies.length : 0)

      // 确保所有值都是有效的数组或字符串
      let finalOtherCurrencies = Array.isArray(otherCurrencies) ? otherCurrencies : []
      let finalSafeOtherCurrencies = Array.isArray(safeOtherCurrencies) ? safeOtherCurrencies : []
      let finalFailedCurrencies = Array.isArray(failedCurrencies) ? failedCurrencies : []
      let finalFailedCurrenciesText = typeof failedCurrenciesText === 'string' ? failedCurrenciesText : ''

      // 最终验证：确保 finalSafeOtherCurrencies 绝对不是 null
      if (finalSafeOtherCurrencies == null || !Array.isArray(finalSafeOtherCurrencies)) {
        console.error('[calculateAmount] finalSafeOtherCurrencies 仍然无效，强制设为空数组')
        finalSafeOtherCurrencies = []
      }

      this.setData({
        cnyAmount: cnyAmount || '',
        egpAmount: egpAmount || '',
        purchasingPower: purchasingPower || '',
        otherCurrencies: finalOtherCurrencies, // 确保是数组
        safeOtherCurrencies: finalSafeOtherCurrencies, // 确保是数组，绝对不会是 null
        failedCurrencies: finalFailedCurrencies,
        failedCurrenciesText: finalFailedCurrenciesText
      }, () => {
        console.log('[calculateAmount] setData 完成，当前 otherCurrencies:', this.data.otherCurrencies, 'safeOtherCurrencies:', this.data.safeOtherCurrencies, 'safeOtherCurrencies类型:', typeof this.data.safeOtherCurrencies, 'safeOtherCurrencies是否为数组:', Array.isArray(this.data.safeOtherCurrencies), 'safeOtherCurrencies长度:', this.data.safeOtherCurrencies ? this.data.safeOtherCurrencies.length : 'N/A')
        // 再次验证 setData 后的值，并同步 safeOtherCurrencies
        if (this.data.otherCurrencies == null || !Array.isArray(this.data.otherCurrencies)) {
          console.error('[calculateAmount] setData 后 otherCurrencies 仍然无效，强制修复')
          this.setData({ 
            otherCurrencies: [],
            safeOtherCurrencies: []
          })
        } else if (!Array.isArray(this.data.safeOtherCurrencies) || this.data.safeOtherCurrencies == null) {
          // 如果 safeOtherCurrencies 无效，同步修复
          console.warn('[calculateAmount] setData 后 safeOtherCurrencies 无效，强制修复')
          const fixedSafe = Array.isArray(this.data.otherCurrencies) ? this.data.otherCurrencies.slice() : []
          this.setData({ 
            safeOtherCurrencies: fixedSafe
          })
        }
      })
  },

  // 切换方向
  toggleDirection() {
    const isReversed = !this.data.isReversed
    const currentAmount = isReversed ? this.data.egpAmount : this.data.cnyAmount
    
    // 直接更新状态，使用条件渲染切换位置
    this.setData({
      isReversed: isReversed
    }, () => {
      // 切换后重新计算（如果有输入值）
      if (currentAmount && currentAmount !== '' && currentAmount !== '0.00' && currentAmount !== '0') {
        this.calculateAmount(currentAmount, isReversed ? 'egp' : 'cny')
      } else {
        // 如果没有输入值，清空另一个字段和其他货币列表
        this.setData({
          cnyAmount: '',
          egpAmount: '',
          purchasingPower: '',
          otherCurrencies: [], // 确保是空数组，不是 null
          safeOtherCurrencies: [], // 同步清空安全副本
          failedCurrencies: [],
          failedCurrenciesText: ''
        })
      }
    })
  },

  // 计算其他货币换算结果
  calculateOtherCurrencies(amount, sourceCurrency) {
    console.log('[calculateOtherCurrencies] 开始计算，amount:', amount, 'sourceCurrency:', sourceCurrency)
    
    try {
      if (!amount || amount <= 0 || isNaN(amount)) {
        console.log('[calculateOtherCurrencies] amount 无效，返回空结果')
        return { currencies: [], failed: [] }
      }

      const rates = this.data.rates || {}
      console.log('[calculateOtherCurrencies] rates 值:', rates, 'rates类型:', typeof rates, 'rates是否为null:', rates === null, 'rates是否为数组:', Array.isArray(rates))
      
      if (!rates || typeof rates !== 'object' || Array.isArray(rates)) {
        console.warn('[calculateOtherCurrencies] rates 无效，所有货币都失败')
        // 如果 rates 为空，所有货币都失败
        const allCurrencies = ['USD', 'EUR', 'SAR', 'GBP', 'JPY', 'AED']
        return { currencies: [], failed: allCurrencies }
      }

      // 定义其他货币列表
      const currencyList = [
        { code: 'USD', name: '美元', flag: '🇺🇸', symbol: '$' },
        { code: 'EUR', name: '欧元', flag: '🇪🇺', symbol: '€' },
        { code: 'SAR', name: '沙特里亚尔', flag: '🇸🇦', symbol: '﷼' },
        { code: 'GBP', name: '英镑', flag: '🇬🇧', symbol: '£' },
        { code: 'JPY', name: '日元', flag: '🇯🇵', symbol: '¥' },
        { code: 'AED', name: '阿联酋迪拉姆', flag: '🇦🇪', symbol: 'د.إ' }
      ]

      const result = []
      const failed = []
      const baseCNY = sourceCurrency === 'cny' ? amount : (amount / this.data.exchangeRate)

      console.log('[calculateOtherCurrencies] 开始遍历货币列表，rates.CNY:', rates.CNY, 'rates.CNY类型:', typeof rates.CNY)

      for (let i = 0; i < currencyList.length; i++) {
        const currency = currencyList[i]
        try {
          console.log(`[calculateOtherCurrencies] 处理货币 ${currency.code}，rates[${currency.code}]:`, rates[currency.code])
          
          // 尝试从 rates 中获取汇率
          let rate = null
          let found = false
          
          // 优先查找 CNY -> 目标货币的直接汇率
          if (rates.CNY && typeof rates.CNY === 'object' && !Array.isArray(rates.CNY) && rates.CNY !== null) {
            console.log(`[calculateOtherCurrencies] rates.CNY 有效，检查 rates.CNY[${currency.code}]:`, rates.CNY[currency.code])
            if (rates.CNY[currency.code] !== undefined && rates.CNY[currency.code] !== null) {
              rate = parseFloat(rates.CNY[currency.code])
              if (!isNaN(rate) && rate > 0) {
                found = true
                console.log(`[calculateOtherCurrencies] 找到 ${currency.code} 直接汇率:`, rate)
              }
            }
          }
          // 如果找不到，尝试通过 EGP 中转计算
          if (!found && rates.CNY && typeof rates.CNY === 'object' && !Array.isArray(rates.CNY) && rates.CNY !== null &&
              rates.CNY.EGP !== undefined && rates.CNY.EGP !== null &&
              rates[currency.code] && typeof rates[currency.code] === 'object' && 
              !Array.isArray(rates[currency.code]) && rates[currency.code] !== null &&
              rates[currency.code].EGP !== undefined && rates[currency.code].EGP !== null) {
            // CNY -> EGP -> 目标货币
            const cnyToEgp = parseFloat(rates.CNY.EGP)
            const egpToTarget = parseFloat(rates[currency.code].EGP)
            if (!isNaN(cnyToEgp) && !isNaN(egpToTarget) && cnyToEgp > 0 && egpToTarget > 0) {
              rate = cnyToEgp / egpToTarget
              found = true
            }
          }
          // 如果还是找不到，尝试目标货币 -> EGP，然后通过 CNY/EGP 计算
          if (!found && rates[currency.code] && typeof rates[currency.code] === 'object' && 
              !Array.isArray(rates[currency.code]) && rates[currency.code] !== null &&
              rates[currency.code].EGP !== undefined && rates[currency.code].EGP !== null && 
              this.data.exchangeRate) {
            const targetToEgp = parseFloat(rates[currency.code].EGP)
            const cnyToEgp = this.data.exchangeRate
            if (!isNaN(targetToEgp) && !isNaN(cnyToEgp) && targetToEgp > 0 && cnyToEgp > 0) {
              rate = cnyToEgp / targetToEgp
              found = true
            }
          }

          if (found && rate && !isNaN(rate) && rate > 0) {
            const convertedAmount = (baseCNY * rate).toFixed(2)
            if (convertedAmount && convertedAmount !== 'NaN') {
              // 确保所有字段都有值，避免 null 或 undefined
              const item = {
                code: currency.code || '',
                name: currency.name || '',
                flag: currency.flag || '',
                symbol: currency.symbol || '',
                amount: convertedAmount || '0.00'
              }
              // 验证所有字段都不为 null
              if (item.code && item.name && item.flag && item.symbol && item.amount) {
                console.log(`[calculateOtherCurrencies] 添加 ${currency.code} 到结果:`, item)
                result.push(item)
              } else {
                console.warn(`[calculateOtherCurrencies] ${currency.code} 数据不完整，跳过:`, item)
                failed.push(currency.code)
              }
            } else {
              console.warn(`[calculateOtherCurrencies] ${currency.code} 计算结果无效:`, convertedAmount)
              failed.push(currency.code)
            }
          } else {
            console.log(`[calculateOtherCurrencies] ${currency.code} 未找到汇率，添加到失败列表`)
            failed.push(currency.code)
          }
        } catch (err) {
          console.error(`[calculateOtherCurrencies] 计算 ${currency.code} 汇率出错`, err)
          console.error(`[calculateOtherCurrencies] 错误堆栈:`, err.stack)
          failed.push(currency.code)
        }
      }

      console.log('[calculateOtherCurrencies] 计算完成，result:', result, 'failed:', failed, 'result是否为数组:', Array.isArray(result), 'failed是否为数组:', Array.isArray(failed))
      
      return { currencies: result, failed: failed }
    } catch (error) {
      console.error('[calculateOtherCurrencies] 计算其他货币出错', error)
      console.error('[calculateOtherCurrencies] 错误堆栈:', error.stack)
      return { currencies: [], failed: ['USD', 'EUR', 'SAR', 'GBP', 'JPY', 'AED'] }
    }
  },

  // 获取购买力参考
  getPurchasingPower(egpAmount) {
    if (!egpAmount || egpAmount <= 0 || isNaN(egpAmount)) {
      return ''
    }

    try {
      const references = [
        { amount: 10, text: '1 瓶大矿泉水 💧', icon: '💧' },
        { amount: 20, text: '1 次打车起步价 🚕', icon: '🚕' },
        { amount: 50, text: '1 份当地快餐 🍔', icon: '🍔' },
        { amount: 100, text: '1 次短途打车 🚗', icon: '🚗' },
        { amount: 200, text: '1 个肯德基套餐 🍗', icon: '🍗' },
        { amount: 500, text: '1 次中档餐厅用餐 🍽️', icon: '🍽️' },
        { amount: 1000, text: '1 晚经济型酒店 🏨', icon: '🏨' },
        { amount: 2000, text: '1 次景点门票 🎫', icon: '🎫' },
        { amount: 5000, text: '1 个月基础生活费 💰', icon: '💰' }
      ]

      // 找到最接近的参考值（小于等于输入金额的最大值）
      let closest = references[0]
      for (let i = references.length - 1; i >= 0; i--) {
        if (egpAmount >= references[i].amount) {
          closest = references[i]
          break
        }
      }

      // 计算倍数
      const times = Math.round(egpAmount / closest.amount)
      if (times === 1) {
        return `≈ ${closest.text}`
      } else if (times > 1 && times <= 20) {
        return `≈ ${times} ${closest.text.replace('1 ', '')}`
      } else {
        // 如果金额很大，尝试找更高级别的参考
        const higherIndex = references.findIndex(ref => ref.amount > closest.amount)
        if (higherIndex > -1) {
          const higherRef = references[higherIndex]
          const higherTimes = Math.round(egpAmount / higherRef.amount)
          if (higherTimes >= 1 && higherTimes <= 20) {
            return `≈ ${higherTimes} ${higherRef.text.replace('1 ', '')}`
          }
        }
        // 如果还是太大，显示最接近的参考
        return `≈ ${times} ${closest.text.replace('1 ', '')}`
      }
    } catch (error) {
      console.error('计算购买力参考出错', error)
      return ''
    }
  },

  updateRate() {
    // 调用API获取最新汇率（强制刷新，不使用缓存）
    this.fetchExchangeRate(true)
  },

  // 从 API 获取汇率
  fetchExchangeRate(forceRefresh = false) {
    const blogApi = require('../../utils/blogApi.js')
    const app = getApp()
    
    // 如果不是强制刷新，先检查缓存
    if (!forceRefresh) {
      const cache = app.globalData.exchangeRateCache
      if (cache && cache.rate && cache.timestamp) {
        const cacheAge = Date.now() - cache.timestamp
        const cacheValidTime = 5 * 60 * 1000 // 5分钟
        
        if (cacheAge < cacheValidTime) {
          console.log('[fetchExchangeRate] 使用缓存的汇率数据，缓存时间:', cacheAge, 'ms')
          // 使用缓存数据
          this.setData({
            exchangeRate: cache.rate,
            reverseRate: cache.reverseRate,
            rates: cache.rates || {},
            lastUpdated: cache.lastUpdated || '',
            rateLoading: false,
            isInitialLoad: false,
            safeOtherCurrencies: [], // 确保 safeOtherCurrencies 被初始化
            otherCurrencies: [], // 确保 otherCurrencies 被初始化
            failedCurrencies: [],
            failedCurrenciesText: ''
          }, () => {
            // 如果是首次加载，使用默认值 1 CNY 进行计算（会自动设置 safeOtherCurrencies）
            if (this.data.isInitialLoad) {
              this.calculateAmount('1', 'cny')
            } else {
              // 如果有当前输入金额，重新计算
              const currentAmount = this.data.isReversed ? this.data.egpAmount : this.data.cnyAmount
              if (currentAmount && currentAmount !== '' && currentAmount !== '0.00' && currentAmount !== '0') {
                this.calculateAmount(currentAmount, this.data.isReversed ? 'egp' : 'cny')
              }
            }
          })
          return
        }
      }
    }
    
    this.setData({
      rateLoading: true
    })

    blogApi.blogPostApi.getList({
      category: '汇率转换',
      page: 1,
      pageSize: 1  // 汇率通常只需要一条数据
    }).then((result) => {
      console.log('[fetchExchangeRate] 获取汇率响应', result)
      
      // 检查响应格式
      if (!result || result.success === false) {
        console.error('[fetchExchangeRate] API返回错误:', result)
        this.showRateError()
        return
      }

      // 从API格式中提取数据：{success, data: [{CNY: {EGP: ...}, USD: {EGP: ...}, ...}]}
      let rateData = null
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        const firstItem = result.data[0]
        // 优先检查 _originalData 字段（旧格式兼容）
        if (firstItem._originalData && Array.isArray(firstItem._originalData) && firstItem._originalData.length > 0) {
          rateData = firstItem._originalData[0]  // 取 _originalData 数组的第一个元素
          console.log('[fetchExchangeRate] 从 _originalData 提取汇率数据:', rateData)
        } else if (firstItem._originalData && typeof firstItem._originalData === 'object') {
          // 如果 _originalData 是对象而不是数组
          rateData = firstItem._originalData
          console.log('[fetchExchangeRate] 从 _originalData 对象提取汇率数据:', rateData)
        } else if (firstItem.CNY && typeof firstItem.CNY === 'object') {
          // 新格式：数据直接在 firstItem 中，包含 CNY、USD 等字段
          rateData = firstItem
          console.log('[fetchExchangeRate] 从 data[0] 直接提取汇率数据:', rateData)
        }
      }

      // 如果没有数据，使用默认值，不报错（允许空数据）
      if (!rateData) {
        console.warn('[fetchExchangeRate] API返回数据为空，使用默认汇率')
        // 使用默认值，不报错
        const defaultRate = 6.7
        const defaultReverseRate = parseFloat((1 / defaultRate).toFixed(4))
        this.setData({
          exchangeRate: defaultRate,
          reverseRate: defaultReverseRate,
          rates: {},
          lastUpdated: '',
          rateLoading: false,
          isInitialLoad: false
        }, () => {
          if (this.data.isInitialLoad) {
            this.calculateAmount('1', 'cny')
          }
        })
        return
      }

      // 解析汇率数据（从 _originalData 中提取）
      let rate = 6.7
      let lastUpdated = ''
      let rates = {} // 多币种汇率对象

      if (rateData && typeof rateData === 'object') {
        // 提取 CNY->EGP 汇率
        if (rateData.CNY && rateData.CNY.EGP) {
          rate = parseFloat(rateData.CNY.EGP)
          console.log('[fetchExchangeRate] 提取到 CNY->EGP 汇率:', rate)
          
          // 提取所有货币汇率（过滤掉非汇率字段）
          rates = {}
          const keys = Object.keys(rateData)
          for (let i = 0; i < keys.length; i++) {
            const key = keys[i]
            // 跳过非汇率字段
            if (key !== 'id' && key !== 'updatedAt' && key !== 'lastUpdated' && key !== 'updateTime') {
              if (rateData[key] && typeof rateData[key] === 'object' && !Array.isArray(rateData[key])) {
                rates[key] = rateData[key]
              }
            }
          }
          console.log('[fetchExchangeRate] 提取到多币种汇率:', rates)
          
          // 提取更新时间
          if (rateData.updatedAt) {
            lastUpdated = rateData.updatedAt
          } else if (rateData.lastUpdated) {
            lastUpdated = rateData.lastUpdated
          } else if (rateData.updateTime) {
            lastUpdated = rateData.updateTime
          }
        }
      }

      // 检查汇率是否有效，如果无效则使用默认值
      if (isNaN(rate) || rate <= 0) {
        console.warn('[fetchExchangeRate] 无法从API解析有效汇率，使用默认值 6.7')
        rate = 6.7 // 使用默认值，不报错
        rates = {} // 重置多币种汇率
      }

      // 如果没有提供更新时间，使用当前时间
      if (!lastUpdated) {
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hours = String(now.getHours()).padStart(2, '0')
        const minutes = String(now.getMinutes()).padStart(2, '0')
        lastUpdated = `${month}-${day} ${hours}:${minutes}`
      }

      // 计算反向汇率
      const reverseRate = parseFloat((1 / rate).toFixed(4))

      console.log('[fetchExchangeRate] 准备保存数据，rate:', rate, 'reverseRate:', reverseRate, 'rates:', rates, 'rates类型:', typeof rates, 'rates是否为null:', rates === null)

      // 保存到全局缓存
      app.globalData.exchangeRateCache = {
        rate: rate,
        reverseRate: reverseRate,
        rates: rates,
        lastUpdated: lastUpdated,
        timestamp: Date.now() // 记录缓存时间
      }
      console.log('[fetchExchangeRate] 汇率数据已缓存到 globalData', app.globalData.exchangeRateCache)

      // 保存当前输入金额，用于重新计算
      const currentAmount = this.data.isReversed ? this.data.egpAmount : this.data.cnyAmount
      const isInitialLoad = this.data.isInitialLoad

      console.log('[fetchExchangeRate] 当前输入金额:', currentAmount, 'isInitialLoad:', isInitialLoad)

      this.setData({
        exchangeRate: rate,
        reverseRate: reverseRate,
        rates: rates, // 保存多币种汇率数据
        lastUpdated: lastUpdated,
        rateLoading: false,
        isInitialLoad: false // 标记首次加载完成
      }, () => {
        console.log('[fetchExchangeRate] setData 完成，当前 rates:', this.data.rates, 'rates类型:', typeof this.data.rates, 'rates是否为null:', this.data.rates === null)
        
        // 如果是首次加载，使用默认值 1 CNY 进行计算
        if (isInitialLoad) {
          console.log('[fetchExchangeRate] 首次加载，使用默认值 1 CNY 进行计算')
          this.calculateAmount('1', 'cny')
        }
        // 如果当前有输入金额，重新计算（包括其他货币）
        else if (currentAmount && currentAmount !== '' && currentAmount !== '0.00' && currentAmount !== '0') {
          console.log('[fetchExchangeRate] 重新计算当前金额:', currentAmount)
          this.calculateAmount(currentAmount, this.data.isReversed ? 'egp' : 'cny')
        }
      })

      // 只在手动刷新时显示提示，首次加载不显示
      if (forceRefresh) {
        wx.showToast({
          title: '汇率已更新',
          icon: 'success',
          duration: 1500
        })
      }
    }).catch((error) => {
      console.error('[fetchExchangeRate] 获取汇率失败', error)
      this.showRateError()
    })
  },

  // 显示汇率错误
  showRateError() {
    this.setData({
      rateLoading: false
    })
    
    wx.showToast({
      title: '获取数据失败，请稍后重试',
      icon: 'none',
      duration: 3000
    })
  }
})

