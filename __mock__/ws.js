const ws = jest.genMockFromModule('ws');



ws.on = (action: string) => {
	switch (action) {
		case 'open':
			return api.handleWSTradeOpen([`${source}quote-${source}base`], {} as any);
		case 'message':
			return api.handleWSTradeMessage('message', {} as any);
		case 'close':
			return console.log('close');
		case 'error':
			return console.log('error');
	}
}
module.exports = ws;
