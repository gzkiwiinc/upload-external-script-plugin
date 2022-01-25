"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
exports.__esModule = true;
var request_promise_1 = __importDefault(require("request-promise"));
var ali_oss_1 = __importDefault(require("ali-oss"));
var fs_1 = __importDefault(require("fs"));
var crypto_1 = __importDefault(require("crypto"));
var path_1 = __importDefault(require("path"));
var chalk_1 = __importDefault(require("chalk"));
var rimraf_1 = __importDefault(require("rimraf"));
var BUCKET_NAME = 'mesh-static';
var MESH_SERVER_HOST = 'https://meshkit.cn';
var UploadExternalScriptPlugin = (function () {
    function UploadExternalScriptPlugin(option) {
        this.option = option;
    }
    UploadExternalScriptPlugin.prototype.apply = function (compiler) {
        var _this = this;
        compiler.hooks.afterEmit.tapPromise('UploadExternalScriptPlugin', function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, dist, libs, _i, libs_1, lib;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log(chalk_1["default"].blue('[UploadExternalScriptPlugin]'), 'was started\n');
                        _a = this.option, dist = _a.dist, libs = _a.libs;
                        if (!dist)
                            throw new Error('The parameter dist needs to be provided');
                        if (!libs || !libs.length)
                            throw new Error('The parameter libs needs to be provided');
                        _i = 0, libs_1 = libs;
                        _b.label = 1;
                    case 1:
                        if (!(_i < libs_1.length)) return [3, 4];
                        lib = libs_1[_i];
                        return [4, this.uploadLib(dist, lib)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3, 1];
                    case 4: return [2];
                }
            });
        }); });
    };
    UploadExternalScriptPlugin.prototype.uploadLib = function (dist, lib) {
        return __awaiter(this, void 0, void 0, function () {
            var localPath, filePaths, ossPath, objs, _i, filePaths_1, filePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        localPath = path_1["default"].resolve(dist, lib.name);
                        filePaths = findAllFileInPath(localPath);
                        ossPath = "/static/".concat(lib.name, "/").concat(lib.version);
                        return [4, this.listFiles(ossPath)];
                    case 1:
                        objs = _a.sent();
                        if (!filePaths.length)
                            throw new Error("No found ".concat(lib.name, " in ").concat(dist));
                        if (Array.isArray(objs) && objs.length && objs.length === filePaths.length) {
                            console.log(chalk_1["default"].yellow("".concat(path_1["default"])), 'has already exists on oss\n');
                            rimraf_1["default"].sync(localPath);
                            return [2];
                        }
                        _i = 0, filePaths_1 = filePaths;
                        _a.label = 2;
                    case 2:
                        if (!(_i < filePaths_1.length)) return [3, 5];
                        filePath = filePaths_1[_i];
                        return [4, this.uploadFile(filePath.replace(localPath, "/static/".concat(lib.name, "/").concat(lib.version)), filePath)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3, 2];
                    case 5:
                        console.log(chalk_1["default"].green("".concat(lib.name, "/").concat(lib.version)), 'has uploaded on oss\n');
                        rimraf_1["default"].sync(localPath);
                        return [2];
                }
            });
        });
    };
    UploadExternalScriptPlugin.prototype.initClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, region, accessKeyId, accessKeySecret, securityToken;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!!this.client) return [3, 2];
                        return [4, requestOSSData()];
                    case 1:
                        _a = _b.sent(), region = _a.region, accessKeyId = _a.accessKeyId, accessKeySecret = _a.accessKeySecret, securityToken = _a.securityToken;
                        this.client = new ali_oss_1["default"]({
                            region: region,
                            accessKeyId: accessKeyId,
                            accessKeySecret: accessKeySecret,
                            bucket: BUCKET_NAME,
                            stsToken: securityToken,
                            timeout: 60 * 10 * 1000,
                            refreshSTSToken: function () { return __awaiter(_this, void 0, void 0, function () {
                                var _a, accessKeyId, accessKeySecret, securityToken;
                                return __generator(this, function (_b) {
                                    switch (_b.label) {
                                        case 0: return [4, requestOSSData()];
                                        case 1:
                                            _a = _b.sent(), accessKeyId = _a.accessKeyId, accessKeySecret = _a.accessKeySecret, securityToken = _a.securityToken;
                                            return [2, {
                                                    accessKeyId: accessKeyId,
                                                    accessKeySecret: accessKeySecret,
                                                    stsToken: securityToken
                                                }];
                                    }
                                });
                            }); },
                            refreshSTSTokenInterval: 50 * 60 * 1000
                        });
                        _b.label = 2;
                    case 2: return [2];
                }
            });
        });
    };
    UploadExternalScriptPlugin.prototype.uploadFile = function (name, path, progress) {
        return __awaiter(this, void 0, void 0, function () {
            var res, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, this.initClient()];
                    case 1:
                        _a.sent();
                        return [4, this.client.multipartUpload(name, path, { progress: progress })];
                    case 2:
                        res = _a.sent();
                        return [2, res];
                    case 3:
                        err_1 = _a.sent();
                        console.log("ERROR when performing multipart upload", err_1);
                        throw err_1;
                    case 4: return [2];
                }
            });
        });
    };
    UploadExternalScriptPlugin.prototype.listFiles = function (prefix) {
        return __awaiter(this, void 0, void 0, function () {
            var list, result, listOptions;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this.initClient()];
                    case 1:
                        _b.sent();
                        list = [];
                        listOptions = (_a = { prefix: prefix }, _a["max-keys"] = 1000, _a);
                        _b.label = 2;
                    case 2: return [4, this.client.list(listOptions, {})];
                    case 3:
                        result = _b.sent();
                        if (result.res && result.res.status === 200) {
                            listOptions["marker"] = result.nextMarker;
                            list = result.objects ? list.concat(result.objects) : list;
                        }
                        else {
                            throw new Error("Error happening when listing files from OSS" + result.res.status);
                        }
                        _b.label = 4;
                    case 4:
                        if (result.isTruncated) return [3, 2];
                        _b.label = 5;
                    case 5: return [2, list];
                }
            });
        });
    };
    return UploadExternalScriptPlugin;
}());
exports["default"] = UploadExternalScriptPlugin;
function findAllFileInPath(_path) {
    var stat = fs_1["default"].statSync(_path);
    if (stat.isFile()) {
        return [_path];
    }
    else if (stat.isDirectory()) {
        var paths = fs_1["default"].readdirSync(_path);
        return paths.reduce(function (prev, cur) {
            var _paths = findAllFileInPath(path_1["default"].resolve(_path, cur));
            return prev.concat(_paths);
        }, []);
    }
    else {
        return [];
    }
}
function getCustomBase64(data) {
    var dataStr = JSON.stringify(data);
    dataStr = Buffer.from(dataStr).toString("base64");
    return dataStr.replace(/\+/g, "-").replace(/\//g, "_");
}
function getSign(param) {
    var salt = "iF0DcUu1xNj8IjTBIw02scEaZjCW1n0oYuRpWk9G";
    return crypto_1["default"].createHmac('sha1', salt).update(param).digest().toString('base64');
}
function requestOSSData() {
    return __awaiter(this, void 0, void 0, function () {
        var data, param, sign, postData, requestOptions, response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    data = {
                        bucket: BUCKET_NAME,
                        applyTime: Date.now()
                    };
                    param = getCustomBase64(data);
                    sign = getSign(param);
                    postData = { sign: sign, param: param };
                    requestOptions = {
                        method: "POST",
                        uri: MESH_SERVER_HOST + "/api/oss/ststoken",
                        body: postData,
                        json: true
                    };
                    return [4, (0, request_promise_1["default"])(requestOptions)];
                case 1:
                    response = _a.sent();
                    if (response.code && response.code === 1) {
                        return [2, response.data];
                    }
                    console.info('access token response: ', JSON.stringify(response));
                    throw new Error("Error response when getting OSS Token");
            }
        });
    });
}
