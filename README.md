# TaxControl ERP — пакет G.1

## SecurityContext, роли и изоляция организаций

Пакет G.1 продолжает последовательность:

```text
A.1 → B.1 → C.1 → D.1 → E.1 → F.1 → G.1
```

Он заменяет четыре несогласованных контура `Auth`, `SecurityGuard`,
`RoleManager`, `UserSession/Session` одним execution-local контекстом и
обязательной фильтрацией данных по `OrganizationID`.

Пакет не изменяет существующие строки при установке и не выполняет
автоматическую миграцию старых данных.

## Что исправлено

### 1. Удалён общий пользовательский контекст из ScriptProperties

Больше не используются:

- `CURRENT_USER`;
- `CURRENT_ROLE`;
- `CURRENT_ORG`;
- другие значения идентичности в `PropertiesService.getScriptProperties()`.

`SecurityContext v1.0.0` существует только в памяти текущего выполнения
Google Apps Script. После завершения запроса контекст не считается
действительным и не переносится в следующий вызов меню или API.

Ни startup, ни reset не создают пользователя по умолчанию.

### 2. Удалена роль ADMIN по умолчанию

Без явного доверенного контекста:

```javascript
Auth.getCurrentUser();                 // null
SecurityGuard.check("CLIENT_READ");    // false
SecurityGuard.require("CLIENT_READ");  // AUTHENTICATION REQUIRED
```

Неизвестные роли и разрешения отклоняются.

### 3. Введён единый каталог разрешений

`PermissionConstants v2.0.0` содержит 87 канонических разрешений:

- CRUD-разрешения для зарегистрированных сущностей;
- финансовые операции;
- отчёты;
- replay событий;
- административные операции.

Старые имена разрешений нормализуются через ограниченный набор alias.
Отсутствующий ранее `PermissionConstants.PERMISSIONS` восстановлен как
совместимое представление канонического каталога. Ошибочное
`PERMISSION_TRIP_VIEW` заменено совместимым alias на `TRIP_READ`.

### 4. Реализована ролевая матрица

Поддерживаются роли:

| Роль | Назначение |
| --- | --- |
| `SYSTEM` | Только доверенные внутренние операции |
| `ADMIN` | Все функциональные разрешения в активной организации |
| `DIRECTOR` | Все функциональные разрешения в активной организации |
| `MANAGER` | Клиенты и управление транспортными процессами |
| `ACCOUNTANT` | Финансы, KPI, аудит и отчёты |
| `DISPATCHER` | Рейсы, заказы и транспортные справочники |
| `DRIVER` | Ограниченное чтение и обновление назначенных операций |
| `VIEWER` | Чтение и просмотр отчётности |

`ADMIN` и `DIRECTOR` не обходят изоляцию организаций.

Дополнительные разрешения и запреты из доверенного профиля пользователя
поддерживаются полями `Permissions` и `DeniedPermissions`. Явный запрет
имеет приоритет.

### 5. SecurityGuard проверяет текущего пользователя

Проверка разрешения теперь требует одновременно:

1. разрешение существует в каталоге;
2. присутствует аутентифицированный execution-local контекст;
3. роль или явный доверенный grant разрешает действие;
4. действие не запрещено через `DeniedPermissions`.

`SecurityGuard.runInternal()` оставлен только для терминальной записи
аудита, версий и failed events. Он не отключает фильтрацию по организации.

### 6. Организация проверяется на всех CRUD-маршрутах

Фильтрация встроена в:

```text
EntityService
    → BaseRepository
        → Database
            → SpreadsheetAdapter
```

Защищены:

- `create`;
- `find` и `findAll`;
- `findWhere`, `findOne`, `findBy`;
- `count`, `search`, `paginate`;
- `update`;
- `delete`;
- `restore`;
- bulk-операции;
- прямые обращения к `Database`.

Для scoped-сущности:

- новая запись автоматически получает активный `OrganizationID`;
- переданный вручную чужой `OrganizationID` отклоняется;
- чужая запись не возвращается при чтении;
- update/delete/restore чужой записи возвращают `not found`;
- `OrganizationID` существующей записи нельзя изменить;
- строка без `OrganizationID` скрывается до проверенной миграции.

