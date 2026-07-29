"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const packageDir = __dirname;

const sourceFiles = [
  "App.js",
  "Bootstrap.js",
  "SystemBootstrap.js",
  "StartupSequence.js",
  "Install.js",
  "CoreFunctions.js",
  "Menu.js",
  "TestStartupPackageAContract.js",
];

const commandNames = [
  "startERP",
  "erpStart",
  "erpHealth",
  "erpDiag",
  "resetERP",
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(name) {
  return fs.readFileSync(
    path.join(packageDir, name),
    "utf8"
  );
}

function staticChecks() {
  const sources = Object.fromEntries(
    sourceFiles.map((name) => [name, read(name)])
  );

  sourceFiles.forEach((name) => {
    assert(
      !/\basync\b|\bawait\b/.test(sources[name]),
      name + " contains async startup code"
    );
  });

  commandNames.forEach((command) => {
    const owners = sourceFiles.filter((name) => {
      const pattern = new RegExp(
        "\\bfunction\\s+" + command + "\\s*\\("
      );
      return pattern.test(sources[name]);
    });

    assert(
      owners.length === 1 &&
        owners[0] === "Bootstrap.js",
      command +
        " must be declared exactly once in Bootstrap.js; found: " +
        owners.join(", ")
    );
  });

  assert(
    !/__ERP_STATE__\s*=/.test(
      sources["SystemBootstrap.js"]
    ),
    "SystemBootstrap.js must not create ERP state"
  );

  assert(
    !/SystemInit\.init\s*\(/.test(
      sources["CoreFunctions.js"]
    ),
    "CoreFunctions.js bypasses Bootstrap"
  );

  assert(
    !/SchemaManager\.init\s*\(|Database\.init\s*\(|EventBus\.init\s*\(/.test(
      sources["Install.js"]
    ),
    "Install.js initializes components manually"
  );

  return {
    status: "PASS",
    checks: 5,
  };
}

function runtimeChecks() {
  const logs = [];
  const counters = {
    systemInit: 0,
    systemReset: 0,
  };

  const context = {
    console,
    Logger: {
      log: (message) => logs.push(["LOG", message]),
      warn: (message) => logs.push(["WARN", message]),
      error: (message) => logs.push(["ERROR", message]),
    },
    SystemInit: {
      version: "TEST",
      initialized: false,
      init() {
        counters.systemInit += 1;
        this.initialized = true;
        return {
          status: "OK",
        };
      },
      reset() {
        counters.systemReset += 1;
        this.initialized = false;
      },
      health() {
        return {
          status: this.initialized ? "OK" : "WARNING",
        };
      },
      diagnostics() {
        return {
          initialized: this.initialized,
        };
      },
    },
    HealthContract: {
      create(module, status, details) {
        return {
          module,
          status,
          details,
        };
      },
    },
  };

  context.globalThis = context;
  vm.createContext(context);

  sourceFiles.forEach((name) => {
    vm.runInContext(read(name), context, {
      filename: name,
    });
  });

  const report = vm.runInContext(
    "runStartupPackageAContractTest()",
    context
  );

  assert(
    report.status === "PASS",
    "Runtime contract did not pass"
  );

  assert(
    counters.systemInit === 1,
    "SystemInit.init expected once after startup contract, received " +
      counters.systemInit
  );

  assert(
    counters.systemReset === 2,
    "SystemInit.reset expected twice after startup contract, received " +
      counters.systemReset
  );

  assert(
    context.Bootstrap.state.bootCount === 1,
    "bootCount must be preserved across reset"
  );

  const health = vm.runInContext("erpHealth()", context);

  assert(
    health.status === "OK" && health.ready === true,
    "erpHealth did not bootstrap a fresh runtime state"
  );

  assert(
    counters.systemInit === 2,
    "erpHealth must initialize SystemInit exactly once"
  );

  const countAfterHealth =
    context.Bootstrap.state.bootCount;

  vm.runInContext("erpDiag()", context);

  assert(
    counters.systemInit === 2 &&
      context.Bootstrap.state.bootCount === countAfterHealth,
    "erpDiag reinitialized an already ready runtime"
  );

  const cleanup = vm.runInContext("resetERP()", context);

  assert(
    cleanup.status === "RESET" &&
      context.Bootstrap.isReady() === false,
    "Final cleanup did not reset runtime"
  );

  return {
    status: "PASS",
    checks: report.checks.length + 7,
    counters,
  };
}

const result = {
  package: "TaxControl Startup Package A",
  static: staticChecks(),
  runtime: runtimeChecks(),
  status: "PASS",
};

console.log(JSON.stringify(result, null, 2));
