/**
 * 音效生成器系统
 * @fileoverview 音效生成器基类和标准生成器实现
 * @author 像素猫粮工厂开发团队
 * @version 1.0.0
 * @created 2025-11-23
 */

/**
 * 音效生成器基类
 */
class SoundGenerator {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.name = 'base-generator';
        this.version = '1.0.0';
    }
    
    /**
     * 生成音效
     * @param {Object} params - 生成参数
     * @returns {Promise<AudioNode>} 音频节点
     */
    async generate(params = {}) {
        throw new Error('generate方法必须在子类中实现');
    }
    
    /**
     * 验证参数
     * @param {Object} params - 参数对象
     * @returns {boolean} 参数是否有效
     */
    validateParams(params) {
        return true; // 基类不做验证，子类可重写
    }
    
    /**
     * 获取默认参数
     * @returns {Object} 默认参数
     */
    getDefaultParams() {
        return {};
    }
    
    /**
     * 清理资源
     */
    cleanup() {
        // 基类清理逻辑
    }
}

/**
 * 简单音调生成器
 * 生成正弦波、方波、三角波等基础波形
 */
class SimpleToneGenerator extends SoundGenerator {
    constructor(audioContext) {
        super(audioContext);
        this.name = 'simple-tone';
        this.version = '1.0.0';
    }
    
    getDefaultParams() {
        return {
            frequency: 440,      // 频率 (Hz)
            duration: 0.1,       // 持续时间 (秒)
            type: 'sine',        // 波形类型: sine, square, triangle, sawtooth
            volume: 0.5,         // 音量 (0-1)
            fadeIn: 0.01,        // 淡入时间 (秒)
            fadeOut: 0.02        // 淡出时间 (秒)
        };
    }
    
    validateParams(params) {
        const defaults = this.getDefaultParams();
        const merged = { ...defaults, ...params };
        
        if (merged.frequency <= 0 || merged.frequency > 20000) {
            throw new Error('频率必须在1-20000Hz范围内');
        }
        if (merged.duration <= 0) {
            throw new Error('持续时间必须大于0');
        }
        if (!['sine', 'square', 'triangle', 'sawtooth'].includes(merged.type)) {
            throw new Error('波形类型必须是sine、square、triangle或sawtooth');
        }
        if (merged.volume < 0 || merged.volume > 1) {
            throw new Error('音量必须在0-1范围内');
        }
        
        return true;
    }
    
    async generate(params = {}) {
        this.validateParams(params);
        const defaults = this.getDefaultParams();
        const config = { ...defaults, ...params };
        
        const now = this.audioContext.currentTime;
        
        // 创建振荡器
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = config.type;
        oscillator.frequency.value = config.frequency;
        
        // 创建增益节点用于音量控制
        const gainNode = this.audioContext.createGain();
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(config.volume, now + config.fadeIn);
        gainNode.gain.setValueAtTime(config.volume, now + config.duration - config.fadeOut);
        gainNode.gain.linearRampToValueAtTime(0, now + config.duration);
        
        // 连接节点
        oscillator.connect(gainNode);
        
        // 设置振荡器时间
        oscillator.start(now);
        oscillator.stop(now + config.duration);
        
        // 返回增益节点作为输出
        gainNode.gainNode = gainNode;
        gainNode.oscillator = oscillator;
        
        return gainNode;
    }
}

/**
 * 噪声爆发生成器
 * 生成白噪声、粉红噪声等噪声效果
 */
class NoiseBurstGenerator extends SoundGenerator {
    constructor(audioContext) {
        super(audioContext);
        this.name = 'noise-burst';
        this.version = '1.0.0';
    }
    
    getDefaultParams() {
        return {
            duration: 0.1,       // 持续时间 (秒)
            type: 'white',       // 噪声类型: white, pink, brown
            volume: 0.3,         // 音量 (0-1)
            fadeIn: 0.005,       // 淡入时间 (秒)
            fadeOut: 0.01        // 淡出时间 (秒)
        };
    }
    
    validateParams(params) {
        const defaults = this.getDefaultParams();
        const merged = { ...defaults, ...params };
        
        if (merged.duration <= 0) {
            throw new Error('持续时间必须大于0');
        }
        if (!['white', 'pink', 'brown'].includes(merged.type)) {
            throw new Error('噪声类型必须是white、pink或brown');
        }
        
        return true;
    }
    
