// @flow
let tool = process.argv[2];
console.log.log('tool ' + tool);

let live = process.argv.includes('live');
util.log('using ' + (live ? 'live' : 'dev') + ' env');

switch (tool) {
	default:
		util.log('no tool selected, exit');
		process.exit();
		break;
}
