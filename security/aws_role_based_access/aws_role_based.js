    var awsCli = require('aws-cli-js');
    var Options = awsCli.Options;
    var Aws = awsCli.Aws;

    var aws = new Aws();

  aws.command('ssm get-parameter --name price-feed-private --with-decryption').then(function (data) {

    console.log(data.object.Parameter.Value);

  }).catch((error) => {
    console.log(error);
  });;