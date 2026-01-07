import {
    isMobileDevice,
    isTouchDevice,
    getDeviceInfo,
    applyDeviceClasses
} from '../../src/utils/DeviceDetection.js';

const originalNavigator = global.navigator;

const setNavigator = (overrides) => {
    Object.defineProperty(global, 'navigator', {
        value: {
            userAgent: '',
            vendor: '',
            platform: 'MacIntel',
            maxTouchPoints: 0,
            msMaxTouchPoints: 0,
            ...overrides
        },
        configurable: true,
        writable: true
    });
};

describe('DeviceDetection', () => {
    afterEach(() => {
        document.body.className = '';
    });

    afterAll(() => {
        Object.defineProperty(global, 'navigator', {
            value: originalNavigator,
            configurable: true
        });
    });

    test('isMobileDevice should detect common mobile user agents', () => {
        setNavigator({ userAgent: 'Mozilla/5.0 (Linux; Android 10; Pixel 3)' });
        expect(isMobileDevice()).toBe(true);

        setNavigator({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' });
        expect(isMobileDevice()).toBe(false);
    });

    test('isTouchDevice should detect touch capable devices', () => {
        setNavigator({ maxTouchPoints: 2, msMaxTouchPoints: 0 });
        expect(isTouchDevice()).toBe(true);
    });

    test('getDeviceInfo should return defaults when game is missing', () => {
        expect(getDeviceInfo(null)).toEqual({
            isMobile: false,
            isAndroid: false,
            isIOS: false,
            isIPad: false,
            isIPhone: false
        });
    });

    test('getDeviceInfo should combine Phaser flags and user agent detection', () => {
        setNavigator({
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
            platform: 'iPhone',
            maxTouchPoints: 2
        });

        const game = {
            device: {
                os: {
                    android: false,
                    iOS: true,
                    iPad: false,
                    iPhone: true,
                    windowsPhone: false
                }
            }
        };

        expect(getDeviceInfo(game)).toEqual({
            isMobile: true,
            isAndroid: false,
            isIOS: true,
            isIPad: false,
            isIPhone: true
        });
    });

    test('applyDeviceClasses should add CSS classes for mobile platforms', () => {
        applyDeviceClasses({
            isMobile: true,
            isAndroid: true,
            isIOS: false
        });

        expect(document.body.classList.contains('mobile')).toBe(true);
        expect(document.body.classList.contains('android')).toBe(true);
        expect(document.body.classList.contains('ios')).toBe(false);
    });
});
