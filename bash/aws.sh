npm run bitfinex aws &>> bitfinex.log &
npm run gdax aws &>> gdax.log &
npm run gemini aws &>> gemini.log &
npm run kraken aws &>> kraken.log &
npm run bitfinex dynamo &>> bitfinex.log &
npm run gdax dynamo &>> gdax.log &
npm run gemini dynamo &>> gemini.log &
npm run kraken dynamo &>> kraken.log &
npm run subscribe aws event=StartPreReset &>> preReset.log &
npm run subscribe aws event=StartReset &>> reset.log &
npm run commit aws generator=preSet &>> commit.log &