### 7. Метаданные приведены к единому scope-контракту

Обязательный scope проверяется для 16 сущностей:

1. `ORGANIZATION`
2. `USER`
3. `CLIENT`
4. `TRIP`
5. `VEHICLE`
6. `DRIVER`
7. `CARRIER`
8. `ROUTE`
9. `CARGO`
10. `TRANSPORT_ORDER`
11. `CLIENT_FINANCE_PROFILE`
12. `FINANCIAL_TRANSACTION`
13. `KPI`
14. `AUDIT`
15. `VERSION`
16. `FAILED_EVENT`

В `ROUTE`, `CARGO` и `CLIENT_FINANCE_PROFILE` добавлено отсутствовавшее
поле `OrganizationID`.

`EntityRegistry v2.7.0` больше не отбрасывает `organizationScope`,
`system` и `permissions` при нормализации метаданных.

### 8. Явный системный bypass

Обход scope возможен только при выполнении двух условий одновременно:

1. код запущен внутри `SecurityContext.runAsSystem(...)` с
   `bypassOrganizationScope: true`;
2. конкретный вызов данных также передаёт
   `bypassOrganizationScope: true`.

Обычный пользователь не может создать `SYSTEM`-контекст через
`SecurityContext.set()`.

Этот маршрут используется диагностикой миграции. Прикладной код не должен
использовать его для пользовательских запросов.

### 9. Аудит, версии и события получают контекст запроса

Исправлены:

- `AuditLog`;
- `Versioning`;
- `EventStore`;
- `FailedEventRepository`;
- `ReportEngine`;
- `checkDuplicateClients`.

`AuditLog` всегда получает `UserID` и `OrganizationID` из
`SecurityContext` и игнорирует подмену этих полей во входных данных.

### 10. Полный reset очищает идентичность

`SystemInit v3.6.0` запускает security-компоненты до Database и
Repository:

```text
PermissionConstants
    → RoleConstants
        → RoleManager
            → SecurityContext
                → UserSession / OrganizationContext
                    → SecurityGuard
                        → OrganizationScope
                            → Database / Repository
```

`resetERP()` очищает текущего пользователя, стек временных контекстов и
внутренние security-флаги. Повторный startup не создаёт идентичность.

## Доверенная граница запроса

`SecurityContext` применяет уже проверенный профиль пользователя. Он не
является механизмом проверки пароля, OAuth-токена или мобильного
access-token.

Серверная точка входа должна:

1. проверить внешнюю идентичность;
2. загрузить роль и разрешённые организации из доверенного хранилища;
3. передать нормализованный профиль на время полного запроса;
4. выполнить бизнес-операцию внутри callback.

Пример серверного вызова:

```javascript
function handleTrustedClientList(authenticatedUser) {
  return withUserContext(
    {
      UserID: authenticatedUser.UserID,
      Role: authenticatedUser.Role,
      OrganizationID:
        authenticatedUser.OrganizationID,
      AllowedOrganizationIDs:
        authenticatedUser.AllowedOrganizationIDs,
      Permissions:
        authenticatedUser.Permissions || [],
      DeniedPermissions:
        authenticatedUser.DeniedPermissions || [],
      Source: "TRUSTED_SERVER_RESOLVER",
    },
    () => EntityService.findAll("CLIENT")
  );
}
```

Нельзя копировать `Role`, `Permissions`, `OrganizationID` или
`AllowedOrganizationIDs` непосредственно из произвольного тела запроса.

`setUser()` оставлен только как совместимый execution-local помощник. Его
нельзя использовать как login между двумя отдельными вызовами GAS.

## Переключение организации

Пользователь может временно выбрать только организацию, присутствующую в
`AllowedOrganizationIDs`:

```javascript
return withUserContext(user, () =>
  OrganizationContext.run(
    "ORG-002",
    () => EntityService.findAll("CLIENT")
  )
);
```

После callback исходная организация восстанавливается даже при ошибке.

## Новые версии

