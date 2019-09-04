var createError = require('http-errors');
const cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var fs = require('fs');

var app = express();


app.use(cors());
app.options('*', cors());

var indexRouter = require('./routes/index');
var eventsRouter = require('./routes/events');
var positionsRouter = require('./routes/positions');
var sensorsRouter = require('./routes/sensors');

var mongoClient = require('mongodb').MongoClient;
let url = "mongodb://localhost:27017/iot-platform";
let db = undefined;

var EVENTS_COLLECTION = "events";
var POSITIONS_COLLECTION = "positions";
var SENSORS_COLLECTION = "sensors";
var FACES_COLLECTION = "faces";
var AVERAGE_TEMPERATURES_COLLECTION = "averageTemperatures";
var COORDINATES_COLLECTION = "coordinates";

var events = fs.readFileSync('../datasets/Events.json');
var positions = fs.readFileSync('../datasets/Positions.json');
var sensors = fs.readFileSync('../datasets/Sensors.json');

var collectionsMap = new Map();
collectionsMap.set(EVENTS_COLLECTION, events);
collectionsMap.set(POSITIONS_COLLECTION, positions);
collectionsMap.set(SENSORS_COLLECTION, sensors);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/events', eventsRouter);
app.use('/positions', positionsRouter);
app.use('/sensors', sensorsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

mongoClient.connect(url, {useNewUrlParser: true}, function (err, client) {
  if (err) {
    console.log('Database is not connected');
    throw err;
  } else {
    db = client.db("iot-platform");

    db.collections(function (err, cols) {
      if (err) {
        console.log('Could not retrieve collections');
        throw err;
      } else {
        let collectionNames = [];
        cols.forEach(function (col) {
          collectionNames.push(col.collectionName);
        });
        checkCollectionExists(collectionNames, EVENTS_COLLECTION);
        checkCollectionExists(collectionNames, POSITIONS_COLLECTION);
        checkCollectionExists(collectionNames, SENSORS_COLLECTION);
        // checkCollectionExists(collectionNames, FACES_COLLECTION);
        createAverageTemperaturesCollection();
        checkGeospatialCollectionExists(collectionNames);
        app.locals.db = db;
        console.log('Database is running');
      }
    })
  }
});

function checkCollectionExists(collections, collection) {
  if (collections.indexOf(collection) < 0) {
    db.createCollection(collection, function (err, res) {
      if (err) {
        console.log("Collection " + collection + " could not be created");
        throw err;
      } else {
          console.log ("Collection " + collection + " has been successfully created!");
          var parsedData = JSON.parse(collectionsMap.get(collection));
          db.collection(collection).insertMany(parsedData, function (err, res) {
            if (err) {
              console.log("Failed to add documents to collection " + collection);
              throw err;
            } else {
              console.log("Documents were successfully added to collection " + collection);
            }
          })
      }
    })
  }
}

function mapFunction() {
  emit(this.node, {count: 1, temp: this.temperature});
}

function reduceFunction(node, temperatures) {
  var value = {
    count: 0,
    temp: 0
  };
  for (var idx = 0; idx < temperatures.length; idx++) {
    value.count += temperatures[idx].count;
    value.temp += temperatures[idx].temp;
  }
  return value;
}

function finalizeFunction(node, value) {
  if (value.count > 0) {
    value.average = (value.temp / value.count).toFixed(2);
  }
  return value;
}

function createAverageTemperaturesCollection() {
  db.collection(SENSORS_COLLECTION)
      .mapReduce(mapFunction,
          reduceFunction,
          {
            out: {
              replace: AVERAGE_TEMPERATURES_COLLECTION
            },
            finalize: finalizeFunction
          });
  console.log("Documents were successfully added to collection " + AVERAGE_TEMPERATURES_COLLECTION);
}

function checkGeospatialCollectionExists(collections) {
  if (collections.indexOf(COORDINATES_COLLECTION) >= 0) {
    db.collection(COORDINATES_COLLECTION).drop(function(err, delOK) {
      if (err) {
        console.log("Collection " + COORDINATES_COLLECTION + " could not be dropped");
        throw err;
      }
      if (delOK) {
        console.log("Collection " + COORDINATES_COLLECTION + " has been dropped successfully");
      }
    });
  }
  var coordinates = [];
  db.collection(POSITIONS_COLLECTION).find().forEach(function (doc) {
    var newDoc  = {
      "_id" : doc["_id"],
      "geoLocation": [parseFloat(doc["coordinate"]["x"]), parseFloat(doc["coordinate"]["y"])],
      "label": doc["label"],
      "type": doc["type"]
    };
    coordinates.push(newDoc);
  });
  db.createCollection(COORDINATES_COLLECTION, function (err, res) {
    if (err) {
      console.log("Collection " + COORDINATES_COLLECTION + " could not be created");
      throw err;
    } else {
      console.log ("Collection " + COORDINATES_COLLECTION + " has been successfully created!");
      db.collection(COORDINATES_COLLECTION).insertMany(coordinates, function (err, res) {
        if (err) {
          console.log("Failed to add documents to collection " + COORDINATES_COLLECTION);
          throw err;
        } else {
          console.log("Documents were successfully added to collection " + COORDINATES_COLLECTION);
          db.collection(COORDINATES_COLLECTION).createIndex(
              { geoLocation: '2dsphere', min: -1000, max: 1000 }
          );
        }
      })
    }
  });
}

module.exports = app;