    async generate(params = {}) {
        this.validateParams(params);
        const defaults = this.getDefaultParams();
        const config = { ...defaults, ...params };
        
        const now = this.audioContext.currentTime;
        const bufferSize = this.audioContext.sampleRate * config.duration;
        
        // 创建缓冲区
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // 生成噪声数据
        this.generateNoise(data, config.type);
        
        // 创建缓冲区源
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // 创建增益节点
        const gainNode = this.audioContext.createGain();
        
        // 设置音量包络
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(config.volume, now + config.fadeIn);
        gainNode.gain.setValueAtTime(config.volume, now + config.duration - config.fadeOut);
        gainNode.gain.linearRampToValueAtTime(0, now + config.duration);
        
        // 连接节点
        source.connect(gainNode);
        
        // 播放
        source.start(now);
        
        // 返回增益节点作为输出
        gainNode.gainNode = gainNode;
        gainNode.source = source;
        
        return gainNode;
    }
    
    /**
     * 生成噪声数据
     * @param {Float32Array} data - 数据数组
     * @param {string} type - 噪声类型
     */
    generateNoise(data, type) {
        switch (type) {
            case 'white':
                // 白噪声：均匀分布的随机数
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                break;
                
            case 'pink':
                // 粉红噪声：低频增强
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < data.length; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    data[i] *= 0.11; // 补偿增益
                    b6 = white * 0.115926;
                }
                break;
                
            case 'brown':
                // 布朗噪声：低频更强
                let lastValue = 0;
                for (let i = 0; i < data.length; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastValue + (0.02 * white)) / 1.02;
                    lastValue = data[i];
                    data[i] *= 3.5; // 补偿增益
                }
                break;
        }
    }
}

/**
 * 频率扫描生成器
 * 生成频率上升或下降的扫描音效
 */
class FrequencySweepGenerator extends SoundGenerator {
    constructor(audioContext) {
        super(audioContext);
        this.name = 'frequency-sweep';
        this.version = '1.0.0';
    }
    
    getDefaultParams() {
        return {
            startFrequency: 100,  // 起始频率 (Hz)
            endFrequency: 1000,  // 结束频率 (Hz)
            duration: 0.2,       // 持续时间 (秒)
            type: 'sine',        // 波形类型
            volume: 0.4,         // 音量 (0-1)
            sweepType: 'up'      // 扫描类型: up, down
        };
    }
    
    validateParams(params) {
        const defaults = this.getDefaultParams();
        const merged = { ...defaults, ...params };
        
        if (merged.startFrequency <= 0 || merged.endFrequency <= 0) {
            throw new Error('频率必须大于0');
        }
        if (merged.duration <= 0) {
            throw new Error('持续时间必须大于0');
        }
        if (!['up', 'down'].includes(merged.sweepType)) {
            throw new Error('扫描类型必须是up或down');
        }
        
        return true;
    }
    
    async generate(params = {}) {
        this.validateParams(params);
        const defaults = this.getDefaultParams();
        const config = { ...defaults, ...params };
        
        const now = this.audioContext.currentTime;
        
        // 创建振荡器
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = config.type;
        
        // 设置频率扫描
        if (config.sweepType === 'up') {
            oscillator.frequency.setValueAtTime(config.startFrequency, now);
            oscillator.frequency.exponentialRampToValueAtTime(config.endFrequency, now + config.duration);
        } else {
            oscillator.frequency.setValueAtTime(config.endFrequency, now);
            oscillator.frequency.exponentialRampToValueAtTime(config.startFrequency, now + config.duration);
        }
        
        // 创建增益节点
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = config.volume;
        
        // 连接节点
        oscillator.connect(gainNode);
        
        // 设置振荡器时间
        oscillator.start(now);
        oscillator.stop(now + config.duration);
        
        // 返回增益节点作为输出
        gainNode.gainNode = gainNode;
        gainNode.oscillator = oscillator;
        
        return gainNode;
    }
}

/**
 * 脉冲序列生成器
 * 生成节奏性的脉冲音效
 */
class PulseSequenceGenerator extends SoundGenerator {
    constructor(audioContext) {
        super(audioContext);
        this.name = 'pulse-sequence';
        this.version = '1.0.0';
    }
    
