var express = require('express');
var router = express.Router();
var SENSORS_COLLECTION = "sensors";
var AVERAGE_TEMPERATURES_COLLECTION = "averageTemperatures";

router.get('/', function(req, res, next) {
    res.send('This is the sensors route');
});

router.get('/average-temperatures', function (req, res) {
    const db = req.app.locals.db;
    db.collection(AVERAGE_TEMPERATURES_COLLECTION).find().toArray(function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send(null);
        }
        res.status(200).send(result);
    });
});

router.get('/average-temperatures/:node', function (req, res) {
    const db = req.app.locals.db;
    db.collection(AVERAGE_TEMPERATURES_COLLECTION).find({"_id": "/" + req.params.node}).toArray(function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send(null);
        }
        res.status(200).send(result);
    });
});

router.get('/nodes', function (req, res) {
    const db = req.app.locals.db;
    db.collection(AVERAGE_TEMPERATURES_COLLECTION).distinct("_id", {}, function (err, result) {
        if (err) {
            console.log(err);
            res.status(500).send(null);
        }
        result.sort();
        var formattedResult = result.map(function (node) {
           return node.slice(1);
        });
        res.status(200).send(formattedResult);
    })
});

function getTimestampForBeginningOfYear(year) {
    const date = new Date(year.toString() + '-01-01');
    return Math.round(date.getTime() / 1000);
}

function getTimestampForEndOfYear(year) {
    const date = new Date((year + 1).toString() + '-01-01');
    return Math.round(date.getTime() / 1000) - 1;
}

router.get('/temperatures/:year', function (req, res) {
    const db = req.app.locals.db;
    const begin = getTimestampForBeginningOfYear(parseInt(req.params.year));
    const end = getTimestampForEndOfYear(parseInt(req.params.year));
    console.log(begin);
    console.log(end);
    const pipeline = [
        {"$project": {"timestamp": "$timestamp", "temperature": "$temperature"}},
        {"$sort": {"timestamp": 1}},
        {"$match": {"timestamp": {"$gte": begin, "$lte": end}}}
    ];
    db.collection(SENSORS_COLLECTION).aggregate(pipeline).toArray(function(err, result) {
        if (err) {
            console.error(err);
            res.status(500).send(null);
        }
        res.status(200).send(result);
    });
});

module.exports = router;