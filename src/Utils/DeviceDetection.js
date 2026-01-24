/**
 * DeviceDetection - Sistema centralizado de detección de dispositivos
 * 
 * Proporciona funciones para detectar el tipo de dispositivo y obtener
 * configuraciones apropiadas (resoluciones, etc.)
 */

/**
 * Detecta si el dispositivo es móvil basándose en userAgent
 * Útil para configuración inicial antes de que Phaser esté disponible
 * @param {string} userAgent - Navigator userAgent (opcional)
 * @returns {boolean}
 */
export function isMobileDevice(userAgent = null) {
    if (typeof navigator === 'undefined') return false;
    const ua = userAgent || navigator.userAgent || navigator.vendor || window.opera || '';
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
}

/**
 * Detecta si es un dispositivo táctil
 * @returns {boolean}
 */
export function isTouchDevice() {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
}

/**
 * Obtiene información detallada del dispositivo usando Phaser.Device
 * @param {Phaser.Game} game - Instancia del juego Phaser
 * @returns {Object} Información del dispositivo
 */
export function getDeviceInfo(game) {
    if (!game || !game.device) {
        return {
            isMobile: false,
            isAndroid: false,
            isIOS: false,
            isIPad: false,
            isIPhone: false,
        };
    }

    const device = game.device;
    const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
    const isTouch = isTouchDevice();

    const isMobile = device.os.android ||
        device.os.iOS ||
        device.os.iPad ||
        device.os.iPhone ||
        device.os.windowsPhone ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent) ||
        (isTouch && /MacIntel/.test(navigator.platform)); // iPad Pro

    const isAndroid = device.os.android || /Android/i.test(userAgent);
    const isIOS = device.os.iOS || 
                  /iPhone|iPad|iPod/i.test(userAgent) || 
                  (isTouch && /MacIntel/.test(navigator.platform));
    const isIPad = device.os.iPad || 
                   /iPad/i.test(userAgent) || 
                   (isTouch && /MacIntel/.test(navigator.platform) && !/iPhone/i.test(userAgent));
    const isIPhone = device.os.iPhone || /iPhone/i.test(userAgent);

    return {
        isMobile,
        isAndroid,
        isIOS,
        isIPad,
        isIPhone,
    };
}

/**
 * Obtiene la resolución apropiada según el dispositivo
 * @param {boolean} isMobile - Si es dispositivo móvil
 * @param {Object} resolutions - Objeto con DESKTOP y MOBILE (de GameConstants)
 * @returns {Object} { width, height }
 */
export function getResolution(isMobile, resolutions) {
    return isMobile ? resolutions.MOBILE : resolutions.DESKTOP;
}

/**
 * Retorna una resolución escalada por devicePixelRatio usando innerWidth/innerHeight.
 * Incluye fallback seguro para no romper SSR ni valores base.
 * @param {{width:number,height:number}} baseResolution
 * @param {Object} [opts]
 * @param {number} [opts.maxDpr=3] - Límite superior para devicePixelRatio
 * @returns {{width:number,height:number}}
 */
export function getHiDpiResolution(baseResolution, opts = {}) {
    const { maxDpr = 3 } = opts;
    if (typeof window === 'undefined') return baseResolution;

    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), maxDpr);
    const innerW = window.innerWidth || baseResolution.width;
    const innerH = window.innerHeight || baseResolution.height;

    const scaledWidth = Math.round(innerW * dpr);
    const scaledHeight = Math.round(innerH * dpr);

    return {
        width: Math.max(baseResolution.width, scaledWidth),
        height: Math.max(baseResolution.height, scaledHeight)
    };
}

/**
 * Retorna un factor de resolución HiDPI clamped para usar en Phaser (config.resolution).
 * @param {Object} [opts]
 * @param {number} [opts.maxDpr=3]
 * @returns {number}
 */
export function getHiDpiScale(opts = {}) {
    const { maxDpr = 3 } = opts;
    if (typeof window === 'undefined') return 1;
    const dpr = window.devicePixelRatio || 1;
    return Math.min(Math.max(dpr, 1), maxDpr);
}

/**
 * Aplica clases CSS al body según el tipo de dispositivo
 * @param {Object} deviceInfo - Información del dispositivo (de getDeviceInfo)
 */
export function applyDeviceClasses(deviceInfo) {
    if (typeof document === 'undefined') return;

    if (deviceInfo.isMobile) {
        document.body.classList.add('mobile');
        if (deviceInfo.isAndroid) document.body.classList.add('android');
        if (deviceInfo.isIOS) document.body.classList.add('ios');
    }
}
