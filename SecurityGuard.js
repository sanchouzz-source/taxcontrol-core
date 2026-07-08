console.log("SecurityGuard");
const SecurityGuard = {

    check(action) {

        if (!Auth.hasPermission(action)) {
            throw new Error(
                "Access denied: " + action + " for role " + Auth.getCurrentUser().role
            );
        }

        return true;
    }
};