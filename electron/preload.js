const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的API到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 获取应用信息
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getAppPath: () => ipcRenderer.invoke('get-app-path'),
  
  // 文件操作
  readConfigFile: (filePath) => ipcRenderer.invoke('read-config-file', filePath),
  writeConfigFile: (filePath, content) => ipcRenderer.invoke('write-config-file', filePath, content),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showErrorDialog: (options) => ipcRenderer.invoke('show-error-dialog', options),
  
  // 监听主进程事件
  onNewConfig: (callback) => ipcRenderer.on('new-config', callback),
  onLoadConfig: (callback) => ipcRenderer.on('load-config', callback),
  onSaveConfig: (callback) => ipcRenderer.on('save-config', callback),
  onShowHelp: (callback) => ipcRenderer.on('show-help', callback),
  onShowAbout: (callback) => ipcRenderer.on('show-about', callback),
  onAppQuitting: (callback) => ipcRenderer.on('app-quitting', callback),
  
  // 移除监听器
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});

// 暴露工具函数
contextBridge.exposeInMainWorld('utils', {
  // 解析演出URL
  parseShowUrl: (url) => {
    try {
      // 支持多种URL格式：
      // 1. /item/数字.html (标准格式)
      // 2. /item.htm?id=数字 (查询参数格式)
      // 3. /item.htm?spm=xxx&id=数字&xxx (带其他参数的格式)
      
      let match = url.match(/\/item\/(\d+)\.html/);
      if (match) {
        return match[1];
      }
      
      // 尝试从查询参数中提取id
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get('id');
      if (id && /^\d+$/.test(id)) {
        return id;
      }
      
      return null;
    } catch (error) {
      console.error('URL解析错误:', error);
      return null;
    }
  },
  
  // 格式化时间
  formatDateTime: (date) => {
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return '';
    }
  },
  
  // 验证配置
  validateConfig: (config) => {
    const errors = [];
    
    if (!config.ticket?.showId) {
      errors.push('演出ID不能为空');
    }
    
    if (!config.ticket?.ticketTime) {
      errors.push('开票时间不能为空');
    }
    
    if (!config.ticket?.ticketTypes || config.ticket.ticketTypes.length === 0) {
      errors.push('票档类型不能为空');
    }
    
    if (!config.ticket?.viewers || config.ticket.viewers.length === 0) {
      errors.push('观演人不能为空');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // 生成配置模板
  generateConfigTemplate: () => {
    return `// 大麦网抢票工具配置文件
// 生成时间: ${new Date().toLocaleString()}

export default {
  // 大麦网配置
  damai: {
    baseUrl: 'https://www.damai.cn',
    mobileUrl: 'https://m.damai.cn',
    loginUrl: 'https://login.damai.cn',
    apiUrl: 'https://api.damai.cn'
  },

  // 抢票配置
  ticket: {
    showId: '',           // 演出ID
    showName: '',         // 演出名称
    venueId: '',          // 场馆ID
    venueName: '',        // 场馆名称
    showTime: '',         // 演出时间
    ticketTime: '',       // 开票时间
    
    ticketTypes: [],      // 票档类型
    maxPrice: 0,          // 最高票价限制
    
    viewers: [],          // 观演人
    maxViewers: 4,        // 最大观演人数量
    
    address: {            // 收货地址
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
    advanceTime: 1000,    // 提前进入时间(毫秒)
    refreshInterval: 100,  // 刷新间隔(毫秒)
    maxRetries: 10,       // 最大重试次数
    concurrent: 3,        // 并发数量
    requestDelay: 50,     // 请求间隔(毫秒)
    
    randomDelay: {
      min: 100,           // 最小随机延迟
      max: 500            // 最大随机延迟
    },
    
    mouseMovement: {
      enabled: true,      // 启用鼠标移动模拟
      points: 5,          // 移动点数
      duration: 1000      // 移动持续时间
    }
  },

  // 浏览器配置
  browser: {
    headless: false,      // 是否无头模式
    slowMo: 100,          // 操作延迟
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
    level: 'info',        // 日志级别
    file: 'logs/ticket-bot.log',
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
};`;
  }
}); 