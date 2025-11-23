/**
 * 音效事件总线
 * @fileoverview 处理音效事件的发布订阅系统
 * @author 像素猫粮工厂开发团队
 * @version 1.0.0
 * @created 2025-11-23
 */

class AudioEventBus {
    constructor() {
        this.subscribers = new Map();        // 初始化订阅者映射表，存储事件类型到回调函数的映射
        this.setupGlobalListener();          // 设置全局DOM事件监听器，监听自定义的audioEvent事件
    }
    
    /**
     * 订阅音效事件
     * @param {string} eventType - 事件类型 ('*' 表示订阅所有事件)
     * @param {Function} callback - 回调函数
     */
    subscribe(eventType, callback) {
        if (!this.subscribers.has(eventType)) {
            this.subscribers.set(eventType, []);
        }
        this.subscribers.get(eventType).push(callback);
    }
    
    /**
     * 取消订阅音效事件
     * @param {string} eventType - 事件类型
     * @param {Function} callback - 回调函数
     */
    unsubscribe(eventType, callback) {
        const callbacks = this.subscribers.get(eventType);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * 发布音效事件
     * @param {string} eventType - 事件类型
     * @param {Object} data - 事件数据
     */
    publish(eventType, data) {
        console.log(`🎵 发布音效事件: ${eventType}`, data);
        
        // 通知特定事件类型的订阅者
        const specificCallbacks = this.subscribers.get(eventType) || [];
        specificCallbacks.forEach(callback => {
            try {
                callback({...data, eventType});
            } catch (error) {
                console.error(`音效事件处理错误 [${eventType}]:`, error);
            }
        });
        
        // 通知通配符订阅者
        const wildcardCallbacks = this.subscribers.get('*') || [];
        wildcardCallbacks.forEach(callback => {
            try {
                callback({...data, eventType});
            } catch (error) {
                console.error(`音效事件处理错误 [${eventType}]:`, error);
            }
        });
    }
    
    /**
     * 设置全局事件监听
     */
    setupGlobalListener() {
        document.addEventListener('audioEvent', (event) => {
            const { type, data } = event.detail;
            this.publish(type, data);
        });
    }
    
    /**
     * 获取订阅者统计信息
     * @returns {Object} 订阅统计
     */
    getSubscriptionStats() {
        const stats = {};
        for (const [eventType, callbacks] of this.subscribers) {
            stats[eventType] = callbacks.length;
        }
        return stats;
    }
}

// 创建全局音效事件总线实例
window.AudioEventBus = new AudioEventBus();