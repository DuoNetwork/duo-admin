import moment from 'moment';
import request from 'request';

export class Util {
	log(text: string): void {
		console.log(moment().format('HH:mm:ss.SSS') + ' ' + text);
	}

	get(url: string): Promise<string> {
		return new Promise((resolve, reject) =>
			request(
				{
					url: url,
					headers: {
						'user-agent': 'node.js'
					}
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}

	postJson(url: string, json: object): Promise<object> {
		return new Promise((resolve, reject) =>
			request(
				{
					url: url,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json: json
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}
}

const util = new Util();
export default util;
