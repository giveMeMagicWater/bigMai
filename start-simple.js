#!/usr/bin/env node

/**
 * 简化启动脚本 - 避免模块类型问题
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动大麦网抢票工具 - 简化版本');
console.log('正在启动Electron应用...\n');

// 直接启动Electron
function startElectron() {
    const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
    const mainPath = path.join(__dirname, 'electron', 'main.js');
    
    console.log(`Electron路径: ${electronPath}`);
    console.log(`主进程路径: ${mainPath}`);
    
    const electron = spawn(electronPath, [mainPath], {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, NODE_OPTIONS: '--no-warnings' }
    });
    
    electron.on('close', (code) => {
        if (code === 0) {
            console.log('✅ 应用正常退出');
        } else {
            console.log(`⚠️ 应用退出，退出码: ${code}`);
        }
        process.exit(code);
    });
    
    electron.on('error', (error) => {
        console.error('❌ 启动Electron失败:', error.message);
        console.log('\n💡 尝试以下解决方案:');
        console.log('1. 重新安装依赖: npm install');
        console.log('2. 清除缓存: npm cache clean --force');
        console.log('3. 删除node_modules并重新安装');
        process.exit(1);
    });
}

// 启动程序
startElectron(); 