import BrowserManager from '../browser/BrowserManager.js';
import TicketStrategy from '../strategies/TicketStrategy.js';
import chalk from 'chalk';
import ora from 'ora';

export default class DamaiTicketBot {
  constructor(config) {
    this.config = config;
    this.browserManager = new BrowserManager(config);
    this.ticketStrategy = new TicketStrategy(config);
    this.isLoggedIn = false;
    this.currentShow = null;
    this.spinner = null;
    
    // 绑定事件
    this.bindEvents();
  }

  /**
   * 绑定事件监听
   */
  bindEvents() {
    this.ticketStrategy.on('strategy:started', () => {
      console.log(chalk.green('🎯 抢票策略已启动'));
    });

    this.ticketStrategy.on('ticket:success', (result) => {
      console.log(chalk.green('🎉 抢票成功!'));
      this.handleTicketSuccess(result);
    });

    this.ticketStrategy.on('strategy:error', (error) => {
      console.error(chalk.red('❌ 抢票策略错误:'), error.message);
    });

    this.ticketStrategy.on('strategy:finished', () => {
      console.log(chalk.blue('🏁 抢票策略执行完成'));
    });
  }

  /**
   * 启动抢票机器人
   */
  async start() {
    try {
      console.log(chalk.blue('🤖 启动大麦网抢票机器人...'));
      
      // 初始化浏览器
      await this.browserManager.initialize();
      
      // 登录大麦网
      await this.login();
      
      // 配置演出信息
      await this.configureShow();
      
      // 启动抢票策略
      await this.ticketStrategy.start();
      
    } catch (error) {
      console.error(chalk.red('❌ 启动失败:'), error.message);
      throw error;
    }
  }

  /**
   * 登录大麦网
   */
  async login() {
    try {
      console.log(chalk.blue('🔐 正在登录大麦网...'));
      
      // 导航到登录页面
      await this.browserManager.navigateTo(this.config.damai.loginUrl);
      
      // 等待用户手动登录
      console.log(chalk.yellow('⚠️ 请在浏览器中手动完成登录...'));
      
      // 等待登录成功
      await this.waitForLogin();
      
      this.isLoggedIn = true;
      console.log(chalk.green('✅ 登录成功'));
      
    } catch (error) {
      console.error(chalk.red('❌ 登录失败:'), error.message);
      throw error;
    }
  }

  /**
   * 等待用户登录
   */
  async waitForLogin() {
    return new Promise((resolve) => {
      const checkLogin = async () => {
        try {
          // 检查是否已登录（通过检查用户头像或其他登录后才会出现的元素）
          const isLoggedIn = await this.browserManager.elementExists('.user-avatar, .user-info, .login-user');
          
          if (isLoggedIn) {
            resolve();
          } else {
            // 继续等待
            setTimeout(checkLogin, 2000);
          }
        } catch (error) {
          // 继续等待
          setTimeout(checkLogin, 2000);
        }
      };
      
      checkLogin();
    });
  }

  /**
   * 配置演出信息
   */
  async configureShow() {
    try {
      console.log(chalk.blue('🎭 配置演出信息...'));
      
      // 导航到演出详情页
      const showUrl = `${this.config.damai.baseUrl}/item/${this.config.ticket.showId}`;
      await this.browserManager.navigateTo(showUrl);
      
      // 等待页面加载
      await this.browserManager.waitForElement('.show-info, .performance-info');
      
      // 获取演出信息
      this.currentShow = await this.getShowInfo();
      
      console.log(chalk.green('✅ 演出信息配置完成'));
      console.log(chalk.cyan(`🎪 演出: ${this.currentShow.name}`));
      console.log(chalk.cyan(`🏟️ 场馆: ${this.currentShow.venue}`));
      console.log(chalk.cyan(`⏰ 时间: ${this.currentShow.time}`));
      
    } catch (error) {
      console.error(chalk.red('❌ 配置演出信息失败:'), error.message);
      throw error;
    }
  }

  /**
   * 获取演出信息
   */
  async getShowInfo() {
    try {
      const name = await this.browserManager.getElementText('.show-name, .performance-title') || this.config.ticket.showName;
      const venue = await this.browserManager.getElementText('.venue-name, .location') || this.config.ticket.venueName;
      const time = await this.browserManager.getElementText('.show-time, .performance-time') || this.config.ticket.showTime;
      
      return { name, venue, time };
    } catch (error) {
      return {
        name: this.config.ticket.showName,
        venue: this.config.ticket.venueName,
        time: this.config.ticket.showTime
      };
    }
  }

  /**
   * 执行抢票流程
   */
  async executeTicketProcess() {
    try {
      console.log(chalk.blue('🚀 开始执行抢票流程...'));
      
      // 等待开票时间
      await this.waitForTicketTime();
      
      // 进入抢票页面
      await this.enterTicketPage();
      
      // 选择票档
      await this.selectTicketType();
      
      // 选择观演人
      await this.selectViewers();
      
      // 提交订单
      await this.submitOrder();
      
      // 完成支付
      await this.completePayment();
      
      console.log(chalk.green('🎉 抢票流程执行完成!'));
      
    } catch (error) {
      console.error(chalk.red('❌ 抢票流程执行失败:'), error.message);
      throw error;
    }
  }

