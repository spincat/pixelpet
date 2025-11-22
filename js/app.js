/**
 * 像素猫粮工厂 - 主应用模块
 * 负责页面核心业务逻辑和状态管理
 * 遵循模块化、轻量化、高性能设计原则
 */

// ==================== 1. 应用状态管理 ====================

/**
 * 应用全局状态对象
 * 集中管理所有应用状态，便于维护和调试
 */
const AppState = {
    // 当前选中的服务类型
    selectedService: 'premium',
    
    // 当前选中的表情符号
    selectedEmoji: '🐱',
    
    // 当前生产步骤索引
    currentStep: 0,
    
    // 生产流程配置值
    processConfig: {
        recipe: 75,
        production: 80,
        quality: 90,
        packaging: 70,
        logistics: 85
    }
};

// ==================== 2. DOM 元素缓存 ====================

/**
 * DOM 元素缓存对象
 * 避免重复查询DOM，提升性能
 */
const DOMCache = {
    // 滑块相关元素
    sliders: {
        recipe: document.getElementById('recipeSlider'),
        production: document.getElementById('productionSlider'),
        quality: document.getElementById('qualitySlider'),
        packaging: document.getElementById('packagingSlider'),
        logistics: document.getElementById('logisticsSlider')
    },
    
    // 滑块值显示元素
    sliderValues: {
        recipe: document.getElementById('recipeValue'),
        production: document.getElementById('productionValue'),
        quality: document.getElementById('qualityValue'),
        packaging: document.getElementById('packagingValue'),
        logistics: document.getElementById('logisticsValue')
    },
    
    // 步骤显示元素
    stepValues: {
        recipe: document.getElementById('step1-value'),
        production: document.getElementById('step2-value'),
        quality: document.getElementById('step3-value'),
        packaging: document.getElementById('step4-value'),
        logistics: document.getElementById('step5-value')
    },
    
    // 步骤元素
    steps: {
        recipe: document.getElementById('step-1'),
        production: document.getElementById('step-2'),
        quality: document.getElementById('step-3'),
        packaging: document.getElementById('step-4'),
        logistics: document.getElementById('step-5')
    },
    
    // 连接线元素
    connectors: {
        recipe: document.getElementById('connector-1'),
        production: document.getElementById('connector-2'),
        quality: document.getElementById('connector-3'),
        packaging: document.getElementById('connector-4'),
        logistics: document.getElementById('connector-5')
    },
    
    // 产品输出相关元素
    productOutput: document.getElementById('product-output'),
    productEmoji: document.getElementById('product-emoji'),
    productTitle: document.getElementById('product-title'),
    productImage: document.getElementById('product-image'),
    productionDate: document.getElementById('production-date'),
    expiryDate: document.getElementById('expiry-date'),
    trackingNumber: document.getElementById('tracking-number'),
    
    // 统计数据元素
    stats: {
        recipe: document.getElementById('stat-recipe'),
        production: document.getElementById('stat-production'),
        quality: document.getElementById('stat-quality'),
        packaging: document.getElementById('stat-packaging'),
        logistics: document.getElementById('stat-logistics'),
        cost: document.getElementById('stat-cost')
    }
};

// ==================== 3. 工具函数模块 ====================

/**
 * 工具函数集合
 * 提供通用的辅助功能
 */
