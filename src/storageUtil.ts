import { Aws } from 'aws-cli-js';
import util from './util';
const Storage = require('@google-cloud/storage');

class StorageUtil {
	public async getAWSkey(name: string) {
		const aws = new Aws();
		return aws.command(
			'ssm get-parameter --name ' + name + ' --region ap-southeast-1 --with-decryption'
		);
	}

	public async getAZUREkey(name: string) {
		const baseUrl =
			'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net';

		const response: any = await util.get(baseUrl, { Metadata: 'true' });
		const responseJson = JSON.parse(response);
		const savedAccessToken = 'Bearer ' + responseJson.access_token;
		const url =
			name === 'price-feed-private'
				? 'https://price-dev-test.vault.azure.net/secrets/price-feed-private?api-version=2016-10-01'
				: 'https://price-dev-test.vault.azure.net/secrets/MySQL-DB-Dev/653497bb15104ba8aa0eccfa4a90b612';
		const bodyKey: any = await util.get(url, { Authorization: savedAccessToken });

		const responseKeyJson = JSON.parse(bodyKey);
		// console.log('Private Key: ' + responseKeyJson.value);
		return responseKeyJson.value;
	}

	public async getGCPkey(name: string): Promise<any> {
		const storage = new Storage({
			projectId: 'duo-network'
		});

		const bucketName = 'eth-test';
		const fileName = name === 'price-feed-private' ? 'testkey.txt' : 'MySQL_DB_Dev.txt';
		return new Promise((resolve, reject) => {
			storage
				.bucket(bucketName)
				.file(fileName)
				.download()
				.then(data => resolve(data.toString('utf-8')))
				.catch(err => reject(err));
		});
	}
}

const storageUtil = new StorageUtil();
export default storageUtil;