    getDefaultParams() {
        return {
            frequency: 440,       // 基础频率 (Hz)
            pulseCount: 3,       // 脉冲数量
            pulseDuration: 0.05,  // 单个脉冲持续时间 (秒)
            gapDuration: 0.05,   // 脉冲间隔时间 (秒)
            type: 'sine',        // 波形类型
            volume: 0.5          // 音量 (0-1)
        };
    }
    
    validateParams(params) {
        const defaults = this.getDefaultParams();
        const merged = { ...defaults, ...params };
        
        if (merged.frequency <= 0) {
            throw new Error('频率必须大于0');
        }
        if (merged.pulseCount <= 0) {
            throw new Error('脉冲数量必须大于0');
        }
        
        return true;
    }
    
    async generate(params = {}) {
        this.validateParams(params);
        const defaults = this.getDefaultParams();
        const config = { ...defaults, ...params };
        
        const now = this.audioContext.currentTime;
        const totalDuration = (config.pulseDuration + config.gapDuration) * config.pulseCount;
        
        // 创建增益节点
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 0; // 初始静音
        
        // 创建多个脉冲
        for (let i = 0; i < config.pulseCount; i++) {
            const pulseStart = now + i * (config.pulseDuration + config.gapDuration);
            
            // 创建振荡器
            const oscillator = this.audioContext.createOscillator();
            oscillator.type = config.type;
            oscillator.frequency.value = config.frequency;
            
            // 创建脉冲增益节点
            const pulseGain = this.audioContext.createGain();
            
            // 设置脉冲包络
            pulseGain.gain.setValueAtTime(0, pulseStart);
            pulseGain.gain.linearRampToValueAtTime(config.volume, pulseStart + 0.005);
            pulseGain.gain.setValueAtTime(config.volume, pulseStart + config.pulseDuration - 0.005);
            pulseGain.gain.linearRampToValueAtTime(0, pulseStart + config.pulseDuration);
            
            // 连接节点
            oscillator.connect(pulseGain);
            pulseGain.connect(gainNode);
            
            // 设置振荡器时间
            oscillator.start(pulseStart);
            oscillator.stop(pulseStart + config.pulseDuration);
        }
        
        // 返回主增益节点
        gainNode.gainNode = gainNode;
        
        return gainNode;
    }
}

/**
 * 滤波器效果生成器
 * 应用滤波器效果到基础音效
 */
class FilterEffectGenerator extends SoundGenerator {
    constructor(audioContext) {
        super(audioContext);
        this.name = 'filter-effect';
        this.version = '1.0.0';
    }
    
    getDefaultParams() {
        return {
            baseSound: null,      // 基础音效生成器
            filterType: 'lowpass', // 滤波器类型: lowpass, highpass, bandpass
            frequency: 1000,      // 截止频率 (Hz)
            Q: 1,                // 品质因数
            gain: 0              // 增益 (用于峰值滤波器)
        };
    }
    
    validateParams(params) {
        const defaults = this.getDefaultParams();
        const merged = { ...defaults, ...params };
        
        if (!merged.baseSound || !(merged.baseSound instanceof SoundGenerator)) {
            throw new Error('必须提供基础音效生成器');
        }
        if (!['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'].includes(merged.filterType)) {
            throw new Error('无效的滤波器类型');
        }
        
        return true;
    }
    
    async generate(params = {}) {
        this.validateParams(params);
        const defaults = this.getDefaultParams();
        const config = { ...defaults, ...params };
        
        // 生成基础音效
        const baseSound = await config.baseSound.generate(config.baseSoundParams || {});
        
        // 创建滤波器
        const filter = this.audioContext.createBiquadFilter();
        filter.type = config.filterType;
        filter.frequency.value = config.frequency;
        filter.Q.value = config.Q;
        
        if (config.filterType.includes('shelf') || config.filterType === 'peaking') {
            filter.gain.value = config.gain;
        }
        
        // 连接节点
        baseSound.connect(filter);
        
        // 返回滤波器节点
        filter.filter = filter;
        filter.baseSound = baseSound;
        
        return filter;
    }
}

/**
 * 延迟效果生成器
 * 应用延迟/回声效果
 */
class DelayEffectGenerator extends SoundGenerator {
    constructor(audioContext) {
        super(audioContext);
        this.name = 'delay-effect';
        this.version = '1.0.0';
    }
    
    getDefaultParams() {
        return {
            baseSound: null,      // 基础音效生成器
            delayTime: 0.1,       // 延迟时间 (秒)
            feedback: 0.5,        // 反馈量 (0-1)
            wetLevel: 0.3         // 湿声级别 (0-1)
        };
    }
    
