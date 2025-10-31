// 渲染进程主逻辑
class ConfigManager {
    constructor() {
        this.config = this.getDefaultConfig();
        this.currentConfigPath = null;
        this.isConfigModified = false;
        
        this.init();
    }

    // 初始化
    init() {
        this.bindEvents();
        this.setupWebView();
        this.loadDefaultConfig();
        this.updateUI();
    }

    // 获取默认配置
    getDefaultConfig() {
        return {
            damai: {
                baseUrl: 'https://www.damai.cn',
                mobileUrl: 'https://m.damai.cn',
                loginUrl: 'https://login.damai.cn',
                apiUrl: 'https://api.damai.cn'
            },
            ticket: {
                showId: '',
                showName: '',
                venueId: '',
                venueName: '',
                showTime: '',
                ticketTime: '',
                ticketTypes: [],
                maxPrice: 0,
                viewers: [],
                maxViewers: 4,
                address: {
                    name: '',
                    phone: '',
                    province: '',
                    city: '',
                    district: '',
                    detail: ''
                }
            },
            strategy: {
                advanceTime: 1000,
                refreshInterval: 100,
                maxRetries: 10,
                concurrent: 3,
                requestDelay: 50,
                randomDelay: {
                    min: 100,
                    max: 500
                },
                mouseMovement: {
                    enabled: true,
                    points: 5,
                    duration: 1000
                }
            },
            browser: {
                headless: false,
                slowMo: 100,
                defaultViewport: {
                    width: 375,          // 移动端宽度
                    height: 667,         // 移动端高度
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
                    '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
                    '--touch-events=enabled'
                ]
            },
            logging: {
                level: 'info',
                file: 'logs/ticket-bot.log',
                maxSize: '10m',
                maxFiles: 5
            },
            notification: {
                email: {
                    enabled: false,
                    smtp: 'smtp.qq.com',
                    user: '',
                    pass: '',
                    to: ''
                },
                webhook: {
                    enabled: false,
                    url: ''
                }
            }
        };
    }

    // 绑定事件
    bindEvents() {
        // 按钮事件
        document.getElementById('newConfigBtn').addEventListener('click', () => this.newConfig());
        document.getElementById('loadConfigBtn').addEventListener('click', () => this.loadConfig());
        document.getElementById('saveConfigBtn').addEventListener('click', () => this.saveConfig());
        document.getElementById('validateConfigBtn').addEventListener('click', () => this.validateConfig());
        document.getElementById('startBotBtn').addEventListener('click', () => this.startBot());
        
        // URL解析
        document.getElementById('parseUrlBtn').addEventListener('click', () => this.parseShowUrl());
        
        // 票档管理
        document.getElementById('addTicketTypeBtn').addEventListener('click', () => this.addTicketType());
        
        // 观演人管理
        document.getElementById('addViewerBtn').addEventListener('click', () => this.addViewer());
        
        // 帮助和关于
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
        document.getElementById('aboutBtn').addEventListener('click', () => this.showAbout());
        
        // WebView控制
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshWebView());
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('forwardBtn').addEventListener('click', () => this.goForward());
        document.getElementById('homeBtn').addEventListener('click', () => this.goHome());
        
        // 模态框事件
        this.setupModalEvents();
        
        // 表单输入事件
        this.setupFormEvents();
        
