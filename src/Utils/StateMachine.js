export default class StateMachine {
    constructor(initialState, context) {
        this.context = context;
        this.states = {};
        this.currentState = null;
        this.isChangingState = false;
        this.changeQueue = [];

        this.initialState = initialState;
    }

    addState(name, config) {
        this.states[name] = {
            onEnter: config.onEnter?.bind(this.context),
            onUpdate: config.onUpdate?.bind(this.context),
            onExit: config.onExit?.bind(this.context)
        };
        return this;
    }

    setState(name) {
        if (!this.states[name]) {
            console.warn(`StateMachine: State '${name}' does not exist.`);
            return;
        }

        if (this.isChangingState) {
            this.changeQueue.push(name);
            return;
        }

        this.isChangingState = true;

        // Exit current state
        if (this.currentState && this.states[this.currentState].onExit) {
            this.states[this.currentState].onExit();
        }

        this.currentState = name;

        // Enter new state
        if (this.states[this.currentState].onEnter) {
            this.states[this.currentState].onEnter();
        }

        this.isChangingState = false;
    }

    update(time, delta) {
        // Process queued state changes
        if (this.changeQueue.length > 0) {
            this.setState(this.changeQueue.shift());
            return;
        }

        // Update current state
        if (this.currentState && this.states[this.currentState].onUpdate) {
            this.states[this.currentState].onUpdate(time, delta);
        }
    }

    start() {
        if (this.initialState) {
            this.setState(this.initialState);
        }
    }
}
