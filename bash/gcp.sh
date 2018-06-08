npm run bitfinex gcp &>> bitfinex.log &
npm run gdax gcp &>> gdax.log &
npm run gemini gcp &>> gemini.log &
npm run kraken gcp &>> kraken.log &
npm run subscribe gcp event=StartPreReset source=infura &>> preReset.log &
npm run subscribe gcp event=StartReset source=infura &>> reset.log &
npm run commit gcp source=infura generator=preSet &>> commit.log &