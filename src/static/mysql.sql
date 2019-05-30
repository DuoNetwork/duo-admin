
CREATE SCHEMA `priceFeedDB`;

CREATE TABLE `priceFeedDB`.`trades` (
  `source` VARCHAR(255) NOT NULL,
  `id` VARCHAR(255) NOT NULL,
  `price` VARCHAR(255) NOT NULL,
  `amount` VARCHAR(255) NOT NULL,
  `timestamp` VARCHAR(255) NOT NULL,
  `systime` VARCHAR(255) NOT NULL,
  `pair` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`timestamp`, `id`, `source`));

CREATE TABLE `priceFeedDB`.`historical_price` (
  `timestamp` VARCHAR(255) NOT NULL,
  `price` VARCHAR(255) NOT NULL,
  `volume` VARCHAR(255) NOT NULL,
  `pair` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`timestamp`));


