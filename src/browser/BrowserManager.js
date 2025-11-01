import puppeteer from 'puppeteer';
import chalk from 'chalk';

export default class BrowserManager {
  constructor(config) {
    this.config = config;
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
  }

  /**
   * 在页面上注入移动端指纹（在新文档上执行，确保覆盖所有导航页面）
   */
  async applyMobileFingerprint({ userAgent, viewport } = {}) {
    // 这段脚本将在每个新文档上下文运行，尽可能覆盖常见的指纹检测点
    const script = function (ua, vp) {
      try {
        // 覆盖 userAgent（setUserAgent 已经设置，但保持冗余）
        Object.defineProperty(navigator, 'userAgent', {
          get: () => ua,
          configurable: true
        });

        // 覆盖 platform
        Object.defineProperty(navigator, 'platform', {
          get: () => 'iPhone',
          configurable: true
        });

        // 覆盖语言
        Object.defineProperty(navigator, 'languages', {
          get: () => ['zh-CN', 'zh'],
          configurable: true
        });

        // 模拟触摸点
        Object.defineProperty(navigator, 'maxTouchPoints', {
          get: () => 5,
          configurable: true
        });

        // 硬件并发数（避免泄露桌面规模）
        Object.defineProperty(navigator, 'hardwareConcurrency', {
          get: () => 4,
          configurable: true
        });

        // 隐藏 webdriver 标志
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
          configurable: true
        });

        // 模拟 screen 信息
        try {
          const scr = window.screen || {};
          Object.defineProperty(scr, 'width', { get: () => vp.width, configurable: true });
          Object.defineProperty(scr, 'height', { get: () => vp.height, configurable: true });
          Object.defineProperty(scr, 'availWidth', { get: () => vp.width, configurable: true });
          Object.defineProperty(scr, 'availHeight', { get: () => vp.height, configurable: true });
          Object.defineProperty(scr, 'pixelDepth', { get: () => 24, configurable: true });
          Object.defineProperty(scr, 'colorDepth', { get: () => 24, configurable: true });
        } catch (e) {
          // ignore
        }

        // 触摸事件支持
        if (typeof window.ontouchstart === 'undefined') {
          Object.defineProperty(window, 'ontouchstart', { value: null, configurable: true });
        }

        // 模拟常见的 navigator.plugins 和 mimeTypes（非空以避免检测）
        try {
          const fakePlugins = [{ name: 'Safari PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }];
          const pluginArray = {
            length: fakePlugins.length,
            item: function (i) { return this[i]; }
          };
          fakePlugins.forEach((p, i) => pluginArray[i] = p);

          Object.defineProperty(navigator, 'plugins', {
            get: () => pluginArray,
            configurable: true
          });

          const mimeArray = { length: 0, item: function () { return null; } };
          Object.defineProperty(navigator, 'mimeTypes', {
            get: () => mimeArray,
            configurable: true
          });
        } catch (e) {
          // ignore
        }

        // 模拟 userAgentData（Chrome 新 API），提供移动信息
        try {
          if (!navigator.userAgentData) {
            Object.defineProperty(navigator, 'userAgentData', {
              get: () => ({
                mobile: true,
                brands: [{ brand: 'Safari', version: '15' }],
                getHighEntropyValues: async (hints) => ({ platform: 'iOS', model: 'iPhone' })
              }),
              configurable: true
            });
          }
        } catch (e) {
          // ignore
        }

        // 覆盖 window.screen.width/height/devicePixelRatio
        try {
          Object.defineProperty(window, 'devicePixelRatio', {
            get: () => vp.deviceScaleFactor || 2,
            configurable: true
          });
        } catch (e) {
          // ignore
        }

        // 修复 permissions.query 对 camera/microphone 等的检测
        try {
          const origQuery = navigator.permissions && navigator.permissions.query;
          if (origQuery) {
            navigator.permissions.query = function (parameters) {
              if (parameters && parameters.name && (parameters.name === 'camera' || parameters.name === 'microphone' || parameters.name === 'notifications')) {
                return Promise.resolve({ state: 'denied' });
              }
              return origQuery(parameters);
            };
          }
        } catch (e) {
          // ignore
        }
      } catch (e) {
        // 在注入过程中忽略任何错误，保持页面可用
        // console.warn('fingerprint injection error', e);
      }
    };

    // 将函数序列化为字符串并在每个新文档注入
    await this.page.evaluateOnNewDocument(script, userAgent, viewport);
  }

  /**
   * 初始化浏览器
   */
  async initialize() {
    try {
      console.log(chalk.blue('🌐 正在启动浏览器...'));
      
      this.browser = await puppeteer.launch({
        headless: this.config.browser.headless,
        slowMo: this.config.browser.slowMo,
        defaultViewport: this.config.browser.defaultViewport,
        args: this.config.browser.args,
        ignoreDefaultArgs: ['--disable-extensions']
      });

      this.page = await this.browser.newPage();
      
      // 设置移动端用户代理（基础 UA）
      const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
      await this.page.setUserAgent(mobileUA);

      // 设置视口
      await this.page.setViewport(this.config.browser.defaultViewport);

      // 在新文档上注入更完整的移动 App 指纹，覆盖 navigator、screen、touch 等属性
      await this.applyMobileFingerprint({
        userAgent: mobileUA,
        viewport: this.config.browser.defaultViewport
      });

      // 设置请求拦截
      await this.setupRequestInterception();

      // 设置事件监听
      await this.setupEventListeners();

      this.isInitialized = true;
      console.log(chalk.green('✅ 浏览器初始化成功'));

      return true;
    } catch (error) {
      console.error(chalk.red('❌ 浏览器初始化失败:'), error.message);
      throw error;
    }
  }

