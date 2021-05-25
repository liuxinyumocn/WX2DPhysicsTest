import './lib/weapp-adapter'
import './lib/symbol'
import Box2DJS from './box2d/Box2D_v2.3.1_min'
import Box2DWASM from './box2d/Box2D_v2.3.1_min.wasm';
import JSANDWASM from './js/JSANDWASM';
import NATIVE from './js/Native';
// let jsbox2d = require('./box2d.umd.js');

window.global_var = {
    record : [],
    push:function(timeout){
        //防止数据量过大只对num 每50 周围的帧进行获取
        let n = window.global_var.num + 1;
        if(n % 50 <= 2){
            window.global_var.record.push([
                window.global_var.num,
                timeout,
                window.global_var.fps
            ])
        }
  
    },
    num:0,
    fps:60,
    print:function(){
        wx.setClipboardData({
            data: JSON.stringify(window.global_var.record)
        })
    }
  };

let version = 2;    // 0 js 1 wasm 2 wx.box2d
if(version == 0){
    Box2DJS().then((box2d)=>{
        new JSANDWASM(box2d)
    })
}else if(version == 1){
    window.Box2D.instantiate('box2d/Box2D_v2.3.1_min.wasm.wasm').then(
        (res)=>{
            //box2d wasm 装载完成
            new JSANDWASM(window.Box2D);
        }
    )
}else if(version == 2){
    new NATIVE(wx.getBox2D());
}