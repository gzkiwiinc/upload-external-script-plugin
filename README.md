# upload-external-script-plugin
A webpack plugin for upload external script to Ali-oss

### Usage

某些 `node_modules` 中的依赖，你想要通过配置 [Webpack external](https://webpack.js.org/configuration/externals/) 不参与编译，并且要把这些依赖维护在 Ali-oss 上面，通过 script 或 link 标签去加载，之前你可能手动将这些依赖上传到 Ali-oss 上，而且也不清楚 Ali-oss 上的依赖的版本是多少， upload-external-script-plugin 就是来帮你解决这个问题的

我们拿 react 来举例，因为 react 提供了 script 的引入方式，因此我们配置 externals 让其不参与编译

```js
module.exports = {
    ...,
    externals: {
        "react": "React",
    }
}
```

使用 HtmlWebpackTagsPlugin 来将 script 动态写入到 index.html 中

```js

const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin")

// react 的版本
const reactVersion = require(path.resolve(
	__dirname,
	"..",
	"node_modules/react/package.json"
)).version

module.exports = {
    ...,
    externals: {
        "react": "React",
    },
    plugins: [
        ...,
        new HtmlWebpackTagsPlugin({
            scripts: [
                `react/${reactVersion}/react.production.min.js`,
            ],
            publicPath: 'Your ali-oss access url'
        })
    ]
}
```

接下来，一种方式是手动将 `node_modules/react/umd` 文件夹上传到 Ali-oss 对应目录下；另一中方式就是使用 upload-external-script-plugin 来做

```js
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin")
const UploadExternalScriptPlugin =
	require("upload-external-script-plugin").default

// react 的版本
const reactVersion = require(path.resolve(
	__dirname,
	"..",
	"node_modules/react/package.json"
)).version

module.exports = {
    ...,
    externals: {
        "react": "React",
    },
    plugins: [
        ...,
        new HtmlWebpackTagsPlugin({
            scripts: [
                `umd/${reactVersion}/react.production.min.js`,
            ],
            publicPath: 'Your ali-oss access url'
        }),
        new UploadExternalScriptPlugin({
            dist: path.resolve(__dirname, "..","node_modules/react/"),
            libs: [
                {
                    name: 'umd',
                    version: cesiumVersion
                }
            ]
        })
    ]
}
```

解释一下参数的意义：
* **dist** 代表本地lib的公共路径
* **libs** 代表在公共路径下所要上传文件夹的名称

**注意**：如果要上传 node_modules 中多个lib，需要配合 copy-webpack-plugin 先将这些 lib 从 node_modules 中拷贝到一个公共路径（也就是 dist），此时再配合 upload-external-script-plugin 就可以了

```js
const HtmlWebpackTagsPlugin = require("html-webpack-tags-plugin")
const UploadExternalScriptPlugin =
	require("upload-external-script-plugin").default
const CopyWebpackPlugin = require("copy-webpack-plugin")

// react 的版本
const reactVersion = require(path.resolve(
	__dirname,
	"..",
	"node_modules/react/package.json"
)).version

// react-dom 的版本
const reactDomVersion = require(path.resolve(
	__dirname,
	"..",
	"node_modules/react-dom/package.json"
)).version

module.exports = {
    ...,
    externals: {
        "react": "React",
        "react-dom": "ReactDOM",
    },
    plugins: [
        ...,
        new HtmlWebpackTagsPlugin({
            scripts: [
                `react/${reactVersion}/react.production.min.js`,
                `react-dom/${reactDomVersion}/react-dom.production.min.js`,
            ],
            publicPath: 'Your ali-oss access url'
        }),
        new CopyWebpackPlugin({
            patterns: [
				{
					from: path.resolve(
						__dirname,
						"..",
						"node_modules/react/umd/"
					),
					to: "react",
				},
                {
					from: path.resolve(
						__dirname,
						"..",
						"node_modules/react-dom/umd/"
					),
					to: "react-dom",
				},
            ]
        })
        new UploadExternalScriptPlugin({
            dist: path.resolve(__dirname, "..","dist"),
            libs: [
                {
                    name: 'react',
                    version: reactVersion
                },
                {
                    name: 'react-dom',
                    version: reactDomVersion
                }
            ]
        })
    ]
}
```