| Компонент | Версия |
| --- | ---: |
| `PermissionConstants` | 2.0.0 |
| `RoleConstants` | 1.0.0 |
| `RoleManager` | 1.0.0 |
| `SecurityContext` | 1.0.0 |
| `UserSession` | 1.0.0 |
| `OrganizationContext` | 2.0.0 |
| `SecurityGuard` | 1.0.0 |
| `Auth` | 2.0.0 |
| `Settings` | 2.0.0 |
| `OrganizationScope` | 1.0.0 |
| `EntityMetadata` | 3.4.0 |
| `EntityRegistry` | 2.7.0 |
| `SchemaRegistry` | 4.1.0 |
| `Database` | 5.4.0 |
| `BaseRepository` | 6.6.0 |
| `EntityService` | 5.5.0 |
| `AuditLog` | 2.2.0 |
| `Versioning` | 1.0.0 |
| `EventStore` | 2.0.0 |
| `ReportEngine` | 1.0.0 |
| `OrganizationScopeMigration` | 1.0.0 |
| `SystemInit` | 3.6.0 |

## Состав пакета

### Заменить полностью

| Файл пакета | Файл проекта |
| --- | --- |
| `AuditLog.js` | `AuditLog.js` |
| `Auth.js` | `Auth.js` |
| `OrganizationContext.js` | `OrganizationContext.js` |
| `PermissionConstants.js` | `PermissionConstants.js` |
| `ReportEngine.js` | `ReportEngine.js` |
| `RoleConstants.js` | `RoleConstants.js` |
| `RoleManager.js` | `RoleManager.js` |
| `SchemaRegistry.js` | `SchemaRegistry.js` |
| `Session.js` | `Session.js` |
| `Settings.js` | `Settings.js` |
| `UserSession.js` | `UserSession.js` |
| `Versioning.js` | `Versioning.js` |
| `checkDuplicateClients.js` | `checkDuplicateClients.js` |
| `src/core/Database.js` | `src/core/Database.js` |
| `src/core/EntityMetadata.js` | `src/core/EntityMetadata.js` |
| `src/core/EntityRegistry.js` | `src/core/EntityRegistry.js` |
| `src/core/EventStore.js` | `src/core/EventStore.js` |
| `src/repositories/BaseRepository.js` | `src/repositories/BaseRepository.js` |
| `src/repositories/FailedEventRepository.js` | `src/repositories/FailedEventRepository.js` |
| `src/repositories/VersionRepository.js` | `src/repositories/VersionRepository.js` |
| `src/services/EntityService.js` | `src/services/EntityService.js` |
| `src/system/SecurityGuard.js` | `src/system/SecurityGuard.js` |
| `src/system/SystemInit.js` | `src/system/SystemInit.js` |

### Добавить

| Файл пакета | Файл проекта |
| --- | --- |
| `OrganizationScopeMigration.js` | `OrganizationScopeMigration.js` |
| `src/system/OrganizationScope.js` | `src/system/OrganizationScope.js` |
| `src/system/SecurityContext.js` | `src/system/SecurityContext.js` |
| `tests/TestSecurityIsolationContract.js` | `tests/TestSecurityIsolationContract.js` |

Если один из файлов из раздела «Добавить» уже существует после ручных
экспериментов, его нужно полностью заменить версией из G.1.

### Не загружать в Google Apps Script

- `verify_security_package_g.js`;
- `package.json`;
- `README.md`.

Они предназначены для локальной проверки и внедрения.

## Порядок внедрения

### Шаг 1. Убедиться, что пакеты A–F уже внедрены

Пакет G рассчитан на:

- единый startup A;
- совместимый storage B;
- граф зависимостей C;
- модульный lifecycle D;
- единый EventBus E;
- Repository/Service API F.

Не объединяйте вручную `SystemInit`, `Database`, `BaseRepository` или
`EntityService` из разных пакетов.

### Шаг 2. Сделать резервную копию

```bash
clasp pull
```

Затем сохранить отдельную копию проекта или сделать git commit.

### Шаг 3. Заменить и добавить файлы

Файлы из таблиц выше нужно разместить по тем же путям. Старые определения
одноимённых глобальных объектов не должны оставаться рядом.

### Шаг 4. Отправить проект

