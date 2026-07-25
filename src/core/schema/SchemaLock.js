// ============================================================
// SchemaLock.gs – блокировки
// ============================================================
const SchemaLock = {
  withLock(fn, timeout = 30000) {
    const lock = LockService.getScriptLock();
    try {
      if (lock.waitLock && typeof lock.waitLock === 'function') {
        lock.waitLock(timeout);
      }
      return fn();
    } finally {
      if (lock.releaseLock && typeof lock.releaseLock === 'function') {
        lock.releaseLock();
      }
    }
  }
};