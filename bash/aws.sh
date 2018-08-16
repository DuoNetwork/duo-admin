pkill npm
npm run bitfinex server aws &>> bitfinex.log &
npm run gdax server aws &>> gdax.log &
npm run gemini server aws &>> gemini.log &
npm run kraken server aws &>> kraken.log &
npm run subscribe server aws event=StartPreReset &>> preReset.log &
npm run subscribe server aws event=StartReset &>> reset.log &
npm run commit server aws &>> commit.log &

