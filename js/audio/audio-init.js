/**
 * 音效系统初始化模块
 * 提供简单的前端API接口，与主应用松耦合
 * 设计原则：独立、可复用、配置驱动
 */

// 全局音效管理器
window.AudioManager = {
    // 全局初始化函数
    initializeAudioSystem: async function() {
        const audioSystem = AudioSystem.getInstance();
        return await audioSystem.initialize({
            implementationsPath: './js/audio/config/sound-implementations.json',
            mappingsPath: './js/audio/config/sound-mappings.json'
        });
    },
    // 初始化状态
    isInitialized: false,
    
    /**
     * 初始化音效系统
     * @returns {Promise<boolean>} 初始化是否成功
     */
    initialize: async function() {
        try {
            console.log('🎵 开始初始化音效系统...');
            
            // 检查音效系统核心组件是否可用
            if (!window.AudioSystem || !window.AudioEventBus) {
                console.warn('音效系统组件未加载，将使用静音模式');
                this.isInitialized = false;
                return false;
            }
            
            // 初始化音效系统
            const success = await window.initializeAudioSystem();
            
            if (success) {
                console.log('🎵 音效系统初始化成功');
                this.isInitialized = true;
                this.setupGlobalEventListeners();
                return true;
            } else {
                console.warn('音效系统初始化失败，将使用静音模式');
                this.isInitialized = false;
                return false;
            }
            
        } catch (error) {
            console.error('音效系统初始化异常:', error);
            this.isInitialized = false;
            return false;
        }
    },
    
    /**
     * 设置全局事件监听器
     */
    setupGlobalEventListeners: function() {
        // 监听音效系统事件
        document.addEventListener('audioSystemInitialized', (event) => {
            console.log('🎵 音效系统已完全初始化', event.detail);
        });
        
        document.addEventListener('audioVolumeChanged', (event) => {
            console.log('🎵 音频音量已更新:', event.detail);
        });
    },
    
    /**
     * 播放音效事件（核心API）
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    playEvent: function(eventType, data = {}) {
        if (window.playAudioEvent) {
            window.playAudioEvent(eventType, data);
        } else {
            console.warn('🎵 音效系统未就绪，无法播放音效:', eventType);
        }
    },
    
    /**
     * 播放UI交互音效
     * @param {string} action - 交互动作
     * @param {Object} data - 附加数据
     */
    playUI: function(action, data = {}) {
        this.playEvent(`ui_${action}`, data);
    },
    
    /**
     * 播放游戏逻辑音效
     * @param {string} action - 游戏动作
     * @param {Object} data - 附加数据
     */
    playGame: function(action, data = {}) {
        this.playEvent(`game_${action}`, data);
    },
    
    /**
     * 播放生产流程音效
     * @param {string} action - 生产动作
     * @param {Object} data - 附加数据
     */
    playProduction: function(action, data = {}) {
        this.playEvent(`production_${action}`, data);
    },
    
    /**
     * 设置音量
     * @param {number} volume - 音量值 (0-1)
     */
    setVolume: function(volume) {
        if (window.AudioSystem && window.AudioSystem.setMasterVolume) {
            window.AudioSystem.setMasterVolume(volume);
        }
    },
    
    /**
     * 启用/禁用音效
     * @param {boolean} enabled - 是否启用
     */
    setEnabled: function(enabled) {
        if (window.AudioSystem && window.AudioSystem.setEnabled) {
            window.AudioSystem.setEnabled(enabled);
        }
    },
    
    /**
     * 获取音效系统状态
     * @returns {Object} 状态信息
     */
    getStatus: function() {
        return {
            initialized: !!window.AudioSystem,
            enabled: window.AudioSystem ? window.AudioSystem.enabled : false,
            volume: window.AudioSystem ? window.AudioSystem.masterVolume : 0
        };
    }
};

// 延迟初始化音效系统，等待用户交互
window.addEventListener('DOMContentLoaded', function() {
    let initialized = false;
    
    // 用户交互时初始化音效系统
    const initializeOnInteraction = async function(event) {
        if (!initialized && !window.AudioManager.isInitialized) {
            initialized = true;
            
            // 记录点击事件信息，用于初始化后播放音效
            const interactionEvent = {
                type: event.type,
                target: event.target,
                timestamp: Date.now()
            };
            
            // 立即移除事件监听器，避免重复初始化
            document.removeEventListener('click', initializeOnInteraction);
            document.removeEventListener('touchstart', initializeOnInteraction);
            document.removeEventListener('keydown', initializeOnInteraction);
            
            // 不阻止事件冒泡，让首次点击能正常触发音效
            // 初始化音效系统
            await window.AudioManager.initialize();
            
            // 初始化完成后，如果点击的是可交互元素，尝试播放对应的音效
            if (interactionEvent.target && interactionEvent.target.hasAttribute('data-audio-event')) {
                const eventType = interactionEvent.target.getAttribute('data-audio-event');
                setTimeout(() => {
                    window.AudioManager.playEvent(eventType);
                }, 100);
            }
        }
    };
    
    // 添加用户交互事件监听器（使用捕获阶段，避免事件冒泡）
    document.addEventListener('click', initializeOnInteraction, { 
        once: true, 
        capture: true 
    });
    document.addEventListener('touchstart', initializeOnInteraction, { 
        once: true, 
        capture: true 
    });
    document.addEventListener('keydown', initializeOnInteraction, { 
        once: true, 
        capture: true 
    });
    
    // 如果5秒后还没有用户交互，尝试静默初始化（可能失败但不会阻塞）
    setTimeout(async () => {
        if (!initialized && !window.AudioManager.isInitialized) {
            console.log('🎵 尝试静默初始化音效系统...');
            await window.AudioManager.initialize();
        }
    }, 5000);
});