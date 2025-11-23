/**
 * 音效系统核心类
 * @fileoverview 音效系统主控制器，协调各个子系统工作
 * @author 像素猫粮工厂开发团队
 * @version 1.0.0
 * @created 2025-11-23
 */

class AudioSystem {
    static instance = null;
    
    constructor() {
        this.audioContext = null;
        this.soundFactory = null;
        this.soundMapping = null;
        this.audioSettings = null;
        this.isInitialized = false;
        this.activeSounds = new Set();
        this.soundQueue = [];
        this.maxConcurrentSounds = 8;
    }
    
    /**
     * 获取音效系统单例实例
     * @returns {AudioSystem} 音效系统实例
     */
    static getInstance() {
        if (!AudioSystem.instance) {
            AudioSystem.instance = new AudioSystem();
        }
        return AudioSystem.instance;
    }
    
    /**
     * 初始化音效系统
     * @param {Object} config - 配置对象
     * @param {string} config.mappingsPath - 音效映射配置文件路径
     * @param {string} config.implementationsPath - 音效实现配置文件路径
     * @returns {Promise<boolean>} 初始化结果
     */
    async initialize(config = {}) {
        try {
            console.log('开始初始化音效系统...');
            
            // 1. 初始化音频设置系统
            this.audioSettings = window.AudioSettings;
            await this.audioSettings.initialize();
            
            // 2. 创建AudioContext
            await this.createAudioContext();
            
            // 3. 初始化音效映射系统
            this.soundMapping = new window.SoundMappingSystem();
            if (config.mappingsPath) {
                await this.soundMapping.initialize(config.mappingsPath);
            } else {
                await this.soundMapping.initialize();
            }
            
            // 4. 初始化音效工厂
            this.soundFactory = new SoundFactory(this.audioContext);
            if (config.implementationsPath) {
                await this.soundFactory.initialize(config.implementationsPath);
            } else {
                await this.soundFactory.initialize();
            }
            
            // 5. 设置事件监听
            this.setupEventListeners();
            
            // 6. 预加载关键音效
            await this.preloadCriticalSounds();
            
            this.isInitialized = true;
            console.log('🎵 音效系统初始化完成');
            
            // 触发初始化完成事件
            this.notifyInitializationComplete();
            
            return true;
        } catch (error) {
            console.error('音效系统初始化失败:', error);
            this.isInitialized = false;
            return false;
        }
    }
    
