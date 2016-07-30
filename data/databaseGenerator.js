'use strict';

var path = require('path');
var request = require('request');
var Async = require('async');
var ProgressBar = require('progress');
var sqlite3 = require('sqlite3').verbose();

var outputFile = process.argv[2] || path.resolve(__dirname, 'norrisbot.db');
var db = new sqlite3.Database(outputFile);

request('http://api.icndb.com/jokes/count', function (error, response, body) {
    if (!error && response.statusCode === 200) {
        var count = JSON.parse(body).value;
        var savedJokes = 0;
        var index = 0;
        var bar = new ProgressBar(':bar :current/:total', {total: count});

        db.serialize();
        db.run('CREATE TABLE IF NOT EXISTS info (name TEXT PRIMARY KEY, val TEXT DEFAULT NULL)');
        db.run('CREATE TABLE IF NOT EXISTS jokes (id INTEGER PRIMARY KEY, joke TEXT, used INTEGER DEFAULT 0)');
        db.run('CREATE INDEX jokes_used_idx ON jokes (used)');

        var test = function () {
            return savedJokes < count;
        };

        var task = function (cb) {
            request('http://api.icndb.com/jokes/' + (++index) + '?escape=javascript', function (err, response, body) {
                if (err || response.statusCode !== 200) {
                    console.log(index, error, response.statusCode);

                    return cb(error || response.statusCode);
                }

                var result = null;
                try {
                    result = JSON.parse(body).value;
                } catch (ex) {
                    return cb(null);
                }

                db.run('INSERT INTO jokes (joke) VALUES (?)', result.joke, function (err) {
                    if (err) {
                        return cb(err);
                    }

                    ++savedJokes;
                    bar.tick();
                    return cb(null);
                });
            });
        };

        var onComplete = function (err) {
            db.close();
            if (err) {
                console.log('Error: ', err);
                process.exit(1);
            }
        };

        return Async.whilst(test, task, onComplete);
    }

    console.log('Error: unable to count the total number of jokes');
    process.exit(1);
});
