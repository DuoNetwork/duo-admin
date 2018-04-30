
CREATE SCHEMA `priceFeedDB` ;

CREATE TABLE `priceFeedDB`.`ETH_Price_Table` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `timestamp` VARCHAR(255) NOT NULL,
  `last_price` VARCHAR(255) NOT NULL,
  `mid` VARCHAR(255) NOT NULL,
  `bid` VARCHAR(255) NOT NULL,
  `ask` VARCHAR(255) NOT NULL,
  `low` VARCHAR(255) NOT NULL,
  `volume` VARCHAR(255) NOT NULL,
  `system_time` VARCHAR(255) NOT NULL,
  `source_exchange` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`,`timestamp`, `source_exchange`));

CREATE TABLE `priceFeedDB`.`ETH_Trades_Table` (
  `exchange_source` VARCHAR(255) NOT NULL,
  `trade_id` VARCHAR(255) NOT NULL,
  `price` VARCHAR(255) NOT NULL,
  `amount` VARCHAR(255) NOT NULL,
  `trade_type` VARCHAR(255) NOT NULL,
  `exchange_returned_timestamp` VARCHAR(255) NOT NULL,
  `system_timestamp` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`exchange_returned_timestamp`, `trade_id`, `exchange_source`));

CREATE TABLE `priceFeedDB`.`ETH_Historical_Price` (
  `timestamp` VARCHAR(255) NOT NULL,
  `price` VARCHAR(255) NOT NULL,
  `volume` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`timestamp`));


