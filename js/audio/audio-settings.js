/**
 * 音频设置系统
 * @fileoverview 管理音频系统的全局设置和音量控制
 * @author 像素猫粮工厂开发团队
 * @version 1.0.0
 * @created 2025-11-23
 */

class AudioSettings {
    constructor() {
        this.settings = {
            // 全局音频设置
            global: {
                enabled: true,
                masterVolume: 0.8,
                mute: false
            },
            
            // 音效分类音量控制
            categories: {
                ui: { volume: 0.7, enabled: true },
                game: { volume: 0.8, enabled: true },
                music: { volume: 0.6, enabled: true },
                environment: { volume: 0.5, enabled: true },
                production: { volume: 0.9, enabled: true },
                customer: { volume: 0.7, enabled: true }
            },
            
            // 性能优化设置
            performance: {
                maxConcurrentSounds: 8,
                bufferPoolSize: 10,
                preloadEnabled: true,
                compressionEnabled: true
            },
            
            // 平台特定优化
            platform: {
                mobileOptimized: true,
                lowLatencyMode: false,
                batterySaverMode: false
            },
            
            // 音质设置
            quality: {
                sampleRate: 44100,
                bitDepth: 16,
                spatialAudio: false,
                hrtfEnabled: false
            },
            
            // 调试和开发设置
            debug: {
                loggingEnabled: false,
                performanceMonitoring: false,
                eventTracing: false
            },
            
            // 浏览器兼容性设置
            compatibility: {
                fallbackToOscillator: true,
                useLegacyAudioAPI: false,
                polyfillEnabled: true
            },
            
            // 用户偏好设置
            preferences: {
                autoPlayEnabled: true,
                interruptBehavior: 'duck', // duck, stop, ignore
                crossfadeDuration: 0.5
            }
        };
        
        this.isInitialized = false;
        this.storageKey = 'pixelpet_audio_settings';
    }
    
    /**
     * 初始化音频设置系统
     * @returns {Promise<boolean>} 初始化结果
     */
    async initialize() {
        try {
            // 尝试从本地存储加载设置
            await this.loadFromStorage();
            
            // 应用平台检测和优化
            this.detectPlatform();
            
            this.isInitialized = true;
            console.log('音频设置系统初始化完成');
            return true;
        } catch (error) {
            console.error('音频设置系统初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 从本地存储加载设置
     */
    async loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
                this.settings = { ...this.settings, ...parsed };
                console.log('从本地存储加载音频设置');
            }
        } catch (error) {
            console.warn('加载音频设置失败，使用默认设置:', error);
        }
    }
    
