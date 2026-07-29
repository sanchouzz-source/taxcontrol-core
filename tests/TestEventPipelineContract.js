// ============================================================
// TestEventPipelineContract v1.0.0
// Non-destructive GAS contract for Package E
//
// Uses synthetic event names only. No repository row is created,
// updated or deleted by this test.
// ============================================================

const TestEventPipelineContract = {
  version: "1.0.0",

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  },

  assertSync(result, label) {
    this.assert(
      !result ||
      typeof result.then !== "function",
      label + " returned Promise"
    );
  },

  handlerCount() {
    return Object.values(
      EventBus.events || {}
    ).reduce(
      (total, list) =>
        total + list.length,
      0
    );
  },

  run() {
    const checks = [];
    const tokens = [];

    const check = (name, callback) => {
      try {
        callback();
        checks.push({
          name,
          status: "PASS",
        });
      } catch (error) {
        checks.push({
          name,
          status: "FAIL",
          error: error.message,
        });
      }
    };

    const initialReset = resetERP();
    this.assertSync(initialReset, "resetERP");

    const start = startERP();
    this.assertSync(start, "startERP");

    check("ERP_READY", () => {
      this.assert(
        start.status === "READY",
        "ERP did not reach READY"
      );
      this.assert(
        SystemInit.isReady() === true,
        "SystemInit is not ready"
      );
    });

    check("EVENT_CONTRACT_V2", () => {
      this.assert(
        ERPEventContract.version === "2.0.0",
        "Unexpected ERPEventContract version"
      );
      this.assert(
        ERPEventContract.initialized === true,
        "ERPEventContract is not initialized"
      );
    });

    check("EVENT_BUS_V3", () => {
      this.assert(
        EventBus.version === "3.0.0",
        "Unexpected EventBus version"
      );
      this.assert(
        EventBus.ready === true,
        "EventBus is not ready"
      );
    });

    check("MANIFEST_EVENT_OWNER", () => {
      this.assert(
        ERP_MODULE_MANIFEST.manifestVersion ===
          "3.1.0",
        "Unexpected manifest version"
      );
      this.assert(
        !!ModuleRegistry.get(
          "EventSubscriptions"
        ),
        "EventSubscriptions not registered"
      );
    });

    let received = null;
    let deliveries = 0;

    check("CANONICAL_ENTITY_ENVELOPE", () => {
      const token = EventBus.subscribe(
        "PACKAGE_E_TEST_ENTITY_CREATED",
        (event) => {
          received = event;
          deliveries++;
          return true;
        },
        {
          name: "PackageE_EntityHandler",
          owner: "PackageETest",
        }
      );
      tokens.push(token);

      const result = EventBus.emit(
        "PACKAGE_E_TEST_ENTITY_CREATED",
        {
          entity:
            "PACKAGE_E_TEST_ENTITY",
          entityId: "TEST-1",
          action: "CREATE",
          after: {
            PackageETestEntityID:
              "TEST-1",
            Value: 10,
          },
          source: "BaseRepository",
        },
        {
          source: "BaseRepository",
        }
      );

      this.assertSync(
        result,
        "EventBus.emit"
      );
      this.assert(
        result.executed === 1,
        "Synthetic entity event not delivered"
      );
      this.assert(
        deliveries === 1,
        "Unexpected delivery count"
      );
      this.assert(
        received &&
        received.name ===
          "PACKAGE_E_TEST_ENTITY_CREATED" &&
        received.event === received.name &&
        received.type === "CREATED" &&
        received.action === "CREATE" &&
        received.entity ===
          "PACKAGE_E_TEST_ENTITY" &&
        received.entityId === "TEST-1" &&
        received.source ===
          "BaseRepository" &&
        received.payload.Value === 10 &&
        received.data === received.payload &&
        received.metadata.contractVersion ===
          "2.0",
        "Canonical envelope mismatch"
      );
      this.assert(
        ERPEventContract.validate(
          received
        ).valid === true,
        "Canonical envelope validation failed"
      );
    });

    check("LEGACY_CRUD_SUPPRESSED", () => {
      const result = EventBus.emit(
        "PACKAGE_E_TEST_ENTITY_CREATED",
        {
          entity:
            "PACKAGE_E_TEST_ENTITY",
          entityId: "TEST-1",
          after: {
            PackageETestEntityID:
              "TEST-1",
          },
          source: "EntityService",
        }
      );

      this.assert(
        result.suppressed === true &&
        result.reason ===
          "CRUD_EVENT_OWNER",
        "Legacy CRUD publisher was not suppressed"
      );
      this.assert(
        deliveries === 1,
        "Suppressed CRUD event reached subscriber"
      );
    });

    check("SUBSCRIPTION_DEDUPLICATION", () => {
      const duplicate = EventBus.subscribe(
        "PACKAGE_E_TEST_ENTITY_CREATED",
        () => true,
        {
          name: "PackageE_EntityHandler",
          owner: "PackageETest",
        }
      );

      this.assert(
        duplicate.duplicate === true,
        "Duplicate subscription accepted"
      );
      this.assert(
        EventBus.listeners(
          "PACKAGE_E_TEST_ENTITY_CREATED"
        ) === 1,
        "Duplicate handler was stored"
      );
    });

    check("UNSUBSCRIBE_BY_TOKEN", () => {
      const removed = EventBus.unsubscribe(
        "PACKAGE_E_TEST_ENTITY_CREATED",
        tokens[0]
      );

      this.assert(
        removed === 1,
        "Subscription token did not remove handler"
      );
      this.assert(
        EventBus.listeners(
          "PACKAGE_E_TEST_ENTITY_CREATED"
        ) === 0,
        "Handler remained after unsubscribe"
      );
      tokens.shift();
    });

    check("DOMAIN_EVENT_ENVELOPE", () => {
      let domain = null;
      const token = EventBus.subscribe(
        "PACKAGE_E_TEST_SIGNAL",
        (event) => {
          domain = event;
          return true;
        },
        {
          name: "PackageE_DomainHandler",
          owner: "PackageETest",
        }
      );
      tokens.push(token);

      const result = EventBus.emit(
        "PACKAGE_E_TEST_SIGNAL",
        {
          amount: 25,
        },
        {
          source: "PackageETest",
        }
      );

      this.assert(
        result.executed === 1,
        "Domain event not delivered"
      );
      this.assert(
        domain &&
        domain.kind === "DOMAIN" &&
        domain.payload.amount === 25 &&
        domain.source === "PackageETest",
        "Domain envelope mismatch"
      );
    });

    check("PROMISE_HANDLER_REJECTED", () => {
      const token = EventBus.subscribe(
        "PACKAGE_E_PROMISE_SIGNAL",
        () => Promise.resolve(true),
        {
          name: "PackageE_PromiseHandler",
          owner: "PackageETest",
        }
      );
      tokens.push(token);

      const result = EventBus.emit(
        "PACKAGE_E_PROMISE_SIGNAL",
        { value: 1 },
        { source: "PackageETest" }
      );

      this.assert(
        result.failed === 1 &&
        result.executed === 0,
        "Promise handler was accepted"
      );
    });

    check("RECURSIVE_EVENT_BLOCKED", () => {
      let inner = null;
      const token = EventBus.subscribe(
        "PACKAGE_E_CYCLE_SIGNAL",
        (event) => {
          inner = EventBus.emit(
            event.name,
            event,
            {
              source: "PackageETest",
            }
          );
          return true;
        },
        {
          name: "PackageE_CycleHandler",
          owner: "PackageETest",
        }
      );
      tokens.push(token);

      const outer = EventBus.emit(
        "PACKAGE_E_CYCLE_SIGNAL",
        { value: 1 },
        { source: "PackageETest" }
      );

      this.assert(
        outer.executed === 1,
        "Outer cycle event failed"
      );
      this.assert(
        inner &&
        inner.cyclical === true &&
        inner.suppressed === true,
        "Recursive event was not blocked"
      );
    });

    check("BUSINESS_PROCESSOR_NO_CRUD_REPUBLISH", () => {
      const before =
        EventBus.metrics.published;
      const event =
        ERPEventContract.create({
          entity:
            "PACKAGE_E_TEST_ENTITY",
          entityId: "TEST-BEP-1",
          type: "CREATED",
          after: {
            PackageETestEntityID:
              "TEST-BEP-1",
          },
          source: "PackageETest",
        });
      const result =
        BusinessEventProcessor.process(event);

      this.assertSync(
        result,
        "BusinessEventProcessor.process"
      );
      this.assert(
        result.status === "SUCCESS",
        "Business event processing failed"
      );
      this.assert(
        result.publishResult &&
        result.publishResult.suppressed ===
          true &&
        result.publishResult.reason ===
          "CRUD_OWNED_BY_BASE_REPOSITORY",
        "Business processor republished CRUD"
      );
      this.assert(
        EventBus.metrics.published === before,
        "CRUD republish reached EventBus"
      );
    });

    check("SYSTEM_EVENT_NEEDS_NO_ENTITY", () => {
      const event =
        ERPEventContract.create({
          name: "PACKAGE_E_SYSTEM_READY",
          type: "READY",
          payload: {
            status: "OK",
          },
          source: "PackageETest",
          metadata: {
            kind: "SYSTEM",
          },
        });

      this.assert(
        event.entity === null &&
        event.entityId === null &&
        ERPEventContract.validate(event)
          .valid === true,
        "System event validation requires entity"
      );
    });

    check("MANAGED_RESET_RESTART", () => {
      tokens.splice(0).forEach((token) => {
        EventBus.unsubscribe(
          token.event,
          token
        );
      });

      const managedBefore =
        this.handlerCount();
      const reset = resetERP();
      this.assertSync(reset, "resetERP");

      this.assert(
        EventBus.ready === false &&
        this.handlerCount() === 0,
        "EventBus reset preserved handlers"
      );

      const restart = startERP();
      this.assertSync(restart, "startERP");

      this.assert(
        restart.status === "READY",
        "ERP restart failed"
      );
      this.assert(
        this.handlerCount() === managedBefore,
        "Managed handlers duplicated after restart"
      );
    });

    const failed = checks.filter(
      (item) => item.status === "FAIL"
    );

    return {
      test: "TestEventPipelineContract",
      version: this.version,
      status:
        failed.length ? "FAIL" : "PASS",
      checks: checks.length,
      passed: checks.length - failed.length,
      failed: failed.length,
      results: checks,
    };
  },
};

globalThis.TestEventPipelineContract =
  TestEventPipelineContract;

function runEventPipelineContractTest() {
  const result =
    TestEventPipelineContract.run();

  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
