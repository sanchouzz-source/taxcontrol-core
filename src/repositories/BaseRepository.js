delete(entity, id) {
  const meta = this.getMeta(entity);
  this.checkPermission(meta, "delete");

  // Ищем только НЕ удалённую запись
  const existing = this.findById(entity, id, { includeDeleted: false });
  if (!existing) {
    throw new Error(entity + " not found");
  }

  this.beforeDelete(entity, existing, meta);

  let result;

  if (meta.softDelete !== false) {
    // Сохраняем версию ДО изменения
    if (typeof Versioning !== "undefined") {
      Versioning.save(entity, id, existing);
    }

    const fields = this.getSoftDeleteFields(meta);
    const deleted = {
      [fields.deleted]: true,
      [fields.deletedAt]: new Date().toISOString(),
      [fields.deletedBy]: this.getCurrentUser()
    };

    // Выполняем обновление
    result = Database.update(meta.table, id, deleted);

    // ---------- ВРЕМЕННОЕ ЛОГИРОВАНИЕ ----------
    Logger.log("DELETE DEBUG RESULT " + JSON.stringify(result));

    const verify = Database.find(meta.table, id);
    Logger.log("DELETE VERIFY " + JSON.stringify(verify));
    // -------------------------------------------

    // Проверяем успешность обновления
    if (!result) {
      throw new Error(`Soft delete failed for ${entity} ${id}`);
    }
  } else {
    result = Database.delete(meta.table, id);
  }

  this.afterDelete(entity, existing, result, meta);
  this.publishEvent(
    entity,
    meta.events?.deleted,
    AuditConstants.ACTION_DELETE,
    existing,
    result
  );

  return result;
}