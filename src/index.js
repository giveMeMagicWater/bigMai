#!/usr/bin/env node

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import DamaiTicketBot from './core/DamaiTicketBot.js';
import config from './config/config.js';

class TicketBotCLI {
  constructor() {
    this.bot = null;
    this.spinner = null;
  }

  /**
   * 启动CLI界面
   */
  async start() {
    console.log(chalk.blue.bold('🎫 大麦网自动化抢票工具'));
    console.log(chalk.gray('版本: 1.0.0 | 基于 Node.js + Puppeteer\n'));

    try {
      // 显示主菜单
      await this.showMainMenu();
    } catch (error) {
      console.error(chalk.red('❌ 程序异常退出:'), error.message);
      process.exit(1);
    }
  }

  /**
   * 显示主菜单
   */
  async showMainMenu() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作:',
        choices: [
          { name: '🚀 启动抢票机器人', value: 'start' },
          { name: '⚙️  配置抢票参数', value: 'config' },
          { name: '📊 查看当前状态', value: 'status' },
          { name: '❓ 使用帮助', value: 'help' },
          { name: '🚪 退出程序', value: 'exit' }
        ]
      }
    ]);

    switch (action) {
      case 'start':
        await this.startTicketBot();
        break;
      case 'config':
        await this.configureTicket();
        break;
      case 'status':
        await this.showStatus();
        break;
      case 'help':
        await this.showHelp();
        break;
      case 'exit':
        console.log(chalk.blue('👋 感谢使用，再见!'));
        process.exit(0);
        break;
    }
  }

  /**
   * 启动抢票机器人
   */
  async startTicketBot() {
    try {
      // 检查配置
      if (!this.validateConfig()) {
        console.log(chalk.yellow('⚠️ 请先配置抢票参数'));
        await this.configureTicket();
        return;
      }

      // 确认启动
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '确认启动抢票机器人?',
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.blue('已取消启动'));
        await this.showMainMenu();
        return;
      }

      // 启动机器人
      this.spinner = ora('正在启动抢票机器人...').start();
      
      this.bot = new DamaiTicketBot(config);
      await this.bot.start();
      
      this.spinner.succeed('抢票机器人启动成功!');
      
      // 显示控制菜单
      await this.showControlMenu();
      
    } catch (error) {
      if (this.spinner) this.spinner.fail('启动失败');
      console.error(chalk.red('❌ 启动失败:'), error.message);
      await this.showMainMenu();
    }
  }

  /**
   * 配置抢票参数
   */
  async configureTicket() {
    console.log(chalk.blue('⚙️ 配置抢票参数\n'));

    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'showId',
          message: '演出ID:',
          default: config.ticket.showId,
          validate: (input) => input.trim() ? true : '演出ID不能为空'
        },
        {
          type: 'input',
          name: 'showName',
          message: '演出名称:',
          default: config.ticket.showName
        },
        {
          type: 'input',
          name: 'ticketTime',
          message: '开票时间 (YYYY-MM-DD HH:mm:ss):',
          default: config.ticket.ticketTime,
          validate: (input) => {
            const date = new Date(input);
            return !isNaN(date.getTime()) ? true : '请输入有效的日期时间格式';
          }
        },
        {
          type: 'input',
          name: 'ticketTypes',
          message: '票档类型 (用逗号分隔):',
          default: config.ticket.ticketTypes.join(','),
          filter: (input) => input.split(',').map(t => t.trim())
        },
        {
          type: 'number',
          name: 'maxPrice',
          message: '最高票价限制:',
          default: config.ticket.maxPrice
        },
        {
          type: 'input',
          name: 'viewers',
          message: '观演人姓名 (用逗号分隔):',
          default: config.ticket.viewers.map(v => v.name).join(','),
          filter: (input) => input.split(',').map(name => ({ name: name.trim(), id: name.trim() }))
        }
      ]);

      // 更新配置
      Object.assign(config.ticket, answers);
      
      console.log(chalk.green('✅ 配置更新成功!'));
      
      // 保存配置到文件
      await this.saveConfig();
      
    } catch (error) {
      console.error(chalk.red('❌ 配置失败:'), error.message);
    }

    await this.showMainMenu();
  }

  /**
   * 显示控制菜单
   */
  async showControlMenu() {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '抢票机器人控制:',
        choices: [
          { name: '📊 查看状态', value: 'status' },
          { name: '⏸️  暂停抢票', value: 'pause' },
          { name: '▶️  继续抢票', value: 'resume' },
          { name: '⏹️  停止机器人', value: 'stop' },
          { name: '🔙 返回主菜单', value: 'back' }
        ]
      }
    ]);

    switch (action) {
      case 'status':
        await this.showStatus();
        break;
      case 'pause':
        await this.pauseTicketBot();
        break;
      case 'resume':
        await this.resumeTicketBot();
        break;
      case 'stop':
        await this.stopTicketBot();
        break;
      case 'back':
        await this.showMainMenu();
        break;
    }
  }

  /**
   * 显示状态信息
   */
  async showStatus() {
    console.log(chalk.blue('📊 当前状态\n'));

    if (this.bot) {
      const status = this.bot.getStatus();
      
      console.log(chalk.cyan('🤖 机器人状态:'));
      console.log(`   登录状态: ${status.isLoggedIn ? '✅ 已登录' : '❌ 未登录'}`);
      console.log(`   当前演出: ${status.currentShow?.name || '未配置'}`);
      
      console.log(chalk.cyan('\n🌐 浏览器状态:'));
      console.log(`   初始化: ${status.browserStatus.isInitialized ? '✅' : '❌'}`);
      console.log(`   浏览器: ${status.browserStatus.hasBrowser ? '✅' : '❌'}`);
      console.log(`   页面: ${status.browserStatus.hasPage ? '✅' : '❌'}`);
      
      console.log(chalk.cyan('\n🎯 策略状态:'));
      console.log(`   运行中: ${status.strategyStatus.isRunning ? '✅' : '❌'}`);
      console.log(`   当前策略: ${status.strategyStatus.currentStrategy || '无'}`);
      console.log(`   重试次数: ${status.strategyStatus.retryCount}`);
      
      if (status.strategyStatus.startTime) {
        const runningTime = Math.floor((Date.now() - status.strategyStatus.startTime) / 1000);
        console.log(`   运行时间: ${runningTime} 秒`);
      }
    } else {
      console.log(chalk.yellow('⚠️ 抢票机器人未启动'));
    }

    console.log('\n' + chalk.gray('按任意键继续...'));
    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  /**
   * 暂停抢票机器人
   */
  async pauseTicketBot() {
    if (this.bot) {
      this.bot.ticketStrategy.stop();
      console.log(chalk.yellow('⏸️ 抢票已暂停'));
    }
    await this.showControlMenu();
  }

  /**
   * 继续抢票机器人
   */
  async resumeTicketBot() {
    if (this.bot) {
      await this.bot.ticketStrategy.start();
      console.log(chalk.green('▶️ 抢票已恢复'));
    }
    await this.showControlMenu();
  }

  /**
   * 停止抢票机器人
   */
  async stopTicketBot() {
    if (this.bot) {
      await this.bot.stop();
      this.bot = null;
      console.log(chalk.blue('⏹️ 抢票机器人已停止'));
    }
    await this.showMainMenu();
  }

  /**
   * 显示帮助信息
   */
  async showHelp() {
    console.log(chalk.blue('❓ 使用帮助\n'));
    
    console.log(chalk.cyan('🎯 主要功能:'));
    console.log('   • 自动化抢票流程');
    console.log('   • 智能重试机制');
    console.log('   • 反检测策略');
    console.log('   • 实时状态监控');
    
    console.log(chalk.cyan('\n⚙️ 配置说明:'));
    console.log('   • 演出ID: 从大麦网演出页面URL获取');
    console.log('   • 开票时间: 精确到秒的时间格式');
    console.log('   • 票档类型: 按优先级排序，用逗号分隔');
    console.log('   • 观演人: 提前在大麦网设置的观演人');
    
    console.log(chalk.cyan('\n⚠️ 注意事项:'));
    console.log('   • 请确保网络环境稳定');
    console.log('   • 建议提前测试配置');
    console.log('   • 遵守大麦网使用条款');
    
    console.log('\n' + chalk.gray('按任意键继续...'));
    await this.waitForKeyPress();
    await this.showMainMenu();
  }

  /**
   * 验证配置
   */
  validateConfig() {
    const { ticket } = config;
    return ticket.showId && ticket.ticketTime && ticket.ticketTypes.length > 0;
  }

  /**
   * 保存配置
   */
  async saveConfig() {
    // 这里可以实现配置保存到文件的逻辑
    console.log(chalk.gray('配置已更新到内存'));
  }

  /**
   * 等待按键
   */
  async waitForKeyPress() {
    return new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        resolve();
      });
    });
  }
}

// 启动CLI
const cli = new TicketBotCLI();
cli.start().catch(console.error);

// 处理程序退出
process.on('SIGINT', async () => {
  console.log(chalk.blue('\n\n👋 正在退出程序...'));
  
  if (cli.bot) {
    await cli.bot.stop();
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (cli.bot) {
    await cli.bot.stop();
  }
  process.exit(0);
}); 