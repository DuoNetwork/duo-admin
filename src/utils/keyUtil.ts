import { Storage } from '@google-cloud/storage';
import { Aws } from 'aws-cli-js';
import * as CST from '../common/constants';
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

	public async getAzureKey(name: string, live: boolean): Promise<string> {
		const baseUrl = CST.KEY_AZURE_BASE_URL;

		const response: any = await httpUtil.get(baseUrl, { Metadata: 'true' });
		const responseJson = JSON.parse(response);
		const savedAccessToken = 'Bearer ' + responseJson.access_token;
		const url = live
			? `${CST.KEY_AZURE_URL_LIVE}${name}${CST.KEY_AZURE_API_VERSION}`
			: `${CST.KEY_AZURE_URL_DEV}${name}${CST.KEY_AZURE_API_VERSION}`;
		const bodyKey: any = await httpUtil.get(url, { Authorization: savedAccessToken });

		const responseKeyJson = JSON.parse(bodyKey);
		return responseKeyJson.value;
	}

	public async getGcpKey(name: string, live: boolean): Promise<string> {
		const storage = new Storage({
			projectId: live ? CST.KEY_GCP_PROJECT_ID_LIVE : CST.KEY_GCP_PROJECT_ID_DEV
		});

		const bucketName = live ? CST.KEY_GCP_BUKKET_NAME_LIVE : CST.KEY_GCP_BUKKET_NAME_DEV;
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
			if (option.aws)
				key = JSON.parse(
					await this.getAwsKey(
						option.live ? CST.KEY_ETH_NAME_LIVE : CST.KEY_ETH_NAME_DEV
					)
				)[tool];
			else if (option.azure)
				key = JSON.parse(
					await this.getAzureKey(
						option.live ? CST.KEY_ETH_NAME_LIVE : CST.KEY_ETH_NAME_DEV,
						option.live
					)
				)[tool];
			else if (option.gcp)
				key = JSON.parse(
					await this.getGcpKey(
						option.live ? CST.KEY_ETH_NAME_LIVE : CST.KEY_ETH_NAME_DEV,
						option.live
					)
				)[tool];

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
			if (option.aws)
				key = JSON.parse(
					await this.getAwsKey(
						option.live ? CST.KEY_SQL_NAME_LIVE : CST.KEY_SQL_NAME_DEV
					)
				);
			else if (option.azure)
				key = JSON.parse(
					await this.getAzureKey(
						option.live ? CST.KEY_SQL_NAME_LIVE : CST.KEY_SQL_NAME_DEV,
						option.live
					)
				);
			else if (option.gcp)
				key = JSON.parse(
					await this.getGcpKey(
						option.live ? CST.KEY_SQL_NAME_LIVE : CST.KEY_SQL_NAME_DEV,
						option.live
					)
				);

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
