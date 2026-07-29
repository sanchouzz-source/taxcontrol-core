"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = __dirname;

const read = (name) =>
  fs.readFileSync(
    path.join(root, name),
    "utf8"
  );

const sources = {
  contract: read("ERPEventContract.js"),
  bus: read("EventBus.js"),
  processor: read(
    "BusinessEventProcessor.js"
  ),
  base: read("BaseRepository.js"),
  finance: read("FinanceEngine.js"),
  kpi: read("KPIEngine.js"),
  subscriptions: read(
    "EventSubscriptions.js"
  ),
  manifest: read("ModuleManifest.js"),
  system: read("SystemInit.js"),
  gasTest: read(
    "TestEventPipelineContract.js"
  ),
  moduleTest: read(
    "TestModuleLifecycleContract.js"
  ),
};

const logs = [];
const context = {
  console: {
    log: (...args) =>
      logs.push(["log", ...args]),
    warn: (...args) =>
      logs.push(["warn", ...args]),
    error: (...args) =>
      logs.push(["error", ...args]),
    debug: (...args) =>
      logs.push(["debug", ...args]),
  },
};

context.globalThis = context;
context.Logger = {
  log: (message) =>
    logs.push(["log", message]),
  info: (message) =>
    logs.push(["info", message]),
  debug: (message) =>
    logs.push(["debug", message]),
  warn: (message) =>
    logs.push(["warn", message]),
  error: (message) =>
    logs.push(["error", message]),
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

vm.createContext(context);

const run = (filename, source) =>
  vm.runInContext(source, context, {
    filename,
  });

[
  ["ERPEventContract.js", sources.contract],
  ["EventBus.js", sources.bus],
  [
    "BusinessEventProcessor.js",
    sources.processor,
  ],
].forEach(([filename, source]) =>
  run(filename, source)
);

const checks = [];

function check(name, callback) {
  callback();
  checks.push({
    name,
    status: "PASS",
  });
}

// ============================================================
// STATIC CONTRACT
// ============================================================

check("STATIC_VERSIONS", () => {
  assert.match(
    sources.contract,
    /ERPEventContract v2\.0\.0/
  );
  assert.match(
    sources.bus,
    /EventBus v3\.0\.0/
  );
  assert.match(
    sources.processor,
    /BusinessEventProcessor v2\.0\.0/
  );
  assert.match(
    sources.base,
    /BaseRepository v6\.4\.0/
  );
  assert.match(
    sources.manifest,
    /ModuleManifest v3\.1\.0/
  );
  assert.match(
    sources.system,
    /SystemInit v3\.4\.0/
  );
});

check("STATIC_SYNCHRONOUS", () => {
  Object.values(sources).forEach((source) => {
    assert.doesNotMatch(
      source,
      /\basync\s+(?:init|start|stop|reset|emit|publish|process)\b|\bawait\b/
    );
  });
});

check("STATIC_SINGLE_CRUD_OWNER", () => {
  assert.match(
    sources.bus,
    /lifecycleOwner:\s*"BaseRepository"/
  );
  assert.match(
    sources.bus,
    /CRUD_EVENT_OWNER/
  );
  assert.match(
    sources.base,
    /source:\s*"BaseRepository"/
  );
});

check("STATIC_MANAGED_SUBSCRIBERS", () => {
  assert.match(
    sources.manifest,
    /EventSubscriptions:\s*createModule/
  );
  assert.match(
    sources.manifest,
    /moduleDependencies:\s*\[\s*"DashboardEngine"/
  );
  assert.doesNotMatch(
    sources.subscriptions,
    /EventSubscriptions\.init\(\)\s*;/
  );
});

check("STATIC_FULL_EVENT_RESET", () => {
  assert.match(
    sources.system,
    /EventBus\.reset unavailable/
  );
  assert.match(
    sources.system,
    /BusinessEventProcessor\.reset unavailable/
  );
  assert.match(
    sources.system,
    /ERPEventContract\.reset/
  );
});

check("STATIC_GAS_CONTRACT", () => {
  assert.match(
    sources.gasTest,
    /TestEventPipelineContract v1\.0\.0/
  );
  assert.match(
    sources.moduleTest,
    /TestModuleLifecycleContract v1\.1\.0/
  );
});

// ============================================================
// EVENT CONTRACT / BUS
// ============================================================

context.ERPEventContract.init();
context.EventBus.init();
context.BusinessEventProcessor.init();

check("ENTITY_ENVELOPE_CANONICAL", () => {
  const event =
    context.ERPEventContract.create({
      name: "TEST_ENTITY_CREATED",
      entity: "TEST_ENTITY",
      entityId: "T-1",
      action: "CREATE",
      after: {
        TestEntityID: "T-1",
        Value: 7,
      },
      source: "BaseRepository",
    });

  assert.strictEqual(
    event.type,
    "CREATED"
  );
  assert.strictEqual(
    event.payload.Value,
    7
  );
  assert.strictEqual(event.data, event.payload);
  assert.strictEqual(
    event.metadata.contractVersion,
    "2.0"
  );
  assert.strictEqual(
    context.ERPEventContract.validate(event)
      .valid,
    true
  );
});

check("SYSTEM_EVENT_WITHOUT_ENTITY", () => {
  const event =
    context.ERPEventContract.create({
      name: "ERP_TEST_READY",
      type: "READY",
      payload: { status: "OK" },
      source: "Verifier",
      metadata: { kind: "SYSTEM" },
    });

  assert.strictEqual(event.entity, null);
  assert.strictEqual(event.entityId, null);
  assert.strictEqual(
    context.ERPEventContract.validate(event)
      .valid,
    true
  );
});

let entityDeliveries = 0;
let entityEnvelope = null;

const entityToken = context.EventBus.subscribe(
  "TEST_ENTITY_CREATED",
  (event) => {
    entityDeliveries++;
    entityEnvelope = event;
    return true;
  },
  {
    name: "Verifier_Entity",
    owner: "Verifier",
  }
);

check("BASE_CRUD_DELIVERED_ONCE", () => {
  const result = context.EventBus.emit(
    "TEST_ENTITY_CREATED",
    {
      entity: "TEST_ENTITY",
      entityId: "T-2",
      after: {
        TestEntityID: "T-2",
      },
      source: "BaseRepository",
    },
    {
      source: "BaseRepository",
    }
  );

  assert.strictEqual(result.executed, 1);
  assert.strictEqual(entityDeliveries, 1);
  assert.strictEqual(
    entityEnvelope.entityId,
    "T-2"
  );
});

check("LEGACY_CRUD_PUBLISHER_SUPPRESSED", () => {
  const result = context.EventBus.emit(
    "TEST_ENTITY_CREATED",
    {
      entity: "TEST_ENTITY",
      entityId: "T-2",
      after: {
        TestEntityID: "T-2",
      },
      source: "EntityService",
    }
  );

  assert.strictEqual(result.suppressed, true);
  assert.strictEqual(
    result.reason,
    "CRUD_EVENT_OWNER"
  );
  assert.strictEqual(entityDeliveries, 1);
});

check("DUPLICATE_SUBSCRIPTION_SKIPPED", () => {
  const duplicate = context.EventBus.subscribe(
    "TEST_ENTITY_CREATED",
    () => true,
    {
      name: "Verifier_Entity",
      owner: "Verifier",
    }
  );

  assert.strictEqual(duplicate.duplicate, true);
  assert.strictEqual(
    context.EventBus.listeners(
      "TEST_ENTITY_CREATED"
    ),
    1
  );
});

check("UNSUBSCRIBE_TOKEN", () => {
  assert.strictEqual(
    context.EventBus.unsubscribe(
      "TEST_ENTITY_CREATED",
      entityToken
    ),
    1
  );
  assert.strictEqual(
    context.EventBus.listeners(
      "TEST_ENTITY_CREATED"
    ),
    0
  );
});

check("PROMISE_HANDLER_REJECTED", () => {
  const token = context.EventBus.subscribe(
    "TEST_PROMISE_SIGNAL",
    () => Promise.resolve(true),
    {
      name: "Verifier_Promise",
      owner: "Verifier",
    }
  );

  const result = context.EventBus.emit(
    "TEST_PROMISE_SIGNAL",
    { value: 1 },
    { source: "Verifier" }
  );

  assert.strictEqual(result.failed, 1);
  assert.strictEqual(result.executed, 0);
  context.EventBus.unsubscribe(
    "TEST_PROMISE_SIGNAL",
    token
  );
});

check("RECURSION_SUPPRESSED", () => {
  let nested = null;

  const token = context.EventBus.subscribe(
    "TEST_CYCLE_SIGNAL",
    (event) => {
      nested = context.EventBus.emit(
        event.name,
        event,
        { source: "Verifier" }
      );
      return true;
    },
    {
      name: "Verifier_Cycle",
      owner: "Verifier",
    }
  );

  const outer = context.EventBus.emit(
    "TEST_CYCLE_SIGNAL",
    { value: 1 },
    { source: "Verifier" }
  );

  assert.strictEqual(outer.executed, 1);
  assert.strictEqual(nested.cyclical, true);
  assert.strictEqual(nested.suppressed, true);
  context.EventBus.unsubscribe(
    "TEST_CYCLE_SIGNAL",
    token
  );
});

// ============================================================
// BUSINESS PROCESSOR
// ============================================================

check("PROCESSOR_DOES_NOT_REPUBLISH_CRUD", () => {
  const before =
    context.EventBus.metrics.published;
  const event =
    context.ERPEventContract.create({
      entity: "TEST_ENTITY",
      entityId: "BEP-1",
      type: "CREATED",
      after: {
        TestEntityID: "BEP-1",
      },
      source: "Verifier",
    });
  const result =
    context.BusinessEventProcessor.process(
      event
    );

  assert.strictEqual(result.status, "SUCCESS");
  assert.strictEqual(
    result.publishResult.suppressed,
    true
  );
  assert.strictEqual(
    result.publishResult.reason,
    "CRUD_OWNED_BY_BASE_REPOSITORY"
  );
  assert.strictEqual(
    context.EventBus.metrics.published,
    before
  );
});

check("PROCESSOR_PUBLISHES_DOMAIN_ONCE", () => {
  let delivered = 0;
  const token = context.EventBus.subscribe(
    "TEST_APPROVED",
    () => {
      delivered++;
      return true;
    },
    {
      name: "Verifier_Approved",
      owner: "Verifier",
    }
  );
  const event =
    context.ERPEventContract.create({
      name: "TEST_APPROVED",
      type: "APPROVED",
      payload: { value: 2 },
      source: "Workflow",
      metadata: { kind: "DOMAIN" },
    });
  const result =
    context.BusinessEventProcessor.process(
      event
    );

  assert.strictEqual(result.status, "SUCCESS");
  assert.strictEqual(result.published, true);
  assert.strictEqual(delivered, 1);
  context.EventBus.unsubscribe(
    "TEST_APPROVED",
    token
  );
});

check("PROCESSOR_SKIPS_ALREADY_PUBLISHED", () => {
  const emitted = context.EventBus.emit(
    "TEST_ALREADY_PUBLISHED",
    { value: 3 },
    { source: "Verifier" }
  );
  const before =
    context.EventBus.metrics.published;
  const result =
    context.BusinessEventProcessor.process(
      emitted.envelope
    );

  assert.strictEqual(
    result.publishResult.suppressed,
    true
  );
  assert.strictEqual(
    result.publishResult.reason,
    "ALREADY_PUBLISHED"
  );
  assert.strictEqual(
    context.EventBus.metrics.published,
    before
  );
});

// ============================================================
// MANAGED CONSUMERS
// ============================================================

const entityCreates = [];

context.EntityService = {
  create(entity, data) {
    entityCreates.push({
      entity,
      data,
    });
    return { ...data };
  },
};

run("FinanceEngine.js", sources.finance);

check("FINANCE_CONSUMES_CANONICAL_PAYLOAD", () => {
  context.FinanceEngine.init();

  context.EventBus.emit(
    "CLIENT_CREATED",
    {
      ClientID: "C-1",
      OrganizationID: "ORG-1",
    },
    {
      source: "BaseRepository",
    }
  );

  context.EventBus.emit(
    "TRIP_COMPLETED",
    {
      TripID: "TR-1",
      OrganizationID: "ORG-1",
      Revenue: 100,
      ActualCost: 60,
    },
    {
      source: "TripRepository",
    }
  );

  assert.strictEqual(entityCreates.length, 2);
  assert.strictEqual(
    entityCreates[0].entity,
    "CLIENT_FINANCE_PROFILE"
  );
  assert.strictEqual(
    entityCreates[0].data.ClientID,
    "C-1"
  );
  assert.strictEqual(
    entityCreates[1].entity,
    "FINANCIAL_TRANSACTION"
  );
  assert.strictEqual(
    entityCreates[1].data.Profit,
    40
  );

  context.FinanceEngine.reset();
  assert.strictEqual(
    context.EventBus.listeners(
      "CLIENT_CREATED"
    ),
    0
  );
});

let kpiCall = null;

context.KPIService = {
  createProfitKPI(
    trip,
    transaction,
    profit
  ) {
    kpiCall = {
      trip,
      transaction,
      profit,
    };
    return true;
  },
};

run("KPIEngine.js", sources.kpi);

check("KPI_CONSUMES_CANONICAL_PAYLOAD", () => {
  context.KPIEngine.init();

  context.EventBus.emit(
    "TRIP_PROFIT_CALCULATED",
    {
      trip: { TripID: "TR-2" },
      transaction: {
        TransactionID: "TX-2",
      },
      profit: 55,
    },
    {
      source: "Finance",
    }
  );

  assert.ok(kpiCall);
  assert.strictEqual(kpiCall.profit, 55);
  assert.strictEqual(
    kpiCall.trip.TripID,
    "TR-2"
  );

  context.KPIEngine.reset();
});

context.EntityEvents = {
  CLIENT: {
    CREATED: "CLIENT_CREATED",
    UPDATED: "CLIENT_UPDATED",
    DELETED: "CLIENT_DELETED",
    RESTORED: "CLIENT_RESTORED",
  },
};

let dashboardRenders = 0;

context.DashboardEngine = {
  render() {
    dashboardRenders++;
    return true;
  },
};

run(
  "EventSubscriptions.js",
  sources.subscriptions
);

check("DASHBOARD_SUBSCRIBER_MANAGED", () => {
  context.EventSubscriptions.init();

  context.EventBus.emit(
    "CLIENT_UPDATED",
    {
      entity: "CLIENT",
      entityId: "C-2",
      after: {
        ClientID: "C-2",
      },
      source: "BaseRepository",
    },
    {
      source: "BaseRepository",
    }
  );

  assert.strictEqual(dashboardRenders, 1);
  assert.strictEqual(
    context.EventSubscriptions.stats
      .processed,
    1
  );

  context.EventSubscriptions.reset();
  assert.strictEqual(
    context.EventBus.listeners(
      "CLIENT_UPDATED"
    ),
    0
  );
});

// ============================================================
// BASE REPOSITORY EVENT OWNERSHIP
// ============================================================

context.EventBus.reset();
context.EventBus.init();

const rows = {};
const audits = [];

context.EntityRegistry = {
  resolve(entity) {
    return entity;
  },
  get(entity) {
    if (entity !== "TEST") {
      return null;
    }

    return {
      name: "TEST",
      idField: "TestID",
      softDelete: true,
      timestamps: true,
      organization: false,
      events: {
        created: "TEST_CREATED",
        updated: "TEST_UPDATED",
        deleted: "TEST_DELETED",
        restored: "TEST_RESTORED",
      },
    };
  },
};

context.IdService = {
  sequence: 0,
  generate() {
    this.sequence++;
    return "TEST-" + this.sequence;
  },
};

context.EntityValidator = {
  validate() {
    return true;
  },
};

context.Database = {
  initialized: true,
  insert(entity, data) {
    rows[data.TestID] = { ...data };
    return { ...rows[data.TestID] };
  },
  update(entity, id, data) {
    rows[id] = {
      ...rows[id],
      ...data,
    };
    return { ...rows[id] };
  },
  find(entity, id) {
    return rows[id]
      ? { ...rows[id] }
      : null;
  },
  query() {
    return Object.values(rows).map(
      (item) => ({ ...item })
    );
  },
  delete(entity, id) {
    const old = rows[id] || null;
    delete rows[id];
    return old;
  },
  reset() {
    return true;
  },
};

context.AuditLog = {
  write(entry) {
    audits.push(entry);
    return true;
  },
};

run("BaseRepository.js", sources.base);

check("BASE_REPOSITORY_LIFECYCLE_EXACTLY_ONCE", () => {
  const received = [];

  [
    "TEST_CREATED",
    "TEST_UPDATED",
    "TEST_DELETED",
    "TEST_RESTORED",
  ].forEach((eventName) => {
    context.EventBus.subscribe(
      eventName,
      (event) => {
        received.push(event);
        return true;
      },
      {
        name:
          "Verifier_" + eventName,
        owner: "Verifier",
      }
    );
  });

  context.BaseRepository.init(
    context.Database
  );
  const repository =
    context.BaseRepository.createRepository(
      "TEST"
    );

  const created = repository.create({
    Value: 1,
  });
  repository.update(
    created.TestID,
    { Value: 2 }
  );
  repository.delete(created.TestID);
  repository.restore(created.TestID);

  assert.deepStrictEqual(
    Array.from(
      received.map((event) => event.name)
    ),
    [
      "TEST_CREATED",
      "TEST_UPDATED",
      "TEST_DELETED",
      "TEST_RESTORED",
    ]
  );
  assert.ok(
    received.every(
      (event) =>
        event.source ===
          "BaseRepository" &&
        event.entityId === created.TestID
    )
  );
  assert.strictEqual(audits.length, 4);
});

check("SPECIALIZED_REPOSITORY_DUPLICATE_BLOCKED", () => {
  const before =
    context.EventBus.metrics.published;
  const result = context.EventBus.emit(
    "TEST_CREATED",
    {
      entity: "TEST",
      entityId: "TEST-1",
      after: rows["TEST-1"],
      source:
        "SpecializedRepository",
    }
  );

  assert.strictEqual(result.suppressed, true);
  assert.strictEqual(
    context.EventBus.metrics.published,
    before
  );
});

check("FULL_RUNTIME_RESET", () => {
  context.BusinessEventProcessor.reset();
  context.EventBus.reset();
  context.ERPEventContract.reset();

  assert.strictEqual(
    context.EventBus.ready,
    false
  );
  assert.strictEqual(
    Object.keys(context.EventBus.events)
      .length,
    0
  );
  assert.strictEqual(
    context.EventBus.history.length,
    0
  );
  assert.strictEqual(
    context.BusinessEventProcessor.ready,
    false
  );
  assert.strictEqual(
    context.ERPEventContract.initialized,
    false
  );
});

// ============================================================
// MANIFEST
// ============================================================

run("ModuleManifest.js", sources.manifest);

check("MANIFEST_V31_VALID", () => {
  assert.strictEqual(
    context.ERP_MODULE_MANIFEST
      .manifestVersion,
    "3.1.0"
  );
  assert.deepStrictEqual(
    Array.from(
      context.ERP_MODULE_MANIFEST.validate()
    ),
    []
  );
  assert.ok(
    context.ERP_MODULE_MANIFEST
      .list()
      .includes("EventSubscriptions")
  );
  assert.strictEqual(
    context.ERP_MODULE_MANIFEST.list()
      .length,
    9
  );
});

const result = {
  package:
    "TaxControl Event Pipeline Package E.1",
  static: {
    status: "PASS",
    checks: 6,
  },
  runtime: {
    status: "PASS",
    checks: checks.length - 6,
  },
  checks: checks.length,
  status: "PASS",
};

console.log(JSON.stringify(result, null, 2));
