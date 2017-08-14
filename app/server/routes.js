module.exports = function (app) {
  // Application ------------------------------------------
  app.get('/', (req, res) => {
    res.sendfile('./app/client/index.html');
  });

  app.get('/wakemydyno.txt', (req, res) => res
    .header('Access-Control-Allow-Origin', '*')
    .sendStatus(200)
  );

  // Wildcard all other GET requests to the angular app
  app.get('*', (req, res) => {
    res.sendfile('./app/client/index.html');
  });
};
