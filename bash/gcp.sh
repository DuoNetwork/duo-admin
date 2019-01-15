killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server gcp &> trades.ALL.log &
npm run trigger server gcp event=StartPreReset &>> preReset.log &
npm run trigger server gcp event=StartReset &>> reset.log &
npm run commit server gcp base=USD quote=ETH &>> commit.log &
npm run fetchPrice server gcp &>> fetchPrice.log &
npm run cleanDB server gcp &>> cleanDB.log &