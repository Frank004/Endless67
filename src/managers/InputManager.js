import EventBus, { Events } from '../core/EventBus.js';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.moveAnchorX = null;
        this.moveAnchorY = null;
        // Read setting from registry (default true)
        this.joystickVisible = scene.registry.get('showJoystick') !== false;

        // SPLIT_X will be calculated in setupInputs() when cameras are available
        this.SPLIT_X = 280; // Default fallback
    }

    setupInputs() {
        const scene = this.scene;

        // Calculate SPLIT_X dynamically based on game width (70% of width)
        // For 360px mobile: 360 * 0.70 = 252px
        // For 400px desktop: 400 * 0.70 = 280px
        const gameWidth = scene.cameras.main.width;
        this.SPLIT_X = Math.round(gameWidth * 0.70);

        // Keyboard
        scene.cursors = scene.input.keyboard.createCursorKeys();
        scene.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Touch Inputs
        scene.input.on('pointerdown', (pointer) => {
            if (scene.isGameOver || scene.isPausedEvent || scene.isPaused || scene.isDevMenuOpen) return;
            if (!scene.gameStarted) { scene.startGame(); return; }
            if (pointer.x > this.SPLIT_X) {
                this.handleJump();
                // Visual feedback for jump - delegate to UIManager
                if (scene.uiManager) {
                    scene.uiManager.showJumpFeedback(pointer.x, pointer.y);
                }
            }
        });

        // Keyboard Jump
        scene.spaceKey.on('down', () => {
            if (scene.isGameOver || scene.isPausedEvent || scene.isPaused || scene.isDevMenuOpen) return;
            if (!scene.gameStarted) { scene.startGame(); return; }
            this.handleJump();
        });

        // Add multi-touch support
        scene.input.addPointer(3);
    }

    handleJump() {
        const scene = this.scene;
        // --- APLICAR SPEED BOOST ---
        let boost = scene.isInvincible ? 1.25 : 1.0; // 25% Extra Force

        // Emit event for jump request (Player will listen to this)
        EventBus.emit(Events.PLAYER_JUMP_REQUESTED, { boost });

        // Player now listens to PLAYER_JUMP_REQUESTED event
        // Removed direct call to prevent double execution
        // const result = scene.player.jump(boost); -> Handled by EventBus listener in Player.js
    }

    update() {
        const scene = this.scene;
        if (scene.isGameOver || scene.isPausedEvent || scene.isPaused || !scene.gameStarted || scene.isDevMenuOpen) return;

        let movePointer = null;
        let keyboardMove = 0;

        // Detectar movimiento por teclado
        if (scene.cursors.left.isDown) {
            keyboardMove = -1;
        } else if (scene.cursors.right.isDown) {
            keyboardMove = 1;
        }

        // Detectar movimiento táctil (solo si no hay input de teclado o es móvil)
        if (scene.isMobile || keyboardMove === 0) {
            scene.input.manager.pointers.forEach((pointer) => {
                if (pointer.isDown && pointer.x <= this.SPLIT_X) movePointer = pointer;
            });
        }

        if (keyboardMove !== 0) {
            // --- MOVIMIENTO POR TECLADO ---
            this.moveAnchorX = null;
            // Hide joystick UI - delegate to UIManager
            if (scene.uiManager) {
                scene.uiManager.hideJoystick();
            }

            // Emit event for player movement
            EventBus.emit(Events.PLAYER_MOVE, { direction: keyboardMove });

            // Event emitted: PLAYER_MOVE
            // Player listens to this event in Player.js
        } else if (movePointer) {
            // --- USUARIO MOVIENDO (TÁCTIL) ---
            if (this.moveAnchorX === null) {
                this.moveAnchorX = movePointer.x;
                this.moveAnchorY = movePointer.y;

                // Show and position joystick - delegate to UIManager
                if (scene.uiManager) {
                    scene.uiManager.showJoystick(this.moveAnchorX, this.moveAnchorY, this.joystickVisible);
                }
            }

            // Calculate delta
            const dx = movePointer.x - this.moveAnchorX;
            const dy = movePointer.y - this.moveAnchorY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 40; // Max joystick radius

            // Update joystick knob position - delegate to UIManager
            if (scene.uiManager) {
                const knobX = dist > maxDist
                    ? this.moveAnchorX + Math.cos(Math.atan2(dy, dx)) * maxDist
                    : movePointer.x;
                const knobY = dist > maxDist
                    ? this.moveAnchorY + Math.sin(Math.atan2(dy, dx)) * maxDist
                    : movePointer.y;
                scene.uiManager.updateJoystickKnob(knobX, knobY);
            }

            // Move player if threshold passed
            if (Math.abs(dx) > 10) {
                const direction = dx > 0 ? 1 : -1;

                // Emit event for player movement
                EventBus.emit(Events.PLAYER_MOVE, { direction });

                // Event emitted: PLAYER_MOVE
                // Player listens to this event in Player.js
            } else {
                // Emit event for player stop
                EventBus.emit(Events.PLAYER_STOP);

                // Event emitted: PLAYER_STOP
                // Player listens to this event in Player.js
            }
        } else {
            this.moveAnchorX = null;
            // Hide joystick UI - delegate to UIManager
            if (scene.uiManager) {
                scene.uiManager.hideJoystick();
            }

            // Emit event for player stop
            EventBus.emit(Events.PLAYER_STOP);

            // Event emitted: PLAYER_STOP
            // Player listens to this event in Player.js
        }
    }

    toggleJoystickVisual() {
        // Read current state from registry and toggle it
        const currentState = this.scene.registry.get('showJoystick') !== false;
        this.joystickVisible = !currentState;
        const scene = this.scene;

        // Persist state in registry
        scene.registry.set('showJoystick', this.joystickVisible);

        // Update button text if it exists (in pause menu or settings)
        if (scene.joystickToggleText) {
            scene.joystickToggleText.setText(this.joystickVisible ? 'JOYSTICK: ON' : 'JOYSTICK: OFF');
        }
        // For Settings scene
        if (scene.joystickText) {
            scene.joystickText.setText(this.joystickVisible ? 'JOYSTICK: ON' : 'JOYSTICK: OFF');
        }
    }

    /**
     * Creates a mobile HTML input for text entry (e.g., initials for high scores)
     * Automatically opens the keyboard on mobile devices
     * @param {Object} options - Configuration options
     * @param {Function} options.onInputChange - Callback when input changes (receives value string)
     * @param {Function} options.onEnter - Callback when Enter is pressed (receives value string)
     * @param {Phaser.GameObjects.Text} options.nameTextDisplay - Optional Phaser text object to update
     * @param {Phaser.GameObjects.Text} options.clickableText - Optional Phaser text object that can trigger input
     * @returns {HTMLInputElement|null} The created input element, or null if not mobile
     */
    createMobileTextInput(options = {}) {
        const scene = this.scene;
        const isMobile = scene.isMobile;

        if (!isMobile) {
            return null;
        }

        const { onInputChange, onEnter, nameTextDisplay, clickableText } = options;

        // Create HTML input element
        const htmlInput = document.createElement('input');
        htmlInput.type = 'text';
        htmlInput.maxLength = 3;
        htmlInput.style.position = 'fixed';
        htmlInput.style.top = '50%';
        htmlInput.style.left = '50%';
        htmlInput.style.transform = 'translate(-50%, -50%)';
        htmlInput.style.width = '250px';
        htmlInput.style.height = '50px';
        htmlInput.style.opacity = '0.01';
        htmlInput.style.zIndex = '10000';
        htmlInput.style.textTransform = 'uppercase';
        htmlInput.style.textAlign = 'center';
        htmlInput.style.fontSize = '24px';
        htmlInput.style.border = 'none';
        htmlInput.style.background = 'transparent';
        htmlInput.style.outline = 'none';
        htmlInput.autocomplete = 'off';
        htmlInput.autocapitalize = 'characters';
        htmlInput.inputMode = 'text';
        document.body.appendChild(htmlInput);

        // Function to attempt focus with multiple methods
        const attemptFocus = () => {
            try {
                // Method 1: Direct focus
                htmlInput.focus();

                // Method 2: Click then focus (for iOS)
                htmlInput.click();

                // Method 3: Set selection range if supported
                if (htmlInput.setSelectionRange) {
                    htmlInput.setSelectionRange(0, 0);
                }

                // Method 4: Force focus with timeout (for Android)
                setTimeout(() => {
                    htmlInput.focus();
                    htmlInput.click();
                }, 50);
            } catch (e) {
                console.error('[InputManager] Error focusing input:', e);
            }
        };

        // Try to focus immediately
        attemptFocus();

        // Try again after a short delay (some devices need this)
        setTimeout(attemptFocus, 100);

        // Try again after longer delay (for slower devices)
        setTimeout(attemptFocus, 300);

        // Listen to input changes
        htmlInput.addEventListener('input', (e) => {
            const value = e.target.value.toUpperCase().substring(0, 3);

            // Update Phaser text display if provided
            if (nameTextDisplay) {
                const display = value.padEnd(3, '_').split('').join(' ');
                nameTextDisplay.setText(display);
            }

            // Call callback if provided
            if (onInputChange) {
                onInputChange(value);
            }
        });

        // Listen to keydown
        htmlInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && htmlInput.value.length > 0) {
                const value = htmlInput.value.toUpperCase().substring(0, 3);
                if (onEnter) {
                    onEnter(value);
                }
            }
        });

        // Also listen to focus events to retry if needed
        htmlInput.addEventListener('blur', () => {
            // If input loses focus too quickly, try to refocus
            setTimeout(() => {
                if (htmlInput && document.body.contains(htmlInput)) {
                    htmlInput.focus();
                }
            }, 100);
        });

        // Make clickable text trigger input focus if provided
        if (clickableText) {
            clickableText.setInteractive({ useHandCursor: true });
            clickableText.on('pointerdown', () => {
                try {
                    htmlInput.focus();
                    htmlInput.click();
                } catch (e) {
                    console.error('[InputManager] Error focusing existing input:', e);
                }
            });
        }

        return htmlInput;
    }

    /**
     * Removes a mobile text input from the DOM
     * @param {HTMLInputElement} htmlInput - The input element to remove
     */
    removeMobileTextInput(htmlInput) {
        if (htmlInput && htmlInput.parentNode) {
            htmlInput.parentNode.removeChild(htmlInput);
        }
    }

    /**
     * Creates a keyboard listener for text input (desktop)
     * @param {Object} options - Configuration options
     * @param {Function} options.onBackspace - Callback when Backspace is pressed
     * @param {Function} options.onEnter - Callback when Enter is pressed
     * @param {Function} options.onKeyPress - Callback when a key is pressed (receives key string)
     * @returns {Function} The keydown listener function (to be used for removal)
     */
    createTextInputListener(options = {}) {
        const scene = this.scene;
        const { onBackspace, onEnter, onKeyPress } = options;

        const keyListener = (event) => {
            if (event.keyCode === 8) { // Backspace
                if (onBackspace) onBackspace();
            } else if (event.keyCode === 13) { // Enter
                if (onEnter) onEnter();
            } else if (event.key && event.key.length === 1) {
                if (onKeyPress) onKeyPress(event.key);
            }
        };

        scene.input.keyboard.on('keydown', keyListener);
        return keyListener;
    }

    /**
     * Removes a text input keyboard listener
     * @param {Function} keyListener - The listener function to remove
     */
    removeTextInputListener(keyListener) {
        const scene = this.scene;
        if (keyListener) {
            scene.input.keyboard.off('keydown', keyListener);
        }
    }
}