  /**
   * 等待开票时间
   */
  async waitForTicketTime() {
    const ticketTime = new Date(this.config.ticket.ticketTime).getTime();
    const now = Date.now();
    const waitTime = ticketTime - now - this.config.strategy.advanceTime;
    
    if (waitTime > 0) {
      console.log(chalk.blue(`⏰ 等待开票时间，剩余 ${Math.ceil(waitTime / 1000)} 秒`));
      await this.sleep(waitTime);
    }
    
    console.log(chalk.yellow('🎯 开票时间到，开始抢票!'));
  }

  /**
   * 进入抢票页面
   */
  async enterTicketPage() {
    try {
      console.log(chalk.blue('🎫 进入抢票页面...'));
      
      // 点击购买按钮
      const buyButton = '.buy-btn, .purchase-btn, .buy-now';
      await this.browserManager.waitForElement(buyButton);
      await this.browserManager.clickElement(buyButton);
      
      // 等待抢票页面加载
      await this.browserManager.waitForElement('.ticket-selection, .seat-selection');
      
      console.log(chalk.green('✅ 成功进入抢票页面'));
      
    } catch (error) {
      console.error(chalk.red('❌ 进入抢票页面失败:'), error.message);
      throw error;
    }
  }

  /**
   * 选择票档
   */
  async selectTicketType() {
    try {
      console.log(chalk.blue('🎫 选择票档...'));
      
      for (const ticketType of this.config.ticket.ticketTypes) {
        const selector = `[data-ticket-type="${ticketType}"], .ticket-type-${ticketType}`;
        
        if (await this.browserManager.elementExists(selector)) {
          await this.browserManager.clickElement(selector);
          console.log(chalk.green(`✅ 选择票档: ${ticketType}`));
          return true;
        }
      }
      
      throw new Error('未找到可用的票档');
      
    } catch (error) {
      console.error(chalk.red('❌ 选择票档失败:'), error.message);
      throw error;
    }
  }

  /**
   * 选择观演人
   */
  async selectViewers() {
    try {
      console.log(chalk.blue('👥 选择观演人...'));
      
      for (const viewer of this.config.ticket.viewers) {
        const selector = `[data-viewer="${viewer.id}"], .viewer-${viewer.id}`;
        
        if (await this.browserManager.elementExists(selector)) {
          await this.browserManager.clickElement(selector);
          console.log(chalk.green(`✅ 选择观演人: ${viewer.name}`));
        }
      }
      
      console.log(chalk.green('✅ 观演人选择完成'));
      
    } catch (error) {
      console.error(chalk.red('❌ 选择观演人失败:'), error.message);
      throw error;
    }
  }

  /**
   * 提交订单
   */
  async submitOrder() {
    try {
      console.log(chalk.blue('📝 提交订单...'));
      
      // 点击提交订单按钮
      const submitButton = '.submit-order, .confirm-order, .submit-btn';
      await this.browserManager.waitForElement(submitButton);
      await this.browserManager.clickElement(submitButton);
      
      // 等待订单确认页面
      await this.browserManager.waitForElement('.order-confirm, .payment-page');
      
      console.log(chalk.green('✅ 订单提交成功'));
      
    } catch (error) {
      console.error(chalk.red('❌ 提交订单失败:'), error.message);
      throw error;
    }
  }

  /**
   * 完成支付
   */
  async completePayment() {
    try {
      console.log(chalk.blue('💳 完成支付...'));
      
      // 选择支付方式（这里需要根据实际情况调整）
      const paymentMethod = '.payment-method, .pay-option';
      if (await this.browserManager.elementExists(paymentMethod)) {
        await this.browserManager.clickElement(paymentMethod);
      }
      
      // 点击确认支付
      const payButton = '.confirm-pay, .pay-now, .confirm-payment';
      await this.browserManager.waitForElement(payButton);
      await this.browserManager.clickElement(payButton);
      
      console.log(chalk.green('✅ 支付流程启动成功'));
      console.log(chalk.yellow('⚠️ 请在浏览器中完成最终支付操作'));
      
    } catch (error) {
      console.error(chalk.red('❌ 完成支付失败:'), error.message);
      throw error;
    }
  }

  /**
   * 处理抢票成功
   */
  handleTicketSuccess(result) {
    console.log(chalk.green('🎉 抢票成功!'));
    console.log(chalk.cyan(`策略: ${result.strategy}`));
    console.log(chalk.cyan(`数据: ${JSON.stringify(result.data)}`));
    
    // 这里可以添加通知逻辑
    this.sendNotification('抢票成功', result);
  }

  /**
   * 发送通知
   */
  sendNotification(title, content) {
    // 实现通知逻辑（邮件、webhook等）
    console.log(chalk.blue(`📢 发送通知: ${title}`));
  }

  /**
   * 停止机器人
   */
  async stop() {
    try {
      console.log(chalk.blue('⏹️ 正在停止抢票机器人...'));
      
      // 停止抢票策略
      this.ticketStrategy.stop();
      
      // 关闭浏览器
      await this.browserManager.close();
      
      console.log(chalk.green('✅ 抢票机器人已停止'));
      
    } catch (error) {
      console.error(chalk.red('❌ 停止失败:'), error.message);
    }
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取机器人状态
   */
  getStatus() {
    return {
      isLoggedIn: this.isLoggedIn,
      currentShow: this.currentShow,
      browserStatus: this.browserManager.getStatus(),
      strategyStatus: this.ticketStrategy.getStatus()
    };
  }
} 