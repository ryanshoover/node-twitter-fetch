exports.api = (function() {
    var request   = require('request');
    var async     = require('async');
    var json2csv  = require('json2csv');
    var tweets    = [];
    var query     = null;
    var startDate = null
    var endDate   = null
    var response  = null;
    var api       = 'https://api.twitter.com/';
    var creds = {
        'key': process.env.TW_API_KEY,
        'secret': process.env.TW_API_SECRET,
        'token': false
    };

    /**
     * Get an authentication token from Twitter
     * @param  {Function} done The callback function
     */
    function getToken(done) {
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
            } else {
                var result = JSON.parse(body)
                var token = false

                if ('bearer' == result.token_type) {
                    token = result.access_token
                }

                done(null, token)
            }
        });
    }

    /**
     * Get search results from the Twitter API
     * @param  {string}   token The authentication token to use
     * @param  {function} done  The callback function
     */
    function getSearch(token, done) {

        fullQuery = ''

        if ( query ) {
            fullQuery += query
        }

        if ( startDate ) {
            fullQuery += ' since:' + startDate
        }

        if ( endDate ) {
            fullQuery += ' until:' + endDate
        }

        searchURI = api + '1.1/search/tweets.json?count=100&result_type=recent&q=' + encodeURIComponent(fullQuery)

        request.get( searchURI, {
            headers: {
                'Authorization': "Bearer " + token
            }
        }, function(err, res, body) {
            var results = JSON.parse(body);
            if (err || results.errors) {
                done(null, console.error('search failed:', results.errors) );
                return;
            } else {
                done(null, results.statuses)
            }
        });
    }

    /**
     * Process a search request
     * Assumes the query has been saved in the return object
     * @param  {string} action The action that should happen after searching (download | render)
     */
    function processSearch(action) {
        var operations = [ getToken, getSearch ];

        async.waterfall(operations, function (err, results) {
            if (err) {
                console.error('waterfall error', err)
            } else {
                processOutput(action, results)
            }
        });
    }

    /**
     * Given an action and tweets, figure out what to do
     * @param  {string} action The action to take (download | render)
     * @param  {array} tweets  The tweets that we need to render, in an array of Twitter response objects
     */
    function processOutput(action, tweets) {
        if ( 'download' === action ) {
            downloadTweets(tweets);
        } else {
            renderTweets(tweets);
        }
    }

    /**
     * Render the index page with tweets passed in
     * @param  {array} tweets The tweets that we need to render, in an array of Twitter responses
     */
    function renderTweets(tweets) {
        response.render('pages/index', { tweets: tweets, query: query })
    }

    /**
     * Download a CSV to the browser containing our tweets
     * @param  {array} tweets The tweets that we need to render, in an array of Twitter responses
     */
    function downloadTweets(tweets) {
        var fields = ['user', 'text', 'link', 'created_at'];

        var tweetsJson = [];

        for ( var i=0; i < tweets.length; i++ ) {
            tweet = tweets[i];

            tweetsJson.push({
                'user' : tweet.user.screen_name,
                'text' : tweet.text,
                'link' : 'http://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str,
                'created_at' : tweet.created_at,
            })
        }

        json2csv({ data: tweetsJson, fields: fields}, function(err, csv) {
            if(err) console.error('json2csv error', err);

            response.set({
                "Content-type": "text/csv",
                "Content-Disposition": "attachment; filename=tweets.csv",
                "Pragma": "no-cache",
                "Expires": "0",
            });
            respon2se.send(csv);
        });
    }

    return {
        /**
         * Perform a search using the API
         * @param  {string} q      The query string
         * @param  {obj}    res    The Express response object
         * @param  {string} action The action to take after searching
         */
        search: function(form, res, action) {
            query = form.query
            startDate = form.startDate
            endDate = form.endDate
            response = res
            processSearch(action);
        }
    }
})();
