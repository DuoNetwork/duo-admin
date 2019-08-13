killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp &> trades.ALL.log &
npm run commit server gcp pairs=ETH_USD &>> commit.log &
npm run cleanDB server gcp &>> cleanDB.log &
npm run fetchPrice server pairs=ETH_USD contractType=BTV tenor=PPT gcp &>> fetchPrice.log &
npm run events server gcp events=StartReset,StartPreReset $1 &>> events.log &