killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server azure &> trades.ALL.log &
npm run cleanDB server azure &>> cleanDB.log &