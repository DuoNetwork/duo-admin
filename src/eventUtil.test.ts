import eventUtil from './eventUtil';
import sampleEvent from './samples/eventsOther.json';

test('parseEvent', () =>
	sampleEvent.forEach(e => expect(eventUtil.parseEvent(e, 1234567890)).toMatchSnapshot()));
