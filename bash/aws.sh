killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server aws &> trades.ALL.log &
npm run commit server aws pairs=ETH_USD &>> commit.log &
npm run cleanDB server aws &>> cleanDB.log &
npm run round contractType=Vivaldi tenor=100C-1H debug server aws &>> vivaldi-100C-1H.log &
npm run fetchPrice server pairs=ETH_USD aws &>> fetchPrice.log &
npm run events server aws events=StartReset,StartPreReset $1 &>> events.log &