  /**
   * 设置请求拦截
   */
  async setupRequestInterception() {
    await this.page.setRequestInterception(true);

    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      
      // 拦截不必要的资源请求，提高性能
      if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        // 添加随机延迟，模拟真实用户行为
        const delay = this.getRandomDelay();
        setTimeout(() => request.continue(), delay);
      }
    });
  }

  /**
   * 设置事件监听
   */
  async setupEventListeners() {
    // 页面加载完成
    this.page.on('load', () => {
      console.log(chalk.blue('📄 页面加载完成'));
    });

    // 控制台日志
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.warn(chalk.yellow('⚠️ 页面错误:'), msg.text());
      }
    });

    // 页面错误
    this.page.on('pageerror', (error) => {
      console.warn(chalk.yellow('⚠️ 页面异常:'), error.message);
    });
  }

  /**
   * 导航到指定页面
   */
  async navigateTo(url, options = {}) {
    if (!this.isInitialized) {
      throw new Error('浏览器未初始化');
    }

    try {
      console.log(chalk.blue(`🌐 正在导航到: ${url}`));
      
      const navigationOptions = {
        waitUntil: 'networkidle2',
        timeout: 30000,
        ...options
      };

      await this.page.goto(url, navigationOptions);
      console.log(chalk.green('✅ 页面导航成功'));
      
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 页面导航失败:'), error.message);
      throw error;
    }
  }

  /**
   * 等待元素出现
   */
  async waitForElement(selector, timeout = 10000) {
    try {
      await this.page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ 等待元素超时: ${selector}`));
      return false;
    }
  }

  /**
   * 点击元素
   */
  async clickElement(selector, options = {}) {
    try {
      // 等待元素可点击
      await this.page.waitForSelector(selector, { 
        visible: true, 
        timeout: 5000 
      });

      // 模拟真实点击行为
      if (this.config.strategy.mouseMovement.enabled) {
        await this.simulateMouseMovement();
      }

      // 执行点击
      await this.page.click(selector, options);
      
      console.log(chalk.blue(`🖱️ 点击元素: ${selector}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ 点击元素失败: ${selector}`), error.message);
      return false;
    }
  }

  /**
   * 输入文本
   */
  async inputText(selector, text, options = {}) {
    try {
      await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
      
      // 清空输入框
      await this.page.click(selector, { clickCount: 3 });
      
      // 模拟真实输入行为
      await this.page.type(selector, text, { 
        delay: this.getRandomDelay(50, 150),
        ...options 
      });
      
      console.log(chalk.blue(`⌨️ 输入文本: ${text}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ 输入文本失败: ${selector}`), error.message);
      return false;
    }
  }

  /**
   * 选择下拉选项
   */
  async selectOption(selector, value) {
    try {
      await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
      await this.page.select(selector, value);
      
      console.log(chalk.blue(`📋 选择选项: ${value}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`❌ 选择选项失败: ${selector}`), error.message);
      return false;
    }
  }

  /**
   * 获取元素文本
   */
  async getElementText(selector) {
    try {
      await this.page.waitForSelector(selector, { visible: true, timeout: 5000 });
      const text = await this.page.$eval(selector, el => el.textContent.trim());
      return text;
    } catch (error) {
      console.warn(chalk.yellow(`⚠️ 获取元素文本失败: ${selector}`));
      return null;
    }
  }

  /**
   * 检查元素是否存在
   */
  async elementExists(selector) {
    try {
      const element = await this.page.$(selector);
      return element !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * 模拟鼠标移动
   */
  async simulateMouseMovement() {
    const { points, duration } = this.config.strategy.mouseMovement;
    
    for (let i = 0; i < points; i++) {
      const x = Math.random() * this.config.browser.defaultViewport.width;
      const y = Math.random() * this.config.browser.defaultViewport.height;
      
      await this.page.mouse.move(x, y);
      await this.sleep(duration / points);
    }
  }

  /**
   * 执行JavaScript代码
   */
  async executeScript(script, ...args) {
    try {
      const result = await this.page.evaluate(script, ...args);
      return result;
    } catch (error) {
      console.error(chalk.red('❌ 执行脚本失败:'), error.message);
      return null;
    }
  }

  /**
   * 截图
   */
  async takeScreenshot(path) {
    try {
      await this.page.screenshot({ 
        path, 
        fullPage: true 
      });
      console.log(chalk.blue(`📸 截图保存: ${path}`));
      return true;
    } catch (error) {
      console.error(chalk.red('❌ 截图失败:'), error.message);
      return false;
    }
  }

  /**
   * 获取随机延迟
   */
  getRandomDelay(min = 100, max = 500) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 关闭浏览器
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      console.log(chalk.blue('🔒 浏览器已关闭'));
    }
  }

  /**
   * 获取浏览器状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      hasBrowser: !!this.browser,
      hasPage: !!this.page
    };
  }
} 