import { Aws } from 'aws-cli-js';
import { IKey, IOption, ISqlAuth } from './types';
import util from './util';
const Storage = require('@google-cloud/storage');
const fs = require('fs');

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
	public async getKey(option: IOption): Promise<IKey> {
		if (!option.live && !option.server) {
			const key = option.azure
				? JSON.parse(fs.readFileSync('./keys/kovan/pfAzure.json'))
				: option.gcp
					? JSON.parse(fs.readFileSync('./keys/kovan/pfGcp.json'))
					: JSON.parse(fs.readFileSync('./keys/kovan/pfAws.json'));
			return {
				publicKey: key.publicKey,
				privateKey: key.privateKey
			};
		} else {
			let key;
			if (option.aws) {
				const keyData = await this.getAWSkey('price-feed-private');
				key = JSON.parse(keyData.object.Parameter.Value);
			}
			if (option.azure) {
				const keyData = await this.getAZUREkey('price-feed-private');
				key = JSON.parse(keyData);
			}
			if (option.gcp) {
				const keyData = await this.getGCPkey('price-feed-private');
				key = JSON.parse(keyData);
			}
			return {
				publicKey: key['publicKey'],
				privateKey: key['privateKey']
			};
		}
	}

	public async getSqlAuth(option: IOption): Promise<ISqlAuth> {
		let key;
		if (!option.live && !option.server) {
			const mysqlAuthFile = JSON.parse(fs.readFileSync('./keys/mysql.json'));
			return {
				host: mysqlAuthFile.host,
				user: mysqlAuthFile.user,
				password: mysqlAuthFile.password
			};
		} else {
			if (option.aws) {
				const keyData = await this.getAWSkey('MySQL_DB_Dev');
				key = JSON.parse(keyData.object.Parameter.Value);
			} else if (option.azure) {
				const keyData = await this.getAZUREkey('MySQL_DB_Dev');
				key = JSON.parse(keyData);
			} else {
				const keyData = await this.getGCPkey('MySQL_DB_Dev');
				key = JSON.parse(keyData);
			}
			return {
				host: key['host'],
				user: key['user'],
				password: key['password']
			};
		}
	}
}

const storageUtil = new StorageUtil();
export default storageUtil;
