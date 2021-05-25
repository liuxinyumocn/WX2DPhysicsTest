# 微信小游戏 Box2D性能测试


## 概述

------

本文就 Box2D 在微信小游戏中的对应 JS 版本与 WASM 版本的物理计算效率进行测试统计，以此来为小游戏开发者提供引擎的在不同场景下的效率，并提供了 Box2D WASM 版本的使用方法。



本文的仓库地址为：https://github.com/liuxinyumocn/WX2DPhysicsTest

仓库内已构建好本文的实验测试用例，可自行下载测试。



## 测试用例场景设计

------

以设备屏幕作为容器，从上方逐渐随机产生不定半径的小球或不定尺寸的方块（下文统称物体）自由落体，直至掉落容器底部，观测在不同设备中的渲染帧率（**FPS**）以及不同引擎中物理单步计算耗时(**stepSimulation**)，实验效果如下图所示。

<img src="https://github.com/liuxinyumocn/WX2DPhysicsTest/blob/master/source/IMG_8626.PNG?raw=true" width="200" />

其中我们对场景中的一些物理参数的设定为：

物体属性：

- Density : 2.5
- Restitution : 0.9
- Friction : 0.6
- r : 2 ～ 12 （小球半径）
- w / h : 4 ～ 24（方块宽高）
- Mass : 3

每100ms产生1个自由落体的物体。



## 影响因素分析

------

影响渲染帧率的因素可能大致包括如下几点：

1. 测试设备自身的硬件性能；
2. 场景中物体掉落位置、形状和其尺寸的随机性导致的波动性的物理计算量；
3. 物理引擎的计算效率；
4. 渲染引擎效率对整体的影响。

本文采用 Pixi.js 作为游戏的渲染引擎，将针对 Box2D 物理引擎分别对他们的 JS 和 WASM 版本进行一系列的性能测试（ WASM 仅针对物理引擎，游戏主体仍是 JS ）。



## 实验数据采样方法

------

本文将主要观测2个数据指标来对不同版本客户端效果进行评测，

第一个指标为 FPS（Frames Per Second），指游戏画面每秒的渲染帧数，通常而言游戏画面稳定的 60FPS 及以上则表明该游戏渲染流畅。

第二个指标为物理引擎单步模拟（stepSimulation）耗时，引擎在渲染前需要进行一次场景各个物体的物理属性计算，本文将对每一次计算的前后进行时间戳标记，从而得到每次物理计算的过程中的耗时，场景中的物理随时间推移组件变多且复杂，由此观测各个环境下的物理运算性能。

对于 FPS 采用计数统计的方式进行获取，具体代码为：

```javascript
fps_record(){
	let now = new Date().getTime();
	let d = now - this.fps_lasttimestamp;
	let fps = this.fp_ / d *1000;
	window.global_var.fps = parseInt(fps);		//导入至一个全局的记录器中  ①
	this.fp_ = 0;
	this.fps_lasttimestamp = now;
	setTimeout(this.fps_record.bind(this),1000); //每秒取样
}
```

对于 stepSimulation 的前后时间戳打点的具体代码如下：

```javascript
updatePhysics(delta){
	let start = new Date().getTime();	//起点时间戳
	this.world.Step( delta , 6 , 2);	//物理模拟计算
	let end = new Date().getTime();		//终点时间戳
	let d = end - start;
  
	window.global_var.push(d);				//导入至一个全局的记录器中  ①
	
	//others...
}
```

上述两个① 处代码用于将当前时刻的相关数据进行统一记录，方法是构建一个全局的记录器。

记录器代码样例为：

```JavaScript
window.global_var = {
  record : [],
  push:function(timeout){
    let n = window.global_var.num + 1;
    if(n % 50 <= 2){  //防止数据集过大只对num 每50 周围的帧进行获取，例如当前 num 为49、50、51 时则开始记录
      window.global_var.record.push([
        window.global_var.num,
        timeout
      ])
    }
  },
  num:0,	//当前已经产生物体的数量 由方块生成函数进行赋值修改
  print:function(){
    wx.setClipboardData({		//将记录集复制到设备的粘贴板 ②
      data: JSON.stringify(window.global_var.record)
    })
  }
};
```