    validateParams(params) {
        const defaults = this.getDefaultParams();
        const merged = { ...defaults, ...params };
        
        if (!merged.baseSound || !(merged.baseSound instanceof SoundGenerator)) {
            throw new Error('必须提供基础音效生成器');
        }
        if (merged.feedback < 0 || merged.feedback >= 1) {
            throw new Error('反馈量必须在0-1范围内');
        }
        
        return true;
    }
    
    async generate(params = {}) {
        this.validateParams(params);
        const defaults = this.getDefaultParams();
        const config = { ...defaults, ...params };
        
        // 生成基础音效
        const baseSound = await config.baseSound.generate(config.baseSoundParams || {});
        
        // 创建延迟节点
        const delay = this.audioContext.createDelay();
        delay.delayTime.value = config.delayTime;
        
        // 创建反馈增益节点
        const feedbackGain = this.audioContext.createGain();
        feedbackGain.gain.value = config.feedback;
        
        // 创建干湿混合节点
        const dryGain = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        
        dryGain.gain.value = 1 - config.wetLevel;
        wetGain.gain.value = config.wetLevel;
        
        // 连接延迟反馈回路
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        
        // 连接干湿混合
        baseSound.connect(dryGain);
        baseSound.connect(delay);
        delay.connect(wetGain);
        
        // 创建合并节点
        const merger = this.audioContext.createGain();
        dryGain.connect(merger);
        wetGain.connect(merger);
        
        // 返回合并节点
        merger.delay = delay;
        merger.baseSound = baseSound;
        
        return merger;
    }
}

/**
 * 生成器管理器
 */
class SoundGeneratorManager {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.generators = new Map();
        this.initializeStandardGenerators();
    }
    
    /**
     * 初始化标准生成器
     */
    initializeStandardGenerators() {
        this.registerGenerator('simple-tone', new SimpleToneGenerator(this.audioContext));
        this.registerGenerator('noise-burst', new NoiseBurstGenerator(this.audioContext));
        this.registerGenerator('frequency-sweep', new FrequencySweepGenerator(this.audioContext));
        this.registerGenerator('pulse-sequence', new PulseSequenceGenerator(this.audioContext));
        this.registerGenerator('filter-effect', new FilterEffectGenerator(this.audioContext));
        this.registerGenerator('delay-effect', new DelayEffectGenerator(this.audioContext));
        
        console.log('标准音效生成器已注册');
    }
    
    /**
     * 注册生成器
     * @param {string} name - 生成器名称
     * @param {SoundGenerator} generator - 生成器实例
     */
    registerGenerator(name, generator) {
        if (this.generators.has(name)) {
            console.warn(`生成器 ${name} 已存在，将被覆盖`);
        }
        this.generators.set(name, generator);
        console.log(`生成器已注册: ${name}`);
    }
    
    /**
     * 获取生成器
     * @param {string} name - 生成器名称
     * @returns {SoundGenerator} 生成器实例
     */
    getGenerator(name) {
        const generator = this.generators.get(name);
        if (!generator) {
            throw new Error(`生成器不存在: ${name}`);
        }
        return generator;
    }
    
    /**
     * 生成音效
     * @param {string} generatorName - 生成器名称
     * @param {Object} params - 生成参数
     * @returns {Promise<AudioNode>} 音频节点
     */
    async generateSound(generatorName, params = {}) {
        const generator = this.getGenerator(generatorName);
        return await generator.generate(params);
    }
    
    /**
     * 获取所有注册的生成器
     * @returns {Array} 生成器列表
     */
    getAllGenerators() {
        return Array.from(this.generators.keys());
    }
    
    /**
     * 清理所有生成器
     */
    cleanup() {
        this.generators.forEach(generator => {
            generator.cleanup();
        });
        this.generators.clear();
        console.log('音效生成器管理器已清理');
    }
}

// 导出类
window.SoundGenerator = SoundGenerator;
window.SoundGeneratorManager = SoundGeneratorManager;
window.SimpleToneGenerator = SimpleToneGenerator;
window.NoiseBurstGenerator = NoiseBurstGenerator;
window.FrequencySweepGenerator = FrequencySweepGenerator;
window.PulseSequenceGenerator = PulseSequenceGenerator;
window.FilterEffectGenerator = FilterEffectGenerator;
window.DelayEffectGenerator = DelayEffectGenerator;