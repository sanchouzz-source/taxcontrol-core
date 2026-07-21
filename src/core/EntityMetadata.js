EntityMetadata.register = function (definition) {
  if (!definition || !definition.entity) {
    throw new Error("EntityMetadata.register: entity name required");
  }
  const entity = definition.entity;

  // Если поля переданы как массив строк – преобразуем в объекты
  if (Array.isArray(definition.fields) && definition.fields.length > 0 && typeof definition.fields[0] === "string") {
    const fieldNames = definition.fields;
    definition.fields = fieldNames.map(name => {
      const field = { name, type: "STRING" };
      if (name.endsWith("ID")) {
        field.type = "REFERENCE";
      }
      if (name === "CreatedAt" || name === "UpdatedAt") {
        field.type = "DATETIME";
      }
      if (name === "Deleted") {
        field.type = "BOOLEAN";
      }
      return field;
    });
  }

  // Заполняем отсутствующие поля значениями по умолчанию
  if (!definition.table) definition.table = entity + "s";
  if (!definition.id) definition.id = entity + "ID";
  if (!definition.idField) definition.idField = definition.id; // <--- ДОБАВЛЕНО
  if (!definition.idPrefix) definition.idPrefix = entity.substring(0, 3);
  if (!definition.permissions) {
    definition.permissions = {
      create: entity + "_CREATE",
      read: entity + "_READ",
      update: entity + "_UPDATE",
      delete: entity + "_DELETE",
      restore: entity + "_RESTORE"
    };
  }
  if (!definition.events) {
    definition.events = {
      created: entity + "_CREATED",
      updated: entity + "_UPDATED",
      deleted: entity + "_DELETED",
      restored: entity + "_RESTORED"
    };
  }

  this[entity] = definition;
  Logger.log("EntityMetadata REGISTERED: " + entity);
  return definition;
};