    /**
     * 创建AudioContext
     */
    async createAudioContext() {
        try {
            // 创建AudioContext（兼容不同浏览器）
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('浏览器不支持Web Audio API');
            }
            
            this.audioContext = new AudioContextClass({
                latencyHint: 'interactive'
            });
            
            // 处理用户交互解锁音频
            if (this.audioContext.state === 'suspended') {
                console.log('AudioContext被挂起，等待用户交互...');
                // 不立即解锁，等待用户交互
                this.setupAudioContextResumeHandler();
            } else {
                console.log('AudioContext创建成功，状态:', this.audioContext.state);
            }
            
            return true;
        } catch (error) {
            console.error('创建AudioContext失败:', error);
            // 创建失败时设置静音模式
            this.audioContext = null;
            return false;
        }
    }
    
    /**
     * 设置AudioContext恢复处理器
     */
    setupAudioContextResumeHandler() {
        const resumeAudioContext = async () => {
            if (!this.audioContext || this.audioContext.state !== 'suspended') {
                return;
            }
            
            try {
                await this.audioContext.resume();
                console.log('🎵 AudioContext已通过用户交互解锁，状态:', this.audioContext.state);
                
                // 触发初始化完成事件
                this.notifyInitializationComplete();
                
                // 用户交互后重新尝试预加载关键音效
                if (this.audioSettings.getPerformanceSettings().preloadEnabled) {
                    console.log('🎵 用户交互后重新尝试预加载关键音效...');
                    this.preloadCriticalSounds().catch(error => {
                        console.warn('用户交互后预加载音效失败:', error);
                    });
                }
                
                // 移除事件监听器
                document.removeEventListener('click', resumeAudioContext);
                document.removeEventListener('touchstart', resumeAudioContext);
                document.removeEventListener('keydown', resumeAudioContext);
            } catch (error) {
                console.warn('AudioContext解锁失败:', error);
            }
        };
        
        // 添加用户交互事件监听器
        document.addEventListener('click', resumeAudioContext, { once: true });
        document.addEventListener('touchstart', resumeAudioContext, { once: true });
        document.addEventListener('keydown', resumeAudioContext, { once: true });
        
        console.log('已设置AudioContext恢复处理器，等待用户交互...');
    }
    
    /**
     * 解锁AudioContext（需要用户交互）
     */
    async unlockAudioContext() {
        if (!this.audioContext) {
            return false;
        }
        
        try {
            await this.audioContext.resume();
            console.log('AudioContext已解锁');
            return true;
        } catch (error) {
            console.warn('AudioContext解锁失败:', error);
            return false;
        }
    }
    
    /**
     * 设置事件监听
     */
    setupEventListeners() {
        // 监听音效事件总线
        const eventBus = window.AudioEventBus;
        
        // 先取消之前的订阅（避免重复订阅）
        if (this.eventBusSubscription) {
            eventBus.unsubscribe('*', this.eventBusSubscription);
        }
        
        // 订阅所有音效事件
        this.eventBusSubscription = (data) => {
            this.handleAudioEvent(data.eventType, data);
        };
        eventBus.subscribe('*', this.eventBusSubscription);
        
        // 监听音频设置变化
        document.addEventListener('audioVolumeChanged', (event) => {
            this.handleVolumeChange(event.detail);
        });
        
        document.addEventListener('audioEnabledChanged', (event) => {
            this.handleEnabledChange(event.detail);
        });
        
        // 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        console.log('音效系统事件监听器设置完成');
    }
    
    /**
     * 预加载关键音效
     */
    async preloadCriticalSounds() {
        if (!this.audioSettings.getPerformanceSettings().preloadEnabled) {
            return;
        }
        
        // 检查AudioContext状态，如果被挂起则等待用户交互
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('AudioContext被挂起，等待用户交互后再预加载音效...');
            return; // 暂时跳过预加载，等待用户交互后重新尝试
        }
        
        // 如果没有AudioContext，暂时跳过预加载
        if (!this.audioContext) {
            console.log('AudioContext不存在，等待初始化完成后再预加载音效...');
            return;
        }
        
        const criticalSounds = [
            'click_sound', 'hover_sound', 'slider_move', 'slider_release',
            'coin_sound', 'level_up_sound', 'machine_start', 'success_sound','production_complete'
        ];
        
        console.log('开始预加载关键音效...');
        
        for (const soundName of criticalSounds) {
            try {
                await this.soundFactory.preloadSound(soundName);
            } catch (error) {
                console.warn(`预加载音效失败: ${soundName}`, error);
            }
        }
        
        console.log('关键音效预加载完成');
    }
    
    /**
     * 处理音效事件
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    async handleAudioEvent(eventType, data) {
        console.log(`🎵 处理音效事件: ${eventType}`, data);
        if (!this.isInitialized) {
            console.log(`🎵 音效系统未初始化，忽略事件: ${eventType}`);
            return;
        }
        
        if (!this.audioSettings.getVolume()) {
            console.log(`🎵 音量为0，忽略事件: ${eventType}`);
            return;
        }
        
        try {
            // 1. 通过映射系统获取音效名称
            const soundName = this.soundMapping.getSoundForAction(eventType, data);
            console.log(`🔍 映射事件 ${eventType} 到音效: ${soundName || '未找到'}`);
            if (!soundName) {
                console.debug(`未找到事件 ${eventType} 的音效映射`);
                return;
            }
            
            // 2. 检查并发音效数量限制
            if (this.activeSounds.size >= this.maxConcurrentSounds) {
                console.warn(`达到最大并发音效限制 (${this.maxConcurrentSounds})，音效 ${soundName} 被忽略`);
                return;
            }
            
            // 3. 播放音效
            console.log(`▶️ 准备播放音效: ${soundName}`);
            await this.playSound(soundName, {
                eventType: eventType,
                eventData: data
            });
            
        } catch (error) {
            console.error(`处理音效事件失败 [${eventType}]:`, error);
        }
    }
    
    /**
     * 播放音效
     * @param {string} soundName - 音效名称
     * @param {Object} options - 播放选项
     * @returns {Promise<boolean>} 播放是否成功
     */
    async playSound(soundName, options = {}) {
        if (!this.isInitialized) {
            console.warn('音效系统未初始化');
            return false;
        }
        
        // 检查AudioContext状态
        if (this.audioContext && this.audioContext.state === 'suspended') {
            console.log('AudioContext被挂起，尝试恢复...');
            const resumed = await this.unlockAudioContext();
            if (!resumed) {
                console.warn('AudioContext恢复失败，音效播放被忽略');
                return false;
            }
        }
        
        // 如果没有AudioContext，尝试创建
        if (!this.audioContext) {
            console.warn('AudioContext不存在，无法播放音效');
            return false;
        }
        
        try {
            // 检查音效是否启用
            const category = this.getSoundCategory(soundName);
            const volume = this.audioSettings.getVolume(category);
            if (volume <= 0) {
                return false;
            }
            
            // 生成音效
            const source = await this.soundFactory.generateSound(soundName, options);
            
            // 设置音量
            this.applyVolumeToSource(source, volume);
            
            // 跟踪活跃音效
            this.trackActiveSound(source, soundName);
            
            // 设置音效结束回调
            source.onended = () => {
                this.activeSounds.delete(source);
            };
            
            if (this.audioSettings.getDebugSettings().loggingEnabled) {
                console.log(`播放音效: ${soundName}`, { volume, category });
            }
            
            return true;
        } catch (error) {
            console.error(`播放音效失败: ${soundName}`, error);
            return false;
        }
    }
    
    /**
     * 获取音效分类
     * @param {string} soundName - 音效名称
     * @returns {string} 音效分类
     */
    getSoundCategory(soundName) {
        // 简单的分类映射，可以根据需要扩展
        if (soundName.includes('click') || soundName.includes('hover') || soundName.includes('slider')) {
            return 'ui';
        } else if (soundName.includes('coin') || soundName.includes('level') || soundName.includes('success')) {
            return 'game';
        } else if (soundName.includes('machine') || soundName.includes('production')) {
            return 'production';
        } else if (soundName.includes('music') || soundName.includes('ambient')) {
            return 'music';
        }
        return 'game'; // 默认分类
    }
    
    /**
     * 应用音量到音频源
     * @param {AudioNode} source - 音频源
     * @param {number} volume - 音量
     */
    applyVolumeToSource(source, volume) {
        // 如果源已经有增益节点，使用它
        if (source.gainNode) {
            source.gainNode.gain.value = volume;
        } else {
            // 否则创建新的增益节点
            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = volume;
            
            // 重新连接音频流
            source.disconnect();
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            source.gainNode = gainNode;
        }
    }
    
    /**
     * 跟踪活跃音效
     * @param {AudioNode} source - 音频源
     * @param {string} soundName - 音效名称
     */
    trackActiveSound(source, soundName) {
        this.activeSounds.add(source);
        
        // 设置清理回调
        const originalOnended = source.onended;
        source.onended = () => {
            this.activeSounds.delete(source);
            if (originalOnended) {
                originalOnended.call(source);
            }
        };
        
        // 设置超时清理（安全措施）
        setTimeout(() => {
            if (this.activeSounds.has(source)) {
                console.warn(`音效 ${soundName} 超时未结束，强制清理`);
                this.activeSounds.delete(source);
                try {
                    source.stop();
                } catch (e) {
                    // 忽略停止错误
                }
            }
        }, 10000); // 10秒超时
    }
    
    /**
     * 处理音量变化
     * @param {Object} detail - 事件详情
     */
    handleVolumeChange(detail) {
        // 更新所有活跃音效的音量
        this.activeSounds.forEach(source => {
            if (source.gainNode) {
                const soundName = source.soundName || 'unknown';
                const category = this.getSoundCategory(soundName);
                const volume = this.audioSettings.getVolume(category);
                
                source.gainNode.gain.value = volume;
            }
        });
        
        console.log('音量已更新:', detail);
    }
    
    /**
     * 处理启用状态变化
     * @param {Object} detail - 事件详情
     */
    handleEnabledChange(detail) {
        if (!detail.enabled) {
            // 禁用时停止所有音效
            this.stopAllSounds();
        }
        console.log('音效系统启用状态已更新:', detail);
    }
    
    /**
     * 处理页面可见性变化
     */
    handleVisibilityChange() {
        if (document.hidden) {
            // 页面隐藏时暂停音频上下文以节省资源
            if (this.audioContext && this.audioContext.state === 'running') {
                this.audioContext.suspend().then(() => {
                    console.log('AudioContext已暂停（页面隐藏）');
                });
            }
        } else {
            // 页面显示时恢复音频上下文
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('AudioContext已恢复（页面显示）');
                });
            }
        }
    }
    
    /**
     * 停止所有音效
     */
    stopAllSounds() {
        this.activeSounds.forEach(source => {
            try {
                source.stop();
            } catch (error) {
                // 忽略停止错误
            }
        });
        this.activeSounds.clear();
        console.log('所有音效已停止');
    }
    
    /**
     * 暂停音效系统
     */
    async pause() {
        if (this.audioContext && this.audioContext.state === 'running') {
            await this.audioContext.suspend();
            console.log('音效系统已暂停');
        }
    }
    
    /**
     * 恢复音效系统
     */
    async resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('音效系统已恢复');
        }
    }
    
    /**
     * 通知初始化完成
     */
    notifyInitializationComplete() {
        const event = new CustomEvent('audioSystemInitialized', {
            detail: {
                timestamp: Date.now(),
                settings: this.audioSettings.getAllSettings(),
                stats: this.getSystemStats()
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 获取系统统计信息
     * @returns {Object} 系统统计
     */
    getSystemStats() {
        return {
            isInitialized: this.isInitialized,
            audioContextState: this.audioContext ? this.audioContext.state : 'none',
            activeSounds: this.activeSounds.size,
            maxConcurrentSounds: this.maxConcurrentSounds,
            soundQueueLength: this.soundQueue.length,
            mappingStats: this.soundMapping ? this.soundMapping.getAllMappings() : {},
            factoryStats: this.soundFactory ? this.soundFactory.getImplementationStats() : {}
        };
    }
    
    /**
     * 销毁音效系统
     */
    async destroy() {
        this.stopAllSounds();
        
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isInitialized = false;
        AudioSystem.instance = null;
        
        console.log('音效系统已销毁');
    }
}

// 全局初始化函数
window.initializeAudioSystem = async function() {
    const audioSystem = AudioSystem.getInstance();
    return await audioSystem.initialize({
        implementationsPath: './js/audio/config/sound-implementations.json',
        mappingsPath: './js/audio/config/sound-mappings.json'
    });
};

// 全局播放音效函数
window.playAudioEvent = async function(eventType, data = {}) {
    const audioSystem = AudioSystem.getInstance();
    if (!audioSystem.isInitialized) {
        console.warn('音效系统未初始化，无法播放音效');
        return false;
    }
    
    // 检查AudioContext状态
    if (audioSystem.audioContext && audioSystem.audioContext.state === 'suspended') {
        console.log('AudioContext被挂起，尝试恢复...');
        const resumed = await audioSystem.unlockAudioContext();
        if (!resumed) {
            console.warn('AudioContext恢复失败，音效播放被忽略');
            return false;
        }
    }
    
    // 如果没有AudioContext，尝试创建
    if (!audioSystem.audioContext) {
        console.warn('AudioContext不存在，无法播放音效');
        return false;
    }
    
    // 通过事件总线触发音效
    const audioEvent = new CustomEvent('audioEvent', {
        detail: {
            type: eventType,
            timestamp: Date.now(),
            data: data
        }
    });
    document.dispatchEvent(audioEvent);
    
    return true;
};

// 导出类
window.AudioSystem = AudioSystem;