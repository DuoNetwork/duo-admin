killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp live &> trades.ALL.log &
npm run commit server gcp live pair=ETH_USD &>> commit.log &
npm run cleanDB server gcp live &>> cleanDB.log &
npm run round contractType=Vivaldi tenor=100C-3H debug server gcp live &>> vivaldi-100C-3H.log &
npm run fetchPrice server gcp live &>> fetchPrice.log &
npm run events server gcp live events=StartReset,StartPreReset $1 &>> events.log &