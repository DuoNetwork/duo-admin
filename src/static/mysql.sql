
CREATE SCHEMA `priceFeedDB`;

CREATE TABLE `priceFeedDB`.`eth_trades_dev` (
  `source` VARCHAR(255) NOT NULL,
  `id` VARCHAR(255) NOT NULL,
  `price` VARCHAR(255) NOT NULL,
  `amount` VARCHAR(255) NOT NULL,
  `timestamp` VARCHAR(255) NOT NULL,
  `systime` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`timestamp`, `id`, `source`));

CREATE TABLE `priceFeedDB`.`eth_historical_price_dev` (
  `timestamp` VARCHAR(255) NOT NULL,
  `price` VARCHAR(255) NOT NULL,
  `volume` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`timestamp`));


