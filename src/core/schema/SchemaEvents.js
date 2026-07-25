// ============================================================
// SchemaEvents.gs – события схемы
// ============================================================
const SchemaEvents = {
  emit(eventName, payload) {
    try {
      if (typeof EventBus !== 'undefined' && EventBus.emit) {
        EventBus.emit(eventName, payload, { source: 'SchemaManager' });
      }
    } catch (e) {
      Logger.debug('Event emit failed: ' + e.message);
    }
  }
};