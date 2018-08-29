pkill npm
npm run bitfinex server gcp &>> bitfinex.log &
npm run gdax gcp server &>> gdax.log &
npm run gemini gcp server &>> gemini.log &
npm run kraken gcp server &>> kraken.log &
npm run subscribe server gcp event=StartPreReset source=infura &>> preReset.log &
npm run subscribe server gcp event=StartReset source=infura &>> reset.log &
npm run commit server gcp source=infura &>> commit.log &
npm run cleanDB gcp &>> cleanDB.log &