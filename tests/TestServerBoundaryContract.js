// ============================================================
// TestServerBoundaryContract v1.0.0
// Non-destructive GAS contract for Package J.1
//
// The test does not execute command routes and does not create, update or
// delete spreadsheet rows or idempotency records.
// ============================================================

function runServerBoundaryContractTest() {
  const checks = [];

  const check = (
    name,
    callback
  ) => {
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

  const assert = (
    condition,
    message
  ) => {
    if (!condition) {
      throw new Error(message);
    }
  };

  const assertThrows = (
    callback,
    pattern
  ) => {
    let thrown = null;

    try {
      callback();
    } catch (error) {
      thrown = error;
    }

    assert(
      !!thrown,
      "Expected error was not thrown"
    );

    if (pattern) {
      assert(
        pattern.test(
          thrown.code ||
          thrown.message
        ),
        "Unexpected error: " +
          (
            thrown.code ||
            thrown.message
          )
      );
    }
  };

  if (
    typeof SystemInit !==
      "undefined" &&
    typeof SystemInit.isReady ===
      "function" &&
    SystemInit.isReady() !== true
  ) {
    startERP();
  }

  check(
    "SERVER_COMPONENTS_AVAILABLE",
    () => {
      [
        "ServerRequestContract",
        "ServerIdempotencyStore",
        "ServerActionRegistry",
        "ServerRequestBoundary",
      ].forEach((name) => {
        assert(
          typeof globalThis[name] ===
            "object",
          name + " unavailable"
        );
      });
    }
  );

  check(
    "SERVER_COMPONENTS_READY",
    () => {
      [
        ServerRequestContract,
        ServerIdempotencyStore,
        ServerActionRegistry,
        ServerRequestBoundary,
      ].forEach((component) => {
        assert(
          component.initialized ===
            true,
          component.version +
            " not initialized"
        );
        assert(
          component.health().status ===
            "OK",
          component.health().module +
            " health is not OK"
        );
      });
    }
  );

  check(
    "SERVER_PLATFORM_VERSION",
    () => {
      assert(
        SystemInit.version ===
          "3.9.0",
        "Unexpected SystemInit version"
      );
      assert(
        ServerRequestContract
          .protocol ===
          "taxcontrol.rpc.v1",
        "Unexpected RPC protocol"
      );
    }
  );

  check(
    "SERVER_LIFECYCLE_ORDER",
    () => {
      const order =
        SystemInit.resolveOrder(
          SystemInit
            .componentDefinitions
        );
      const before = (
        left,
        right
      ) => {
        assert(
          order.indexOf(left) <
            order.indexOf(right),
          left +
            " must start before " +
            right
        );
      };

      before(
        "UserMembershipService",
        "ServerActionRegistry"
      );
      before(
        "TrustedEntryPoints",
        "ServerRequestBoundary"
      );
      before(
        "ServerIdempotencyStore",
        "ServerRequestBoundary"
      );
      before(
        "ServerActionRegistry",
        "ServerRequestBoundary"
      );
    }
  );

  check(
    "ACTION_ALLOWLIST_EXACT",
    () => {
      const actions =
        ServerActionRegistry
          .list();

      assert(
        actions.length === 9,
        "Unexpected action count"
      );
      assert(
        actions.some(
          (item) =>
            item.name ===
            "IDENTITY.CURRENT"
        ),
        "IDENTITY.CURRENT missing"
      );
      assert(
        actions.some(
          (item) =>
            item.name ===
            "USER.MEMBERSHIP.CREATE"
        ),
        "Membership create missing"
      );
    }
  );

  check(
    "ACTION_PERMISSIONS_FIXED",
    () => {
      assert(
        ServerActionRegistry
          .get(
            "SYSTEM.HEALTH"
          ).permission ===
          "SYSTEM_ADMIN",
        "System health permission invalid"
      );
      assert(
        ServerActionRegistry
          .get(
            "USER.MEMBERSHIP.CREATE"
          ).permission ===
          "USER_CREATE",
        "Membership create permission invalid"
      );
      assert(
        ServerActionRegistry
          .get(
            "IDENTITY.CURRENT"
          ).permission === null,
        "Identity route has unexpected permission"
      );
    }
  );

  check(
    "COMMANDS_REQUIRE_IDEMPOTENCY",
    () => {
      const commands =
        ServerActionRegistry
          .list()
          .filter(
            (item) =>
              item.mode ===
              "COMMAND"
          );

      assert(
        commands.length === 5,
        "Unexpected command count"
      );
      assert(
        commands.every(
          (item) =>
            item
              .requiresIdempotency ===
              true &&
            item.retrySafe === true
        ),
        "Unsafe or non-idempotent command found"
      );
    }
  );

  check(
    "REQUEST_ENVELOPE_STRICT",
    () => {
      assertThrows(
        () =>
          ServerRequestContract
            .normalize({
              protocol:
                "taxcontrol.rpc.v1",
              requestId:
                "REQ-12345678",
              action:
                "IDENTITY.CURRENT",
              payload: {},
              role: "ADMIN",
            }),
        /REQUEST_INVALID/
      );
    }
  );

  check(
    "PAYLOAD_FIELDS_STRICT",
    () => {
      const route =
        ServerActionRegistry
          .get(
            "USER.MEMBERSHIP.CREATE"
          );

      assertThrows(
        () =>
          ServerActionRegistry
            .validatePayload(
              route,
              {
                email:
                  "contract@example.test",
                name: "Contract",
                role: "VIEWER",
                organizationId:
                  "ORG_FOREIGN",
              }
            ),
        /PAYLOAD_FIELDS_FORBIDDEN/
      );
    }
  );

  check(
    "PROTOTYPE_KEYS_REJECTED",
    () => {
      const payload =
        JSON.parse(
          '{"__proto__":{"admin":true}}'
        );

      assertThrows(
        () =>
          ServerRequestContract
            .normalize({
              protocol:
                "taxcontrol.rpc.v1",
              requestId:
                "REQ-12345679",
              action:
                "IDENTITY.CURRENT",
              payload,
            }),
        /REQUEST_INVALID/
      );
    }
  );

  check(
    "UNKNOWN_ERRORS_SANITIZED",
    () => {
      const response =
        ServerRequestContract
          .failure(
            {
              requestId:
                "REQ-12345680",
              action:
                "IDENTITY.CURRENT",
            },
            new Error(
              "SECRET_INTERNAL_STACK_VALUE"
            )
          );
      const serialized =
        JSON.stringify(response);

      assert(
        response.error.code ===
          "INTERNAL_ERROR",
        "Unknown error code leaked"
      );
      assert(
        serialized.indexOf(
          "SECRET_INTERNAL_STACK_VALUE"
        ) === -1,
        "Internal error leaked"
      );
      assert(
        serialized.indexOf(
          "stack"
        ) === -1,
        "Stack trace field leaked"
      );
    }
  );

  check(
    "NO_PRINCIPAL_OVERRIDE_METHOD",
    () => {
      [
        "handleAs",
        "runAs",
        "dispatchAs",
        "setPrincipal",
      ].forEach((method) => {
        assert(
          typeof ServerRequestBoundary[
            method
          ] === "undefined",
          "Unsafe boundary method exists: " +
            method
        );
      });
    }
  );

  check(
    "PUBLIC_HTTP_CLOSED",
    () => {
      assert(
        typeof globalThis.doGet ===
          "undefined" &&
        typeof globalThis.doPost ===
          "undefined",
        "Public HTTP entry point enabled"
      );
      assert(
        typeof runERPServerRequest ===
          "function",
        "Trusted RPC entry point missing"
      );
    }
  );

  check(
    "IDEMPOTENCY_RESET_POLICY",
    () => {
      const health =
        ServerIdempotencyStore
          .health();

      assert(
        health.persistence ===
          "ScriptProperties",
        "Unexpected idempotency persistence"
      );
      assert(
        health.resetPreservesRecords ===
          true,
        "resetERP would erase replay records"
      );
    }
  );

  check(
    "SECURITY_CONTEXT_NOT_LEAKED",
    () => {
      assert(
        SecurityContext.get() ===
          null,
        "Security context leaked"
      );
    }
  );

  const failed =
    checks.filter(
      (item) =>
        item.status === "FAIL"
    );
  const result = {
    package: "J.1",
    status:
      failed.length
        ? "FAIL"
        : "PASS",
    total: checks.length,
    passed:
      checks.length -
      failed.length,
    failed: failed.length,
    writes: 0,
    checks,
  };

  Logger.log(
    JSON.stringify(
      result,
      null,
      2
    )
  );

  if (failed.length) {
    throw new Error(
      "Server boundary contract failed: " +
        failed
          .map(
            (item) =>
              item.name +
              " — " +
              item.error
          )
          .join("; ")
    );
  }

  return result;
}