const Utils = {
    
    /**
     * 根据数值获取质量标签
     * @param {number} value - 质量数值 (0-100)
     * @returns {string} 质量标签
     */
    getQualityLabel: function(value) {
        if (value >= 80) return '优秀';
        if (value >= 60) return '良好';
        return '一般';
    },
    
    /**
     * 根据总分获取成本标签
     * @param {number} totalScore - 总分
     * @returns {string} 成本标签
     */
    getCostLabel: function(totalScore) {
        if (totalScore >= 80) return '高';
        if (totalScore >= 60) return '中等';
        return '低';
    },
    
    /**
     * 根据流程类型获取步骤编号
     * @param {string} type - 流程类型
     * @returns {number} 步骤编号
     */
    getStepNumber: function(type) {
        const stepMap = {
            'recipe': 1,
            'production': 2,
            'quality': 3,
            'packaging': 4,
            'logistics': 5
        };
        return stepMap[type];
    },
    
    /**
     * 根据步骤编号获取流程类型
     * @param {number} step - 步骤编号
     * @returns {string} 流程类型
     */
    getTypeFromStep: function(step) {
        const typeMap = {
            1: 'recipe',
            2: 'production', 
            3: 'quality',
            4: 'packaging',
            5: 'logistics'
        };
        return typeMap[step];
    },
    
    /**
     * 根据流程类型获取颜色
     * @param {string} type - 流程类型
     * @returns {string} 颜色值
     */
    getProcessColor: function(type) {
        const colorMap = {
            'recipe': '#FF6B6B',
            'production': '#4ECDC4',
            'quality': '#45B7D1',
            'packaging': '#96CEB4',
            'logistics': '#FFE66D'
        };
        return colorMap[type];
    }
};

// ==================== 4. 滑块控制模块 ====================

/**
 * 滑块控制模块
 * 负责滑块值的更新和显示
 */
const SliderController = {
    
    /**
     * 初始化所有滑块
     * 设置初始值并更新显示
     */
    initialize: function() {
        this.updateSlider('recipe');
        this.updateSlider('production');
        this.updateSlider('quality');
        this.updateSlider('packaging');
        this.updateSlider('logistics');
    },
    
    /**
     * 更新指定类型的滑块
     * @param {string} type - 滑块类型
     */
    updateSlider: function(type) {
        const slider = DOMCache.sliders[type];
        const valueDisplay = DOMCache.sliderValues[type];
        const stepValue = DOMCache.stepValues[type];
        const stepElement = DOMCache.steps[type];
        
        const value = slider.value;
        
        // 更新状态
        AppState.processConfig[type] = parseInt(value);
        
        // 更新显示
        valueDisplay.textContent = value + '%';
        stepValue.textContent = value + '%';
        
        // 更新步骤透明度
        const opacity = value / 100;
        stepElement.style.opacity = opacity;
        
        // 更新连接线颜色
        this.updateConnectorColor(type, value);
    },
    
    /**
     * 更新连接线颜色
     * @param {string} type - 流程类型
     * @param {number} value - 数值
     */
    updateConnectorColor: function(type, value) {
        const stepNumber = Utils.getStepNumber(type);
        const connectorElement = DOMCache.connectors[type];
        
        const color = Utils.getProcessColor(type);
        const opacity = value / 100;
        
        connectorElement.style.background = color;
        connectorElement.style.opacity = opacity;
    }
};

// ==================== 5. 界面交互模块 ====================

/**
 * 界面交互模块
 * 负责用户交互事件处理
 */