    /**
     * 保存设置到本地存储
     */
    async saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (error) {
            console.error('保存音频设置失败:', error);
        }
    }
    
    /**
     * 检测平台并优化设置
     */
    detectPlatform() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEndDevice = this.isLowEndDevice();
        
        if (isMobile || isLowEndDevice) {
            this.settings.platform.mobileOptimized = true;
            this.settings.performance.maxConcurrentSounds = 4;
            this.settings.performance.bufferPoolSize = 5;
            this.settings.quality.spatialAudio = false;
            
            if (isLowEndDevice) {
                this.settings.platform.batterySaverMode = true;
                this.settings.performance.preloadEnabled = false;
            }
        }
        
        console.log(`平台检测: mobile=${isMobile}, lowEnd=${isLowEndDevice}`);
    }
    
    /**
     * 检测是否为低端设备
     * @returns {boolean} 是否为低端设备
     */
    isLowEndDevice() {
        // 简单的设备性能检测
        const memory = navigator.deviceMemory || 4; // GB
        const cores = navigator.hardwareConcurrency || 4;
        
        return memory < 4 || cores < 4;
    }
    
    /**
     * 获取全局音量（考虑主音量和分类音量）
     * @param {string} category - 音效分类
     * @returns {number} 实际音量（0-1）
     */
    getVolume(category = null) {
        if (!this.settings.global.enabled || this.settings.global.mute) {
            return 0;
        }
        
        let volume = this.settings.global.masterVolume;
        
        if (category && this.settings.categories[category]) {
            const categorySettings = this.settings.categories[category];
            if (!categorySettings.enabled) {
                return 0;
            }
            volume *= categorySettings.volume;
        }
        
        return Math.max(0, Math.min(1, volume));
    }
    
    /**
     * 设置主音量
     * @param {number} volume - 音量（0-1）
     */
    setMasterVolume(volume) {
        this.settings.global.masterVolume = Math.max(0, Math.min(1, volume));
        this.saveToStorage();
        this.notifyVolumeChange();
    }
    
    /**
     * 设置分类音量
     * @param {string} category - 音效分类
     * @param {number} volume - 音量（0-1）
     */
    setCategoryVolume(category, volume) {
        if (this.settings.categories[category]) {
            this.settings.categories[category].volume = Math.max(0, Math.min(1, volume));
            this.saveToStorage();
            this.notifyVolumeChange();
        }
    }
    
    /**
     * 启用/禁用音效系统
     * @param {boolean} enabled - 是否启用
     */
    setEnabled(enabled) {
        this.settings.global.enabled = enabled;
        this.saveToStorage();
        this.notifyEnabledChange();
    }
    
    /**
     * 静音/取消静音
     * @param {boolean} mute - 是否静音
     */
    setMute(mute) {
        this.settings.global.mute = mute;
        this.saveToStorage();
        this.notifyVolumeChange();
    }
    
    /**
     * 启用/禁用音效分类
     * @param {string} category - 音效分类
     * @param {boolean} enabled - 是否启用
     */
    setCategoryEnabled(category, enabled) {
        if (this.settings.categories[category]) {
            this.settings.categories[category].enabled = enabled;
            this.saveToStorage();
            this.notifyCategoryChange(category);
        }
    }
    
    /**
     * 获取性能设置
     * @returns {Object} 性能设置
     */
    getPerformanceSettings() {
        return { ...this.settings.performance };
    }
    
    /**
     * 获取音质设置
     * @returns {Object} 音质设置
     */
    getQualitySettings() {
        return { ...this.settings.quality };
    }
    
    /**
     * 获取平台设置
     * @returns {Object} 平台设置
     */
    getPlatformSettings() {
        return { ...this.settings.platform };
    }
    
    /**
     * 获取调试设置
     * @returns {Object} 调试设置
     */
    getDebugSettings() {
        return { ...this.settings.debug };
    }
    
    /**
     * 获取所有设置
     * @returns {Object} 所有设置
     */
    getAllSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }
    
    /**
     * 更新设置
     * @param {Object} newSettings - 新设置
     */
    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.saveToStorage();
        this.notifySettingsChange();
    }
    
    /**
     * 重置为默认设置
     */
    resetToDefaults() {
        // 创建新的默认设置对象
        const defaultSettings = new AudioSettings().settings;
        this.settings = JSON.parse(JSON.stringify(defaultSettings));
        
        // 重新检测平台
        this.detectPlatform();
        
        this.saveToStorage();
        this.notifySettingsChange();
    }
    
    /**
     * 通知音量变化
     */
    notifyVolumeChange() {
        const event = new CustomEvent('audioVolumeChanged', {
            detail: {
                masterVolume: this.settings.global.masterVolume,
                muted: this.settings.global.mute
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 通知启用状态变化
     */
    notifyEnabledChange() {
        const event = new CustomEvent('audioEnabledChanged', {
            detail: {
                enabled: this.settings.global.enabled
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 通知分类变化
     * @param {string} category - 音效分类
     */
    notifyCategoryChange(category) {
        const event = new CustomEvent('audioCategoryChanged', {
            detail: {
                category: category,
                enabled: this.settings.categories[category].enabled,
                volume: this.settings.categories[category].volume
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 通知设置变化
     */
    notifySettingsChange() {
        const event = new CustomEvent('audioSettingsChanged', {
            detail: {
                settings: this.getAllSettings()
            }
        });
        document.dispatchEvent(event);
    }
    
    /**
     * 验证设置的有效性
     * @returns {Object} 验证结果
     */
    validateSettings() {
        const errors = [];
        const warnings = [];
        
        // 验证音量范围
        if (this.settings.global.masterVolume < 0 || this.settings.global.masterVolume > 1) {
            errors.push('主音量必须在0-1范围内');
        }
        
        // 验证分类音量
        for (const [category, settings] of Object.entries(this.settings.categories)) {
            if (settings.volume < 0 || settings.volume > 1) {
                errors.push(`${category}分类音量必须在0-1范围内`);
            }
        }
        
        // 验证性能设置
        if (this.settings.performance.maxConcurrentSounds < 1) {
            errors.push('最大并发音效数必须大于0');
        }
        
        if (this.settings.performance.bufferPoolSize < 0) {
            errors.push('缓冲池大小不能为负数');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
    
    /**
     * 导出设置
     * @returns {string} 设置JSON字符串
     */
    exportSettings() {
        return JSON.stringify(this.settings, null, 2);
    }
    
    /**
     * 导入设置
     * @param {string} settingsJson - 设置JSON字符串
     * @returns {boolean} 导入是否成功
     */
    importSettings(settingsJson) {
        try {
            const parsed = JSON.parse(settingsJson);
            this.updateSettings(parsed);
            return true;
        } catch (error) {
            console.error('导入设置失败:', error);
            return false;
        }
    }
}

// 创建全局音频设置实例
window.AudioSettings = new AudioSettings();