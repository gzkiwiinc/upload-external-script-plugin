import { Compiler } from 'webpack';
import rp  from 'request-promise';
import OSS from 'ali-oss';
import fs from 'fs';
import crypto from 'crypto';
import path from 'path';
import chalk from 'chalk';
import rimraf from 'rimraf';

const BUCKET_NAME = 'mesh-static';
const MESH_SERVER_HOST = 'https://meshkit.cn';

interface IOption
{
    /**
     * 输出文件路径
     */
    dist: string;
    /**
     * 
     */
    libs: ILib[];
}

interface ILib
{
    name: string;
    version: string;
}

export default class UploadExternalScriptPlugin
{
    option: IOption; // plugin option
    client: OSS; // ali-oss client

    constructor(option: IOption)
    {
        this.option = option
    }

    apply(compiler: Compiler)
    {
        compiler.hooks.afterEmit.tapPromise('UploadExternalScriptPlugin', async () =>
        {
            console.log(chalk.blue('[UploadExternalScriptPlugin]'), 'was started\n')
            const { dist, libs } = this.option
            if (!dist) throw new Error('The parameter dist needs to be provided')
            if (!libs || !libs.length) throw new Error('The parameter libs needs to be provided')
            for (const lib of libs)
            {
                await this.uploadLib(dist, lib)
            }
        })
    }

    async uploadLib(dist: string, lib: ILib)
    {
        const localPath = path.resolve(dist, lib.name)
        const filePaths = findAllFileInPath(localPath)

        const ossPath = `/static/${lib.name}/${lib.version}`
        const objs = await this.listFiles(ossPath);

        if (!filePaths.length) throw new Error(`No found ${lib.name} in ${dist}`)

        if (Array.isArray(objs) && objs.length && objs.length === filePaths.length)
        {
            console.log(chalk.yellow(`${path}`), 'has already exists on oss\n')
            rimraf.sync(localPath)
            return
        }

        for (const filePath of filePaths)
        {
            await this.uploadFile(filePath.replace(localPath, `/static/${lib.name}/${lib.version}`), filePath)
        }

        console.log(chalk.green(`${lib.name}/${lib.version}`), 'has uploaded on oss\n')

        rimraf.sync(localPath)
    }

    async initClient()
    {
        if (!this.client)
        {
            const { region, accessKeyId, accessKeySecret, securityToken } = await requestOSSData();
            this.client = new OSS({
				region: region,
				accessKeyId: accessKeyId,
				accessKeySecret: accessKeySecret,
				bucket: BUCKET_NAME,
				stsToken: securityToken,
                timeout: 60 * 10 * 1000,
                refreshSTSToken: async () => {
                    const { accessKeyId, accessKeySecret, securityToken } = await requestOSSData();
                    return {
                        accessKeyId, accessKeySecret, stsToken: securityToken
                    }
                },
                refreshSTSTokenInterval: 50 * 60 * 1000 // 后端的过期时间是60分钟，这里设置为50分钟
			});
        }
    }

    /**
     * Upload a file to OSS
     * @param name - name of this file on OSS CDN bucket
     * @param path - file path locally
     * @param progress - the progress callback
     */
    async uploadFile(name: string, path: string, progress?: (percentage: number) => void)
    {
        try
        {
            await this.initClient();

            const res = await this.client.multipartUpload(name, path, { progress });

            return res
        }
        catch(err)
        {
            console.log("ERROR when performing multipart upload", err);
            throw err;
        }
    }

    /**
	 * List files on OSS bucket, with prefix if provided
	 * npm: https://www.npmjs.com/package/ali-oss#listquery-options
	 * tutorial: https://help.aliyun.com/document_detail/111389.html?spm=a2c4g.11186623.6.1174.1aa336d4rCx5xa
	 * @param {string} prefix - (optional) prefix of files to list
	 *
	 * @return
	 */
	async listFiles(prefix: string)
	{

		await this.initClient();

		let list: OSS.ObjectMeta[] = []
		let result: OSS.ListObjectResult;
        //max-keys: max objects, default is 100, limit to 1000
		const listOptions = { prefix, ["max-keys"]: 1000 }
		do
		{
			result = await this.client.list(listOptions, {});
			if (result.res && result.res.status === 200)
			{
				listOptions["marker"] = result.nextMarker
				list = result.objects ? list.concat(result.objects) : list
			}
			else
			{
				throw new Error("Error happening when listing files from OSS" + result.res.status);
			}
		} while (result.isTruncated)
		return list
	}
}

/**
 * Search all files in path
 * @param _path 
 * @returns 
 */
function findAllFileInPath(_path): string[]
{
	const stat = fs.statSync(_path)
	if (stat.isFile()) {
		return [_path]
	} else if (stat.isDirectory()) {
		const paths = fs.readdirSync(_path)
		return paths.reduce((prev, cur) => {
			const _paths = findAllFileInPath(path.resolve(_path, cur))
			return prev.concat(_paths)
		}, [])
	} else {
		return []
	}
}

function getCustomBase64(data: any)
{
    // 将data对象转换为json字符串
    let dataStr = JSON.stringify(data);
    // 先转为 base64 , 再将字符串中的加号 “+” 换成中划线 “-”，并且将斜杠 “/” 换成下划线 “_”
    dataStr = Buffer.from(dataStr).toString("base64");
    return dataStr.replace(/\+/g, "-").replace(/\//g, "_")
}

function getSign(param: string)
{
    const salt = "iF0DcUu1xNj8IjTBIw02scEaZjCW1n0oYuRpWk9G";
    return crypto.createHmac('sha1', salt).update(param).digest().toString('base64');
}

interface IOSSAuthData
{
    region: string;
    accessKeyId: string;
    accessKeySecret: string;
    securityToken: string;
    // 过期时间 YYYY-MM-DDTHH:mm:ssZ
    expiration: string;
}

async function requestOSSData()
{
    const data = {
        bucket: BUCKET_NAME,
        applyTime: Date.now()
    }
    const param = getCustomBase64(data);
    const sign = getSign(param);

    const postData = { sign, param }
    const requestOptions = {
        method: "POST",
        uri: MESH_SERVER_HOST + "/api/oss/ststoken",
        body: postData,
        json: true
    };

    const response = await rp(requestOptions);

    if (response.code && response.code === 1)
    {
        return response.data as IOSSAuthData;
    }
    console.info('access token response: ', JSON.stringify(response));

    throw new Error("Error response when getting OSS Token");

}