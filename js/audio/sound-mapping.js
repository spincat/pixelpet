/**
 * 音效映射系统
 * @fileoverview 管理动作场景与声音名称的映射关系
 * @author 像素猫粮工厂开发团队
 * @version 1.0.0
 * @created 2025-11-23
 */

class SoundMappingSystem {
    constructor() {
        this.mappings = new Map();
        this.conditionalMappings = new Map();
        this.isInitialized = false;
    }
    
    /**
     * 初始化音效映射系统
     * @param {string|Object} config - 配置文件路径或映射配置对象
     * @returns {Promise<boolean>} 初始化结果
     */
    async initialize(config = null) {
        try {
            if (typeof config === 'string') {
                // 从文件路径加载配置
                await this.loadConfigFromFile(config);
            } else if (config) {
                // 从配置对象加载
                await this.loadConfig(config);
            } else {
                // 加载默认配置
                await this.loadDefaultConfig();
            }
            
            this.isInitialized = true;
            console.log('音效映射系统初始化完成');
            return true;
        } catch (error) {
            console.error('音效映射系统初始化失败:', error);
            return false;
        }
    }
    
    /**
     * 加载配置
     * @param {Object} config - 映射配置
     */
    async loadConfig(config) {
        this.mappings.clear();
        this.conditionalMappings.clear();
        
        // 加载基础映射
        if (config.mappings) {
            for (const [action, soundName] of Object.entries(config.mappings)) {
                this.mappings.set(action, soundName);
            }
        }
        
        // 加载条件映射
        if (config.conditional_mappings) {
            for (const [condition, mapping] of Object.entries(config.conditional_mappings)) {
                this.conditionalMappings.set(condition, mapping);
            }
        }
        
        console.log(`加载了 ${this.mappings.size} 个基础映射和 ${this.conditionalMappings.size} 个条件映射`);
    }
    
