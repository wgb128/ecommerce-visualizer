const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient

var db; //global for reference to mongodb database

// cors
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

MongoClient.connect('mongodb://localhost:27017/', (err, database) => {
    if (err) return console.log(err);
    else db = database;
});

app.listen(3001, function() {
    console.log("Listening on 3001");
});

app.get('/', (req, res) => {
    var category = req.query.category;
    var mongo_url = 'mongodb://localhost:27017/';
    var collection_name = '1496977049705';
    MongoClient.connect(mongo_url, function(err, db) {
        if(err) console.error(err);
        else {
            console.log("Connected to mongo");
            db.collection(collection_name).findOne({category: category}, {}).then(function(doc) {
                res.send(JSON.stringify(doc));
            });
            db.close();
        }
    });
});
