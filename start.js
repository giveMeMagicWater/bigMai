#!/usr/bin/env node

/**
 * 大麦网抢票工具快速启动脚本
 * 使用方法: node start.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log(chalk.blue.bold('🎫 大麦网自动化抢票工具'));
console.log(chalk.gray('正在启动...\n'));

// 检查依赖是否安装
async function checkDependencies() {
  try {
    const fs = await import('fs');
    const packagePath = join(__dirname, 'package.json');
    
    if (!fs.existsSync(packagePath)) {
      console.error(chalk.red('❌ 未找到 package.json 文件'));
      console.log(chalk.yellow('请确保在项目根目录下运行此脚本'));
      process.exit(1);
    }
    
    const nodeModulesPath = join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      console.log(chalk.yellow('⚠️ 检测到依赖未安装，正在安装...'));
      await installDependencies();
    }
    
  } catch (error) {
    console.error(chalk.red('❌ 依赖检查失败:'), error.message);
    process.exit(1);
  }
}

// 安装依赖
async function installDependencies() {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue('📦 正在安装依赖...'));
    
    const npm = spawn('npm', ['install'], {
      stdio: 'inherit',
      shell: true
    });
    
    npm.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ 依赖安装完成'));
        resolve();
      } else {
        console.error(chalk.red('❌ 依赖安装失败'));
        reject(new Error(`npm install 退出码: ${code}`));
      }
    });
    
    npm.on('error', (error) => {
      console.error(chalk.red('❌ 启动npm失败:'), error.message);
      reject(error);
    });
  });
}

// 启动主程序
async function startMain() {
  try {
    console.log(chalk.blue('🚀 启动主程序...'));
    
    const mainPath = join(__dirname, 'src', 'index.js');
    const child = spawn('node', [mainPath], {
      stdio: 'inherit',
      shell: true
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('✅ 程序正常退出'));
      } else {
        console.log(chalk.yellow(`⚠️ 程序退出，退出码: ${code}`));
      }
      process.exit(code);
    });
    
    child.on('error', (error) => {
      console.error(chalk.red('❌ 启动主程序失败:'), error.message);
      process.exit(1);
    });
    
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  try {
    await checkDependencies();
    await startMain();
  } catch (error) {
    console.error(chalk.red('❌ 启动失败:'), error.message);
    process.exit(1);
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  console.log(chalk.blue('\n👋 正在退出...'));
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log(chalk.blue('\n👋 正在退出...'));
  process.exit(0);
});

// 启动程序
main(); 