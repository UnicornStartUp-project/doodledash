// WebSocket Connection with auto-reconnect

class Connection {
  constructor(url) {
    this.url = url;
    this.handlers = {};
    this.reconnectAttempts = 0;
    this.maxBackoff = 10000;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      console.log('🔗 Connected to DoodleDash server');
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type && this.handlers[msg.type]) {
          this.handlers[msg.type].forEach(fn => fn(msg.payload));
        }
      } catch (e) {
        // ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      console.log('🔌 Disconnected — reconnecting...');
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };
  }

  scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxBackoff);
    this.reconnectAttempts++;
    setTimeout(() => this.connect(), delay);
  }

  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(fn);
  }

  send(type, payload = {}) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

export default Connection;