        // 主进程事件监听
        this.setupMainProcessEvents();
    }

    // 设置WebView
    setupWebView() {
        const webview = document.getElementById('damaiWebview');
        
        webview.addEventListener('did-start-loading', () => {
            document.getElementById('webviewStatus').textContent = '正在加载...';
        });
        
        webview.addEventListener('did-finish-load', () => {
            document.getElementById('webviewStatus').textContent = '加载完成';
            document.getElementById('webviewUrl').textContent = webview.src;
        });
        
        webview.addEventListener('did-fail-load', (event) => {
            document.getElementById('webviewStatus').textContent = '加载失败';
        });
        
        webview.addEventListener('new-window', (event) => {
            // 在新窗口中打开链接
            window.open(event.url);
        });
    }

    // 设置模态框事件
    setupModalEvents() {
        const modals = document.querySelectorAll('.modal');
        
        modals.forEach(modal => {
            const closeBtn = modal.querySelector('.close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideModal(modal));
            }
            
            // 点击模态框外部关闭
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    this.hideModal(modal);
                }
            });
        });
        
        // 通用模态框按钮
        document.getElementById('modalCancelBtn').addEventListener('click', () => {
            this.hideModal(document.getElementById('modal'));
        });
        
        document.getElementById('modalConfirmBtn').addEventListener('click', () => {
            this.hideModal(document.getElementById('modal'));
        });
    }

    // 设置表单事件
    setupFormEvents() {
        // 监听所有输入框变化
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updateConfigFromUI();
                this.isConfigModified = true;
                this.updateConfigStatus();
            });
        });
    }

    // 设置主进程事件监听
    setupMainProcessEvents() {
        if (window.electronAPI) {
            window.electronAPI.onNewConfig(() => this.newConfig());
            window.electronAPI.onLoadConfig((event, filePath) => this.loadConfigFromPath(filePath));
            window.electronAPI.onSaveConfig(() => this.saveConfig());
            window.electronAPI.onShowHelp(() => this.showHelp());
            window.electronAPI.onShowAbout(() => this.showAbout());
            window.electronAPI.onAppQuitting(() => this.handleAppQuitting());
        }
    }

    // 更新UI
    updateUI() {
        // 演出信息
        document.getElementById('showId').value = this.config.ticket.showId;
        document.getElementById('showName').value = this.config.ticket.showName;
        document.getElementById('venueName').value = this.config.ticket.venueName;
        
        if (this.config.ticket.showTime) {
            document.getElementById('showTime').value = this.formatDateTimeForInput(this.config.ticket.showTime);
        }
        if (this.config.ticket.ticketTime) {
            document.getElementById('ticketTime').value = this.formatDateTimeForInput(this.config.ticket.ticketTime);
        }
        
        // 票档信息
        this.updateTicketTypesList();
        document.getElementById('maxPrice').value = this.config.ticket.maxPrice;
        
        // 观演人信息
        this.updateViewersList();
        document.getElementById('maxViewers').value = this.config.ticket.maxViewers;
        
        // 收货地址
        document.getElementById('addressName').value = this.config.ticket.address.name;
        document.getElementById('addressPhone').value = this.config.ticket.address.phone;
        document.getElementById('addressProvince').value = this.config.ticket.address.province;
        document.getElementById('addressCity').value = this.config.ticket.address.city;
        document.getElementById('addressDistrict').value = this.config.ticket.address.district;
        document.getElementById('addressDetail').value = this.config.ticket.address.detail;
        
        // 策略配置
        document.getElementById('advanceTime').value = this.config.strategy.advanceTime;
        document.getElementById('refreshInterval').value = this.config.strategy.refreshInterval;
        document.getElementById('maxRetries').value = this.config.strategy.maxRetries;
        document.getElementById('concurrent').value = this.config.strategy.concurrent;
    }

    // 更新票档列表
    updateTicketTypesList() {
        const container = document.getElementById('ticketTypesList');
        container.innerHTML = '';
        
        this.config.ticket.ticketTypes.forEach((type, index) => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
                ${type}
                <span class="remove" onclick="configManager.removeTicketType(${index})">&times;</span>
            `;
            container.appendChild(tag);
        });
    }

    // 更新观演人列表
    updateViewersList() {
        const container = document.getElementById('viewersList');
        container.innerHTML = '';
        
        this.config.ticket.viewers.forEach((viewer, index) => {
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `
                ${viewer.name}
                <span class="remove" onclick="configManager.removeViewer(${index})">&times;</span>
            `;
            container.appendChild(tag);
        });
    }

    // 从UI更新配置
    updateConfigFromUI() {
        this.config.ticket.showId = document.getElementById('showId').value;
        this.config.ticket.showName = document.getElementById('showName').value;
        this.config.ticket.venueName = document.getElementById('venueName').value;
        
        const showTime = document.getElementById('showTime').value;
        if (showTime) {
            this.config.ticket.showTime = this.formatDateTimeFromInput(showTime);
        }
        
        const ticketTime = document.getElementById('ticketTime').value;
        if (ticketTime) {
            this.config.ticket.ticketTime = this.formatDateTimeFromInput(ticketTime);
        }
        
        this.config.ticket.maxPrice = parseInt(document.getElementById('maxPrice').value) || 0;
        this.config.ticket.maxViewers = parseInt(document.getElementById('maxViewers').value) || 4;
        
        this.config.ticket.address.name = document.getElementById('addressName').value;
        this.config.ticket.address.phone = document.getElementById('addressPhone').value;
        this.config.ticket.address.province = document.getElementById('addressProvince').value;
        this.config.ticket.address.city = document.getElementById('addressCity').value;
        this.config.ticket.address.district = document.getElementById('addressDistrict').value;
        this.config.ticket.address.detail = document.getElementById('addressDetail').value;
        
        this.config.strategy.advanceTime = parseInt(document.getElementById('advanceTime').value) || 1000;
        this.config.strategy.refreshInterval = parseInt(document.getElementById('refreshInterval').value) || 100;
        this.config.strategy.maxRetries = parseInt(document.getElementById('maxRetries').value) || 10;
        this.config.strategy.concurrent = parseInt(document.getElementById('concurrent').value) || 3;
    }

    // 解析演出URL
    parseShowUrl() {
        const url = document.getElementById('showUrl').value;
        if (!url) {
            this.showMessage('请输入演出页面URL', 'error');
            return;
        }
        
        const showId = window.utils.parseShowUrl(url);
        if (showId) {
            document.getElementById('showId').value = showId;
            this.config.ticket.showId = showId;
            this.isConfigModified = true;
            this.updateConfigStatus();
            this.showMessage(`成功解析演出ID: ${showId}`, 'success');
        } else {
            this.showMessage('无法解析演出ID，请检查URL格式', 'error');
        }
    }

    // 添加票档类型
    addTicketType() {
        const input = document.getElementById('ticketTypes');
        const type = input.value.trim();
        
        if (!type) {
            this.showMessage('请输入票档类型', 'error');
            return;
        }
        
        if (this.config.ticket.ticketTypes.includes(type)) {
            this.showMessage('票档类型已存在', 'error');
            return;
        }
        
        this.config.ticket.ticketTypes.push(type);
        input.value = '';
        this.updateTicketTypesList();
        this.isConfigModified = true;
        this.updateConfigStatus();
    }

    // 移除票档类型
    removeTicketType(index) {
        this.config.ticket.ticketTypes.splice(index, 1);
        this.updateTicketTypesList();
        this.isConfigModified = true;
        this.updateConfigStatus();
    }

    // 添加观演人
    addViewer() {
        const input = document.getElementById('viewerName');
        const name = input.value.trim();
        
        if (!name) {
            this.showMessage('请输入观演人姓名', 'error');
            return;
        }
        
        if (this.config.ticket.viewers.some(v => v.name === name)) {
            this.showMessage('观演人已存在', 'error');
            return;
        }
        
        this.config.ticket.viewers.push({ name, id: name });
        input.value = '';
        this.updateViewersList();
        this.isConfigModified = true;
        this.updateConfigStatus();
    }

    // 移除观演人
    removeViewer(index) {
        this.config.ticket.viewers.splice(index, 1);
        this.updateViewersList();
        this.isConfigModified = true;
        this.updateConfigStatus();
    }

    // 新建配置
    newConfig() {
        if (this.isConfigModified) {
            this.showConfirmDialog('配置已修改，是否保存当前配置？', () => {
                this.saveConfig();
                this.resetConfig();
            }, () => {
                this.resetConfig();
            });
        } else {
            this.resetConfig();
        }
    }

    // 重置配置
    resetConfig() {
        this.config = this.getDefaultConfig();
        this.currentConfigPath = null;
        this.isConfigModified = false;
        this.updateUI();
        this.updateConfigStatus();
        this.showMessage('配置已重置', 'success');
    }

    // 加载配置
    async loadConfig() {
        try {
            const result = await window.electronAPI.showOpenDialog({
                properties: ['openFile'],
                filters: [
                    { name: '配置文件', extensions: ['js', 'json'] }
                ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                await this.loadConfigFromPath(result.filePaths[0]);
            }
        } catch (error) {
            this.showMessage('加载配置失败: ' + error.message, 'error');
        }
    }

    // 从路径加载配置
    async loadConfigFromPath(filePath) {
        try {
            const result = await window.electronAPI.readConfigFile(filePath);
            
            if (result.success) {
                // 解析配置文件内容
                const configContent = result.content;
                let loadedConfig;
                
                if (filePath.endsWith('.json')) {
                    loadedConfig = JSON.parse(configContent);
                } else {
                    // 对于.js文件，需要提取export default部分
                    const match = configContent.match(/export\s+default\s+({[\s\S]*});?$/);
                    if (match) {
                        try {
                            loadedConfig = eval('(' + match[1] + ')');
                        } catch (e) {
                            throw new Error('配置文件格式错误');
                        }
                    } else {
                        throw new Error('无法解析配置文件');
                    }
                }
                
                this.config = { ...this.getDefaultConfig(), ...loadedConfig };
                this.currentConfigPath = filePath;
                this.isConfigModified = false;
                this.updateUI();
                this.updateConfigStatus();
                this.showMessage('配置加载成功', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showMessage('加载配置失败: ' + error.message, 'error');
        }
    }

    // 保存配置
    async saveConfig() {
        try {
            this.updateConfigFromUI();
            
            let filePath = this.currentConfigPath;
            if (!filePath) {
                const result = await window.electronAPI.showSaveDialog({
                    defaultPath: 'damai-config.js',
                    filters: [
                        { name: 'JavaScript文件', extensions: ['js'] },
                        { name: 'JSON文件', extensions: ['json'] }
                    ]
                });
                
                if (result.canceled) return;
                filePath = result.filePath;
            }
            
            let content;
            if (filePath.endsWith('.json')) {
                content = JSON.stringify(this.config, null, 2);
            } else {
                content = window.utils.generateConfigTemplate();
                // 替换模板中的配置值
                content = content.replace(/showId: '',/g, `showId: '${this.config.ticket.showId}',`);
                content = content.replace(/showName: '',/g, `showName: '${this.config.ticket.showName}',`);
                // ... 其他配置项替换
            }
            
            const result = await window.electronAPI.writeConfigFile(filePath, content);
            
            if (result.success) {
                this.currentConfigPath = filePath;
                this.isConfigModified = false;
                this.updateConfigStatus();
                this.showMessage('配置保存成功', 'success');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            this.showMessage('保存配置失败: ' + error.message, 'error');
        }
    }

    // 验证配置
    validateConfig() {
        this.updateConfigFromUI();
        const validation = window.utils.validateConfig(this.config);
        
        const resultDiv = document.getElementById('validationResult');
        if (validation.isValid) {
            resultDiv.className = 'validation-result success';
            resultDiv.innerHTML = '<i class="fas fa-check-circle"></i> 配置验证通过！';
        } else {
            resultDiv.className = 'validation-result error';
            resultDiv.innerHTML = '<i class="fas fa-exclamation-triangle"></i> 配置验证失败：<br>' + 
                                validation.errors.map(error => `• ${error}`).join('<br>');
        }
    }

    // 启动抢票机器人
    startBot() {
        this.updateConfigFromUI();
        const validation = window.utils.validateConfig(this.config);
        
        if (!validation.isValid) {
            this.showMessage('请先完成配置验证', 'error');
            return;
        }
        
        this.showConfirmDialog('确认启动抢票机器人？', () => {
            // 这里可以调用主进程启动抢票机器人
            this.showMessage('正在启动抢票机器人...', 'info');
            // TODO: 实现启动逻辑
        });
    }

    // WebView控制
    refreshWebView() {
        document.getElementById('damaiWebview').reload();
    }

    goBack() {
        const webview = document.getElementById('damaiWebview');
        if (webview.canGoBack()) {
            webview.goBack();
        }
    }

    goForward() {
        const webview = document.getElementById('damaiWebview');
        if (webview.canGoForward()) {
            webview.goForward();
        }
    }

    goHome() {
        document.getElementById('damaiWebview').loadURL('https://www.damai.cn');
    }

    // 显示帮助
    showHelp() {
        document.getElementById('helpModal').classList.add('show');
    }

    // 显示关于
    showAbout() {
        document.getElementById('aboutModal').classList.add('show');
    }

    // 隐藏模态框
    hideModal(modal) {
        modal.classList.remove('show');
    }

    // 显示确认对话框
    showConfirmDialog(message, onConfirm, onCancel) {
        const modal = document.getElementById('modal');
        document.getElementById('modalTitle').textContent = '确认';
        document.getElementById('modalBody').textContent = message;
        
        const confirmBtn = document.getElementById('modalConfirmBtn');
        const cancelBtn = document.getElementById('modalCancelBtn');
        
        // 移除旧的事件监听器
        confirmBtn.replaceWith(confirmBtn.cloneNode(true));
        cancelBtn.replaceWith(cancelBtn.cloneNode(true));
        
        // 添加新的事件监听器
        document.getElementById('modalConfirmBtn').addEventListener('click', () => {
            this.hideModal(modal);
            if (onConfirm) onConfirm();
        });
        
        document.getElementById('modalCancelBtn').addEventListener('click', () => {
            this.hideModal(modal);
            if (onCancel) onCancel();
        });
        
        modal.classList.add('show');
    }

    // 显示消息
    showMessage(message, type = 'info') {
        // 简单的消息提示实现
        console.log(`[${type.toUpperCase()}] ${message}`);
        
        // 可以在这里实现更美观的消息提示
        const messageDiv = document.createElement('div');
        messageDiv.className = `message message-${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 4px;
            color: white;
            z-index: 3000;
            animation: slideIn 0.3s ease-out;
        `;
        
        if (type === 'success') {
            messageDiv.style.background = '#28a745';
        } else if (type === 'error') {
            messageDiv.style.background = '#dc3545';
        } else if (type === 'warning') {
            messageDiv.style.background = '#ffc107';
            messageDiv.style.color = '#212529';
        } else {
            messageDiv.style.background = '#17a2b8';
        }
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }

    // 更新配置状态
    updateConfigStatus() {
        const statusElement = document.getElementById('configStatus');
        if (this.isConfigModified) {
            statusElement.textContent = '配置状态: 已修改';
            statusElement.style.color = '#ffc107';
        } else {
            statusElement.textContent = '配置状态: 已保存';
            statusElement.style.color = '#28a745';
        }
    }

    // 加载默认配置
    loadDefaultConfig() {
        // 可以在这里加载上次保存的配置
        this.updateConfigStatus();
    }

    // 处理应用退出
    handleAppQuitting() {
        if (this.isConfigModified) {
            this.saveConfig();
        }
    }

    // 工具函数
    formatDateTimeForInput(dateTime) {
        if (!dateTime) return '';
        const date = new Date(dateTime);
        if (isNaN(date.getTime())) return '';
        
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    formatDateTimeFromInput(inputValue) {
        if (!inputValue) return '';
        const date = new Date(inputValue);
        if (isNaN(date.getTime())) return '';
        return date.toISOString();
    }
}

// 全局实例
let configManager;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    configManager = new ConfigManager();
});

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style); 