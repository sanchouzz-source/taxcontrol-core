// ============================================================
// Versioning v1.0.0
// Organization-scoped version history facade
//
// Replaces the legacy direct-sheet implementation and never reads shared
// script-level user or organization state.
// ============================================================

console.log("Versioning v1.0.0");

const Versioning = {
  version: "1.0.0",
  initialized: false,

  init() {
    if (
      typeof VersionRepository ===
        "undefined"
    ) {
      throw new Error(
        "Versioning requires VersionRepository"
      );
    }

    this.initialized = true;
    return true;
  },

  requireReady() {
    if (!this.initialized) {
      this.init();
    }

    return true;
  },

  save(entity, id, data) {
    this.requireReady();

    const context =
      SecurityContext.require();
    const snapshot =
      data &&
      typeof data === "object"
        ? { ...data }
        : data;

    if (
      snapshot &&
      typeof snapshot === "object" &&
      snapshot.OrganizationID &&
      String(snapshot.OrganizationID) !==
        String(
          context.OrganizationID
        )
    ) {
      throw new Error(
        "CROSS_ORGANIZATION_ACCESS_DENIED"
      );
    }

    const write = () =>
      VersionRepository
        .createVersion(
          entity,
          id,
          snapshot,
          {
            organizationId:
              context.OrganizationID,
            source: "Versioning",
          }
        );

    return (
      typeof SecurityGuard !==
        "undefined" &&
      typeof SecurityGuard
        .runInternal === "function"
        ? SecurityGuard
          .runInternal(write)
        : write()
    );
  },

  get(entity, id) {
    this.requireReady();

    if (
      typeof VersionRepository
        .findByEntity === "function"
    ) {
      return VersionRepository
        .findByEntity(entity, id);
    }

    return VersionRepository
      .findAll({
        Entity: entity,
        EntityID: id,
      });
  },

  last(entity, id) {
    this.requireReady();

    if (
      typeof VersionRepository
        .findLatest === "function"
    ) {
      return VersionRepository
        .findLatest(entity, id);
    }

    const history =
      this.get(entity, id);

    return history.length
      ? history[
          history.length - 1
        ]
      : null;
  },

  reset() {
    this.initialized = false;
    return true;
  },

  health() {
    return {
      module: "Versioning",
      version: this.version,
      status:
        this.initialized
          ? "OK"
          : "WARNING",
      initialized: this.initialized,
      repository:
        typeof VersionRepository !==
          "undefined",
    };
  },
};

globalThis.Versioning =
  Versioning;
