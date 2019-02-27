killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server dynamo live &> trades.ALL.log &
npm run prices period=1 dynamo live &> prices.1.log &
npm run prices period=60 dynamo live &> prices.60.log &
npm run events server dynamo events=Others live $1 &>> events.log &