npm run bitfinex azure &>> bitfinex.log &
npm run gdax azure &>> gdax.log &
npm run gemini azure &>> gemini.log &
npm run kraken azure &>> kraken.log &
npm run subscribe azure event=StartPreReset source=infura &>> preReset.log &
npm run subscribe azure event=StartReset source=infura &>> reset.log &
npm run commit azure source=infura generator=gbm &>> commit.log &