import EventBus, { Events } from '../../core/EventBus.js';

export class InputManager {
    constructor(scene) {
        this.scene = scene;
        this.moveAnchorX = null;
        this.moveAnchorY = null;
        // Read setting from registry (default true)
        this.joystickVisible = scene.registry.get('showJoystick') !== false;

        // SPLIT_X will be calculated in setupInputs() when cameras are available
        this.SPLIT_X = 280; // Default fallback

        // Input Throttling for UI Navigation
        this.lastNavTime = 0;
        this.navThreshold = 200; // ms
    }

    setupInputs() {
        const scene = this.scene;

        // Calculate SPLIT_X dynamically based on game width (70% of width)
        const gameWidth = scene.cameras.main.width;
        this.SPLIT_X = Math.round(gameWidth * 0.70);

        // --- KEYBOARD ---
        scene.cursors = scene.input.keyboard.createCursorKeys();
        scene.spaceKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        scene.enterKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        scene.escKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
        scene.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

        // --- TOUCH ---
        scene.input.on('pointerdown', (pointer) => {
            if (this.shouldIgnoreInput()) return;
            // Only start game if the scene has the method (e.g., Game scene)
            if (!scene.gameStarted && !scene.isPaused && typeof scene.startGame === 'function') {
                scene.startGame();
                return;
            }

            // Jump Zone (Right side)
            if (pointer.x > this.SPLIT_X) {
                this.handleJump();
                if (scene.uiManager) {
                    scene.uiManager.showJumpFeedback(pointer.x, pointer.y);
                }
            }
        });

        // Add multi-touch support
        scene.input.addPointer(3);

        // --- GAMEPAD ---
        this.setupGamepad();
    }

    setupGamepad() {
        const scene = this.scene;

        // Initialize gamepad plugin if not already started
        if (scene.input.gamepad && !scene.input.gamepad.enabled) {
            scene.input.gamepad.start();
            console.log('[InputManager] Gamepad plugin started');
        }

        if (!scene.input.gamepad) {
            console.warn('[InputManager] Gamepad plugin not available');
            return;
        }

        scene.input.gamepad.on('connected', (pad) => {
            console.log('🎮 Gamepad connected:', pad.id);
            EventBus.emit(Events.GAMEPAD_CONNECTED, { id: pad.id });
        });

        scene.input.gamepad.on('disconnected', (pad) => {
            console.log('🎮 Gamepad disconnected:', pad.id);
            EventBus.emit(Events.GAMEPAD_DISCONNECTED, { id: pad.id });
        });

        // Check if any gamepads are already connected
        const pads = scene.input.gamepad.gamepads;
        if (pads && pads.length > 0) {
            pads.forEach((pad, index) => {
                if (pad) {
                    console.log(`🎮 Gamepad ${index} already connected:`, pad.id);
                }
            });
        }
    }

    shouldIgnoreInput() {
        const scene = this.scene;
        return scene.isGameOver || scene.isPausedEvent || scene.isDevMenuOpen || scene.isPaused;
    }

    handleJump() {
        const scene = this.scene;
        // --- APLICAR SPEED BOOST ---
        let boost = scene.isInvincible ? 1.25 : 1.0; // 25% Extra Force
        EventBus.emit(Events.PLAYER_JUMP_REQUESTED, { boost });
    }

    update(time, delta) {
        const scene = this.scene;

        // 1. Dev Menu blocks everything
        if (scene.isDevMenuOpen) return;

        // 2. Menu Input States (GameOver, Paused, or MainMenu/NotStarted)
        if (scene.isGameOver || scene.isPaused || scene.isPausedEvent || !scene.gameStarted) {
            this.processMenuInputs(time);
            return;
        }

        // 3. Gameplay Inputs
        this.processGameInputs();
    }

    processMenuInputs(time) {
        if (time - this.lastNavTime < this.navThreshold) return;

        const scene = this.scene;

        // DEBUG: Log when in Game Over state
        if (scene.isGameOver) {
            console.log('[InputManager] 🎮 Processing inputs in GAME OVER state');
        }

        const pad = scene.input.gamepad ? scene.input.gamepad.getPad(0) : null;
        let navAction = null;

        // 1. Gamepad Navigation
        if (pad && pad.connected) {
            const axisH = pad.getAxisValue(0); // Left Stick Horizontal
            const axisV = pad.getAxisValue(1); // Left Stick Vertical

            if (pad.up || axisV < -0.5) navAction = Events.UI_NAV_UP;
            else if (pad.down || axisV > 0.5) navAction = Events.UI_NAV_DOWN;
            else if (pad.left || axisH < -0.5) navAction = Events.UI_NAV_LEFT;
            else if (pad.right || axisH > 0.5) navAction = Events.UI_NAV_RIGHT;

            if (pad.A) {
                EventBus.emit(Events.UI_SELECT);
                this.lastNavTime = time;
                return;
            }
            if (pad.B) {
                EventBus.emit(Events.UI_BACK);
                this.lastNavTime = time;
                return;
            }
        }

        // 2. Keyboard Navigation (Fallback / Parallel)
        const cursors = scene.cursors;
        if (cursors.up.isDown) navAction = Events.UI_NAV_UP;
        else if (cursors.down.isDown) navAction = Events.UI_NAV_DOWN;
        else if (cursors.left.isDown) navAction = Events.UI_NAV_LEFT;
        else if (cursors.right.isDown) navAction = Events.UI_NAV_RIGHT;

        if (scene.spaceKey.isDown || scene.enterKey.isDown) {
            // CRITICAL: Check if we should start the game (Game Scene Pre-start)
            if (!scene.gameStarted && !scene.isPaused && typeof scene.startGame === 'function') {
                scene.startGame();
                this.lastNavTime = time;
                return;
            }

            EventBus.emit(Events.UI_SELECT);
            this.lastNavTime = time;
            return;
        }

        if (navAction) {
            EventBus.emit(navAction);
            this.lastNavTime = time;
        }

        // Handle Escape for Back navigation (when not in Pause mode)
        if (scene.escKey.isDown && !scene.isPaused) {
            EventBus.emit(Events.UI_BACK);
            this.lastNavTime = time;
        }

        // 3. Pause Toggle from Menu (Resume)
        // If we are paused, allow escaping the menu
        if (scene.isPaused && (scene.escKey.isDown || scene.shiftKey.isDown)) {
            if (!this.pauseKey_wasDown) {
                EventBus.emit(Events.PAUSE_TOGGLE);
            }
            this.pauseKey_wasDown = true;
        } else {
            // Only reset if we are not pressing it (handled in processGameInputs usually, but here for safety)
            if (!scene.escKey.isDown && !scene.shiftKey.isDown) {
                this.pauseKey_wasDown = false;
            }
        }
    }

