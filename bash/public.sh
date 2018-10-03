pkill npm
rm *.log
npm run trades assets=ETH,USD server dynamo &> trades.ALL.log &
npm run hourly server dynamo &>> hourly.log &
npm run minutely server dynamo &>> minutely.log &
npm run subscribe server event=others source=infura dynamo &>> others.log &