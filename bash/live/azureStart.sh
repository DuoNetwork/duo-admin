ln -s /home/ubuntu/duo-admin/systemd/live/azure/cleanDB.service /lib/systemd/system/cleanDB.service
ln -s /home/ubuntu/duo-admin/systemd/live/azure/commit.service /lib/systemd/system/commit.service
ln -s /home/ubuntu/duo-admin/systemd/live/azure/events.service /lib/systemd/system/events.service
ln -s /home/ubuntu/duo-admin/systemd/live/azure/fetchPrice.service /lib/systemd/system/fetchPrice.service
ln -s /home/ubuntu/duo-admin/systemd/live/azure/trades.service /lib/systemd/system/trades.service
systemctl daemon-reload
systemctl enable cleanDB
systemctl enable commit
systemctl enable events
systemctl enable fetchPrice
systemctl enable trades
systemctl start cleanDB
systemctl start commit
systemctl start events
systemctl start fetchPrice
systemctl start trades
