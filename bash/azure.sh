pkill npm
npm run bitfinex server azure &>> bitfinex.log &
npm run gdax server azure &>> gdax.log &
npm run gemini server azure &>> gemini.log &
npm run kraken server azure &>> kraken.log &
npm run subscribe server azure event=StartPreReset source=infura &>> preReset.log &
npm run subscribe server azure event=StartReset source=infura &>> reset.log &
npm run commit server azure source=infura &>> commit.log &