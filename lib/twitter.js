exports.api = (function() {
    var request = require('request');
    var async = require('async');
    var json2csv = require('json2csv');
    var tweets = [];
    var api = 'https://api.twitter.com/';
    var creds = {
        'key': 'VeRyZOEWK4d8g9ysIpGpFUqTH',
        'secret': '3DZnOwumJgo3Vv0m4b6KQ4scB7xHfZ8xajjldDntJu87aUmrrT',
        'token': false
    };

    function processSearch(q, express, action) {
        async.series ({
            token:  function (done) {
                if ( false !== creds.token) {
                    done(null, creds.token);
                }
                request.post(api + '/oauth2/token', {
                    'auth': {
                        'user': creds.key,
                        'pass': creds.secret
                    },
                    'form': {
                        'grant_type': 'client_credentials'
                    }
                }, function(err, res, body) {
                    if (err) {
                        done(null, console.error('token fetch failed:', err) );
                        return;
                    } else {
                        var result = JSON.parse(body)
                        if ('bearer' == result.token_type) {
                            creds.token = result.access_token
                        }

                        done(null, creds.token)
                    }
                });
            },
            search: function (done) {
                request.get(api + '1.1/search/tweets.json?count=100&result_type=recent&q=' + encodeURI(q), {
                    headers: {
                        'Authorization': "Bearer " + creds.token
                    }
                }, function(err, res, body) {
                    if (err) {
                        done(null, console.error('search failed:', err) );
                        return;
                    } else {
                        var results = JSON.parse(body);
                        var tweets = results.statuses;

                        done(null, tweets);
                        return tweets;
                    }
                });
            }
        }, function (err, results) {
            // Callback function
            if ( 'download' === action ) {
                downloadTweets(express, results.search);
            } else {
                renderTweets(express, results.search, q);
            }
            return results;
        });
    }

    function renderTweets(express, tweets, query) {
        express.render('pages/index', { tweets: tweets, query: query })
    }

    function downloadTweets(express, tweets) {
        var fields = ['user', 'text', 'link'];
        var tweetsJson = [];
        for ( var i=0; i < tweets.length; i++ ) {
            tweet = tweets[i];
            tweetsJson.push({
                'user' : tweet.user.screen_name,
                'text' : tweet.text,
                'link' : 'http://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str,
            })
        }

        json2csv({ data: tweetsJson, fields: fields}, function(err, csv) {
            if(err) console.log(err);

            express.set({
                "Content-type": "text/csv",
                "Content-Disposition": "attachment; filename=tweets.csv",
                "Pragma": "no-cache",
                "Expires": "0",
            });
            express.send(csv);
        });
    }

    return {
        search: function(q, res, action) {
            processSearch(q, res, action);
        }
    }
})();
