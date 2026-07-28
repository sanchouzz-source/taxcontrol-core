// ============================================================
// TestEntityLifecycleMatrix v2.3.0
// ERP Entity Lifecycle Enterprise Test
// TaxControl ERP
//
// Compatible:
// SystemInit v2.5+
// RepositoryFactory v3+
// BaseRepository v6+
// EntityService v5+
// EntityValidator v1+
// EventBus v2+
//
// Modes:
// safe=true  - metadata/contract checks only, no CRUD writes
// safe=false - explicit full lifecycle with CRUD writes
// ============================================================

console.log("TestEntityLifecycleMatrix v2.3.0");

const TestEntityLifecycleMatrix = {
  version: "2.3.0",

  run(options = {}) {
    const safe = options.safe !== false;

    Logger.log(
      "========== ENTITY LIFECYCLE MATRIX v2.3 START " +
        (safe ? "SAFE" : "FULL") +
        " =========="
    );

    const result = {
      version: this.version,
      timestamp: new Date().toISOString(),
      mode: safe ? "SAFE" : "FULL",
      writesAllowed: !safe,
      tests: {},
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
      },
    };

    const tests = [
      ["SYSTEM", this.testSystemEntity],
      ["CLIENT", this.testClient],
      ["TRIP", this.testTrip],
      ["KPI", this.testKPI],
      ["AUDIT", this.testAudit],
      ["VERSION", this.testVersion],
      ["EVENTS", this.testEvents],
      ["VALIDATION", this.testValidation],
      ["SERVICE_HEALTH", this.testServiceHealth],
    ];

    tests.forEach((item) => {
      const name = item[0];
      const fn = item[1];

      result.tests[name] = this.execute(name, () =>
        fn.call(this, safe)
      );
    });

    Object.keys(result.tests).forEach((name) => {
      result.summary.total++;

      if (result.tests[name].status === "PASS") {
        result.summary.passed++;
      } else {
        result.summary.failed++;
      }
    });

    result.status =
      result.summary.failed === 0 ? "PASS" : "FAIL";

    Logger.log(JSON.stringify(result, null, 2));
    Logger.log("========== ENTITY MATRIX COMPLETE ==========");

    return result;
  },

  execute(name, fn) {
    const start = Date.now();

    try {
      const value = fn();

      return {
        status: "PASS",
        duration: Date.now() - start,
        result: value,
      };
    } catch (error) {
      Logger.error(name + " FAILED " + error.message);

      return {
        status: "FAIL",
        duration: Date.now() - start,
        error: error.message,
      };
    }
  },

  org() {
    if (
      typeof OrganizationContext !== "undefined" &&
      typeof OrganizationContext.get === "function"
    ) {
      return OrganizationContext.get();
    }

    return "SYSTEM";
  },

  repoInfo(entity) {
    if (
      typeof RepositoryFactory === "undefined" ||
      typeof RepositoryFactory.get !== "function"
    ) {
      throw new Error("RepositoryFactory unavailable");
    }

    const repo = RepositoryFactory.get(entity);

    if (!repo) {
      throw new Error("Repository missing " + entity);
    }

    const meta =
      RepositoryFactory.metadata &&
      RepositoryFactory.metadata[entity]
        ? RepositoryFactory.metadata[entity]
        : null;

    return {
      exists: true,
      type: meta && meta.type ? meta.type : "UNKNOWN",
      version: repo.version || "unknown",
      methods: this.repositoryContract(repo),
    };
  },

  repositoryContract(repo) {
    const required = [
      "create",
      "findById",
      "findAll",
      "update",
      "delete",
      "restore",
      "exists",
    ];

    const missing = required.filter(
      (name) => typeof repo[name] !== "function"
    );

    if (missing.length) {
      throw new Error(
        "Repository methods missing " + missing.join(",")
      );
    }

    return "OK";
  },

  safeEntityCheck(entity) {
    if (
      typeof EntityMetadata === "undefined" ||
      typeof EntityMetadata.get !== "function"
    ) {
      throw new Error("EntityMetadata unavailable");
    }

    const metadata = EntityMetadata.get(entity);

    if (!metadata) {
      throw new Error("Metadata missing " + entity);
    }

    return {
      entity,
      table: metadata.table,
      idField: metadata.idField,
      repository: this.repoInfo(entity),
      lifecycle: "CONTRACT_ONLY",
      writes: 0,
    };
  },

  testSystemEntity(safe) {
    const entity = "__TEST_DATABASE";

    if (safe) {
      return this.safeEntityCheck(entity);
    }

    const created = EntityService.create(entity, {
      value: "matrix-test",
    });

    try {
      const found = EntityService.findById(entity, created.id);

      if (!found) {
        throw new Error("SYSTEM READ FAILED");
      }

      return {
        entity,
        repository: this.repoInfo(entity),
        crud: "CREATE READ DELETE OK",
      };
    } finally {
      EntityService.delete(entity, created.id);
    }
  },

  testClient(safe) {
    if (safe) {
      return this.safeEntityCheck("CLIENT");
    }

    const client = EntityService.create("CLIENT", {
      OrganizationID: this.org(),
      Name: "Matrix Client",
      INN: "7777777777",
      Phone: "+79990000001",
      Email: "matrix@test.ru",
      Status: "ACTIVE",
    });

    const read = EntityService.findById(
      "CLIENT",
      client.ClientID
    );

    if (!read) {
      throw new Error("CLIENT READ FAILED");
    }

    EntityService.update("CLIENT", client.ClientID, {
      Status: "UPDATED",
    });
    EntityService.delete("CLIENT", client.ClientID);
    EntityService.restore("CLIENT", client.ClientID);

    const restored = EntityService.findById(
      "CLIENT",
      client.ClientID
    );

    if (!restored) {
      throw new Error("CLIENT RESTORE FAILED");
    }

    return {
      id: client.ClientID,
      repository: this.repoInfo("CLIENT"),
      lifecycle: "FULL",
    };
  },

  testTrip(safe) {
    if (safe) {
      return this.safeEntityCheck("TRIP");
    }

    const trip = EntityService.create("TRIP", {
      OrganizationID: this.org(),
      Status: "NEW",
      Revenue: 10000,
      Cost: 7000,
    });

    const found = EntityService.findById("TRIP", trip.TripID);

    if (!found) {
      throw new Error("TRIP READ FAILED");
    }

    EntityService.update("TRIP", trip.TripID, {
      Status: "COMPLETED",
    });

    return {
      id: trip.TripID,
      repository: this.repoInfo("TRIP"),
      lifecycle: "FULL",
    };
  },

  testKPI(safe) {
    if (safe) {
      return this.safeEntityCheck("KPI");
    }

    const kpi = EntityService.create("KPI", {
      Name: "MATRIX KPI",
      Value: 100,
    });

    const found = EntityService.findById("KPI", kpi.KPIID);

    if (!found) {
      throw new Error("KPI READ FAILED");
    }

    return {
      id: kpi.KPIID,
      repository: this.repoInfo("KPI"),
      lifecycle: "FULL",
    };
  },

  testAudit() {
    if (typeof AuditLog === "undefined") {
      return { status: "SKIPPED" };
    }

    if (typeof AuditLog.write !== "function") {
      throw new Error("AuditLog.write missing");
    }

    return {
      audit: "READY",
      writes: 0,
    };
  },

  testVersion() {
    if (typeof Versioning === "undefined") {
      return { status: "SKIPPED" };
    }

    return {
      versioning: "READY",
      writes: 0,
    };
  },

  testEvents() {
    if (typeof EventBus === "undefined") {
      throw new Error("EventBus missing");
    }

    return {
      ready: EventBus.ready === true,
      version: EventBus.version,
      writes: 0,
    };
  },

  testValidation(safe) {
    if (typeof EntityValidator === "undefined") {
      return {
        validation: "SKIPPED",
        writes: 0,
      };
    }

    let blocked = false;

    if (
      safe &&
      typeof EntityValidator.check === "function"
    ) {
      const result = EntityValidator.check("TRIP", {
        OrganizationID: this.org(),
        UnknownField: "BAD",
      });

      blocked =
        result.valid === false &&
        (result.errors || []).join(" ").indexOf("Unknown field") >= 0;
    } else {
      try {
        EntityService.create("TRIP", {
          OrganizationID: this.org(),
          UnknownField: "BAD",
        });
      } catch (error) {
        blocked = true;
      }
    }

    if (!blocked) {
      throw new Error(
        "EntityValidator does not block invalid fields"
      );
    }

    return {
      validation: "OK",
      mode: safe ? "DIRECT_VALIDATOR" : "SERVICE",
      writes: 0,
    };
  },

  testServiceHealth() {
    if (typeof EntityService === "undefined") {
      throw new Error("EntityService missing");
    }

    const health = EntityService.health();

    return {
      status: health.status,
      version:
        health.details && health.details.version
          ? health.details.version
          : EntityService.version,
      writes: 0,
    };
  },

  runSafe() {
    return this.run({ safe: true });
  },

  runFull(options = {}) {
    if (options.allowWrites !== true) {
      throw new Error(
        "Full lifecycle requires allowWrites:true"
      );
    }

    return this.run({ safe: false });
  },
};

globalThis.TestEntityLifecycleMatrix =
  TestEntityLifecycleMatrix;

globalThis.testEntityLifecycleMatrix = function () {
  return TestEntityLifecycleMatrix.runSafe();
};

globalThis.testEntityLifecycleMatrixFull = function (
  allowWrites
) {
  return TestEntityLifecycleMatrix.runFull({
    allowWrites: allowWrites === true,
  });
};

Logger.log(
  "TestEntityLifecycleMatrix READY v" +
    TestEntityLifecycleMatrix.version
);

