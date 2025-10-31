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
      
      // 设置移动端用户代理
      await this.page.setUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      );

      // 设置视口
      await this.page.setViewport(this.config.browser.defaultViewport);

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