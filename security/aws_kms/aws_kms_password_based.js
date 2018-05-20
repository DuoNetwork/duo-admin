// Need to install the AWS CLI
// Need to do the setup of region first.
// Tested successfully to run in azure cloud server.

var awsCli = require('aws-cli-js');
var Options = awsCli.Options;
var Aws = awsCli.Aws;


var options = new Options(
    /* accessKey    */ 'AKIAI65M5NSNZDZRUJFQ',
    /* secretKey    */ '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', null
  );

  var aws = new Aws(options);


  aws.command('ssm get-parameter --name price-feed-private --with-decryption').then(function (data) {

    console.log(data.object.Parameter.Value);

  }).catch((error) => {
    console.log(error);
  });;