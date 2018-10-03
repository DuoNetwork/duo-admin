pkill npm
rm *.log
npm run trades assets=ETH,USD server aws &> trades.ALL.log &
npm run subscribe server aws event=StartPreReset &>> preReset.log &
npm run subscribe server aws event=StartReset &>> reset.log &
npm run commit server aws &>> commit.log &
npm run node server aws &>> node.log &
npm run cleanDB server aws &>> cleanDB.log &

