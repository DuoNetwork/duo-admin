npm run trigger server gcp event=StartPreReset &>> preReset.log &
npm run trigger server gcp event=StartReset &>> reset.log &
npm run commit server gcp pair=ETH_USD &>> commit.log &
npm run fetchPrice server gcp &>> fetchPrice.log &