② 处负责将记录的结果集进行打印输出，在小游戏环境中将记录的数据**使用微信API** ***wx.setClipboardData({})*** ，设置到移动设备的粘贴板中从而可以复制出来。

注：考虑到在控制台调试模式下会造成性能的额外损耗（尤其在移动设备中），所以 **不采用 *console.log()*** 方式将数据集打印出来。



## 实验结果

------

分别使用Android与iOS设备对上述测试用例进行真机测试。



**测试环境**：

iPhone：iPhone11 Pro Max 版本14.4.2 A13 / 微信 版本 8.0.5 支持库 2.16.1

Android：小米10 版本10 内核4.19.81 骁龙865  / 微信 版本 8.0.3 支持库 2.16.1



**测试项**：

使用 JS 版本、 WASM 版本以及Naive版本（ wx.getBox2D() ） Box2D 的 Demo 在 iPhone11 Pro Max WX、小米10 WX 中进行测试，记录在不同的运行环境中 FPS 值由 60 (＞60 也算 60) 逐渐降低的物体产生数量，同时也以每50个物体为一组，观测一组物体的物理单步计算耗时。

注：Naive版本是微信小游戏支持库自带的 C++ 版 Box2D 引擎，该测试数据可近似为原生游戏下的计算性能，在本报告中作为参照项。该版 Box2D 部分接口与现网较新 Box2D 的版本 API 并非完全兼容。



#### 实验数据

数据列代表产生对应物体时的 “渲染帧率（**FPS**）” 以及对应的 “物理计算时差（**stepSimulation**）”，

例如100物体:  60FPS - 30ms  代表生成100个物体时渲染帧率为 60FPS，物理计算耗时为 30ms（两者为对应时刻附近均值）。

| 设备-运行环境                | 50物体 (FPS - ms) | 100        | 150        | 200            | 400        | 800                |
| ---------------------------- | ----------------- | ---------- | ---------- | -------------- | ---------- | ------------------ |
| iPhone11 Pro Max WX - JS     | 60 - 1            | 60 - 6     | 60 - 9     | <u>51 - 16</u> | 21 - 52    | 6 - 169            |
| iPhone11 Pro Max WX - WASM   | 60 - 1            | 60 - **1** | 60 - **2** | **60 - 3**     | **60 - 7** | **<u>36 - 19</u>** |
| iPhone11 Pro Max WX - Native | 60 - 0            | 60 - 0     | 60 - 0     | 60 - 1         | 60 - 1     | 60 - 2             |
| 小米10 WX - JS               | 60 - 1            | 60 - 1     | 60 - 2     | 60 - 2         | 60 - 5     | 60 - 12            |
| 小米10 WX - WASM             | 60 - 0            | 60 - 1     | 60 - 1     | 60 - 2         | 60 - **3** | 60 - **6**         |
| 小米10 WX - Native           | 60 - 0            | 60 - 0     | 60 - 0     | 60 - 1         | 60 - 1     | 60 - 3             |

注：<u>下划线</u> 代表该机型首次出现低于 60FPS 的位置。**加粗** 指 JS 版本与 WASM 版本在同一机型同一取样点时较优性能高亮指示。在机型支持 90FPS 时本文对大于 60FPS 的渲染均按照 60FPS 记录。



## 结论

------

上述实验中选用目前小米10（1档 Android 机型）与iPhone11 Pro Max（1档 iOS 机型）进行测试，总结如下：

1. 在两种机型下，使用 WASM 版本的物理引擎均有效的提升游戏的渲染性能1～3倍，这是在不需要改变游戏内在结构的情况下，一种快捷有效的性能优化手段，推荐开发者优先使用 WASM 版的物理引擎；
2. iOS 微信小游戏由于没有 JIT ，因此在各个渲染引擎中相比其他环境性能上均稍有逊色，但从 JS 与 WASM 的对照中可知，使用 WASM 版物理引擎可较明显的改善性能的损失。