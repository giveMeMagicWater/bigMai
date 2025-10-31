export default {
  // 大麦网配置
  damai: {
    baseUrl: 'https://m.damai.cn',        // 使用移动端URL
    mobileUrl: 'https://m.damai.cn',
    loginUrl: 'https://login.damai.cn',
    apiUrl: 'https://api.damai.cn'
  },

  // 抢票配置
  ticket: {
    // 目标演出信息
    showId: '',           // 演出ID
    showName: '',         // 演出名称
    venueId: '',          // 场馆ID
    venueName: '',        // 场馆名称
    showTime: '',         // 演出时间
    ticketTime: '',       // 开票时间 (YYYY-MM-DD HH:mm:ss)
    
    // 票档配置
    ticketTypes: [],      // 票档类型，按优先级排序
    maxPrice: 0,          // 最高票价限制
    
    // 观演人配置
    viewers: [],          // 观演人列表
    maxViewers: 4,        // 最大观演人数量
    
    // 收货地址
    address: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: ''
    }
  },

  // 抢票策略配置
  strategy: {
    // 时间策略
    advanceTime: 1000,    // 提前进入时间(毫秒)
    refreshInterval: 100,  // 刷新间隔(毫秒)
    maxRetries: 10,       // 最大重试次数
    
    // 并发策略
    concurrent: 3,        // 并发数量
    requestDelay: 50,     // 请求间隔(毫秒)
    
    // 反检测策略
    randomDelay: {
      min: 100,           // 最小随机延迟
      max: 500            // 最大随机延迟
    },
    
    // 触摸事件模拟
    touchSimulation: {
      enabled: true,      // 启用触摸事件模拟
      points: 3,          // 触摸点数
      duration: 500       // 触摸持续时间
    }
  },

  // 移动端浏览器配置
  browser: {
    headless: false,      // 是否无头模式
    slowMo: 100,          // 操作延迟
    
    // 移动端视口配置
    defaultViewport: {
      width: 375,          // iPhone标准宽度
      height: 667,         // iPhone标准高度
      deviceScaleFactor: 2, // 设备像素比
      isMobile: true,      // 标记为移动设备
      hasTouch: true,      // 支持触摸
      isLandscape: false   // 竖屏模式
    },
    
    // 移动端启动参数
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--touch-events=enabled',
      '--enable-touch-drag-drop',
      '--enable-features=TouchEventFeatureDetection',
      '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    ]
  },

  // 日志配置
  logging: {
    level: 'info',        // 日志级别
    file: 'logs/mobile-ticket-bot.log',
    maxSize: '10m',
    maxFiles: 5
  },

  // 通知配置
  notification: {
    email: {
      enabled: false,     // 是否启用邮件通知
      smtp: 'smtp.qq.com',
      user: '',
      pass: '',
      to: ''
    },
    webhook: {
      enabled: false,     // 是否启用webhook通知
      url: ''
    }
  }
}; 