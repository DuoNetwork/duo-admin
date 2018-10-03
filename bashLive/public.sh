pkill npm
npm run trades assets=ETH,USD server dynamo live &> trades.ALL.log &
npm run hourly server dynamo live &>> hourly.log &
npm run minutely server dynamo live &>> minutely.log &
npm run subscribe server event=others source=infura dynamo live &>> others.log &