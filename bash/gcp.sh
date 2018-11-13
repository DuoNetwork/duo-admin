killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp &> trades.ALL.log &
npm run subscribe server gcp event=StartPreReset source=infura &>> preReset.log &
npm run subscribe server gcp event=StartReset source=infura &>> reset.log &
npm run commit server gcp source=infura base=USD quote=ETH &>> commit.log &
npm run fetchPrice server gcp source=infura &>> fetchPrice.log &
npm run cleanDB server gcp &>> cleanDB.log &