const UIController = {
    
    /**
     * 选择表情符号
     * @param {HTMLElement} element - 点击的表情元素
     */
    selectEmoji: function(element) {
        // 移除其他选中状态
        document.querySelectorAll('.emoji-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        
        // 设置当前选中
        element.classList.add('selected');
        AppState.selectedEmoji = element.getAttribute('data-emoji');
    },
    
    /**
     * 选择服务类型
     * @param {string} serviceType - 服务类型
     * @param {Event} event - 事件对象
     */
    selectService: function(serviceType, event) {
        // 移除其他选中状态
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('active');
        });
        
        // 设置当前选中
        event.currentTarget.classList.add('active');
        AppState.selectedService = serviceType;
    },
    
    /**
     * 启动生产流程
     */
    launchProduction: function() {
        ProductionController.resetProcess();
        ProductionController.startProductionAnimation();
    },
    
    /**
     * 重置系统
     */
    resetSystem: function() {
        AppState.selectedService = 'premium';
        AppState.currentStep = 0;
        
        // 重置UI状态
        this.resetUIState();
        
        // 重置滑块值
        this.resetSliders();
        
        // 重置生产流程
        ProductionController.resetProcess();
        
        // 隐藏产品输出
        DOMCache.productOutput.classList.remove('show');
    },
    
    /**
     * 重置UI状态
     */
    resetUIState: function() {
        // 重置服务卡片
        document.querySelectorAll('.service-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector('.service-card').classList.add('active');
        
        // 重置表情选择
        document.querySelectorAll('.emoji-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        document.querySelector('.emoji-option').classList.add('selected');
        AppState.selectedEmoji = '🐱';
    },
    
    /**
     * 重置滑块值
     */
    resetSliders: function() {
        DOMCache.sliders.recipe.value = 75;
        DOMCache.sliders.production.value = 80;
        DOMCache.sliders.quality.value = 90;
        DOMCache.sliders.packaging.value = 70;
        DOMCache.sliders.logistics.value = 85;
        
        SliderController.initialize();
    }
};

// ==================== 6. 生产流程控制模块 ====================

/**
 * 生产流程控制模块
 * 负责生产动画和流程控制
 */
const ProductionController = {
    
    /**
     * 启动生产动画
     */
    startProductionAnimation: function() {
        AppState.currentStep = 0;
        const steps = [1, 2, 3, 4, 5];
        const stepValues = [
            AppState.processConfig.recipe,
            AppState.processConfig.production,
            AppState.processConfig.quality,
            AppState.processConfig.packaging,
            AppState.processConfig.logistics
        ];
        
        const processInterval = setInterval(() => {
            if (AppState.currentStep < steps.length) {
                this.activateStep(steps[AppState.currentStep], stepValues[AppState.currentStep]);
                AppState.currentStep++;
            } else {
                clearInterval(processInterval);
                this.showFinalProduct();
            }
        }, 800);
    },
    
    /**
     * 激活指定步骤
     * @param {number} stepNumber - 步骤编号
     * @param {number} value - 步骤值
     */
    activateStep: function(stepNumber, value) {
        const stepElement = document.getElementById(`step-${stepNumber}`);
        const connectorElement = document.getElementById(`connector-${stepNumber}`);
        
        stepElement.classList.add('active');
        connectorElement.classList.add('active');
        
        setTimeout(() => {
            stepElement.classList.add('completed');
            stepElement.classList.remove('active');
        }, 600);
    },
    
    /**
     * 显示最终产品
     */
    showFinalProduct: function() {
        const brandName = document.getElementById('brandName').value || '喵星人优选';
        
        // 更新产品信息
        this.updateProductInfo(brandName);
        
        // 显示产品输出
        DOMCache.productOutput.classList.add('show');
    },
    
    /**
     * 更新产品信息
     * @param {string} brandName - 品牌名称
     */
    updateProductInfo: function(brandName) {
        // 更新基础信息
        DOMCache.productEmoji.textContent = AppState.selectedEmoji;
        DOMCache.productTitle.textContent = brandName;
        DOMCache.productImage.innerHTML = AppState.selectedEmoji + '🍖';
        
        // 更新日期信息
        this.updateDateInfo();
        
        // 更新统计数据
        this.updateStats();
        
        // 生成物流单号
        this.generateTrackingNumber();
    },
    
    /**
     * 更新日期信息
     */
    updateDateInfo: function() {
        const productionDate = new Date();
        const expiryDate = new Date(productionDate);
        expiryDate.setMonth(expiryDate.getMonth() + 18);
        
        DOMCache.productionDate.textContent = productionDate.toISOString().split('T')[0];
        DOMCache.expiryDate.textContent = '18个月';
    },
    
    /**
     * 更新统计数据
     */
    updateStats: function() {
        DOMCache.stats.recipe.textContent = Utils.getQualityLabel(AppState.processConfig.recipe);
        DOMCache.stats.production.textContent = Utils.getQualityLabel(AppState.processConfig.production);
        DOMCache.stats.quality.textContent = AppState.processConfig.quality >= 60 ? '通过' : '不通过';
        DOMCache.stats.packaging.textContent = Utils.getQualityLabel(AppState.processConfig.packaging);
        DOMCache.stats.logistics.textContent = Utils.getQualityLabel(AppState.processConfig.logistics);
        
        // 计算预估成本
        const totalScore = (AppState.processConfig.recipe + AppState.processConfig.production + 
                          AppState.processConfig.packaging + AppState.processConfig.logistics) / 4;
        DOMCache.stats.cost.textContent = Utils.getCostLabel(totalScore);
    },
    
    /**
     * 生成物流单号
     */
    generateTrackingNumber: function() {
        DOMCache.trackingNumber.textContent = `TRK-${Date.now().toString().slice(-8)}`;
    },
    
    /**
     * 重置生产流程
     */
    resetProcess: function() {
        for (let i = 1; i <= 5; i++) {
            const stepElement = document.getElementById(`step-${i}`);
            const connectorElement = document.getElementById(`connector-${i}`);
            
            stepElement.classList.remove('active', 'completed');
            connectorElement.classList.remove('active');
            
            // 重置步骤透明度
            const type = Utils.getTypeFromStep(i);
            const value = AppState.processConfig[type];
            stepElement.style.opacity = value / 100;
            SliderController.updateConnectorColor(type, value);
        }
    }
};

// ==================== 7. 产品分享模块 ====================

/**
 * 产品分享模块
 * 负责产品信息的分享和下载
 */
const ProductSharing = {
    
    /**
     * 分享产品信息
     */
    shareProduct: function() {
        const productData = this.getProductData();
        const shareText = this.generateShareText(productData);
        
        if (navigator.share) {
            navigator.share({
                title: '我的定制猫粮产品',
                text: shareText,
                url: window.location.href
            });
        } else {
            this.copyToClipboard(shareText);
        }
    },
    
    /**
     * 获取产品数据
     * @returns {Object} 产品数据对象
     */
    getProductData: function() {
        return {
            brand: document.getElementById('brandName').value,
            emoji: AppState.selectedEmoji,
            recipe: AppState.processConfig.recipe,
            production: AppState.processConfig.production,
            quality: AppState.processConfig.quality,
            packaging: AppState.processConfig.packaging,
            logistics: AppState.processConfig.logistics,
            tracking: DOMCache.trackingNumber.textContent
        };
    },
    
    /**
     * 生成分享文本
     * @param {Object} productData - 产品数据
     * @returns {string} 分享文本
     */
    generateShareText: function(productData) {
        return `🐱 我的定制猫粮产品！\n品牌：${productData.brand} ${productData.emoji}\n配方：${productData.recipe}%\n生产：${productData.production}%\n物流单号：${productData.tracking}\n#像素猫粮工厂 #定制宠物食品`;
    },
    
    /**
     * 复制到剪贴板
     * @param {string} text - 要复制的文本
     */
    copyToClipboard: function(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert('产品信息已复制到剪贴板！📋\n\n' + text);
        });
    },
    
    /**
     * 下载产品卡片
     */
    downloadProductCard: function() {
        const productCard = document.getElementById('product-card');
        const productActions = document.getElementById('product-actions');
        
        // 下载前隐藏操作按钮
        productActions.style.display = 'none';
        
        html2canvas(productCard, {
            backgroundColor: '#DCEDC8',
            scale: 2,
            useCORS: true
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `猫粮产品-${document.getElementById('brandName').value || '定制'}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // 下载完成后恢复显示操作按钮
            setTimeout(() => {
                productActions.style.display = 'flex';
            }, 100);
        }).catch(error => {
            console.error('下载产品卡片失败:', error);
            // 出错时也要恢复显示操作按钮
            productActions.style.display = 'flex';
        });
    }
};

// ==================== 8. 应用初始化 ====================

/**
 * 应用初始化函数
 * 在DOM加载完成后执行
 */
function initializeApp() {
    // 初始化滑块
    SliderController.initialize();
    
    // 设置默认表情
    UIController.selectEmoji(document.querySelector('.emoji-option'));
    
    console.log('🐱 像素猫粮工厂应用初始化完成！');
}

// DOM加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initializeApp);