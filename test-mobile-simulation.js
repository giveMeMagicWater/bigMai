#!/usr/bin/env node

/**
 * 测试移动端模拟功能
 */

import puppeteer from 'puppeteer';
import chalk from 'chalk';

async function testMobileSimulation() {
  console.log('🧪 测试移动端模拟功能\n');
  
  let browser;
  let page;
  
  try {
    // 启动浏览器
    console.log('🌐 正在启动浏览器...');
    browser = await puppeteer.launch({
      headless: false,
      slowMo: 100,
      defaultViewport: {
        width: 375,          // iPhone标准宽度
        height: 667,         // iPhone标准高度
        deviceScaleFactor: 2, // 设备像素比
        isMobile: true,      // 标记为移动设备
        hasTouch: true,      // 支持触摸
        isLandscape: false   // 竖屏模式
      },
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--touch-events=enabled',
        '--enable-touch-drag-drop',
        '--enable-features=TouchEventFeatureDetection',
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      ]
    });

    // 创建新页面
    page = await browser.newPage();
    
    // 设置移动端用户代理
    await page.setUserAgent(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
    );

    // 设置触摸事件支持
    await page.evaluateOnNewDocument(() => {
      // 模拟触摸事件
      window.ontouchstart = null;
      window.ontouchmove = null;
      window.ontouchend = null;
      
      // 模拟触摸事件对象
      if (!window.TouchEvent) {
        window.TouchEvent = class TouchEvent extends Event {
          constructor(type, options = {}) {
            super(type, options);
            this.touches = options.touches || [];
            this.targetTouches = options.targetTouches || [];
            this.changedTouches = options.changedTouches || [];
          }
        };
      }
    });

    console.log('✅ 浏览器启动成功');
    
    // 测试移动端检测
    console.log('\n🔍 测试移动端检测...');
    
    // 检查视口信息
    const viewport = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      userAgent: navigator.userAgent,
      maxTouchPoints: navigator.maxTouchPoints,
      onLine: navigator.onLine,
      platform: navigator.platform
    }));
    
    console.log('📱 视口信息:');
    console.log(`  宽度: ${viewport.width}px`);
    console.log(`  高度: ${viewport.height}px`);
    console.log(`  设备像素比: ${viewport.devicePixelRatio}`);
    console.log(`  触摸点数量: ${viewport.maxTouchPoints}`);
    console.log(`  平台: ${viewport.platform}`);
    console.log(`  在线状态: ${viewport.onLine}`);
    
    // 检查User-Agent
    console.log('\n🌐 User-Agent:');
    console.log(viewport.userAgent);
    
    // 测试触摸事件
    console.log('\n👆 测试触摸事件...');
    const touchSupport = await page.evaluate(() => {
      return {
        hasTouchStart: 'ontouchstart' in window,
        hasTouchMove: 'ontouchmove' in window,
        hasTouchEnd: 'ontouchend' in window,
        hasTouchEvent: 'TouchEvent' in window,
        maxTouchPoints: navigator.maxTouchPoints || 0
      };
    });
    
    console.log('触摸事件支持:');
    console.log(`  touchstart: ${touchSupport.hasTouchStart}`);
    console.log(`  touchmove: ${touchSupport.hasTouchMove}`);
    console.log(`  touchend: ${touchSupport.hasTouchEnd}`);
    console.log(`  TouchEvent: ${touchSupport.hasTouchEvent}`);
    console.log(`  最大触摸点: ${touchSupport.maxTouchPoints}`);
    
    // 访问大麦网移动端
    console.log('\n🌐 访问大麦网移动端...');
    await page.goto('https://m.damai.cn', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ 页面加载成功');
    
    // 等待一下让页面完全加载
    await page.waitForTimeout(3000);
    
    // 获取页面标题
    const title = await page.title();
    console.log(`📄 页面标题: ${title}`);
    
    // 检查是否有移动端限制提示
    const mobileRestriction = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return {
        hasRestriction: bodyText.includes('只能在手机app内操作') || 
                       bodyText.includes('请使用手机APP') ||
                       bodyText.includes('移动端专用'),
        bodyText: bodyText.substring(0, 200) + '...'
      };
    });
    
    if (mobileRestriction.hasRestriction) {
      console.log('⚠️  检测到移动端限制提示');
      console.log('页面内容片段:', mobileRestriction.bodyText);
    } else {
      console.log('✅ 未检测到移动端限制提示');
    }
    
    // 截图保存
    console.log('\n📸 保存截图...');
    await page.screenshot({ 
      path: 'mobile-simulation-test.png',
      fullPage: true 
    });
    console.log('✅ 截图已保存为 mobile-simulation-test.png');
    
    console.log('\n🎯 移动端模拟测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// 运行测试
testMobileSimulation(); 