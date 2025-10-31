#!/usr/bin/env node

/**
 * 测试URL解析功能
 */

// 模拟parseShowUrl函数
function parseShowUrl(url) {
  try {
    // 支持多种URL格式：
    // 1. /item/数字.html (标准格式)
    // 2. /item.htm?id=数字 (查询参数格式)
    // 3. /item.htm?spm=xxx&id=数字&xxx (带其他参数的格式)
    
    let match = url.match(/\/item\/(\d+)\.html/);
    if (match) {
      return match[1];
    }
    
    // 尝试从查询参数中提取id
    const urlObj = new URL(url);
    const id = urlObj.searchParams.get('id');
    if (id && /^\d+$/.test(id)) {
      return id;
    }
    
    return null;
  } catch (error) {
    console.error('URL解析错误:', error);
    return null;
  }
}

// 测试用例
const testUrls = [
  // 您提供的URL
  'https://detail.damai.cn/item.htm?spm=a2oeg.search_category.0.0.227928dfS3JiAB&id=964306382331&clicktitle=%E5%91%A8%E6%9D%B0%E4%BC%A62025%E2%80%9C%E5%98%89%E5%B9%B4%E5%8D%8E%E2%80%9D%E4%B8%96%E7%95%8C%E5%B7%A1%E5%9B%9E%E6%BC%94%E5%94%B1%E4%BC%9A-%E4%B8%8A%E6%B5%B7%E7%AB%99',
  
  // 标准格式
  'https://www.damai.cn/item/123456789.html',
  
  // 简单查询参数格式
  'https://detail.damai.cn/item.htm?id=987654321',
  
  // 带其他参数的格式
  'https://detail.damai.cn/item.htm?spm=xxx&id=555666777&other=value'
];

console.log('🧪 测试URL解析功能\n');

testUrls.forEach((url, index) => {
  const showId = parseShowUrl(url);
  console.log(`测试 ${index + 1}:`);
  console.log(`URL: ${url}`);
  console.log(`解析结果: ${showId ? `✅ ${showId}` : '❌ 解析失败'}`);
  console.log('---');
});

console.log('\n🎯 测试完成！'); 