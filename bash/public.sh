killall -s KILL node
rm *.log
npm run trades assets=ETH,USD server dynamo &> trades.ALL.log &
npm run prices period=1 dev dynamo &> prices.1.log &
npm run prices period=60 dev dynamo &> prices.60.log &
npm run events server dynamo events=Others $1 &>> events.log &