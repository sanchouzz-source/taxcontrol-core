console.log("TestEntityLifecycleMatrix");


const TestEntityLifecycleMatrix = {


  run(entity, repository, factoryData) {

    Logger.log(
      "===== ENTITY TEST START: " + entity + " ====="
    );


    let created;
    let updated;
    let restored;


    // CREATE
    created = repository.create(factoryData);

    if (!created) {
      throw new Error(entity + " CREATE FAILED");
    }


    Logger.log(
      "CREATE OK: " + created[entity + "ID"]
    );


    // READ

    const read = repository.findById(
      created[entity + "ID"]
    );


    if (!read) {
      throw new Error(entity + " READ FAILED");
    }


    Logger.log("READ OK");


    // UPDATE

    updated = repository.update(
      created[entity + "ID"],
      {
        TestField:"UPDATED"
      }
    );


    if (!updated) {
      throw new Error(entity + " UPDATE FAILED");
    }


    Logger.log("UPDATE OK");


    // DELETE

    repository.delete(
      created[entity + "ID"]
    );


    const deleted =
      repository.findById(
        created[entity + "ID"]
      );


    if (deleted) {
      throw new Error(entity + " DELETE FAILED");
    }


    Logger.log("DELETE OK");


    // RESTORE

    restored =
      repository.restore(
        created[entity + "ID"]
      );


    if (!restored) {
      throw new Error(entity + " RESTORE FAILED");
    }


    Logger.log("RESTORE OK");


    Logger.log(
      "===== ENTITY TEST SUCCESS: "
      + entity
      + " ====="
    );


    return true;
  }

};


globalThis.TestEntityLifecycleMatrix =
TestEntityLifecycleMatrix;