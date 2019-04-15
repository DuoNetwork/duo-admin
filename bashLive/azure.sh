killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server azure live &> trades.ALL.log &
npm run cleanDB server azure live &>> cleanDB.log &
npm run commit server azure live pairs=ETH_USD &>> commit.log &
npm run fetchPrice server pairs=ETH_USD azure live &>> fetchPrice.log &
npm run events server azure live events=StartReset,StartPreReset $1 &>> events.log &
npm run round contractType=Vivaldi tenor=100C-1H server azure &>> vivaldi-100C-1H.log &