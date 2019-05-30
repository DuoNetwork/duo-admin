killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp live &> trades.ALL.log &
npm run cleanDB server gcp live &>> cleanDB.log &
npm run commit server gcp live pairs=ETH_USD &>> commit.log &
npm run fetchPrice server pairs=ETH_USD gcp live &>> fetchPrice.log &
npm run events server gcp live events=StartReset,StartPreReset $1 &>> events.log &