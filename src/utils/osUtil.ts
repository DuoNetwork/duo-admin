import * as os from 'os';

class OsUtil {
	public getHostName() {
		return os.hostname();
	}

	public isWindows() {
		return process.platform === 'win32';
	}
}

const osUtil = new OsUtil();
export default osUtil;
