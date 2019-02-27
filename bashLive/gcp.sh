killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp live &> trades.ALL.log &
npm run cleanDB server gcp live &>> cleanDB.log &