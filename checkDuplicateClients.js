function checkDuplicateClients() {
  SecurityGuard.require(
    "CLIENT_READ"
  );

  const clients =
    Database.query("CLIENT", {});
  const map = {};
  const duplicates = [];

  clients.forEach((client) => {
    if (map[client.ClientID]) {
      duplicates.push(
        client.ClientID
      );
      Logger.log(
        "DUPLICATE: " +
          client.ClientID
      );
    }

    map[client.ClientID] = true;
  });

  return duplicates;
}
