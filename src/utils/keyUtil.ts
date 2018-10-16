import { Storage } from '@google-cloud/storage';
import { Aws } from 'aws-cli-js';
import { IKey, IOption, ISqlAuth } from '../common/types';
import util from './util';

class KeyUtil {
	public async getAwsKey(name: string) {
		const aws = new Aws();
		return aws.command(
			'ssm get-parameter --name ' + name + ' --region ap-southeast-1 --with-decryption'
		);
	}

	public async getAzureKey(name: string): Promise<string> {
		const baseUrl =
			'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net';

		const response: any = await util.get(baseUrl, { Metadata: 'true' });
		const responseJson = JSON.parse(response);
		const savedAccessToken = 'Bearer ' + responseJson.access_token;
		const url =
			'https://price-dev-test.vault.azure.net/secrets/' + name + '?api-version=2016-10-01';
		const bodyKey: any = await util.get(url, { Authorization: savedAccessToken });

		const responseKeyJson = JSON.parse(bodyKey);
		// console.log('Private Key: ' + responseKeyJson.value);
		return responseKeyJson.value;
	}

	public async getGcpKey(name: string): Promise<string> {
		const storage = new Storage({
			projectId: 'duo-network'
		});

		const bucketName = 'eth-test';
		const fileName = name + '.txt';
		return (storage
			.bucket(bucketName)
			.file(fileName)
			.download() as any).then((data: any) => data.toString());
	}

	public async getKey(option: IOption): Promise<IKey> {
		if (!option.live && !option.server) {
			const key = option.azure
				? require('../keys/kovan/pfAzure.json')
				: option.gcp
					? require('../keys/kovan/pfGcp.json')
					: require('../keys/kovan/pfAws.json');
			return {
				publicKey: key.publicKey,
				privateKey: key.privateKey
			};
		} else {
			let key: { [k: string]: string } = {};
			if (option.aws) {
				const keyData = await this.getAwsKey('price-feed-private');
				key = JSON.parse(keyData.object.Parameter.Value);
			} else if (option.azure) {
				const keyData = await this.getAzureKey('price-feed-private');
				key = JSON.parse(keyData);
			} else if (option.gcp) {
				const keyData = await this.getGcpKey('price-feed-private');
				key = JSON.parse(keyData);
			}
			return {
				publicKey: key['publicKey'],
				privateKey: key['privateKey']
			};
		}
	}

	public async getSqlAuth(option: IOption): Promise<ISqlAuth> {
		if (!option.live && !option.server) {
			const mysqlAuthFile = require('../keys/mysql.json');
			return {
				host: mysqlAuthFile.host,
				user: mysqlAuthFile.user,
				password: mysqlAuthFile.password
			};
		} else {
			let key: { [k: string]: string } = {};
			if (option.aws) {
				const keyData = await this.getAwsKey('MySQL-DB-Dev');
				key = JSON.parse(keyData.object.Parameter.Value);
			} else if (option.azure) {
				const keyData = await this.getAzureKey('MySQL-DB-Dev');
				key = JSON.parse(keyData);
			} else if (option.gcp) {
				const keyData = await this.getGcpKey('MySQL-DB-Dev');
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

const keyUtil = new KeyUtil();
export default keyUtil;
