npm run trigger server gcp event=StartPreReset &>> preReset.log &
npm run trigger server gcp event=StartReset &>> reset.log &
npm run fetchPrice server gcp &>> fetchPrice.log &