    processGameInputs() {
        const scene = this.scene;

        // --- MOVEMENT ---
        let moveDirection = 0;

        // 1. Keyboard
        if (scene.cursors.left.isDown) moveDirection = -1;
        else if (scene.cursors.right.isDown) moveDirection = 1;

        // Keyboard Jump
        const isJumpKeyDown = scene.spaceKey.isDown || scene.cursors.up.isDown;
        if (isJumpKeyDown && !this.jumpKey_wasDown) {
            this.handleJump();
        }
        this.jumpKey_wasDown = isJumpKeyDown;

        // ESC or SHIFT to Pause
        const isPauseKeyDown = scene.escKey.isDown || scene.shiftKey.isDown;
        if (isPauseKeyDown) {
            if (!this.pauseKey_wasDown) {
                EventBus.emit(Events.PAUSE_TOGGLE);
            }
            this.pauseKey_wasDown = true;
        } else {
            this.pauseKey_wasDown = false;
        }

        // 2. Gamepad
        const pad = scene.input.gamepad ? scene.input.gamepad.getPad(0) : null;
        if (pad && pad.connected) {
            const axisH = pad.getAxisValue(0);
            if (axisH < -0.3) moveDirection = -1;
            else if (axisH > 0.3) moveDirection = 1;

            if (pad.left) moveDirection = -1;
            if (pad.right) moveDirection = 1;

            if (pad.A || pad.B || pad.Y) {
                if (!this.padA_wasDown) {
                    this.handleJump();
                }
                this.padA_wasDown = true;
            } else {
                this.padA_wasDown = false;
            }
            if (pad.buttons[9] && pad.buttons[9].pressed) {
                if (!this.padStart_wasDown) {
                    EventBus.emit(Events.PAUSE_TOGGLE);
                }
                this.padStart_wasDown = true;
            } else {
                this.padStart_wasDown = false;
            }
        }

        // 3. Touch / Virtual Stick
        if (this.moveAnchorX !== null) {
            // Logic handles touch movement below
        }

        // --- EXECUTE MOVEMENT ---

        // Priority: Keyboard/Gamepad > Touch
        if (moveDirection !== 0) {
            // Hide Touch UI
            if (scene.uiManager) scene.uiManager.hideJoystick();
            this.moveAnchorX = null;

            EventBus.emit(Events.PLAYER_MOVE, { direction: moveDirection });
        } else {
            // Fallback to Touch Logic
            this.handleTouchMovement();
        }

        // --- EXECUTE JUMP ---
        // Jump is handled via event emission (PLAYER_JUMP_REQUESTED) in Keyboard/Gamepad sections above.
        // No further logic needed here for jump initiation, as it delegates to Player class via EventBus.

    }

    handleTouchMovement() {
        const scene = this.scene;
        let movePointer = null;

        // Check active pointers
        scene.input.manager.pointers.forEach((pointer) => {
            if (pointer.isDown && pointer.x <= this.SPLIT_X) movePointer = pointer;
        });

        if (movePointer) {
            if (this.moveAnchorX === null) {
                this.moveAnchorX = movePointer.x;
                this.moveAnchorY = movePointer.y;
                if (scene.uiManager) scene.uiManager.showJoystick(this.moveAnchorX, this.moveAnchorY, this.joystickVisible);
            }

            const dx = movePointer.x - this.moveAnchorX;
            const dy = movePointer.y - this.moveAnchorY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = 40;

            if (scene.uiManager) {
                const knobX = dist > maxDist
                    ? this.moveAnchorX + Math.cos(Math.atan2(dy, dx)) * maxDist
                    : movePointer.x;
                const knobY = dist > maxDist
                    ? this.moveAnchorY + Math.sin(Math.atan2(dy, dx)) * maxDist
                    : movePointer.y;
                scene.uiManager.updateJoystickKnob(knobX, knobY);
            }

            if (Math.abs(dx) > 10) {
                const direction = dx > 0 ? 1 : -1;
                EventBus.emit(Events.PLAYER_MOVE, { direction });
            } else {
                EventBus.emit(Events.PLAYER_STOP);
            }
        } else {
            this.moveAnchorX = null;
            if (scene.uiManager) scene.uiManager.hideJoystick();
            EventBus.emit(Events.PLAYER_STOP);
        }
    }

    toggleJoystickVisual() {
        // ... (rest of method unchanged, just keeping context)
        const currentState = this.scene.registry.get('showJoystick') !== false;
        this.joystickVisible = !currentState;
        const scene = this.scene;
        scene.registry.set('showJoystick', this.joystickVisible);
        if (scene.joystickToggleText) {
            scene.joystickToggleText.setText(this.joystickVisible ? 'JOYSTICK: ON' : 'JOYSTICK: OFF');
        }
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