```bash
clasp push
```

Перед подтверждением проверить список изменяемых файлов.

### Шаг 5. Выполнить контрактные проверки

Запускать по одной функции и ждать её завершения:

1. `runSchemaStorageAdapterContractTest`
2. `runRepositoryServiceContractTest`
3. `runEventPipelineContractTest`
4. `runModuleLifecycleContractTest`
5. `runSystemInitContractTest`
6. `runSecurityIsolationContractTest`
7. `startERP`

`runSecurityIsolationContractTest()` не создаёт, не меняет и не удаляет
строки рабочих таблиц. CRUD-сценарии выполняются на in-memory adapter.

Ожидаемый результат:

```javascript
{
  status: "PASS",
  total: 12,
  passed: 12,
  failed: 0,
  writes: 0
}
```

### Шаг 6. Выполнить только аудит старых строк

После успешного startup:

```javascript
runOrganizationScopeAudit()
```

Функция:

- читает scoped-сущности;
- считает строки без `OrganizationID`;
- показывает уже встречающиеся организации;
- не создаёт, не изменяет и не удаляет строки;
- всегда возвращает `writes: 0`.

Возможные статусы:

| Статус | Значение |
| --- | --- |
| `PASS` | Все строки имеют scope, ошибок чтения нет |
| `REVIEW_REQUIRED` | Есть строки без `OrganizationID` или ошибка проверки |

`REVIEW_REQUIRED` ожидаем для старых данных и не означает ошибку startup.
Такие строки уже скрыты от пользовательских запросов. Не назначайте им
организацию массово без проверки владельца каждой группы данных.

### Шаг 7. Временно ограничить рабочие операции

До проверенной миграции `OrganizationID` не следует открывать запись через
мобильный API или многопользовательский UI. Старые строки без scope будут
невидимы, а старые точки входа без `withUserContext()` получат
`AUTHENTICATION REQUIRED`.

## Локальная проверка пакета

В каталоге пакета:

```bash
npm test
```

Ожидаемый результат:

```text
30 PASS
0 FAIL
```

Проверяются:

- синтаксис всех JavaScript-файлов;
- отсутствие shared security properties;
- отсутствие default ADMIN/SYSTEM;
- полнота каталога и ролевой матрицы;
- порядок security-компонентов в `SystemInit`;
- обязательная синхронность callback;
- ограниченное переключение организации;
- полнота metadata scope;
- маркировка новых записей;
- фильтрация чтения;
- блокировка чужих create/update/delete/restore;
- scope для ADMIN;
- двойное подтверждение system bypass;
- защита прямого Database API;
- очистка контекста при reset;
- неразрушающий миграционный аудит.

## Допустимое предупреждение

Если в проекте отсутствует `NotificationService`, модульная диагностика
может остаться `DEGRADED` с предупреждением. Это допустимо, если:

- `startERP()` возвращает `READY`;
- критические компоненты имеют статус `READY`;
- `failedModules = 0`;
- предупреждение относится только к необязательному сервису уведомлений.

## Что пакет G не делает

Пакет намеренно не:

- проверяет пароль, OAuth-токен или мобильный access-token;
- доверяет роли и организации из тела внешнего запроса;
- сохраняет login между GAS executions;
- назначает `OrganizationID` старым строкам;
- решает, какой организации принадлежит legacy-строка;
- переписывает menu/API callbacks под конкретный provider идентичности;
- изменяет `ServiceRegistry`, `ModuleRegistry` или событийный контракт.

Следующий безопасный пакет должен соединить реальные точки входа с
доверенным resolver пользователя и подготовить контролируемую миграцию
legacy-строк по результату аудита.

## Откат

Установка G.1 сама не изменяет данные.

Для отката к F.1:

1. вернуть сохранённые версии заменённых файлов;
2. удалить `OrganizationScopeMigration.js`;
3. удалить `src/system/OrganizationScope.js`;
4. удалить `src/system/SecurityContext.js`;
5. удалить `tests/TestSecurityIsolationContract.js`;
6. выполнить `clasp push`;
7. запустить контрактные тесты A–F.

Не удаляйте листы, схему или рабочие строки.
