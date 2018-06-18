npm run bitfinex server dynamo &>> bitfinex.log &
npm run gdax server dynamo &>> gdax.log &
npm run gemini server dynamo &>> gemini.log &
npm run kraken server dynamo &>> kraken.log &
npm run hourly server dynamo &>> node.log &
npm run minutely server dynamo &>> node.log &
npm run subscribe server event=others source=infura dynamo &>> others.log &