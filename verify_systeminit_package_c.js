"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;
const systemSource = fs.readFileSync(
  path.join(root, "SystemInit.js"),
  "utf8"
);
const appSource = fs.readFileSync(
  path.join(root, "App.js"),
  "utf8"
);
const gasTestSource = fs.readFileSync(
  path.join(
    root,
    "TestSystemInitContract.js"
  ),
  "utf8"
);

function createRuntime(options = {}) {
  const calls = [];
  const logs = [];
  const schemaWrites = [];

  const mark = (name) => {
    calls.push(name);
  };

  const context = {
    console: {
      log: (...args) => logs.push(["log", ...args]),
      warn: (...args) => logs.push(["warn", ...args]),
      error: (...args) => logs.push(["error", ...args]),
    },
  };

  context.Logger = {
    version: "test",
    log: (message) => logs.push(["log", message]),
    warn: (message) => logs.push(["warn", message]),
    error: (message) => logs.push(["error", message]),
  };

  context.HealthContract = {
    create(module, status, details) {
      return {
        module,
        status,
        details,
      };
    },
  };

  context.Config = {
    initialized: false,
    init() {
      mark("Config");
      this.initialized = true;
      return true;
    },
    reset() {
      this.initialized = false;
      return true;
    },
  };

  context.EntityMetadata = {
    initialized: false,
    init() {
      mark("EntityMetadata");
      this.initialized = true;
      return true;
    },
    list() {
      return [
        "CLIENT",
        "TRANSPORT_ORDER",
      ];
    },
    validate() {
      return [];
    },
  };

  context.EntityRegistry = {
    initialized: false,
    ready: false,
    init() {
      mark("EntityRegistry");
      assert.strictEqual(
        context.EntityMetadata.initialized,
        true
      );
      this.initialized = true;
      this.ready = true;
      return true;
    },
    list() {
      return [
        "CLIENT",
        "TRANSPORT_ORDER",
      ];
    },
    validate() {
      return [];
    },
    reset() {
      this.initialized = false;
      this.ready = false;
      return true;
    },
  };

  context.SchemaRegistry = {
    initialized: false,
    init() {
      mark("SchemaRegistry");
      assert.strictEqual(
        context.EntityRegistry.ready,
        true
      );
      this.initialized = true;
      return true;
    },
    list() {
      return [
        "CLIENT",
        "TRANSPORT_ORDER",
      ];
    },
    validate() {
      return [];
    },
    reset() {
      this.initialized = false;
      return true;
    },
  };

  context.SpreadsheetAdapter = {
    initialized: false,
    init() {
      mark("SpreadsheetAdapter");
      this.initialized = true;
      return true;
    },
    replace() {
      return true;
    },
    reset() {
      this.initialized = false;
      return true;
    },
  };

  context.SchemaBuilder = {
    build() {
      return {
        CLIENT: {},
        TRANSPORT_ORDER: {},
      };
    },
  };

  context.SchemaStorage = {
    load() {
      return {};
    },
    save(schema) {
      schemaWrites.push(schema);
      return true;
    },
  };

  context.SchemaManager = {
    initialized: false,
    state: "CREATED",
    tables: [],
    init() {
      mark("SchemaManager");
      assert.strictEqual(
        context.SpreadsheetAdapter.initialized,
        true
      );
      this.initialized = true;
      this.state = "READY";
      this.tables = [
        "CLIENT",
        "TRANSPORT_ORDER",
      ];
      context.SchemaStorage.save({
        CLIENT: {},
      });
      return this.tables;
    },
    getTables() {
      return [...this.tables];
    },
    reset() {
      this.initialized = false;
      this.state = "CREATED";
      this.tables = [];
      return true;
    },
  };

  context.Database = {
    initialized: false,
    status: "CREATED",
    entities: [],
    init(adapter) {
      mark("Database");
      assert.strictEqual(
        adapter,
        context.SpreadsheetAdapter
      );

      if (!options.databaseFalseReady) {
        this.initialized = true;
        this.status = "READY";
        this.entities = [
          "CLIENT",
          "TRANSPORT_ORDER",
        ];
      }

      return true;
    },
    list() {
      return [...this.entities];
    },
    reset() {
      this.initialized = false;
      this.status = "CREATED";
      this.entities = [];
      return true;
    },
  };

  context.BaseRepository = {
    _ready: false,
    init(database) {
      mark("BaseRepository");
      assert.strictEqual(
        database,
        context.Database
      );
      this._ready = true;
      return true;
    },
    ready() {
      return this._ready;
    },
    reset() {
      this._ready = false;
      return true;
    },
  };

  context.RepositoryFactory = {
    initialized: false,
    repositories: [],
    init() {
      mark("RepositoryFactory");
      this.initialized = true;
      this.repositories = [
        "CLIENT",
        "TRANSPORT_ORDER",
      ];
      return true;
    },
    list() {
      return [...this.repositories];
    },
    reset() {
      this.initialized = false;
      this.repositories = [];
      return true;
    },
  };

  context.RepositoryRegistry = {
    ready: false,
    repositories: {},
    factorySyncCount: 0,
    init() {
      mark("RepositoryRegistry");
      this.ready = true;
      this.repositories = {
        CLIENT: {},
        TRANSPORT_ORDER: {},
      };
      return true;
    },
    list() {
      return Object.keys(this.repositories);
    },
  };

  context.EntityService = {
    ready: false,
    init() {
      mark("EntityService");
      this.ready = true;
      return true;
    },
    reset() {
      this.ready = false;
      return true;
    },
  };

  context.ERPEventContract = {
    sequence: 0,
    init() {
      mark("ERPEventContract");
      return true;
    },
    create(params) {
      return { ...params };
    },
    validate() {
      return { valid: true };
    },
  };

  context.EventBus = {
    ready: false,
    events: {},
    history: [],
    _processing: new Set(),
    _idCounter: 0,
    init() {
      mark("EventBus");
      this.ready = true;
      return true;
    },
    emit(name, payload) {
      this.history.push({ name, payload });
      return {
        handlers: 0,
      };
    },
    clear() {
      this.events = {};
      return true;
    },
  };

  context.BusinessEventProcessor = {
    ready: false,
    processed: 0,
    failed: 0,
    duplicates: 0,
    auditFailed: 0,
    lastProcessed: null,
    startTime: null,
    eventCounter: 0,
    handlerCache: {},
    HANDLERS: {},
    _memoryCache: {},
    _memoryCacheKeys: [],
    init() {
      mark("BusinessEventProcessor");
      this.ready = true;
      return true;
    },
  };

  context.ClientService = {
    initialized: false,
    init() {
      mark("ClientService");
      this.initialized = true;
      return true;
    },
  };

  context.TransportOrderService = {
    initialized: false,
    init() {
      mark("TransportOrderService");
      this.initialized = true;
      return true;
    },
  };

  context.KPIService = {
    health() {
      return {
        status: "OK",
      };
    },
  };

  context.ServiceRegistry = {
    initialized: false,
    services: {},
    init() {
      mark("ServiceRegistry.init");
      this.initialized = true;
      return true;
    },
    refresh() {
      mark("ServiceRegistry.refresh");
      this.services = {
        ClientService:
          context.ClientService,
        TransportOrderService:
          context.TransportOrderService,
        KPIService:
          context.KPIService,
      };
      return true;
    },
    has(name) {
      return !!this.services[name];
    },
    reset() {
      this.initialized = false;
      this.services = {};
      return true;
    },
    health() {
      return {
        status:
          this.initialized ? "OK" : "WARNING",
      };
    },
  };

  context.ERP_MODULE_MANIFEST = {
    ExampleModule: {
      moduleDefinition: {
        name: "ExampleModule",
      },
    },
  };

  context.ModuleRegistry = {
    initialized: false,
    starting: false,
    startedAll: false,
    modules: {},
    started: {},
    failed: {},
    pending: {},
    criticalModules: {},
    phaseHistory: [],
    eventBus: null,
    loader: null,
    init() {
      mark("ModuleRegistry.init");
      this.initialized = true;
      return true;
    },
    setEventBus(bus) {
      this.eventBus = bus;
      return true;
    },
    loadManifest(manifest) {
      Object.keys(manifest).forEach((name) => {
        this.modules[name] =
          manifest[name];
      });
      return Object.keys(manifest).length;
    },
    count() {
      return Object.keys(this.modules).length;
    },
    health() {
      return {
        status: "OK",
      };
    },
  };

  if (options.missingRequired) {
    delete context[options.missingRequired];
  }

  if (options.asyncConfig) {
    context.Config.init = function init() {
      mark("Config");
      return Promise.resolve(true);
    };
  }

  vm.createContext(context);
  context.globalThis = context;

  vm.runInContext(
    systemSource,
    context,
    {
      filename: "SystemInit.js",
    }
  );

  vm.runInContext(
    appSource,
    context,
    {
      filename: "App.js",
    }
  );

  return {
    context,
    calls,
    logs,
    schemaWrites,
  };
}

