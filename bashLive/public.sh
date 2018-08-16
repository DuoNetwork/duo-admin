pkill npm
npm run bitfinex server dynamo live &>> bitfinex.log &
npm run gdax server dynamo live &>> gdax.log &
npm run gemini server dynamo live &>> gemini.log &
npm run kraken server dynamo live &>> kraken.log &
npm run hourly server dynamo live &>> hourly.log &
npm run minutely server dynamo live &>> minutely.log &
npm run subscribe server event=others source=infura dynamo live &>> others.log &