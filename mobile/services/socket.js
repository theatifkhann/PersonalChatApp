import { NativeModules, Platform } from "react-native";

const DEFAULT_PORT = 8000;
let backendHostOverride = "";
const DEPLOYED_HTTP_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_API_URL || "");
const DEPLOYED_WS_BASE_URL = normalizeBaseUrl(process.env.EXPO_PUBLIC_WS_URL || "");

function extractHost(value) {
  if (!value || typeof value !== "string") {
    return "";
  }

  return value
    .replace(/^[a-z]+:\/\//i, "")
    .split("/")[0]
    .split(":")[0]
    .trim();
}

export function normalizeBackendHost(value) {
  return extractHost(value);
}

function normalizeBaseUrl(value) {
  return typeof value === "string" ? value.trim().replace(/\/+$/, "") : "";
}

function convertHttpUrlToWebSocketUrl(value) {
  return value.replace(/^http:\/\//i, "ws://").replace(/^https:\/\//i, "wss://");
}

function getExpoManifest() {
  const rawManifest =
    NativeModules.ExponentConstants?.manifest ??
    NativeModules.EXConstants?.manifest ??
    null;

  if (!rawManifest) {
    return null;
  }

  if (typeof rawManifest === "string") {
    try {
      return JSON.parse(rawManifest);
    } catch {
      return null;
    }
  }

  return rawManifest;
}

function resolveLocalHost() {
  const expoManifest = getExpoManifest();
  const configuredHost =
    expoManifest?.extra?.backendHost ||
    process.env.EXPO_PUBLIC_BACKEND_HOST ||
    "";
  const candidates = [
    configuredHost,
    expoManifest?.hostUri,
    NativeModules.ExponentConstants?.experienceUrl,
    NativeModules.ExponentConstants?.linkingUri,
    NativeModules.SourceCode?.scriptURL,
  ];

  for (const candidate of candidates) {
    const host = extractHost(candidate);
    if (host) {
      return host;
    }
  }

  return Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
}

export function getDefaultBackendHost() {
  return resolveLocalHost();
}

export function isProductionApiConfigured() {
  return Boolean(DEPLOYED_HTTP_BASE_URL);
}

export function setBackendHostOverride(value) {
  backendHostOverride = normalizeBackendHost(value);
}

export function getBackendHost() {
  return backendHostOverride || getDefaultBackendHost();
}

export function getHttpBaseUrl() {
  if (DEPLOYED_HTTP_BASE_URL) {
    return DEPLOYED_HTTP_BASE_URL;
  }
  return `http://${getBackendHost()}:${DEFAULT_PORT}`;
}

export function getWsBaseUrl() {
  if (DEPLOYED_WS_BASE_URL) {
    return DEPLOYED_WS_BASE_URL;
  }
  if (DEPLOYED_HTTP_BASE_URL) {
    return convertHttpUrlToWebSocketUrl(DEPLOYED_HTTP_BASE_URL);
  }
  return `ws://${getBackendHost()}:${DEFAULT_PORT}`;
}

class ChatSocket {
  constructor() {
    this.socket = null;
    this.messageListeners = new Set();
    this.statusListeners = new Set();
  }

  onMessage(listener) {
    this.messageListeners.add(listener);

    return () => {
      this.messageListeners.delete(listener);
    };
  }

  onStatusChange(listener) {
    this.statusListeners.add(listener);

    return () => {
      this.statusListeners.delete(listener);
    };
  }

  emitMessage(payload) {
    this.messageListeners.forEach((listener) => listener(payload));
  }

  emitStatus(status) {
    this.statusListeners.forEach((listener) => listener(status));
  }

  connect(userId, token) {
    this.disconnect();
    this.emitStatus("connecting");

    return new Promise((resolve, reject) => {
      let settled = false;
      const wsBaseUrl = getWsBaseUrl();
      const socket = new WebSocket(
        `${wsBaseUrl}/ws/${userId}?token=${encodeURIComponent(token)}`,
      );
      this.socket = socket;

      socket.onopen = () => {
        settled = true;
        this.emitStatus("connected");
        resolve();
      };

      socket.onmessage = (event) => {
        try {
          this.emitMessage(JSON.parse(event.data));
        } catch (error) {
          this.emitMessage({
            type: "system",
            message: event.data,
          });
        }
      };

      socket.onerror = () => {
        this.emitStatus("error");
        if (!settled) {
          settled = true;
          reject(new Error("Unable to reach the websocket server."));
        }
      };

      socket.onclose = () => {
        if (this.socket === socket) {
          this.socket = null;
        }
        this.emitStatus("disconnected");
        if (!settled) {
          settled = true;
          reject(new Error("The websocket connection closed before it opened."));
        }
      };
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  sendMessage(receiverId, message) {
    if (!this.socket || this.socket.readyState !== 1) {
      throw new Error("Socket is not connected.");
    }

    this.socket.send(
      JSON.stringify({
        receiver_id: receiverId,
        message,
      }),
    );
  }
}

const chatSocket = new ChatSocket();

export default chatSocket;
