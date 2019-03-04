killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp live &> trades.ALL.log &
npm run cleanDB server gcp live &>> cleanDB.log &
npm run commit server gcp live pair=ETH_USD &>> commit.log &
npm run fetchPrice server gcp live &>> fetchPrice.log &