# Tetris App

* 支持平台: JSBox/Browser/Nodejs
* 采用分层架构设计：游戏逻辑层、控制面板层、界面展示层

## 在JSBox上运行
这个工程是一个JSBox原生工程，上传至JSBox可直接运行。

## 在浏览器上运行
需要配合静态http服务器进行运行，推荐使用python自带http服务器：
```shell
# python 3
python -m http.server

# python 2
python -m SimpleHTTPServer
```
控制说明：
* 访问：`http://lcoalhost:8000/browser/view.html`
* `←`和`→`控制左右方向
* `↑`形变
* `↓`长按加速，双击落地
* `p`暂停
* `s`开始

## 在控制台基于nodejs运行
```shell
node terminal/app.js
```
控制说明：
* `←`和`→`控制左右方向
* `↑`形变
* `↓`落地
* `p`暂停
* `s`开始