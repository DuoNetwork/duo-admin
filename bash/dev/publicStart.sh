ln -s /home/ubuntu/duo-admin/systemd/dev/public/events.service /lib/systemd/system/events.service
ln -s /home/ubuntu/duo-admin/systemd/dev/public/price1.service /lib/systemd/system/price1.service
ln -s /home/ubuntu/duo-admin/systemd/dev/public/price60.service /lib/systemd/system/price60.service
ln -s /home/ubuntu/duo-admin/systemd/dev/public/trades.service /lib/systemd/system/trades.service
systemctl daemon-reload
systemctl enable events
systemctl enable price1
systemctl enable price60
systemctl enable trades
systemctl start events
systemctl start price1
systemctl start price60
systemctl start trades
