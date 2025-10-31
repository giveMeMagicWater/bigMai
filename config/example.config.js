// 大麦网抢票工具示例配置文件
// 复制此文件为 config.js 并修改相应参数

export default {
  // 大麦网配置
  damai: {
    baseUrl: 'https://www.damai.cn',
    mobileUrl: 'https://m.damai.cn',
    loginUrl: 'https://login.damai.cn',
    apiUrl: 'https://api.damai.cn'
  },

  // 抢票配置 - 请根据实际情况修改
  ticket: {
    // 演出信息 - 从大麦网演出页面URL获取
    showId: '123456789',           // 演出ID，例如：https://www.damai.cn/item/123456789.html
    showName: '周杰伦2024演唱会',    // 演出名称
    venueId: 'venue123',           // 场馆ID
    venueName: '北京工人体育馆',     // 场馆名称
    showTime: '2024-12-25 19:30',  // 演出时间
    ticketTime: '2024-11-01 10:00:00', // 开票时间 (YYYY-MM-DD HH:mm:ss)
    
    // 票档配置 - 按优先级排序，用逗号分隔
    ticketTypes: ['VIP', 'A区', 'B区', 'C区'],  // 票档类型
    maxPrice: 2000,                // 最高票价限制
    
    // 观演人配置 - 提前在大麦网设置的观演人
    viewers: [
      { name: '张三', id: 'viewer1' },
      { name: '李四', id: 'viewer2' }
    ],
    maxViewers: 4,                 // 最大观演人数量
    
    // 收货地址
    address: {
      name: '张三',
      phone: '13800138000',
      province: '北京市',
      city: '北京市',
      district: '朝阳区',
      detail: '某某街道某某小区'
    }
  },

  // 抢票策略配置
  strategy: {
    // 时间策略
    advanceTime: 1000,             // 提前进入时间(毫秒)
    refreshInterval: 100,           // 刷新间隔(毫秒)
    maxRetries: 10,                // 最大重试次数
    
    // 并发策略
    concurrent: 3,                 // 并发数量
    requestDelay: 50,              // 请求间隔(毫秒)
    
    // 反检测策略
    randomDelay: {
      min: 100,                    // 最小随机延迟
      max: 500                     // 最大随机延迟
    },
    
    // 鼠标移动模拟
    mouseMovement: {
      enabled: true,               // 启用鼠标移动模拟
      points: 5,                   // 移动点数
      duration: 1000               // 移动持续时间
    }
  },

  // 浏览器配置
  browser: {
    headless: false,               // 是否无头模式（建议设为false，方便观察）
    slowMo: 100,                   // 操作延迟
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  },

  // 日志配置
  logging: {
    level: 'info',                 // 日志级别
    file: 'logs/ticket-bot.log',
    maxSize: '10m',
    maxFiles: 5
  },

  // 通知配置
  notification: {
    email: {
      enabled: false,              // 是否启用邮件通知
      smtp: 'smtp.qq.com',         // SMTP服务器
      user: 'your-email@qq.com',   // 邮箱账号
      pass: 'your-password',       // 邮箱密码
      to: 'target-email@qq.com'    // 目标邮箱
    },
    webhook: {
      enabled: false,              // 是否启用webhook通知
      url: 'https://your-webhook-url.com' // webhook地址
    }
  }
}; 