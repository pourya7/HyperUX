import 'dotenv/config';
import { WebSocketServer } from 'ws';
import express from 'express';
import { connect, Schema, model } from 'mongoose';

const app = express();
const port = process.env.PORT || 8080;

const validApiKeys = new Set(['api-key-111', 'api-key-112', 'api-key-113']);

connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB', err));

// event schema to support session recording
const eventSchema = new Schema({
    event: String,
    details: Schema.Types.Mixed,
    timestamp: Date,
    userAgent: String,
    sessionId: String,
    recorded: Boolean
});

const Event = model('Event', eventSchema);

const wss = new WebSocketServer({ 
    server: app.listen(port, () => console.log(`Server running on port ${port}`))
});


// Real-time processing on the server
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (!validApiKeys.has(data.apiKey)) {
                console.warn('Invalid API key', data.apiKey);
                ws.close(1008, 'Invalid API key');
                return;
            }

            if (validateEventData(data)) {
                const event = new Event({
                    ...data,
                    timestamp: new Date(),
                    sessionId: data.sessionId || generateSessionId(ws),
                });

                // Save the event to the database
                await event.save();

                console.log('Event saved:', event);
            } else {
                console.warn('Invalid data received:', data);
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

// Helper function to validate event data
function validateEventData(data) {
    return data.event && data.details && data.timestamp && data.userAgent;
}

// Helper function to generate a session ID
function generateSessionId(ws) {
    return ws._socket.remoteAddress + '-' + new Date().getTime();
}
