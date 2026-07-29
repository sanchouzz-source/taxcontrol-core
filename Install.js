// ============================================================
// Install v2.0.0
//
// Installation uses the same lifecycle as every other runtime.
// Component-by-component initialization is prohibited here.
// ============================================================

function installSystem() {
  Logger.log(
    "SYSTEM INSTALL: delegating to canonical ERP startup"
  );

  if (typeof startERP !== "function") {
    throw new Error("startERP command unavailable");
  }

  const result = startERP();

  if (result && typeof result.then === "function") {
    throw new Error(
      "installSystem must remain synchronous"
    );
  }

  Logger.log("System installation complete.");
  return result;
}
