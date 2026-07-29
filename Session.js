// ============================================================
// Session compatibility commands — Package G
//
// Context is valid only for the current GAS execution. Do not call setUser()
// in one menu command and expect it to persist into another execution.
// Use withUserContext() around the complete request instead.
// ============================================================

function setUser(
  userId,
  role,
  organizationId,
  options = {}
) {
  return SecurityContext.set({
    UserID: userId,
    Role: role,
    OrganizationID:
      organizationId,
    AllowedOrganizationIDs:
      options.allowedOrganizationIds ||
      options.AllowedOrganizationIDs ||
      [organizationId],
    Permissions:
      options.permissions || [],
    DeniedPermissions:
      options.deniedPermissions || [],
    Name: options.name || "",
    Email: options.email || "",
    Source:
      options.source ||
      "GAS_EXECUTION",
  });
}

function clearUser() {
  return SecurityContext.clear();
}

function withUserContext(
  user,
  callback
) {
  return SecurityContext.execute(
    user,
    callback
  );
}

