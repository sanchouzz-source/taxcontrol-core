// ============================================================
// SchemaStorage.gs
// Schema persistence layer
// ERP TexControl
// Version 2.0.0
// ============================================================

const SchemaStorage = {

  version: "2.0.0",

  _tablesSheet: "_SystemSchemaTables",
  _fieldsSheet: "_SystemSchemaFields",
  _versionsSheet: "_SchemaVersions",
  _migrationsSheet: "_SchemaMigrations",


  // ============================================================
  // ADAPTER SAFE METHODS
  // ============================================================

  _read(sheet) {

    if (!SpreadsheetAdapter) {
      throw new Error(
        "SpreadsheetAdapter unavailable"
      );
    }


    if (SpreadsheetAdapter.query) {

      return SpreadsheetAdapter.query(sheet) || [];

    }


    if (SpreadsheetAdapter.findAll) {

      return SpreadsheetAdapter.findAll(sheet) || [];

    }


    throw new Error(
      "SpreadsheetAdapter read API not found"
    );
  },


  _write(sheet, rows, headers) {


    if (SpreadsheetAdapter.replace) {

      return SpreadsheetAdapter.replace(
        sheet,
        rows,
        headers
      );

    }


    if (SpreadsheetAdapter.write) {

      return SpreadsheetAdapter.write(
        sheet,
        rows,
        headers
      );

    }


    throw new Error(
      "SpreadsheetAdapter write API not found"
    );
  },


  _append(sheet,row){


    if (SpreadsheetAdapter.insert){

      return SpreadsheetAdapter.insert(
        sheet,
        row
      );

    }


    throw new Error(
      "SpreadsheetAdapter insert API not found"
    );

  },



  // ============================================================
  // TABLES
  // ============================================================


  loadTables(){


    const rows=this._read(
      this._tablesSheet
    );


    const result={};


    rows.forEach(row=>{


      const table=row.table || row[0];


      if(!table)
        return;


      result[table]={

        table,

        primaryKey:
          row.primaryKey || row[1] || null,


        softDelete:
          row.softDelete !== false,


        timestamps:
          row.timestamps !== false,


        requireId:
          row.requireId !== false,


        fields:[],


        relations:{},


        indexes:[],


        uid:table

      };


    });


    return result;

  },




  saveTables(schema){


    const rows=[];


    Object.values(schema)
    .forEach(meta=>{


      rows.push({

        table:meta.table,


        primaryKey:
          meta.primaryKey || "",


        softDelete:
          meta.softDelete !== false,


        timestamps:
          meta.timestamps !== false,


        requireId:
          meta.requireId !== false

      });


    });



    this._write(

      this._tablesSheet,

      rows,

      [
        "table",
        "primaryKey",
        "softDelete",
        "timestamps",
        "requireId"
      ]

    );


  },





  // ============================================================
  // FIELDS
  // ============================================================


  loadFields(){


    const rows=this._read(
      this._fieldsSheet
    );


    const result={};



    rows.forEach(row=>{


      const table=
        row.table || row[0];


      if(!table)
        return;



      if(!result[table])
        result[table]=[];




      result[table].push({

        name:
          row.field || row[1],


        type:
          row.type || row[2] || "STRING",


        required:
          row.required === true ||
          row.required==="TRUE",


        unique:
          row.unique === true ||
          row.unique==="TRUE",


        index:
          row.index === true ||
          row.index==="TRUE",


        relation:
          row.relation || "",


        nullable:
          row.nullable !== false,


        active:
          row.active !== false

      });


    });



    return result;

  },




  saveFields(schema){


    const rows=[];



    Object.values(schema)
    .forEach(meta=>{


      (meta.fields||[])
      .forEach(field=>{


        rows.push({

          table:meta.table,


          field:field.name,


          type:
            field.type || "STRING",


          required:
            !!field.required,


          unique:
            !!field.unique,


          index:
            !!field.index,


          relation:
            field.relation || "",


          nullable:
            field.nullable !== false,


          active:
            field.active !== false


        });



      });



    });



    this._write(

      this._fieldsSheet,

      rows,

      [
        "table",
        "field",
        "type",
        "required",
        "unique",
        "index",
        "relation",
        "nullable",
        "active"
      ]

    );


  },




  // ============================================================
  // VERSIONING
  // ============================================================


  getVersion(){


    const rows=
      this._read(
        this._versionsSheet
      );


    if(!rows.length)
      return 0;



    return Math.max(
      ...rows.map(
        r=>Number(
          r.version || r[0] || 0
        )
      )
    );


  },




  getCurrentHash(){


    const rows=
      this._read(
        this._versionsSheet
      );


    if(!rows.length)
      return null;



    rows.sort(
      (a,b)=>
        Number(b.version||b[0])
        -
        Number(a.version||a[0])
    );


    return rows[0].hash || rows[0][2];

  },




  saveVersion(
    version,
    hash,
    author="system"
  ){


    this._append(

      this._versionsSheet,

      {

        version,

        date:
          new Date(),

        hash,

        author

      }

    );


  },




  // ============================================================
  // MIGRATIONS
  // ============================================================


  getMigrations(){

    return this._read(
      this._migrationsSheet
    );

  },




  saveMigration(
    id,
    version,
    action,
    status,
    rollback=""
  ){


    this._append(

      this._migrationsSheet,

      {

        id,

        version,

        action,

        status,

        date:
          new Date(),

        rollback

      }

    );


  },




  // ============================================================
  // FULL LOAD/SAVE
  // ============================================================


  load(){


    const tables =
      this.loadTables();



    const fields =
      this.loadFields();



    Object.keys(fields)
    .forEach(table=>{


      if(tables[table]){

        tables[table].fields =
          fields[table];

      }


    });



    return tables;


  },




  save(schema){


    this.saveTables(schema);

    this.saveFields(schema);


  }



};




globalThis.SchemaStorage =
SchemaStorage;


Logger.log(
 "SchemaStorage READY v"+
 SchemaStorage.version
);