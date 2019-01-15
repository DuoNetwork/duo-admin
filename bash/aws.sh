killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws &> trades.ALL.log &
npm run trigger server aws event=StartPreReset source=infura &>> preReset.log &
npm run trigger server aws event=StartReset source=infura &>> reset.log &
npm run commit server aws base=USD quote=ETH source=infura &>> commit.log &
npm run fetchPrice server aws source=infura &>> fetchPrice.log &
npm run cleanDB server aws &>> cleanDB.log &