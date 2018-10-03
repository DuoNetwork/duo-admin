pkill npm
rm *.log
npm run trades assets=ETH,USD server azure &> trades.ALL.log &
npm run subscribe server azure event=StartPreReset source=infura &>> preReset.log &
npm run subscribe server azure event=StartReset source=infura &>> reset.log &
npm run commit server azure source=infura &>> commit.log &
npm run cleanDB azure &>> cleanDB.log &