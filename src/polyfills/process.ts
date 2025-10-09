// Custom process polyfill for Google Cloud libraries in browser
// Ensure process is always available globally
// @ts-nocheck

// Import events polyfill
import { EventEmitter } from 'events';
// Import our custom util polyfill
import * as util from './util';
// Import promisify polyfill
import promisify from 'util-promisify';

// Make events available globally
if (typeof globalThis.events === 'undefined') {
  globalThis.events = { EventEmitter };
}

// Make util available globally
if (typeof globalThis.util === 'undefined') {
  globalThis.util = util;
}

// Create a safe EventEmitter instance for binding
const safeEventEmitter = new EventEmitter();

// Safe binding functions
const safeBind = (method: any, fallback: any) => {
  try {
    return method ? method.bind(safeEventEmitter) : fallback;
  } catch (error) {
    return fallback;
  }
};

// Ensure process is available immediately
if (typeof process === 'undefined') {
  // @ts-ignore
  globalThis.process = {};
}

// Create a more robust process object
const createProcessObject = () => ({
  env: {},
  platform: 'browser',
  version: 'v16.0.0',
  versions: {
    node: '16.0.0',
    v8: '9.0.0',
    uv: '1.41.0',
    zlib: '1.2.11',
    brotli: '1.0.9',
    ares: '1.17.2',
    modules: '93',
    nghttp2: '1.42.0',
    napi: '8',
    llhttp: '6.0.1',
    openssl: '1.1.1l',
    cldr: '39.0',
    icu: '69.1',
    tz: '2021a',
    unicode: '13.0'
  },
  argv: [],
  pid: 1,
  title: 'browser',
  arch: 'x64',
  stdout: {
    isTTY: false,
    write: () => {},
    end: () => {},
    on: () => {},
    once: () => {},
    emit: () => {},
    addListener: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    setMaxListeners: () => {},
    getMaxListeners: () => 10,
    listeners: () => [],
    rawListeners: () => [],
    listenerCount: () => 0,
    eventNames: () => [],
    prependListener: () => {},
    prependOnceListener: () => {},
    pipe: () => {},
    unpipe: () => {},
    cork: () => {},
    uncork: () => {},
    destroy: () => {},
    destroyed: false,
    readable: true,
    readableEncoding: null,
    readableEnded: false,
    readableFlowing: null,
    readableHighWaterMark: 16384,
    readableLength: 0,
    readableObjectMode: false,
    writable: true,
    writableEnded: false,
    writableFinished: false,
    writableHighWaterMark: 16384,
    writableLength: 0,
    writableObjectMode: false,
    writableCorked: 0,
    _writableState: {},
    _readableState: {},
    _events: {},
    _eventsCount: 0,
    _maxListeners: undefined
  },
  stderr: {
    isTTY: false,
    write: () => {},
    end: () => {},
    on: () => {},
    once: () => {},
    emit: () => {},
    addListener: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    setMaxListeners: () => {},
    getMaxListeners: () => 10,
    listeners: () => [],
    rawListeners: () => [],
    listenerCount: () => 0,
    eventNames: () => [],
    prependListener: () => {},
    prependOnceListener: () => {},
    pipe: () => {},
    unpipe: () => {},
    cork: () => {},
    uncork: () => {},
    destroy: () => {},
    destroyed: false,
    readable: true,
    readableEncoding: null,
    readableEnded: false,
    readableFlowing: null,
    readableHighWaterMark: 16384,
    readableLength: 0,
    readableObjectMode: false,
    writable: true,
    writableEnded: false,
    writableFinished: false,
    writableHighWaterMark: 16384,
    writableLength: 0,
    writableObjectMode: false,
    writableCorked: 0,
    _writableState: {},
    _readableState: {},
    _events: {},
    _eventsCount: 0,
    _maxListeners: undefined
  },
  stdin: {
    isTTY: false,
    read: () => null,
    on: () => {},
    once: () => {},
    emit: () => {},
    addListener: () => {},
    removeListener: () => {},
    removeAllListeners: () => {},
    setMaxListeners: () => {},
    getMaxListeners: () => 10,
    listeners: () => [],
    rawListeners: () => [],
    listenerCount: () => 0,
    eventNames: () => [],
    prependListener: () => {},
    prependOnceListener: () => {},
    pipe: () => {},
    unpipe: () => {},
    cork: () => {},
    uncork: () => {},
    destroy: () => {},
    destroyed: false,
    readable: true,
    readableEncoding: null,
    readableEnded: false,
    readableFlowing: null,
    readableHighWaterMark: 16384,
    readableLength: 0,
    readableObjectMode: false,
    writable: false,
    writableEnded: false,
    writableFinished: false,
    writableHighWaterMark: 16384,
    writableLength: 0,
    writableObjectMode: false,
    writableCorked: 0,
    _writableState: {},
    _readableState: {},
    _events: {},
    _eventsCount: 0,
    _maxListeners: undefined
  },
  nextTick: (callback: Function, ...args: any[]) => {
    setTimeout(() => callback(...args), 0);
  },
  cwd: () => '/',
  chdir: () => {},
  umask: () => 0,
  hrtime: () => [0, 0],
  uptime: () => 0,
  memoryUsage: () => ({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0
  }),
  cpuUsage: () => ({ user: 0, system: 0 }),
  binding: () => {},
  dlopen: () => {},
  exit: () => {},
  kill: () => {},
  abort: () => {},
  emitWarning: () => {},
  on: safeBind(EventEmitter.prototype.on, () => {}),
  once: safeBind(EventEmitter.prototype.once, () => {}),
  emit: safeBind(EventEmitter.prototype.emit, () => false),
  addListener: safeBind(EventEmitter.prototype.addListener, () => {}),
  removeListener: safeBind(EventEmitter.prototype.removeListener, () => {}),
  removeAllListeners: safeBind(EventEmitter.prototype.removeAllListeners, () => {}),
  setMaxListeners: safeBind(EventEmitter.prototype.setMaxListeners, () => {}),
  getMaxListeners: safeBind(EventEmitter.prototype.getMaxListeners, () => 10),
  listeners: safeBind(EventEmitter.prototype.listeners, () => []),
  rawListeners: safeBind(EventEmitter.prototype.rawListeners, () => []),
  listenerCount: safeBind(EventEmitter.prototype.listenerCount, () => 0),
  eventNames: safeBind(EventEmitter.prototype.eventNames, () => []),
  prependListener: safeBind(EventEmitter.prototype.prependListener, () => {}),
  prependOnceListener: safeBind(EventEmitter.prototype.prependOnceListener, () => {}),
  domain: null,
  _events: {},
  _eventsCount: 0,
  _maxListeners: undefined
});

