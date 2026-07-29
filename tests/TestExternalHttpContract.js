// ============================================================
// TestExternalHttpContract v1.0.0
// Non-destructive GAS contract for Package K.1
//
// The test performs no external HTTP request, writes no USER rows and never
// invokes doPost with a credential.
// ============================================================

function runExternalHttpContractTest() {
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
    "EXTERNAL_COMPONENTS_AVAILABLE",
    () => {
      [
        "ExternalHttpConfig",
        "ExternalHttpContract",
        "GoogleIdTokenAuthenticator",
        "ExternalHttpRateLimiter",
        "ExternalUserResolver",
        "ExternalIdentityBindingService",
        "ExternalHttpPolicy",
        "ExternalHttpAdapter",
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
    "EXTERNAL_COMPONENTS_READY",
    () => {
      [
        ExternalHttpConfig,
        ExternalHttpContract,
        GoogleIdTokenAuthenticator,
        ExternalHttpRateLimiter,
        ExternalUserResolver,
        ExternalIdentityBindingService,
        ExternalHttpPolicy,
        ExternalHttpAdapter,
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
    "EXTERNAL_PLATFORM_VERSION",
    () => {
      assert(
        SystemInit.version ===
          "4.0.0",
        "Unexpected SystemInit version"
      );
      assert(
        EntityMetadata.version ===
          "3.6.0",
        "Unexpected EntityMetadata version"
      );
      assert(
        ExternalHttpContract
          .protocol ===
          "taxcontrol.http.v1",
        "Unexpected HTTP protocol"
      );
    }
  );

  check(
    "EXTERNAL_LIFECYCLE_ORDER",
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
        "ServerActionRegistry",
        "ExternalHttpPolicy"
      );
      before(
        "Database",
        "ExternalUserResolver"
      );
      before(
        "GoogleIdTokenAuthenticator",
        "ExternalHttpAdapter"
      );
      before(
        "ServerRequestBoundary",
        "ExternalHttpAdapter"
      );
    }
  );

  check(
    "EXTERNAL_ACTION_ALLOWLIST_EXACT",
    () => {
      const actions =
        ExternalHttpPolicy.list();

      assert(
        actions.length === 4,
        "Unexpected external action count"
      );
      assert(
        actions.every(
          (action) =>
            action.mode === "QUERY"
        ),
        "External command exposed"
      );
      assert(
        actions.some(
          (action) =>
            action.name ===
            "IDENTITY.CURRENT"
        ),
        "Identity query unavailable"
      );
    }
  );

  check(
    "INTERNAL_ACTION_ALLOWLIST_PRESERVED",
    () => {
      assert(
        ServerActionRegistry
          .count() === 9,
        "Internal J allowlist changed"
      );
      assert(
        ServerActionRegistry
          .list()
          .filter(
            (action) =>
              action.mode ===
              "COMMAND"
          ).length === 5,
        "Internal commands changed"
      );
    }
  );

  check(
    "EXTERNAL_COMMANDS_BLOCKED",
    () => {
      assertThrows(
        () =>
          ExternalHttpPolicy
            .requireAllowed(
              "USER.MEMBERSHIP.CREATE"
            ),
        /EXTERNAL_ACTION_FORBIDDEN/
      );
    }
  );

  check(
    "HTTP_ENTRY_POINT_EXACT",
    () => {
      assert(
        typeof doPost ===
          "function",
        "doPost unavailable"
      );
      assert(
        typeof globalThis.doGet ===
          "undefined",
        "doGet must not be installed"
      );
    }
  );

  check(
    "HTTP_QUERY_PARAMETERS_REJECTED",
    () => {
      assertThrows(
        () =>
          ExternalHttpContract
            .parseEvent({
              queryString:
                "credential=secret",
              parameter: {
                credential:
                  "secret",
              },
            }),
        /HTTP_QUERY_FORBIDDEN/
      );
    }
  );

  check(
    "HTTP_DISABLED_FAILS_CLOSED",
    () => {
      const health =
        ExternalHttpConfig
          .health();

      assert(
        typeof health.enabled ===
          "boolean",
        "Enabled flag unavailable"
      );
      assert(
        health.credentialsStored ===
          false,
        "Credential storage detected"
      );
      assert(
        health.principalStored ===
          false,
        "Principal storage detected"
      );
    }
  );

  check(
    "GOOGLE_SUBJECT_METADATA",
    () => {
      const metadata =
        EntityMetadata.get(
          "USER"
        );

      assert(
        metadata &&
        metadata.fields &&
        metadata.fields
          .GoogleSubject,
        "USER.GoogleSubject missing"
      );
      assert(
        typeof UserMembershipService
          .bindGoogleSubject ===
          "function",
        "Managed Google binding unavailable"
      );
    }
  );

  check(
    "EXTERNAL_PROFILE_BRIDGE_GUARDED",
    () => {
      assert(
        typeof ServerRequestBoundary
          .handleWithProfile ===
          "function",
        "Verified principal bridge unavailable"
      );
      assertThrows(
        () =>
          ServerRequestBoundary
            ._assertExternalProfile({
              UserID: "USR_FAKE",
              OrganizationID:
                "ORG_FAKE",
              Role: "ADMIN",
            }),
        /EXTERNAL_PRINCIPAL_INVALID/
      );
    }
  );

  check(
    "BINDING_NOT_EXTERNALLY_EXPOSED",
    () => {
      assert(
        !ExternalHttpPolicy
          .actions.includes(
            "IDENTITY.GOOGLE.BIND"
          ),
        "Binding route exposed"
      );
      assert(
        ExternalIdentityBindingService
          .health()
          .externalRouteExposed ===
          false,
        "Binding service exposure invalid"
      );
    }
  );

  check(
    "TOKENINFO_MARKED_PILOT",
    () => {
      const health =
        GoogleIdTokenAuthenticator
          .health();

      assert(
        health.verifier ===
          "TOKENINFO_PILOT",
        "Unexpected token verifier"
      );
      assert(
        health.productionReady ===
          false,
        "Pilot verifier marked production ready"
      );
      assert(
        health.rawTokenPersisted ===
          false &&
        health.rawTokenLogged ===
          false,
        "Raw token handling invalid"
      );
    }
  );

  check(
    "HTTP_LIMITS_BOUNDED",
    () => {
      assert(
        ExternalHttpContract
          .limits.bodyBytes <=
          49152,
        "HTTP body limit too large"
      );
      assert(
        ExternalHttpContract
          .limits
          .credentialLength <=
          8192,
        "Credential limit too large"
      );
      assert(
        ExternalHttpRateLimiter
          .health()
          .failClosed === true,
        "Rate limiter not fail closed"
      );
    }
  );

  check(
    "HTTP_STATUS_LIMITATION_DECLARED",
    () => {
      const response =
        ExternalHttpContract
          .failure(
            ExternalHttpContract
              .error(
                "GOOGLE_CREDENTIAL_INVALID"
              )
          );

      assert(
        response.status === 401,
        "Application status invalid"
      );
      assert(
        response.meta
          .actualHttpStatus ===
          "PLATFORM_MANAGED",
        "GAS status limitation missing"
      );
    }
  );

  const failed =
    checks.filter(
      (item) =>
        item.status === "FAIL"
    );

  checks.forEach((item) => {
    const line =
      item.status +
      " " +
      item.name +
      (
        item.error
          ? " — " + item.error
          : ""
      );

    if (
      typeof Logger !==
        "undefined" &&
      typeof Logger.log ===
        "function"
    ) {
      Logger.log(line);
    } else {
      console.log(line);
    }
  });

  if (failed.length) {
    throw new Error(
      "External HTTP contract failed: " +
        failed.length
    );
  }

  return {
    status: "PASS",
    checks:
      checks.length,
    package: "K.1",
    destructive: false,
    externalRequests: 0,
    writes: 0,
  };
}
