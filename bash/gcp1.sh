killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp &> trades.ALL.log &
npm run commit server gcp pair=ETH_USD &>> commit.log &
npm run cleanDB server gcp &>> cleanDB.log &