const checks = [];

function check(name, fn) {
  fn();
  checks.push({
    name,
    status: "PASS",
  });
}

// ============================================================
// STATIC CONTRACT
// ============================================================

check("STATIC_VERSIONS", () => {
  assert.match(systemSource, /SystemInit v3\.2\.0/);
  assert.match(appSource, /App v4\.2\.0/);
  assert.match(
    gasTestSource,
    /TestSystemInitContract v4\.0\.0/
  );
});

check("STATIC_SYNCHRONOUS_LIFECYCLE", () => {
  assert.doesNotMatch(
    systemSource,
    /\basync\b|\bawait\b/
  );
  assert.doesNotMatch(
    appSource,
    /\basync\b|\bawait\b/
  );
});

check("STATIC_NO_MODULE_START", () => {
  assert.doesNotMatch(
    systemSource,
    /ModuleRegistry\.startAll|component\.startAll/
  );
  assert.match(
    systemSource,
    /REGISTERED_ONLY/
  );
});

check("STATIC_SCHEMA_IS_NOT_CLEARED", () => {
  assert.doesNotMatch(
    systemSource,
    /SchemaStorage\.clear\s*\(/
  );
});

check("STATIC_APP_DELEGATES_RESET", () => {
  assert.match(
    appSource,
    /systemResult = system\.reset\(\)/
  );
  assert.doesNotMatch(
    appSource,
    /EventBus\.reset|EntityService\.reset|SchemaManager\.reset/
  );
});

// ============================================================
// NORMAL RUNTIME
// ============================================================

const runtime = createRuntime();
const system = runtime.context.SystemInit;

const firstResult = system.init();

check("RUNTIME_INIT_IS_SYNC", () => {
  assert.ok(
    !firstResult ||
      typeof firstResult.then !== "function"
  );
});

check("RUNTIME_SYSTEM_READY", () => {
  assert.strictEqual(system.initialized, true);
  assert.strictEqual(system.status, "READY");
  assert.strictEqual(system.isReady(), true);
  assert.strictEqual(firstResult.status, "OK");
});

check("RUNTIME_GRAPH_COVERS_ALL_COMPONENTS", () => {
  assert.strictEqual(
    system.startupOrder.length,
    Object.keys(system.componentDefinitions)
      .length
  );
  assert.strictEqual(
    new Set(
      Array.from(system.startupOrder)
    ).size,
    system.startupOrder.length
  );
});

check("RUNTIME_SCHEMA_ORDER", () => {
  const order = system.startupOrder;

  assert.ok(
    order.indexOf("SpreadsheetAdapter") <
      order.indexOf("SchemaStorage")
  );
  assert.ok(
    order.indexOf("SchemaStorage") <
      order.indexOf("SchemaManager")
  );
  assert.ok(
    order.indexOf("SchemaBuilder") <
      order.indexOf("SchemaManager")
  );
  assert.ok(
    order.indexOf("SchemaManager") <
      order.indexOf("Database")
  );
});

check("RUNTIME_REPOSITORY_ORDER", () => {
  const order = system.startupOrder;

  assert.ok(
    order.indexOf("Database") <
      order.indexOf("BaseRepository")
  );
  assert.ok(
    order.indexOf("BaseRepository") <
      order.indexOf("RepositoryFactory")
  );
  assert.ok(
    order.indexOf("RepositoryFactory") <
      order.indexOf("RepositoryRegistry")
  );
  assert.ok(
    order.indexOf("RepositoryRegistry") <
      order.indexOf("EntityService")
  );
});

check("RUNTIME_CRITICAL_READY", () => {
  system.criticalComponents.forEach((name) => {
    assert.strictEqual(
      system.componentStatus[name].status,
      "READY",
      name
    );
    assert.strictEqual(
      typeof system.componentStatus[name]
        .readyBeforeStart,
      "boolean",
      name + " readiness provenance"
    );
  });
});

check("RUNTIME_OPTIONAL_MISSING_IS_SKIPPED", () => {
  assert.strictEqual(
    system.componentStatus.FinanceService.status,
    "SKIPPED"
  );
});

check("RUNTIME_MODULES_REGISTERED_ONLY", () => {
  const modules = system.health().modules;

  assert.strictEqual(
    modules.mode,
    "REGISTERED_ONLY"
  );
  assert.strictEqual(modules.startedAll, false);
  assert.strictEqual(modules.registered, 1);
});

check("RUNTIME_SERVICES_VALIDATED", () => {
  assert.strictEqual(
    runtime.context.ServiceRegistry.has(
      "ClientService"
    ),
    true
  );
  assert.strictEqual(
    runtime.context.ServiceRegistry.has(
      "TransportOrderService"
    ),
    true
  );
});

check("RUNTIME_INIT_IS_IDEMPOTENT", () => {
  const callsBefore = runtime.calls.length;
  const secondResult = system.init();

  assert.strictEqual(secondResult.status, "OK");
  assert.strictEqual(
    runtime.calls.length,
    callsBefore
  );
});

check("RUNTIME_DIAGNOSTICS_SAFE", () => {
  const diagnostics = system.diagnostics();

  assert.strictEqual(
    diagnostics.status,
    "READY"
  );
  assert.ok(
    Array.isArray(diagnostics.order)
  );
  assert.strictEqual(
    diagnostics.modules.mode,
    "REGISTERED_ONLY"
  );
});

check("RUNTIME_DEEP_RESET", () => {
  const preservedSubscription = () => true;
  const preservedBusinessHandler = {
    process() {
      return true;
    },
  };

  runtime.context.EventBus.events.TEST_EVENT = [
    {
      name: "preserved",
      handler: preservedSubscription,
    },
  ];
  runtime.context.BusinessEventProcessor
    .HANDLERS.TEST =
      preservedBusinessHandler;

  const resetResult = system.reset();

  assert.strictEqual(
    resetResult.status,
    "RESET"
  );
  assert.strictEqual(system.status, "CREATED");
  assert.strictEqual(system.initialized, false);
  assert.strictEqual(
    runtime.context.Config.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.EntityRegistry.ready,
    false
  );
  assert.strictEqual(
    runtime.context.SpreadsheetAdapter.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.SchemaManager.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.Database.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.BaseRepository.ready(),
    false
  );
  assert.strictEqual(
    runtime.context.RepositoryFactory.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.RepositoryRegistry.ready,
    false
  );
  assert.strictEqual(
    runtime.context.EventBus.ready,
    false
  );
  assert.strictEqual(
    runtime.context.ServiceRegistry.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.ModuleRegistry.initialized,
    false
  );
  assert.strictEqual(
    runtime.context.EventBus.events
      .TEST_EVENT[0].handler,
    preservedSubscription
  );
  assert.strictEqual(
    runtime.context.BusinessEventProcessor
      .HANDLERS.TEST,
    preservedBusinessHandler
  );
});

check("RUNTIME_RESET_PRESERVES_SCHEMA_STORAGE", () => {
  assert.ok(runtime.schemaWrites.length > 0);
  assert.strictEqual(
    typeof runtime.context.SchemaStorage.load,
    "function"
  );
  assert.strictEqual(
    typeof runtime.context.SchemaStorage.save,
    "function"
  );
});

// ============================================================
// FAILURE CONTRACTS
// ============================================================

check("RUNTIME_MISSING_REQUIRED_FAILS_PREFLIGHT", () => {
  const missing = createRuntime({
    missingRequired: "SchemaStorage",
  });

  assert.throws(
    () => missing.context.SystemInit.init(),
    /Lifecycle preflight failed: SchemaStorage unavailable/
  );

  assert.strictEqual(
    missing.calls.length,
    0,
    "Preflight started components before failing"
  );
  assert.strictEqual(
    missing.context.SystemInit.status,
    "FAILED"
  );
});

check("RUNTIME_FALSE_READY_IS_REJECTED", () => {
  const falseReady = createRuntime({
    databaseFalseReady: true,
  });

  assert.throws(
    () => falseReady.context.SystemInit.init(),
    /Database did not confirm ready state/
  );

  assert.strictEqual(
    falseReady.context.SystemInit
      .componentStatus.Database.status,
    "FAILED"
  );
  assert.strictEqual(
    falseReady.context.SystemInit.initialized,
    false
  );
});

check("RUNTIME_PROMISE_IS_REJECTED", () => {
  const asyncRuntime = createRuntime({
    asyncConfig: true,
  });

  assert.throws(
    () => asyncRuntime.context.SystemInit.init(),
    /Config\.init must be synchronous/
  );
  assert.strictEqual(
    asyncRuntime.context.SystemInit.status,
    "FAILED"
  );
});

check("RUNTIME_CYCLE_IS_REJECTED", () => {
  const cycle = createRuntime();

  assert.throws(
    () =>
      cycle.context.SystemInit.resolveOrder({
        A: {
          dependencies: ["B"],
        },
        B: {
          dependencies: ["A"],
        },
      }),
    /Circular lifecycle dependency/
  );
});

check("RUNTIME_UNKNOWN_DEPENDENCY_IS_REJECTED", () => {
  const unknown = createRuntime();

  assert.throws(
    () =>
      unknown.context.SystemInit.resolveOrder({
        A: {
          dependencies: ["MISSING"],
        },
      }),
    /A has unknown dependency MISSING/
  );
});

check("RUNTIME_STARTED_MODULES_BLOCK_FALSE_RESET", () => {
  const moduleRuntime = createRuntime();
  moduleRuntime.context.SystemInit.init();
  moduleRuntime.context.ModuleRegistry.started = {
    ExampleModule: true,
  };
  moduleRuntime.context.ModuleRegistry.startedAll =
    true;

  const result =
    moduleRuntime.context.SystemInit.reset();

  assert.strictEqual(result.status, "ERROR");
  assert.match(
    result.errors.join("; "),
    /synchronous stop lifecycle is not available yet/
  );
});

// ============================================================
// APP CONTRACT
// ============================================================

check("APP_START_AND_RESET_DELEGATE_TO_SYSTEMINIT", () => {
  const appRuntime = createRuntime();
  const app = appRuntime.context.App;

  const start = app.start();

  assert.strictEqual(start.status, "READY");
  assert.strictEqual(app.isReady(), true);

  const reset = app.reset();

  assert.strictEqual(reset.status, "OK");
  assert.strictEqual(
    reset.system.status,
    "RESET"
  );
  assert.strictEqual(app.isReady(), false);
  assert.strictEqual(
    appRuntime.context.SystemInit.status,
    "CREATED"
  );
});

check("GAS_CONTRACT_EXECUTES_IN_ONE_RUNTIME", () => {
  const gasRuntime = createRuntime();
  const context = gasRuntime.context;

  context.Bootstrap = {
    state: {
      bootCount: 0,
      started: false,
    },
    start() {
      if (
        this.started === true ||
        context.App.isReady()
      ) {
        this.started = true;
        return {
          status: "ALREADY_STARTED",
        };
      }

      this.state.bootCount++;
      const result = context.App.start();
      this.started = true;
      this.state.started = true;
      return result;
    },
    stop() {
      const result = context.App.reset();
      this.started = false;
      this.state.started = false;

      return result.status === "ERROR"
        ? {
            status: "ERROR",
            error: result.errors.join("; "),
          }
        : {
            status: "RESET",
          };
    },
  };

  context.startERP = () =>
    context.Bootstrap.start();
  context.resetERP = () =>
    context.Bootstrap.stop();

  vm.runInContext(
    gasTestSource,
    context,
    {
      filename: "TestSystemInitContract.js",
    }
  );

  const result =
    context.runSystemInitContractTest();

  assert.strictEqual(result.status, "PASS");
  assert.strictEqual(result.count, 17);
  assert.strictEqual(
    context.SystemInit.status,
    "CREATED"
  );
});

const result = {
  package: "TaxControl SystemInit Package C.1",
  static: {
    status: "PASS",
    checks: 5,
  },
  runtime: {
    status: "PASS",
    checks: checks.length - 5,
  },
  checks: checks.length,
  status: "PASS",
};

console.log(JSON.stringify(result, null, 2));
