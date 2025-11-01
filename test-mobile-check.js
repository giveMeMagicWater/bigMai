#!/usr/bin/env node

import BrowserManager from './src/browser/BrowserManager.js';
import mobileConfig from './src/config/mobile.config.js';

async function run() {
  const bm = new BrowserManager(mobileConfig);
  try {
    await bm.initialize();
    // 导航到 about:blank 并在页面上下文打印一些检测信息
    await bm.navigateTo('about:blank');
    const info = await bm.executeScript(() => ({
      ua: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      devicePixelRatio: window.devicePixelRatio,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      hasTouchStart: 'ontouchstart' in window,
      userAgentData: navigator.userAgentData ? { mobile: navigator.userAgentData.mobile, brands: navigator.userAgentData.brands } : null
    }));

    console.log('=== Mobile simulation check ===');
    console.log(info);

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await bm.close();
  }
}

run();
