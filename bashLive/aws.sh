killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws live &> trades.ALL.log &
npm run commit server aws live pair=ETH_USD &>> commit.log &
npm run cleanDB server aws live &>> cleanDB.log &
npm run round contractType=Vivaldi tenor=100C-3H debug server aws live &>> vivaldi-100C-3H.log &
npm run fetchPrice server aws live &>> fetchPrice.log &
npm run events server aws live events=StartReset,StartPreReset $1 &>> events.log &