// Assign the process object
if (typeof process === 'undefined' || !process.cwd) {
  // @ts-ignore
  globalThis.process = createProcessObject();
  // @ts-ignore
  window.process = globalThis.process;
}

// Additional safety: ensure process.stdout, stderr, stdin are always defined
if (typeof process !== 'undefined') {
  if (!process.stdout) {
    process.stdout = {
      isTTY: false,
      write: () => {},
      end: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      addListener: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      setMaxListeners: () => {},
      getMaxListeners: () => 10,
      listeners: () => [],
      rawListeners: () => [],
      listenerCount: () => 0,
      eventNames: () => [],
      prependListener: () => {},
      prependOnceListener: () => {},
      pipe: () => {},
      unpipe: () => {},
      cork: () => {},
      uncork: () => {},
      destroy: () => {},
      destroyed: false,
      readable: true,
      readableEncoding: null,
      readableEnded: false,
      readableFlowing: null,
      readableHighWaterMark: 16384,
      readableLength: 0,
      readableObjectMode: false,
      writable: true,
      writableEnded: false,
      writableFinished: false,
      writableHighWaterMark: 16384,
      writableLength: 0,
      writableObjectMode: false,
      writableCorked: 0,
      _writableState: {},
      _readableState: {},
      _events: {},
      _eventsCount: 0,
      _maxListeners: undefined
    };
  }
  
  if (!process.stderr) {
    process.stderr = {
      isTTY: false,
      write: () => {},
      end: () => {},
      on: () => {},
      once: () => {},
      emit: () => {},
      addListener: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      setMaxListeners: () => {},
      getMaxListeners: () => 10,
      listeners: () => [],
      rawListeners: () => [],
      listenerCount: () => 0,
      eventNames: () => [],
      prependListener: () => {},
      prependOnceListener: () => {},
      pipe: () => {},
      unpipe: () => {},
      cork: () => {},
      uncork: () => {},
      destroy: () => {},
      destroyed: false,
      readable: true,
      readableEncoding: null,
      readableEnded: false,
      readableFlowing: null,
      readableHighWaterMark: 16384,
      readableLength: 0,
      readableObjectMode: false,
      writable: true,
      writableEnded: false,
      writableFinished: false,
      writableHighWaterMark: 16384,
      writableLength: 0,
      writableObjectMode: false,
      writableCorked: 0,
      _writableState: {},
      _readableState: {},
      _events: {},
      _eventsCount: 0,
      _maxListeners: undefined
    };
  }
  
  if (!process.stdin) {
    process.stdin = {
      isTTY: false,
      read: () => null,
      on: () => {},
      once: () => {},
      emit: () => {},
      addListener: () => {},
      removeListener: () => {},
      removeAllListeners: () => {},
      setMaxListeners: () => {},
      getMaxListeners: () => 10,
      listeners: () => [],
      rawListeners: () => [],
      listenerCount: () => 0,
      eventNames: () => [],
      prependListener: () => {},
      prependOnceListener: () => {},
      pipe: () => {},
      unpipe: () => {},
      cork: () => {},
      uncork: () => {},
      destroy: () => {},
      destroyed: false,
      readable: true,
      readableEncoding: null,
      readableEnded: false,
      readableFlowing: null,
      readableHighWaterMark: 16384,
      readableLength: 0,
      readableObjectMode: false,
      writable: false,
      writableEnded: false,
      writableFinished: false,
      writableHighWaterMark: 16384,
      writableLength: 0,
      writableObjectMode: false,
      writableCorked: 0,
      _writableState: {},
      _readableState: {},
      _events: {},
      _eventsCount: 0,
      _maxListeners: undefined
    };
  }
}