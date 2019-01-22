killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server azure &> trades.ALL.log &
npm run trigger server azure event=StartPreReset &>> preReset.log &
npm run trigger server azure event=StartReset &>> reset.log &
npm run commit server azure pair=ETH_USD &>> commit.log &
npm run fetchPrice server azure &>> fetchPrice.log &
npm run cleanDB server azure &>> cleanDB.log &