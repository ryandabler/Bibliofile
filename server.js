"use strict";

////////////////////////////
// Initialize
////////////////////////////
const express  = require("express");
const morgan   = require("morgan");
const mongoose = require("mongoose");

const app = express();

const { routerCreator, routerWork } = require("./routers");

const { PORT, DATABASE_URL } = require("./config");

app.use(express.static("public"));

////////////////////////////
// Set up application
////////////////////////////

// Log HTTP layer
app.use(morgan("common"));

// Set up router
app.use("/api/creators", routerCreator);
app.use("/api/works", routerWork);

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