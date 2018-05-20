
'use strict'

const request = require('request')

function fetch_process() {

    var saved_access_token = 'Bearer ';

    var access_key_options = {
        url: 'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net',
        headers: {
            'Metadata': 'true'
        }
    };

    request(access_key_options,
        function (error, response, body) {

            if (!error && response.statusCode == 200) {
                var responseJson = JSON.parse(body);
                saved_access_token = saved_access_token + responseJson.access_token;
                // console.log(saved_access_token);

                var private_key_options = {
                    url: 'https://price-dev-test.vault.azure.net/secrets/price-feed-private?api-version=2016-10-01',
                    headers: {
                        'Authorization': saved_access_token
                    }
                };

                request(private_key_options,
                    function (error, response, body) {

                        console.log(">>>> " + saved_access_token);

                        if (!error && response.statusCode == 200) {
                            var responseJson = JSON.parse(body);
                            console.log('Private Key: ' + responseJson.value);
                        } else {
                            console.log(response.statusCode);
                            console.log(error);
                            console.log("-Phase 2--Failed to fetch Private Key.");
                        }

                    });

            } else {
                console.log("-Phase 1--Failed to fetch Access Key.");
            }
        });
}


fetch_process();
