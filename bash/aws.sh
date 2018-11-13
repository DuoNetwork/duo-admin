pkill npm
rm *.log
npm run trades assets=ETH,USD server aws &> trades.ALL.log &
npm run subscribe server aws event=StartPreReset &>> preReset.log &
npm run subscribe server aws event=StartReset &>> reset.log &
npm run commit server aws base=USD quote=ETH &>> commit.log &
npm run fetchPrice server aws &>> fetchPrice.log &
npm run cleanDB server aws &>> cleanDB.log &