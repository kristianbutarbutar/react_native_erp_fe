export * from 'react-native-web';
import * as ReactNativeWeb from 'react-native-web';

class EventEmitterClass {
  constructor() {
    this.listeners = {};
  }
  addListener(eventType, listener) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(listener);
    return {
      remove: () => {
        this.removeListener(eventType, listener);
      },
    };
  }
  removeListener(eventType, listener) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType] = this.listeners[eventType].filter(l => l !== listener);
  }
  removeAllListeners(eventType) {
    if (eventType) {
      delete this.listeners[eventType];
    } else {
      this.listeners = {};
    }
  }
  emit(eventType, ...args) {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(listener => listener(...args));
  }
}

export const EventEmitter = EventEmitterClass;
EventEmitter.EventEmitter = EventEmitterClass;

export class NativeEventEmitter extends EventEmitterClass {
  constructor(nativeModule) {
    super();
    this.nativeModule = nativeModule || {};
  }
}
NativeEventEmitter.EventEmitter = EventEmitterClass;
NativeEventEmitter.NativeEventEmitter = NativeEventEmitter;

export const TurboModuleRegistry = {
  getEnforcing: () => null,
  get: () => null,
};

export const AssetRegistry = {
  registerAsset: (asset) => asset.hash,
  getAssetByID: () => null,
};

export const getAssetByID = () => null;

export const NativeModules = {
  NativeEventEmitter: NativeEventEmitter,
  EventEmitter: EventEmitter,
  ...(ReactNativeWeb.NativeModules || {}),
};

export const DeviceEventEmitter = {
  addListener: () => ({ remove: () => {} }),
  removeListener: () => {},
  emit: () => {},
};

export const PixelRatio = ReactNativeWeb.PixelRatio || {
  get: () => 1,
  getFontScale: () => 1,
  roundToNearestPixel: (sz) => sz,
};

export const Platform = ReactNativeWeb.Platform || { 
  OS: 'web', 
  select: (obj) => obj.web || obj.default 
};

const shimObject = {
  ...ReactNativeWeb,
  EventEmitter,
  NativeEventEmitter,
  TurboModuleRegistry,
  AssetRegistry,
  getAssetByID,
  NativeModules,
  DeviceEventEmitter,
  PixelRatio,
  Platform,
};

export default shimObject;