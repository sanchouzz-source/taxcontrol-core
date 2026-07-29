// ============================================================
// ExternalIdentityBindingService v1.0.0
// One-time self-binding of an internal USER membership to Google `sub`
//
// Binding is allowed only from a trusted GAS active-user context. It is never
// exposed through doPost or the external action allowlist.
// ============================================================

console.log(
  "ExternalIdentityBindingService v1.0.0"
);

const ExternalIdentityBindingService = {
  version: "1.0.0",
  initialized: false,

  init() {
    if (this.initialized) {
      return true;
    }

    [
      "SecurityContext",
      "GoogleIdTokenAuthenticator",
      "UserMembershipService",
      "ExternalHttpContract",
    ].forEach((name) => {
      if (!globalThis[name]) {
        throw new Error(
          "ExternalIdentityBindingService requires " +
            name
        );
      }
    });

    if (
      typeof UserMembershipService
        .bindGoogleSubject !==
        "function"
    ) {
      throw new Error(
        "UserMembershipService.bindGoogleSubject unavailable"
      );
    }

    this.initialized = true;
    return true;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  bindCurrentCredential(
    credential
  ) {
    if (!this.initialized) {
      this.init();
    }

    const context =
      SecurityContext.require();

    if (
      context.Source !==
        "GAS_ACTIVE_USER_DIRECTORY" ||
      context.System === true ||
      context.Role === "SYSTEM"
    ) {
      throw ExternalHttpContract
        .error(
          "EXTERNAL_BINDING_REQUIRES_INTERNAL_SESSION",
          "External identity binding requires trusted GAS session"
        );
    }

    const identity =
      GoogleIdTokenAuthenticator
        .authenticate(credential);
    const contextEmail =
      String(context.Email || "")
        .trim()
        .toLowerCase();

    if (
      !contextEmail ||
      identity.email !==
        contextEmail
    ) {
      throw ExternalHttpContract
        .error(
          "EXTERNAL_BINDING_EMAIL_MISMATCH",
          "Google token email differs from current GAS user"
        );
    }

    return UserMembershipService
      .bindGoogleSubject(
        identity.subject,
        identity.email
      );
  },

  health() {
    return {
      module:
        "ExternalIdentityBindingService",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized:
        this.initialized,
      externalRouteExposed: false,
      internalSessionRequired: true,
      selfBindingOnly: true,
    };
  },
};

globalThis
  .ExternalIdentityBindingService =
  ExternalIdentityBindingService;
