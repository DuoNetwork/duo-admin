killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws live &> trades.ALL.log &
npm run cleanDB server aws live &>> cleanDB.log &
npm run commit server aws live pairs=ETH_USD &>> commit.log &
npm run fetchPrice server pairs=ETH_USD aws live &>> fetchPrice.log &
npm run events server aws live events=StartReset,StartPreReset $1 &>> events.log &