pkill npm
rm *.log
npm run trades assets=ETH,USD server gcp &> trades.ALL.log &
npm run subscribe server gcp event=StartPreReset source=infura &>> preReset.log &
npm run subscribe server gcp event=StartReset source=infura &>> reset.log &
npm run commit server gcp source=infura &>> commit.log &
npm run cleanDB gcp &>> cleanDB.log &