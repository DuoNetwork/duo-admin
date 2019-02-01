npm run trigger server aws event=StartPreReset &>> preReset.log &
npm run trigger server aws event=StartReset &>> reset.log &
npm run fetchPrice server aws &>> fetchPrice.log &