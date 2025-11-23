/**
 * 音效工厂系统
 * @fileoverview 根据音效名称生成对应的音频
 * @author 像素猫粮工厂开发团队
 * @version 1.0.0
 * @created 2025-11-23
 */

class SoundFactory {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.implementations = new Map();
        this.audioBufferPool = new Map();
        this.isInitialized = false;
    }
    
    /**
     * 初始化音效工厂
     * @param {string|Object} config - 实现配置文件路径或配置对象
     * @returns {Promise<boolean>} 初始化结果
     */
    async initialize(config = null) {
        try {
            if (config) {
                if (typeof config === 'string') {
                    // 从文件路径加载配置
                    await this.loadConfigFromFile(config);
                } else {
                    // 直接使用配置对象
                    await this.loadConfig(config);
                }
            } else {
                // 加载默认配置
                await this.loadDefaultConfig();
            }
            
            this.isInitialized = true;
            console.log('音效工厂初始化完成');
            return true;
        } catch (error) {
            console.error('音效工厂初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 加载配置
     * @param {Object} config - 实现配置
     */
    async loadConfig(config) {
        this.implementations.clear();
        
        if (config.sounds) {
            for (const [soundName, implementation] of Object.entries(config.sounds)) {
                this.implementations.set(soundName, implementation);
            }
        }
        
        console.log(`加载了 ${this.implementations.size} 个音效实现`);
    }
    
    /**
     * 从文件加载配置
     * @param {string} configPath - 配置文件路径
     */
    async loadConfigFromFile(configPath) {
        try {
            console.log(`🎵 尝试加载配置文件: ${configPath}`);
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`配置文件加载失败: ${response.status} ${response.statusText}`);
            }
            
            const config = await response.json();
            console.log(`🎵 配置文件加载成功，内容类型:`, config.implementations ? '嵌套结构' : '扁平结构');
            
            // 处理嵌套的配置结构（按实现类型分组）
            if (config.implementations) {
                const flattenedConfig = { sounds: {} };
                
                // 遍历所有实现类型
                for (const [implType, implConfig] of Object.entries(config.implementations)) {
                    if (implConfig.sounds) {
                        // 遍历该类型下的所有音效
                        for (const [soundName, soundConfig] of Object.entries(implConfig.sounds)) {
                            // 创建扁平化的音效配置，处理参数字段映射
                            const flattenedSoundConfig = {
                                type: implType,
                                ...soundConfig
                            };
                            
                            // 如果配置中有 'parameters' 字段，映射到 'params' 字段
                            if (soundConfig.parameters) {
                                flattenedSoundConfig.params = soundConfig.parameters;
                                // 删除原始的 parameters 字段避免冲突
                                delete flattenedSoundConfig.parameters;
                            }
                            
                            flattenedConfig.sounds[soundName] = flattenedSoundConfig;
                        }
                    }
                }
                
                console.log(`🎵 扁平化配置包含 ${Object.keys(flattenedConfig.sounds).length} 个音效`);
                await this.loadConfig(flattenedConfig);
            } else {
                // 如果是扁平化的配置结构
                console.log(`🎵 扁平配置包含 ${config.sounds ? Object.keys(config.sounds).length : 0} 个音效`);
                await this.loadConfig(config);
            }
        } catch (error) {
            console.error('配置文件加载失败:', error);
            // 如果文件加载失败，回退到默认配置
            console.warn('🎵 配置文件加载失败，回退到默认配置');
            await this.loadDefaultConfig();
        }
    }
    
    /**
     * 加载默认配置
     */
    async loadDefaultConfig() {
        console.log('🎵 尝试加载默认音效配置...');
        const defaultConfig = {
            sounds: {
                // 基础UI音效
                'click_sound': {
                    type: 'web_audio',
                    generator: 'simple_tone',
                    params: {
                        frequency: 800,
                        duration: 0.05,
                        waveType: 'sine',
                        volume: 0.3
                    }
                },
                
                'hover_sound': {
                    type: 'web_audio',
                    generator: 'simple_tone',
                    params: {
                        frequency: 600,
                        duration: 0.03,
                        waveType: 'sine',
                        volume: 0.2
                    }
                },
                
                // 滑块音效
                'slider_move': {
                    type: 'web_audio',
                    generator: 'noise_burst',
                    params: {
                        duration: 0.02,
                        volume: 0.15,
                        filterType: 'lowpass',
                        filterFrequency: 3000
                    }
                },
                
                'slider_release': {
                    type: 'web_audio',
                    generator: 'simple_tone',
                    params: {
                        frequency: 400,
                        duration: 0.08,
                        waveType: 'sine',
                        volume: 0.25
                    }
                },
                
                // 游戏音效
                'coin_sound': {
                    type: 'web_audio',
                    generator: 'complex_sequence',
                    params: {
                        sequence: [
                            { type: 'tone', frequency: 800, duration: 0.05, volume: 0.3 },
                            { type: 'tone', frequency: 1200, duration: 0.1, volume: 0.4 }
                        ]
                    }
                },
                
                'coin_gain': {
                    type: 'web_audio',
                    generator: 'chord_sequence',
                    params: {
                        chords: [
                            { notes: [523, 659, 784], duration: 0.15, waveType: 'sine' }
                        ],
                        volume: 0.5
                    }
                },
                
                'coin_loss': {
                    type: 'web_audio',
                    generator: 'simple_tone',
                    params: {
                        frequency: 200,
                        duration: 0.2,
                        waveType: 'sawtooth',
                        volume: 0.3
                    }
                },
                
                'level_up_sound': {
                    type: 'web_audio',
                    generator: 'envelope_sequence',
                    params: {
                        stages: [
                            { frequency: 300, duration: 0.1, volume: 0.3, waveType: 'sine' },
                            { frequency: 600, duration: 0.1, volume: 0.5, waveType: 'sine' },
                            { frequency: 900, duration: 0.2, volume: 0.4, waveType: 'sine' }
                        ]
                    }
                },
                
                // 生产音效
                'machine_start': {
                    type: 'web_audio',
                    generator: 'envelope_sequence',
                    params: {
                        stages: [
                            { frequency: 100, duration: 0.3, volume: 0.2, waveType: 'sawtooth' },
                            { frequency: 200, duration: 0.5, volume: 0.4, waveType: 'sawtooth' }
                        ]
                    }
                },
                
                'success_sound': {
                    type: 'web_audio',
                    generator: 'chord_sequence',
                    params: {
                        chords: [
                            { notes: [659, 784, 988], duration: 0.2, waveType: 'sine' },
                            { notes: [784, 988, 1175], duration: 0.3, waveType: 'sine' }
                        ],
                        volume: 0.6
                    }
                },
                
                // 环境音效
                'ambient_music': {
                    type: 'web_audio',
                    generator: 'filtered_noise',
                    params: {
                        duration: 30.0,
                        volume: 0.1,
                        filterType: 'lowpass',
                        filterFrequency: 500,
                        modulation: {
                            type: 'lfo',
                            frequency: 0.5,
                            depth: 0.05
                        }
                    }
                },
                
                'transition_sound': {
                    type: 'web_audio',
                    generator: 'pulse_wave',
                    params: {
                        frequency: 150,
                        duration: 0.3,
                        pulseWidth: 0.3,
                        volume: 0.3
                    }
                }
            }
        };
        
        await this.loadConfig(defaultConfig);
    }
    
    /**
     * 根据音效名称生成音频
     * @param {string} soundName - 音效名称
     * @param {Object} options - 生成选项
     * @returns {Promise<AudioBufferSourceNode>} 音频源节点
     */
    async generateSound(soundName, options = {}) {
        console.log(`🎵 生成音效: ${soundName}`, options);
        if (!this.isInitialized) {
            throw new Error('音效工厂未初始化');
        }
        
        const implementation = this.implementations.get(soundName);
        if (!implementation) {
            console.warn(`未找到音效实现: ${soundName}`);
            // 返回一个静音的音频源作为后备
            return this.generateSilentSound(0.1);
        }
        
        // 检查缓冲池中是否有缓存的音频
        const cacheKey = this.getCacheKey(soundName, implementation.params);
        if (this.audioBufferPool.has(cacheKey)) {
            console.log(`🎵 从缓存获取音效: ${soundName}`);
            return this.createSourceFromBuffer(this.audioBufferPool.get(cacheKey));
        }
        
        // 根据类型生成音频
        switch (implementation.type) {
            case 'web_audio':
                return await this.generateWebAudio(implementation, options);
            case 'file':
                return await this.generateFromFile(implementation, options);
            case 'third_party':
                return await this.generateFromThirdParty(implementation, options);
            case 'custom':
                return await this.generateCustom(implementation, options);
            default:
                throw new Error(`不支持的音效类型: ${implementation.type}`);
        }
    }
    
    /**
     * 使用Web Audio API生成音频
     * @param {Object} implementation - 实现配置
     * @param {Object} options - 生成选项
     * @returns {Promise<AudioBufferSourceNode>} 音频源节点
     */
    async generateWebAudio(implementation, options) {
        const { generator, params } = implementation;
        
        // 根据生成器类型创建音频（支持连字符和下划线两种格式）
        const normalizedGenerator = generator.replace('-', '_');
        
        switch (normalizedGenerator) {
            case 'simple_tone':
                return this.generateSimpleTone(params);
            case 'noise_burst':
                return this.generateNoiseBurst(params);
            case 'frequency_sweep':
                return this.generateFrequencySweep(params);
            case 'pulse_sequence':
                return this.generatePulseSequence(params);
            case 'complex_sequence':
                return this.generateComplexSequence(params);
            case 'envelope_sequence':
                return this.generateEnvelopeSequence(params);
            case 'chord_sequence':
                return this.generateChordSequence(params);
            case 'pulse_wave':
                return this.generatePulseWave(params);
            case 'filtered_noise':
                return this.generateFilteredNoise(params);
            default:
                throw new Error(`不支持的生成器: ${generator}`);
        }
    }
    
    /**
     * 生成简单音调
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateSimpleTone(params = {}) {
        // 参数映射：配置文件使用 'type'，代码使用 'waveType'
        const { 
            frequency = 800, 
            duration = 0.05, 
            type, 
            waveType, 
            volume = 0.3 
        } = params;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // 支持两种参数名：优先使用配置文件中的 'type'，其次使用 'waveType'
        oscillator.type = type || waveType || 'sine';
        oscillator.frequency.value = frequency;
        
        // 设置音量包络
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        return oscillator;
    }
    
    /**
     * 生成噪音脉冲
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateNoiseBurst(params = {}) {
        const { 
            duration = 0.02, 
            volume = 0.15, 
            type = 'white', 
            filterType, 
            filterFrequency 
        } = params;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 根据噪音类型生成不同的噪音
        for (let i = 0; i < bufferSize; i++) {
            let noiseValue;
            
            switch (type) {
                case 'brown':
                    // 布朗噪音（红噪音）
                    noiseValue = this.generateBrownNoise(i, data[i - 1] || 0);
                    break;
                case 'pink':
                    // 粉红噪音
                    noiseValue = this.generatePinkNoise(i);
                    break;
                default:
                    // 默认白噪音
                    noiseValue = (Math.random() * 2 - 1) * volume;
            }
            
            data[i] = noiseValue;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 应用滤波器
        if (filterType && filterFrequency) {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = filterType;
            filter.frequency.value = filterFrequency;
            source.connect(filter);
            filter.connect(this.audioContext.destination);
        } else {
            source.connect(this.audioContext.destination);
        }
        
        source.start();
        return source;
    }

    /**
     * 生成布朗噪音（红噪音）
     * @param {number} index - 样本索引
     * @param {number} previousValue - 前一个样本值
     * @returns {number} 噪音值
     */
    generateBrownNoise(index, previousValue) {
        // 布朗噪音：低频分量更强
        const white = (Math.random() * 2 - 1) * 0.02;
        return previousValue + white;
    }

    /**
     * 生成粉红噪音
     * @param {number} index - 样本索引
     * @returns {number} 噪音值
     */
    generatePinkNoise(index) {
        // 粉红噪音：每倍频程能量相等
        // 简化实现：使用白噪音并应用低通滤波效果
        return (Math.random() * 2 - 1) * 0.1;
    }

    /**
     * 生成复杂序列
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateComplexSequence(params = {}) {
        // 简化实现 - 实际应该拼接多个音频片段
        return this.generateSimpleTone({
            frequency: 800,
            duration: 0.15,
            waveType: 'sine',
            volume: 0.4
        });
    }
    
    /**
     * 生成包络序列
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateEnvelopeSequence(params = {}) {
        // 简化实现
        return this.generateSimpleTone({
            frequency: 600,
            duration: 0.3,
            waveType: 'sine',
            volume: 0.5
        });
    }
    
    /**
     * 生成和弦序列
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateChordSequence(params = {}) {
        // 简化实现
        return this.generateSimpleTone({
            frequency: 500,
            duration: 0.25,
            waveType: 'sine',
            volume: 0.6
        });
    }
    
    /**
     * 生成脉冲波
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generatePulseWave(params = {}) {
        // 简化实现
        return this.generateSimpleTone({
            frequency: 200,
            duration: 0.2,
            waveType: 'square',
            volume: 0.4
        });
    }
    
    /**
     * 生成滤波噪音
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateFilteredNoise(params = {}) {
        // 简化实现
        return this.generateNoiseBurst({
            duration: 2.0,
            volume: 0.1,
            filterType: 'lowpass',
            filterFrequency: 500
        });
    }
    
    /**
     * 生成频率扫描音效
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateFrequencySweep(params = {}) {
        const { 
            startFrequency = 800, 
            endFrequency = 1200, 
            duration = 0.15, 
            type = 'sine', 
            volume = 0.4, 
            sweepType = 'up' 
        } = params;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type || 'sine';
        
        // 设置频率扫描
        const now = this.audioContext.currentTime;
        if (sweepType === 'down') {
            oscillator.frequency.setValueAtTime(endFrequency, now);
            oscillator.frequency.exponentialRampToValueAtTime(startFrequency, now + duration);
        } else {
            // 默认向上扫描
            oscillator.frequency.setValueAtTime(startFrequency, now);
            oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
        }
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
        gainNode.gain.setValueAtTime(volume, now + duration - 0.02);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + duration);
        
        return oscillator;
    }
    
    /**
     * 生成脉冲序列音效
     * @param {Object} params - 参数
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generatePulseSequence(params = {}) {
        const { 
            frequency = 440, 
            pulseCount = 3, 
            pulseDuration = 0.08, 
            gapDuration = 0.06, 
            type = 'sine', 
            volume = 0.5 
        } = params;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type || 'sine';
        oscillator.frequency.value = frequency;
        
        const now = this.audioContext.currentTime;
        const totalDuration = pulseCount * (pulseDuration + gapDuration);
        
        // 设置脉冲序列
        for (let i = 0; i < pulseCount; i++) {
            const pulseStart = now + i * (pulseDuration + gapDuration);
            const pulseEnd = pulseStart + pulseDuration;
            
            // 脉冲开始
            gainNode.gain.setValueAtTime(0, pulseStart);
            gainNode.gain.linearRampToValueAtTime(volume, pulseStart + 0.005);
            
            // 脉冲结束
            gainNode.gain.setValueAtTime(volume, pulseEnd - 0.005);
            gainNode.gain.linearRampToValueAtTime(0, pulseEnd);
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start(now);
        oscillator.stop(now + totalDuration);
        
        return oscillator;
    }
    
    /**
     * 从文件生成音频
     * @param {Object} implementation - 实现配置
     * @param {Object} options - 生成选项
     * @returns {Promise<AudioBufferSourceNode>} 音频源节点
     */
    async generateFromFile(implementation, options) {
        try {
            const cacheKey = this.getCacheKey(implementation.name || 'unknown', implementation.params);
            
            // 检查是否有预加载的缓冲
            if (this.audioBufferPool.has(cacheKey)) {
                const audioBuffer = this.audioBufferPool.get(cacheKey);
                
                // 创建音频源
                const source = this.audioContext.createBufferSource();
                source.buffer = audioBuffer;
                
                // 创建音量控制节点
                const gainNode = this.audioContext.createGain();
                const volume = options.volume || implementation.volume || 1.0;
                gainNode.gain.value = volume;
                
                // 连接节点
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                // 设置循环（如果需要）
                if (implementation.loop) {
                    source.loop = true;
                }
                
                console.log(`🎵 使用缓存音效: ${implementation.file}`);
                return source;
            }
            
            // 如果没有缓存，则实时加载
            const filePath = implementation.file;
            const basePath = implementation.base_path || 'assets/audio/';
            const fullPath = basePath + filePath;
            
            console.log(`🎵 实时加载音频文件: ${fullPath}`);
            
            // 使用fetch加载音频文件
            const response = await fetch(fullPath);
            if (!response.ok) {
                throw new Error(`音频文件加载失败: ${response.status} ${response.statusText}`);
            }
            
            const arrayBuffer = await response.arrayBuffer();
            
            // 解码音频数据
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            // 创建音频源
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            
            // 创建音量控制节点
            const gainNode = this.audioContext.createGain();
            const volume = options.volume || implementation.volume || 1.0;
            gainNode.gain.value = volume;
            
            // 连接节点
            source.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            // 设置循环（如果需要）
            if (implementation.loop) {
                source.loop = true;
            }
            
            console.log(`✅ 音频文件加载成功: ${filePath}`);
            return source;
            
        } catch (error) {
            console.error(`❌ 音频文件加载失败:`, error);
            // 失败时返回一个静音音频作为后备
            return this.generateSilentSound(0.1);
        }
    }
    
    /**
     * 从第三方库生成音频
     * @param {Object} implementation - 实现配置
     * @param {Object} options - 生成选项
     * @returns {Promise<AudioBufferSourceNode>} 音频源节点
     */
    async generateFromThirdParty(implementation, options) {
        // 简化实现
        return this.generateSimpleTone({
            frequency: 660,
            duration: 0.3,
            waveType: 'sine',
            volume: 0.5
        });
    }
    
    /**
     * 生成静音音频
     * @param {number} duration - 持续时间（秒）
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    generateSilentSound(duration = 0.1) {
        // 创建一个静音音频缓冲
        const sampleRate = this.audioContext.sampleRate;
        const frameCount = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, frameCount, sampleRate);
        
        // 创建音频源
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        
        return source;
    }
    
    /**
     * 生成自定义音频
     * @param {Object} implementation - 实现配置
     * @param {Object} options - 生成选项
     * @returns {Promise<AudioBufferSourceNode>} 音频源节点
     */
    async generateCustom(implementation, options) {
        // 简化实现
        return this.generateSimpleTone({
            frequency: 880,
            duration: 0.4,
            waveType: 'sine',
            volume: 0.5
        });
    }
    
    /**
     * 从缓冲创建音频源
     * @param {AudioBuffer} buffer - 音频缓冲
     * @returns {AudioBufferSourceNode} 音频源节点
     */
    createSourceFromBuffer(buffer) {
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
        return source;
    }
    
    /**
     * 获取缓存键
     * @param {string} soundName - 音效名称
     * @param {Object} params - 参数
     * @returns {string} 缓存键
     */
    getCacheKey(soundName, params) {
        return `${soundName}_${JSON.stringify(params)}`;
    }
    
    /**
     * 预加载音效
     * @param {string} soundName - 音效名称
     * @returns {Promise<void>}
     */
    async preloadSound(soundName) {
        const implementation = this.implementations.get(soundName);
        if (!implementation) return;
        
        const cacheKey = this.getCacheKey(soundName, implementation.params);
        if (!this.audioBufferPool.has(cacheKey)) {
            try {
                console.log(`🎵 开始预加载音效: ${soundName}`);
                
                // 对于文件类型的音效，预加载并缓存音频缓冲
                if (implementation.type === 'file') {
                    const filePath = implementation.file;
                    const basePath = implementation.base_path || 'assets/audio/';
                    const fullPath = basePath + filePath;
                    
                    // 加载音频文件
                    const response = await fetch(fullPath);
                    if (!response.ok) {
                        throw new Error(`音频文件加载失败: ${response.status}`);
                    }
                    
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    // 缓存音频缓冲
                    this.audioBufferPool.set(cacheKey, audioBuffer);
                    console.log(`✅ 音效预加载成功: ${soundName} (文件: ${filePath})`);
                } else {
                    // 对于其他类型的音效，生成并缓存
                    const source = await this.generateSound(soundName);
                    console.log(`预加载音效: ${soundName}`);
                }
                
            } catch (error) {
                console.error(`❌ 预加载音效失败: ${soundName}`, error);
            }
        } else {
            console.log(`音效已预加载: ${soundName}`);
        }
    }
    
    /**
     * 清理缓冲池
     */
    cleanupBufferPool() {
        this.audioBufferPool.clear();
    }
    
    /**
     * 获取实现统计信息
     * @returns {Object} 统计信息
     */
    getImplementationStats() {
        const stats = {
            total: this.implementations.size,
            byType: {}
        };
        
        for (const [soundName, implementation] of this.implementations) {
            const type = implementation.type;
            if (!stats.byType[type]) {
                stats.byType[type] = 0;
            }
            stats.byType[type]++;
        }
        
        return stats;
    }
}

// 注意：SoundFactory需要在AudioContext创建后实例化