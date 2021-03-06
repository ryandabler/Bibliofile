"use strict";

////////////////////////////
// Initialize
////////////////////////////
const express  = require("express");
const morgan   = require("morgan");
const mongoose = require("mongoose");

const app = express();
const { PORT, DATABASE_URL } = require("./config");

app.use(express.static("public"));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  next();
});

////////////////////////////
// Set up application
////////////////////////////

// Log HTTP layer
app.use(morgan("common"));

// Set up router
app.use("/api/creators", require("./routes/creator").router);
app.use("/api/works", require("./routes/work").router);
app.use("/api/search/works", require("./routes/search-works").router);
app.use("/api/search/creators", require("./routes/search-creators").router);
app.use("/api/conversation", require("./routes/conversation").router);

// Error handling
app.use((err, req, res, next) => {
  res.status(err.status).json({ message: err.message });
});

////////////////////////////
// Set up server
////////////////////////////
mongoose.Promise = global.Promise;

let server;

function runServer(databaseUrl = DATABASE_URL, port = PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, {}, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing server');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = { app, runServer, closeServer };