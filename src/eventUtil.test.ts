import { EventLog } from 'web3/types';
import eventUtil from './eventUtil';
const sampleEvent: EventLog[] = require('./samples/eventsOther.json');

test('parseEvent', () =>
	sampleEvent.forEach(e => expect(eventUtil.parseEvent(e, 1234567890)).toMatchSnapshot()));
