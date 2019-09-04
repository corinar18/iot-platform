var express = require('express');
var router = express.Router();
var POSITIONS_COLLECTION = "positions";
var COORDINATES_COLLECTION = "coordinates";

router.get('/', function(req, res, next) {
    res.send('This is the positions route');
});

router.get('/last-known-position/:label', function (req, res) {
    const db = req.app.locals.db;
    var pipeline = [
        {"$match": {"label": req.params.label}},
        {"$sort": {"timestamp": -1}},
        {"$limit": 1}
    ];
    db.collection(POSITIONS_COLLECTION).aggregate(pipeline).toArray(function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send(null);
        }
        res.status(200).send(result);
    });
});

router.get('/labels', function (req, res) {
   const db = req.app.locals.db;
   db.collection(POSITIONS_COLLECTION).distinct("label", {}, function (err, result) {
       if (err) {
           console.log(err);
           res.status(500).send(null);
       }
       result.sort();
       res.status(200).send(result);
   })
});

router.get('/nearby-objects/:x1/:y1/:x2/:y2', function(req, res) {
    const db = req.app.locals.db;
    const query = {
        "geoLocation": {
            "$within": {
                "$box": [[parseInt(req.params.x1), parseInt(req.params.y1)],
                    [parseInt(req.params.x2), parseInt(req.params.y2)]]
            }
        }
    };
    db.collection(COORDINATES_COLLECTION).find(query).toArray(function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send(null);
        }
        res.status(200).send(result);
    })
});

router.get('/coordinates/:label', function (req, res) {
   const db = req.app.locals.db;
   const query = {"label": req.params.label};

   db.collection(COORDINATES_COLLECTION).find(query).toArray(function (err, result) {
       if (err) {
           console.log(err);
           res.status(500).send(null);
       }

       const coordinatesList = result.map(function (item) {
           return item.geoLocation;
       });
       res.status(200).send(coordinatesList);
   })
});

module.exports = router;