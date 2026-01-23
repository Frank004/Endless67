import { getDeviceInfo, applyDeviceClasses } from '../../utils/DeviceDetection.js';

export class DeviceConfig {
    /**
     * Configures the scene with device-specific settings and event listeners.
     * @param {Phaser.Scene} scene
     */
    static setup(scene) {
        const deviceInfo = getDeviceInfo(scene.sys.game);

        // Attach flags to scene for easy access
        scene.isMobile = deviceInfo.isMobile;
        scene.isAndroid = deviceInfo.isAndroid;
        scene.isIOS = deviceInfo.isIOS;
        scene.isIPad = deviceInfo.isIPad;
        scene.isIPhone = deviceInfo.isIPhone;

        // Apply CSS classes to body
        applyDeviceClasses(deviceInfo);

        console.log(`Device Detection: Mobile=${scene.isMobile}, Android=${scene.isAndroid}, iOS=${scene.isIOS}`);

        DeviceConfig.setupOrientationHandlers(scene);
    }

    /**
     * Sets up listeners for orientation changes and visibility changes.
     * @param {Phaser.Scene} scene 
     */
    static setupOrientationHandlers(scene) {
        const checkOrientation = () => {
            if (window.innerWidth > window.innerHeight) {
                document.body.classList.add('landscape');
                document.body.classList.remove('portrait');
            } else {
                document.body.classList.add('portrait');
                document.body.classList.remove('landscape');
            }
        };

        scene._orientationHandlers = scene._orientationHandlers || {};
        scene._orientationHandlers.checkOrientation = checkOrientation;

        // Handle audio context resuming on visibility change
        scene._orientationHandlers.visibilityHandler = () => {
            if (!document.hidden && scene.audioManager?.scene?.sound?.context) {
                scene.audioManager.scene.sound.context.resume().catch(() => { });
            }
        };

        window.addEventListener('resize', checkOrientation);
        window.addEventListener('orientationchange', checkOrientation);
        document.addEventListener('visibilitychange', scene._orientationHandlers.visibilityHandler);

        // Initial check
        checkOrientation();
    }

    /**
     * cleans up event listeners attached to the window/document.
     * @param {Phaser.Scene} scene 
     */
    static cleanup(scene) {
        const handlers = scene._orientationHandlers;
        if (handlers) {
            if (handlers.checkOrientation) {
                window.removeEventListener('resize', handlers.checkOrientation);
                window.removeEventListener('orientationchange', handlers.checkOrientation);
            }
            if (handlers.visibilityHandler) {
                document.removeEventListener('visibilitychange', handlers.visibilityHandler);
            }
            scene._orientationHandlers = null;
        }
    }
}
