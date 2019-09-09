var express = require('express');
var router = express.Router();
var FACES_COLLECTION = "faces";

router.get('/', function(req, res, next) {
    res.send('This is the faces route');
});

module.exports = router;