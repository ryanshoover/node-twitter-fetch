"use strict";
var base64  = require('./base64.js');
var request = require('request');

var searchQuery = '';
var api = 'https://api.twitter.com/';
var creds = {
	'key':'VeRyZOEWK4d8g9ysIpGpFUqTH',
	'secret':'3DZnOwumJgo3Vv0m4b6KQ4scB7xHfZ8xajjldDntJu87aUmrrT',
	'token':false
};

// Create the Twitter fetch function
// function search( query ) {
// 	searchQuery = query;
// 	return getToken();
// }

var twitterSearch = (function() {
	function getToken(){
		var twURL = api + '/oauth2/token';

		var result = request.post( twURL, {
			'auth': {
				'user': creds.key,
				'pass': creds.secret
			},
			'form': {
				'grant_type': 'client_credentials'
			}
		}, function( err, res, body ) {
			if ( 200 != res.statusCode) {
				return;
			}

			var result = JSON.parse(body);

			if ( 'bearer' == result.token_type ) {
				creds.token = result.access_token;
				return getSearch();
			}
		});

		return result;
	}

	function getSearch() {
		var twURL = api + '1.1/search/tweets.json?q=' + encodeURI( searchQuery );

		var result = request.get( twURL, {
			headers: {
				'Authorization': "Bearer " + creds.token
			}
		},function (err, res, body) {
			if (res.statusCode == 200) {
				return JSON.parse(body);
			}
		});

		return result;
	}

	return {
		search: function() {
			return getToken();
		}
	}
})();

exports.search = twitterSearch;