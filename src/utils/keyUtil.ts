import { Storage } from '@google-cloud/storage';
import { Aws } from 'aws-cli-js';
import { IKey, IOption, ISqlAuth } from '../common/types';
import httpUtil from './httpUtil';
import util from './util';

class KeyUtil {
	public async getAwsKey(name: string) {
		const aws = new Aws();
		const keyData = await aws.command(
			'ssm get-parameter --name ' + name + ' --region ap-southeast-1 --with-decryption'
		);

		return keyData.object.Parameter.Value;
	}

	public async getAzureKey(name: string): Promise<string> {
		const baseUrl =
			'http://169.254.169.254/metadata/identity/oauth2/token?api-version=2018-02-01&resource=https%3A%2F%2Fvault.azure.net';

		const response: any = await httpUtil.get(baseUrl, { Metadata: 'true' });
		const responseJson = JSON.parse(response);
		const savedAccessToken = 'Bearer ' + responseJson.access_token;
		const url =
			'https://price-dev-test.vault.azure.net/secrets/' + name + '?api-version=2016-10-01';
		const bodyKey: any = await httpUtil.get(url, { Authorization: savedAccessToken });

		const responseKeyJson = JSON.parse(bodyKey);
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

	public async getKey(tool: string, option: IOption): Promise<IKey> {
		let key = {
			publicKey: '',
			privateKey: ''
		};
		if (!option.live && !option.server) {
			try {
				key = option.azure
					? require('../keys/kovan/pfAzure.json')
					: option.gcp
					? require('../keys/kovan/pfGcp.json')
					: require('../keys/kovan/pfAws.json');
			} catch (error) {
				util.logError(error);
			}
			return {
				publicKey: key.publicKey,
				privateKey: key.privateKey
			};
		} else {
			if (option.aws) key = JSON.parse(await this.getAwsKey('price-feed-private'))[tool];
			else if (option.azure) key = JSON.parse(await this.getAzureKey('price-feed-private'))[tool];
			else if (option.gcp) key = JSON.parse(await this.getGcpKey('price-feed-private'))[tool];

			return {
				publicKey: key.publicKey,
				privateKey: key.privateKey
			};
		}
	}

	public async getSqlAuth(option: IOption): Promise<ISqlAuth> {
		let key = {
			host: '',
			user: '',
			password: ''
		};
		if (!option.live && !option.server) {
			try {
				key = require('../keys/mysql.json');
			} catch (error) {
				util.logError(error);
			}
			return {
				host: key.host,
				user: key.user,
				password: key.password
			};
		} else {
			if (option.aws) key = JSON.parse(await this.getAwsKey('MySQL-DB-Dev'));
			else if (option.azure) key = JSON.parse(await this.getAzureKey('MySQL-DB-Dev'));
			else if (option.gcp) key = JSON.parse(await this.getGcpKey('MySQL-DB-Dev'));

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
