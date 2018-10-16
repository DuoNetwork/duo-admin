import request from 'request';

class HttpUtil {
	public get(url: string, headerOthers?: object): Promise<any> {
		return new Promise((resolve, reject) =>
			request(
				{
					url,
					headers: Object.assign(
						{
							'user-agent': 'node.js'
						},
						headerOthers || {}
					)
				},
				(error, res, body) => {
					if (error) reject(error);
					else if (res.statusCode === 200) resolve(body);
					else reject('Error status ' + res.statusCode + ' ' + res.statusMessage);
				}
			)
		);
	}

	public postJson(url: string, json: object): Promise<object> {
		return new Promise((resolve, reject) =>
			request(
				{
					url,
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					json
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

const httpUtil = new HttpUtil();
export default httpUtil;
