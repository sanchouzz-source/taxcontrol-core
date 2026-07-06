function setUser(userId, role) {

    PropertiesService.getScriptProperties()
        .setProperty("CURRENT_USER", userId);

    PropertiesService.getScriptProperties()
        .setProperty("CURRENT_ROLE", role);
}