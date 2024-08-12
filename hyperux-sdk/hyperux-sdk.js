export default class HyperUXSDK {
    constructor(config) {
        this.apiKey = config.apiKey;
        this.serverUrl = config.serverUrl;
        this.socket = null;
        this.sessionId = this.getSessionId();
        this.initWebSocket();
        this.initEventTracking();
    }

    // Initialize WebSocket connection
    initWebSocket() {
        if (!this.apiKey) {
            console.error('A valid API key is required for WebSocket connection.');
            return;
        }

        if (!this.serverUrl) {
            console.error('A valid API URL is required for WebSocket connection.');
            return;
        }

        const wsUrl = new URL(this.serverUrl);
        wsUrl.searchParams.append('apiKey', this.apiKey);
        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket connection established');
            this.sendData({ event: 'connectionEstablished', sessionId: this.sessionId });
        };

        this.socket.onclose = (event) => {
            if (event.code === 1008) {
                console.error('Invalid API key. Connection closed.');
            } else {
                console.warn('WebSocket connection closed.');
            }
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    sendData(data) {
        const enrichedData = {
            ...data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            sessionId: this.sessionId,
            apiKey: this.apiKey,
        };
    
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(enrichedData));
        } else {
            console.warn('WebSocket connection is not open, data not sent:', enrichedData);
        }
    }

    // Capture and send user interaction events
    captureEvent(eventName, eventDetails) {
        const eventData = {
            event: eventName,
            details: eventDetails,
        };

        this.sendData(eventData);
    }

    // Event Tracking
    initEventTracking() {
        document.addEventListener('click', (event) => {
            this.captureEvent('click', {
                element: event.target.tagName,
                id: event.target.id,
                classes: event.target.className,
                x: event.clientX,
                y: event.clientY,
            });
        });

        // document.addEventListener('scroll', () => {
        //     this.captureEvent('scroll', {
        //         scrollX: window.scrollX,
        //         scrollY: window.scrollY,
        //     });
        // });

        // document.addEventListener('submit', (event) => {
        //     this.captureEvent('formSubmit', {
        //         formId: event.target.id,
        //         formAction: event.target.action,
        //     });
        // });

        // document.addEventListener('mouseover', (event) => {
        //     this.captureEvent('hover', {
        //         element: event.target.tagName,
        //         id: event.target.id,
        //         classes: event.target.className,
        //     });
        // });
    }

    // Get or generate a session ID
    getSessionId() {
        let sessionId = sessionStorage.getItem('hyperux-session-id');
        if (!sessionId) {
            sessionId = `session-${Math.random().toString(36).substr(2, 9)}`;
            sessionStorage.setItem('hyperux-session-id', sessionId);
        }
        return sessionId;
    }
}