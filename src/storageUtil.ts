import { Aws } from 'aws-cli-js';
import util from './util';
const Storage = require('@google-cloud/storage');

class StorageUtil {
	public async getAWSKey() {
		const aws = new Aws();
		return aws.command(
			'ssm get-parameter --name price-feed-private --region ap-southeast-1 --with-decryption'
		);
	}

	public async getAZUREKey() {
		const baseUrl =
			'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net';

		const response: any = await util.get(baseUrl, { Metadata: 'true' });
		const responseJson = JSON.parse(response);
		const savedAccessToken = 'Bearer ' + responseJson.access_token;
		const url =
			'https://price-dev-test.vault.azure.net/secrets/price-feed-private?api-version=2016-10-01';
		const bodyKey: any = await util.get(url, { Authorization: savedAccessToken });

		const responseKeyJson = JSON.parse(bodyKey);
		// console.log('Private Key: ' + responseKeyJson.value);
		return responseKeyJson.value;
	}

	public async getGoogleKey(): Promise<any> {
		const storage = new Storage({
			projectId: 'duo-network'
		});

		const bucketName = 'eth-test';
		return new Promise((resolve, reject) => {
			storage
				.bucket(bucketName)
				.file('testkey.txt')
				.download()
				.then(data => resolve(data.toString('utf-8')))
				.catch(err => reject(err));
		});
	}
}

const storageUtil = new StorageUtil();
export default storageUtil;
