import { Compiler } from 'webpack';
import OSS from 'ali-oss';
interface IOption {
    dist: string;
    libs: ILib[];
}
interface ILib {
    name: string;
    version: string;
}
export default class UploadExternalScriptPlugin {
    option: IOption;
    client: OSS;
    constructor(option: IOption);
    apply(compiler: Compiler): void;
    uploadLib(dist: string, lib: ILib): Promise<void>;
    initClient(): Promise<void>;
    uploadFile(name: string, path: string, progress?: (percentage: number) => void): Promise<OSS.MultipartUploadResult>;
    listFiles(prefix: string): Promise<OSS.ObjectMeta[]>;
}
export {};
