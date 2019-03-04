killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws live &> trades.ALL.log &
npm run cleanDB server aws live &>> cleanDB.log &
npm run commit server aws live pair=ETH_USD &>> commit.log &
npm run fetchPrice server aws live &>> fetchPrice.log &