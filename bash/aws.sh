npm run bitfinex aws &>> bitfinex.log &
npm run gdax aws &>> gdax.log &
npm run gemini aws &>> gemini.log &
npm run kraken aws &>> kraken.log &
npm run subscribe aws event=StartPreReset &>> preReset.log &
npm run subscribe aws event=StartReset &>> reset.log &
npm run commit aws generator=preSet &>> commit.log &
npm run node aws &>> node.log &
