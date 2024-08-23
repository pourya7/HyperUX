class HyperUXSDK {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.serverUrl = config.serverUrl;
        this.socket = null;
        this.sessionId = this.getSessionId();
        this.eventQueue = [];
        this.isSocketReady = false;

        this.initWebSocket().then(() => {
            this.initDOMCapture();
            this.initEventTracking();
        });
    }

    async initWebSocket() {
        if (!this.apiKey || !this.serverUrl) {
            console.error('A valid API key and server URL are required for WebSocket connection.');
            return;
        }

        const wsUrl = new URL(this.serverUrl);
        wsUrl.searchParams.append('apiKey', this.apiKey);
        this.socket = new WebSocket(wsUrl);

        return new Promise((resolve, reject) => {
            this.socket.onopen = () => {
                console.log('WebSocket connection established');
                this.isSocketReady = true;
                this.flushEventQueue();
                resolve();
            };

            this.socket.onclose = (event) => {
                console.warn('WebSocket connection closed:', event);
                reject();
            };

            this.socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject();
            };
        });
    }

    flushEventQueue() {
        while (this.eventQueue.length && this.isSocketReady) {
            const event = this.eventQueue.shift();
            this.sendData(event);
        }
    }

    initDOMCapture() {
        window.addEventListener('load', () => {
            this.captureDOMStructure();
            this.captureEvent('pageLoad', {
                element: document.body,
                url: window.location.href,
                referrer: document.referrer,
            });
        });
    }

    initEventTracking() {
        // Navigation Events
        document.addEventListener('click', (event) => {
            this.captureEvent('click', {
                element: event.target,
                id: event.target.id,
                x: event.clientX,
                y: event.clientY,
            });
        });

        // Scroll Event with Throttling
        document.addEventListener('scroll', throttle(() => {
            this.captureEvent('scroll', {
                element: document.scrollingElement || document.documentElement,
                scrollTop: document.documentElement.scrollTop || document.body.scrollTop,
                scrollLeft: document.documentElement.scrollLeft || document.body.scrollLeft,
            });
        }, 200));

        // Engagement Events
        let startTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - startTime;
            this.captureEvent('timeSpent', {
                element: document.body,
                duration: timeSpent,
            });
        });

        // Hover Event with Throttling
        document.addEventListener('mouseover', throttle((event) => {
            this.captureEvent('hover', {
                element: event.target,
                id: event.target.id,
            });
        }, 200));

        // Interaction Events
        document.addEventListener('submit', (event) => {
            this.captureEvent('formSubmit', {
                element: event.target,
                formId: event.target.id,
                action: event.target.action,
                method: event.target.method,
            });
        });

        document.addEventListener('click', (event) => {
            if (event.target.tagName.toLowerCase() === 'button') {
                this.captureEvent('buttonClick', {
                    element: event.target,
                    buttonId: event.target.id,
                    buttonText: event.target.innerText,
                });
            }
        });
    }

    sendData(data) {
        const enrichedData = {
            ...data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            apiKey: this.apiKey,
        };

        if (this.isSocketReady && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(enrichedData));
        } else {
            this.eventQueue.push(enrichedData);
            console.warn('WebSocket connection is not open, data queued:', enrichedData);
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('hyperux-session-id');
        if (!sessionId) {
            sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('hyperux-session-id', sessionId);
        }
        return sessionId;
    }

    captureDOMWithComponents(element = document.body) {
        const node = {
            tagName: element.tagName,
            id: element.id,
            componentType: identifyComponent(element),
            children: [...element.children].map(child => this.captureDOMWithComponents(child)),
        };
        return node;
    }

    captureDOMStructure() {
        const domTree = this.captureDOMWithComponents();
        this.sendData({
            event: 'domCapture',
            domTree: domTree,
        });
    }

    captureEvent(eventName, eventDetails) {
        if (eventDetails.element && eventDetails.element.getAttribute) {
            eventDetails.componentType = identifyComponent(eventDetails.element);
        }

        const eventData = {
            event: eventName,
            details: eventDetails,
        };

        this.sendData(eventData);
    }
}

function throttle(fn, limit) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now;
            return fn(...args);
        }
    };
}

function identifyComponent(element) {
    if (element && element.getAttribute) {
        let role = element.getAttribute('role');
        if (role) {
            return role;
        }

        let tag = element.tagName.toLowerCase();
        switch (tag) {
            case 'button':
            case 'a':
                return 'button';
            case 'nav':
                return 'navigation';
            case 'header':
                return 'header';
            case 'footer':
                return 'footer';
            case 'input':
            case 'textarea':
                return 'input';
            default:
                return 'generic';
        }
    }
    return 'unknown';
}
