components() {

return {

Config:
typeof Config !== "undefined"
&& (
Config.initialized===true ||
Config.status==="READY"
)
?
"READY"
:
"WARNING",



SchemaManager:
typeof SchemaManager !== "undefined"
&& (
SchemaManager.initialized===true ||
SchemaManager.status==="READY"
)
?
"READY"
:
"WARNING",



Database:
typeof Database !== "undefined"
&& (
Database.initialized===true ||
Database.status==="READY"
)
?
"READY"
:
"WARNING",



SchemaRegistry:
typeof SchemaRegistry !== "undefined"
&& (
SchemaRegistry.initialized===true ||
SchemaRegistry.status==="READY"
)
?
"READY"
:
"WARNING",



EntityRegistry:
typeof EntityRegistry !== "undefined"
&& (
EntityRegistry.initialized===true ||
EntityRegistry.status==="READY"
)
?
"READY"
:
"WARNING",



BaseRepository:
typeof BaseRepository !== "undefined"
?
"READY"
:
"FAILED",



RepositoryFactory:
typeof RepositoryFactory !== "undefined"
&& (
RepositoryFactory.initialized===true ||
RepositoryFactory.status==="READY"
)
?
"READY"
:
"WARNING",



RepositoryRegistry:
typeof RepositoryRegistry !== "undefined"
&& (
RepositoryRegistry.initialized===true ||
RepositoryRegistry.status==="READY"
)
?
"READY"
:
"WARNING",



EventBus:
typeof EventBus !== "undefined"
&& (
EventBus.initialized===true ||
EventBus.ready===true ||
EventBus.status==="READY"
)
?
"READY"
:
"WARNING",



BusinessEventProcessor:
typeof BusinessEventProcessor !== "undefined"
&& (
BusinessEventProcessor.ready===true ||
BusinessEventProcessor.initialized===true
)
?
"READY"
:
"WARNING",



SecurityGuard:
typeof SecurityGuard !== "undefined"
?
"READY"
:
"FAILED",



EntityValidator:
typeof EntityValidator !== "undefined"
?
"READY"
:
"FAILED",



IdService:
typeof IdService !== "undefined"
?
"READY"
:
"FAILED"

};

}