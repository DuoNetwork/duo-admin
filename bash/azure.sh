killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server azure &> trades.ALL.log &
npm run commit server azure pairs=ETH_USD &>> commit.log &
npm run cleanDB server azure &>> cleanDB.log &
npm run round contractType=Vivaldi tenor=100C-1H debug server azure &>> vivaldi-100C-1H.log &
npm run fetchPrice server pairs=ETH_USD azure &>> fetchPrice.log &
npm run events server azure events=StartReset,StartPreReset $1 &>> events.log &