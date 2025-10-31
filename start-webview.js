#!/usr/bin/env node

/**
 * 启动WebView配置界面
 * 使用方法: node start-webview.js
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 启动大麦网抢票工具 - WebView配置界面');
console.log('正在检查依赖...\n');

// 检查是否安装了Electron
function checkElectron() {
    try {
        require.resolve('electron');
        return true;
    } catch (e) {
        return false;
    }
}

// 安装Electron依赖
function installElectron() {
    return new Promise((resolve, reject) => {
        console.log('📦 正在安装Electron依赖...');
        
        const npm = spawn('npm', ['install', 'electron', 'electron-builder', '--save-dev'], {
            stdio: 'inherit',
            shell: true
        });
        
        npm.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Electron依赖安装完成');
                resolve();
            } else {
                console.error('❌ Electron依赖安装失败');
                reject(new Error(`npm install 退出码: ${code}`));
            }
        });
        
        npm.on('error', (error) => {
            console.error('❌ 启动npm失败:', error.message);
            reject(error);
        });
    });
}

// 启动Electron应用
function startElectron() {
    console.log('🚀 启动Electron应用...');
    
    const electronPath = path.join(__dirname, 'node_modules', '.bin', 'electron');
    const mainPath = path.join(__dirname, 'electron', 'main.js');
    
    const electron = spawn(electronPath, [mainPath], {
        stdio: 'inherit',
        shell: true
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
        process.exit(1);
    });
}

// 主函数
async function main() {
    try {
        if (!checkElectron()) {
            console.log('⚠️ 检测到Electron未安装');
            await installElectron();
        }
        
        startElectron();
    } catch (error) {
        console.error('❌ 启动失败:', error.message);
        process.exit(1);
    }
}

// 启动程序
main(); 