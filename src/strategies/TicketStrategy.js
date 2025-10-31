import { EventEmitter } from 'events';
import chalk from 'chalk';

export default class TicketStrategy extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.isRunning = false;
    this.retryCount = 0;
    this.startTime = null;
    this.currentStrategy = null;
  }

  /**
   * 启动抢票策略
   */
  async start() {
    if (this.isRunning) {
      throw new Error('抢票策略已在运行中');
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.retryCount = 0;

    console.log(chalk.green('🚀 启动抢票策略...'));
    this.emit('strategy:started');

    try {
      // 等待开票时间
      await this.waitForTicketTime();
      
      // 执行抢票流程
      await this.executeTicketProcess();
      
    } catch (error) {
      console.error(chalk.red('❌ 抢票策略执行失败:'), error.message);
      this.emit('strategy:error', error);
    } finally {
      this.isRunning = false;
      this.emit('strategy:finished');
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

    console.log(chalk.yellow('🎯 即将开票，准备抢票...'));
  }

  /**
   * 执行抢票流程
   */
  async executeTicketProcess() {
    const strategies = [
      this.rapidClickStrategy.bind(this),
      this.concurrentRequestStrategy.bind(this),
      this.intelligentRetryStrategy.bind(this)
    ];

    for (const strategy of strategies) {
      if (!this.isRunning) break;
      
      try {
        this.currentStrategy = strategy.name;
        console.log(chalk.cyan(`🔄 执行策略: ${strategy.name}`));
        
        const result = await strategy();
        if (result.success) {
          console.log(chalk.green('✅ 抢票成功!'));
          this.emit('ticket:success', result);
          return result;
        }
      } catch (error) {
        console.error(chalk.red(`❌ 策略 ${strategy.name} 执行失败:`), error.message);
        this.emit('strategy:failed', { strategy: strategy.name, error });
      }
    }

    throw new Error('所有抢票策略均失败');
  }

  /**
   * 快速点击策略
   */
  async rapidClickStrategy() {
    console.log(chalk.blue('⚡ 执行快速点击策略...'));
    
    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts && this.isRunning) {
      try {
        // 模拟快速点击购买按钮
        const result = await this.simulateRapidClick();
        
        if (result.success) {
          return { success: true, strategy: 'rapidClick', data: result.data };
        }

        attempts++;
        await this.sleep(this.config.strategy.refreshInterval);
        
      } catch (error) {
        console.warn(chalk.yellow(`⚠️ 快速点击尝试 ${attempts} 失败:`, error.message));
        attempts++;
      }
    }

    return { success: false, strategy: 'rapidClick' };
  }

  /**
   * 并发请求策略
   */
  async concurrentRequestStrategy() {
    console.log(chalk.blue('🚀 执行并发请求策略...'));
    
    const promises = [];
    const concurrent = this.config.strategy.concurrent;

    for (let i = 0; i < concurrent; i++) {
      promises.push(this.concurrentTicketRequest(i));
    }

    try {
      const results = await Promise.race(promises);
      return { success: true, strategy: 'concurrent', data: results };
    } catch (error) {
      return { success: false, strategy: 'concurrent', error: error.message };
    }
  }

  /**
   * 智能重试策略
   */
  async intelligentRetryStrategy() {
    console.log(chalk.blue('🧠 执行智能重试策略...'));
    
    const maxRetries = this.config.strategy.maxRetries;
    let retryCount = 0;

    while (retryCount < maxRetries && this.isRunning) {
      try {
        // 随机延迟，避免被检测
        const delay = this.getRandomDelay();
        await this.sleep(delay);

        const result = await this.intelligentTicketRequest();
        
        if (result.success) {
          return { success: true, strategy: 'intelligentRetry', data: result.data };
        }

        retryCount++;
        console.log(chalk.yellow(`🔄 智能重试 ${retryCount}/${maxRetries}`));
        
      } catch (error) {
        retryCount++;
        console.warn(chalk.yellow(`⚠️ 智能重试 ${retryCount} 失败:`, error.message));
      }
    }

    return { success: false, strategy: 'intelligentRetry' };
  }

  /**
   * 模拟快速点击
   */
  async simulateRapidClick() {
    // 这里需要与浏览器实例交互
    // 实际实现时会调用 Puppeteer 相关方法
    return new Promise((resolve) => {
      setTimeout(() => {
        // 模拟点击结果
        const success = Math.random() > 0.8; // 20% 成功率
        resolve({
          success,
          data: success ? { message: '快速点击成功' } : null
        });
      }, 100);
    });
  }

  /**
   * 并发票务请求
   */
  async concurrentTicketRequest(index) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const success = Math.random() > 0.7; // 30% 成功率
        if (success) {
          resolve({ index, success: true, data: { message: `并发请求 ${index} 成功` } });
        } else {
          reject(new Error(`并发请求 ${index} 失败`));
        }
      }, this.config.strategy.requestDelay * (index + 1));
    });
  }

  /**
   * 智能票务请求
   */
  async intelligentTicketRequest() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.6; // 40% 成功率
        resolve({
          success,
          data: success ? { message: '智能请求成功' } : null
        });
      }, 200);
    });
  }

  /**
   * 获取随机延迟时间
   */
  getRandomDelay() {
    const { min, max } = this.config.strategy.randomDelay;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 停止抢票策略
   */
  stop() {
    this.isRunning = false;
    console.log(chalk.yellow('⏹️ 停止抢票策略'));
    this.emit('strategy:stopped');
  }

  /**
   * 睡眠函数
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取策略状态
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      currentStrategy: this.currentStrategy,
      retryCount: this.retryCount,
      startTime: this.startTime,
      runningTime: this.startTime ? Date.now() - this.startTime : 0
    };
  }
} 