    /**
     * 从文件加载配置
     * @param {string} configPath - 配置文件路径
     */
    async loadConfigFromFile(configPath) {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`配置文件加载失败: ${response.status} ${response.statusText}`);
            }
            
            const config = await response.json();
            
            // 处理配置文件结构
            if (config.mappings) {
                // 如果是完整的配置文件结构
                await this.loadConfig({
                    mappings: this.flattenMappings(config.mappings),
                    conditional_mappings: this.flattenConditionalMappings(config.conditional_mappings || {})
                });
            } else {
                // 如果是直接的映射对象
                await this.loadConfig({
                    mappings: config,
                    conditional_mappings: {}
                });
            }
        } catch (error) {
            console.error('配置文件加载失败:', error);
            throw error;
        }
    }
    
    /**
     * 展平映射配置结构
     * @param {Object} mappings - 嵌套的映射配置
     * @returns {Object} 展平后的映射配置
     */
    flattenMappings(mappings) {
        const flattened = {};
        
        for (const [category, categoryConfig] of Object.entries(mappings)) {
            if (categoryConfig.actions) {
                for (const [action, actionConfig] of Object.entries(categoryConfig.actions)) {
                    // 构造完整的动作名称（category_action）
                    const fullActionName = `${category}_${action}`;
                    flattened[fullActionName] = actionConfig.sound_name;
                }
            }
        }
        
        return flattened;
    }
    
    /**
     * 展平条件映射配置结构
     * @param {Object} conditionalMappings - 嵌套的条件映射配置
     * @returns {Object} 展平后的条件映射配置
     */
    flattenConditionalMappings(conditionalMappings) {
        const flattened = {};
        
        // 处理外部配置文件中的规则数组结构
        if (conditionalMappings.rules && Array.isArray(conditionalMappings.rules)) {
            for (const rule of conditionalMappings.rules) {
                if (rule.condition && rule.mappings) {
                    // 为每个规则创建条件映射
                    const conditionName = `rule_${rule.condition.replace(/[^a-zA-Z0-9]/g, '_')}`;
                    
                    // 将规则映射转换为函数条件
                    flattened[conditionName] = {
                        condition: (data) => {
                            // 简单的条件解析（实际项目中应该使用更复杂的解析器）
                            if (rule.condition.includes('time_of_day')) {
                                return data.time_of_day === 'night';
                            }
                            if (rule.condition.includes('production_quality')) {
                                return data.quality >= 90;
                            }
                            if (rule.condition.includes('customer_mood')) {
                                return data.mood === 'happy';
                            }
                            return false;
                        },
                        sound: Object.values(rule.mappings)[0]?.sound_name || 'click_sound'
                    };
                }
            }
        } else {
            // 如果是直接的映射对象结构
            for (const [conditionName, mapping] of Object.entries(conditionalMappings)) {
                flattened[conditionName] = mapping;
            }
        }
        
        return flattened;
    }
    
    /**
     * 加载默认配置
     */
    async loadDefaultConfig() {
        const defaultConfig = {
            mappings: {
                // UI交互音效
                'button_click': 'click_sound',
                'button_hover': 'hover_sound',
                'slider_adjusted': 'slider_move',
                'slider_released': 'slider_release',
                'ui_emoji_select': 'click_sound',  // 添加emoji选择的音效映射
                'ui_slider_adjust': 'slider_move',  // 滑块调整音效
                'ui_service_select': 'click_sound',  // 服务选择音效
                'ui_system_reset': 'click_sound',  // 系统重置音效
                'ui_product_share': 'click_sound',  // 产品分享音效
                'ui_product_download': 'click_sound',  // 产品下载音效
                
                // 游戏逻辑音效
                'money_changed': 'coin_sound',
                'level_up': 'level_up_sound',
                'production_started': 'machine_start',
                'production_completed': 'success_sound',
                'production_production_start': 'machine_start',  // 生产开始音效
                'production_step_recipe': 'click_sound',  // 配方步骤音效
                'production_step_production': 'click_sound',  // 生产步骤音效
                'production_step_quality': 'click_sound',  // 质检步骤音效
                'production_step_packaging': 'click_sound',  // 包装步骤音效
                'production_step_logistics': 'click_sound',  // 物流步骤音效
                'production_step_complete': 'success_sound',  // 步骤完成音效
                'production_production_complete': 'production_complete',  // 生产完成音效
                
                // 环境音效
                'background_music': 'ambient_music',
                'ui_transition': 'transition_sound'
            },
            
            conditional_mappings: {
                'money_increased': {
                    condition: (data) => data.delta > 0,
                    sound: 'coin_gain'
                },
                'money_decreased': {
                    condition: (data) => data.delta < 0,
                    sound: 'coin_loss'
                },
                'high_quality': {
                    condition: (data) => data.quality > 80,
                    sound: 'high_quality_sound'
                },
                'low_quality': {
                    condition: (data) => data.quality < 30,
                    sound: 'low_quality_sound'
                }
            }
        };
        
        await this.loadConfig(defaultConfig);
    }
    
    /**
     * 根据动作场景获取音效名称
     * @param {string} action - 动作场景
     * @param {Object} data - 相关数据
     * @returns {string|null} 音效名称
     */
    getSoundForAction(action, data = {}) {
        if (!this.isInitialized) {
            console.warn('音效映射系统未初始化');
            return null;
        }
        
        // 首先检查条件映射
        for (const [conditionName, mapping] of this.conditionalMappings) {
            if (mapping.condition && mapping.condition(data)) {
                return mapping.sound;
            }
        }
        
        // 然后检查基础映射
        return this.mappings.get(action) || null;
    }
    
    /**
     * 添加自定义映射
     * @param {string} action - 动作场景
     * @param {string} soundName - 音效名称
     */
    addMapping(action, soundName) {
        this.mappings.set(action, soundName);
    }
    
    /**
     * 添加条件映射
     * @param {string} conditionName - 条件名称
     * @param {Function} condition - 条件函数
     * @param {string} soundName - 音效名称
     */
    addConditionalMapping(conditionName, condition, soundName) {
        this.conditionalMappings.set(conditionName, {
            condition: condition,
            sound: soundName
        });
    }
    
    /**
     * 移除映射
     * @param {string} action - 动作场景
     */
    removeMapping(action) {
        this.mappings.delete(action);
    }
    
    /**
     * 获取所有映射
     * @returns {Object} 映射配置
     */
    getAllMappings() {
        const mappings = {};
        for (const [action, soundName] of this.mappings) {
            mappings[action] = soundName;
        }
        
        const conditionalMappings = {};
        for (const [conditionName, mapping] of this.conditionalMappings) {
            conditionalMappings[conditionName] = {
                condition: mapping.condition ? mapping.condition.toString() : null,
                sound: mapping.sound
            };
        }
        
        return {
            mappings: mappings,
            conditional_mappings: conditionalMappings
        };
    }
    
    /**
     * 验证映射配置
     * @param {Object} config - 映射配置
     * @returns {Object} 验证结果
     */
    validateConfig(config) {
        const errors = [];
        const warnings = [];
        
        if (!config.mappings) {
            errors.push('缺少基础映射配置');
        }
        
        if (config.mappings) {
            for (const [action, soundName] of Object.entries(config.mappings)) {
                if (typeof soundName !== 'string') {
                    errors.push(`映射 ${action} 的音效名称必须是字符串`);
                }
            }
        }
        
        if (config.conditional_mappings) {
            for (const [conditionName, mapping] of Object.entries(config.conditional_mappings)) {
                if (typeof mapping.condition !== 'function') {
                    errors.push(`条件映射 ${conditionName} 的条件必须是函数`);
                }
                if (typeof mapping.sound !== 'string') {
                    errors.push(`条件映射 ${conditionName} 的音效名称必须是字符串`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors,
            warnings: warnings
        };
    }
}

// 导出音效映射系统类
window.SoundMappingSystem = SoundMappingSystem;