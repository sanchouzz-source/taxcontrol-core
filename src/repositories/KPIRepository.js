console.log("KPIRepository");


const KPIRepository =
BaseRepository.createRepository({

entity:"KPI",

table:"KPIMetrics",

prefix:"KPI",


permissions:{

CREATE:"KPI_CREATE",

READ:"KPI_READ",

UPDATE:"KPI_UPDATE",

DELETE:"KPI_DELETE",

RESTORE:"KPI_RESTORE"

},



events:{

CREATED:"KPI_CREATED",

UPDATED:"KPI_UPDATED",

DELETED:"KPI_DELETED",

RESTORED:"KPI_RESTORED"

}



});



globalThis.KPIRepository =
KPIRepository;