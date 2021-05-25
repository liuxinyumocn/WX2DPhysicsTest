/**
 *  作者： Nebula Liu
 *  仓库地址： https://github.com/liuxinyumocn/WX2DPhysicsTest
 * 
*/
import * as PIXI from '../pixi/pixi'
const systemInfo = wx.getSystemInfoSync();
let Box2D;
export default class Main{

    constructor(box2d){
        // console.log(wx.getBox2D())
        Box2D = box2d;

        //帧数计数器
        this.fp_ = 0;
        this.fps_lasttimestamp =  new Date().getTime();

        //初始化渲染
        this.init();
        //初始化物理引擎
        this.initPhysics();
        //循环生产小球到场景中
        this.genBallsAndCubes();
        //动画驱动
        this.animate();
        this.fps_record();
    }

    fps_record(){
        let now = new Date().getTime();
        let d = now - this.fps_lasttimestamp;
        let fps = this.fp_ / d *1000;

        window.global_var.fps = parseInt(fps);

        this.fp_ = 0;
        this.fps_lasttimestamp = now;

        setTimeout(this.fps_record.bind(this),1000);
    }

    init(){
        let type = "WebGL"
        if(!PIXI.utils.isWebGLSupported()){
          type = "canvas"
        }
        PIXI.utils.sayHello(type)
        let app = new PIXI.Application({
            width: systemInfo.windowWidth, 
            height: systemInfo.windowHeight,
            view:canvas    
        });
        this.app = app;
        app.renderer.backgroundColor = 0xefefef; //设置背景颜色
        this._balls = []; //小球对象
        this._cubes = []; //小方块对象
        this.lasttimestamp = new Date().getTime();
    }

    /**
     *  初始化物理系统
    */
    initPhysics(){
        this.world = new Box2D.b2World(
            new Box2D.b2Vec2(0,-10),
            true,        //doSleep
        );
        //创建三个地面
        {
            //下面
            let groundBodyDef = new Box2D.b2BodyDef();
            groundBodyDef.position.Set(systemInfo.windowWidth,-1*systemInfo.windowHeight * 2);
            let groundBody = this.world.CreateBody(groundBodyDef);
            let groundBox = new Box2D.b2PolygonShape();
            groundBox.SetAsBox(systemInfo.windowWidth,10.0);
            let groundFixtureDef = new Box2D.b2FixtureDef();
            groundFixtureDef.set_shape(groundBox);
            groundBody.CreateFixture(groundFixtureDef);
        }
        {
            //左面
            let groundBodyDef = new Box2D.b2BodyDef();
            groundBodyDef.position.Set(0,-1*systemInfo.windowHeight);
            let groundBody = this.world.CreateBody(groundBodyDef);
            let groundBox = new Box2D.b2PolygonShape();
            groundBox.SetAsBox(10,systemInfo.windowHeight);
            let groundFixtureDef = new Box2D.b2FixtureDef();
            groundFixtureDef.set_shape(groundBox);
            groundBody.CreateFixture(groundFixtureDef);
        }
        {
            //右面
            let groundBodyDef = new Box2D.b2BodyDef();
            groundBodyDef.position.Set(systemInfo.windowWidth*2,-1*systemInfo.windowHeight);
            let groundBody = this.world.CreateBody(groundBodyDef);
            let groundBox = new Box2D.b2PolygonShape();
            groundBox.SetAsBox(10,systemInfo.windowHeight);
            let groundFixtureDef = new Box2D.b2FixtureDef();
            groundFixtureDef.set_shape(groundBox);
            groundBody.CreateFixture(groundFixtureDef);
        }
        
    }

    drawCircle(x,y,r){
        let circle = new PIXI.Graphics();
        circle.beginFill(0x9966FF);
        circle.drawCircle(0, 0, r);
        circle.endFill();
        circle.x = x;
        circle.y = y;
        this.app.stage.addChild(circle);
        return circle;
    }

    drawRect(x,y,w,h){
        let rectangle = new PIXI.Graphics();
        rectangle.beginFill(0x66CCFF);
        rectangle.drawRect(-w/2, -h/2, w, h);
        rectangle.endFill();
        rectangle.x = x;
        rectangle.y = y;
        this.app.stage.addChild(rectangle);
        return rectangle;
    }

    genPhyRect(x,y,w,h){
        //创建动态物体
        let bodyDef = new Box2D.b2BodyDef();
        bodyDef.set_type( 2 );
        bodyDef.position.Set(x,y);
        let body = this.world.CreateBody(bodyDef);
        //设置重量
        let mass = new Box2D.b2MassData();
        mass.mass = 3;
        body.SetMassData(mass);
        let dynamicBox = new Box2D.b2PolygonShape();
        dynamicBox.SetAsBox(w,h);
        let obFixtureDef = new Box2D.b2FixtureDef();
        obFixtureDef.set_shape(dynamicBox);
        obFixtureDef.set_density(2.5)
        obFixtureDef.set_restitution(0.9);
        obFixtureDef.set_friction(0.6)
        body.CreateFixture(obFixtureDef);
        return body;
    }

    genPhyCircle(x,y,r){
        //创建动态物体
        let bodyDef = new Box2D.b2BodyDef();
        bodyDef.set_type( 2 );
        bodyDef.position.Set(x,y);
        let body = this.world.CreateBody(bodyDef);
        //设置重量
        let mass = new Box2D.b2MassData();
        mass.mass = 3;
        body.SetMassData(mass);
        let dynamicBox = new Box2D.b2CircleShape();
        dynamicBox.set_m_radius(r/2);
        let obFixtureDef = new Box2D.b2FixtureDef();
        obFixtureDef.set_shape(dynamicBox);
        obFixtureDef.set_density(2.5)
        obFixtureDef.set_restitution(0.9);
        obFixtureDef.set_friction(0.6)
        body.CreateFixture(obFixtureDef);
        return body;
    }

    /**
     *  随机生成小球与方块
    */
   genBallsAndCubes(){
       let ball = Math.random() > 0.5 ? true : false;
        if(this._balls.length + this._cubes.length < 802){
            if(ball){
                let x = Math.random() * systemInfo.windowWidth + systemInfo.windowWidth / 2;
                let r = 2 + 10 * Math.random();
                this.genBall(x,0,r)
            }else{
                let x = Math.random() * systemInfo.windowWidth + systemInfo.windowWidth / 2;
                let w = 2 + 10 * Math.random();
                let h = 2 + 10 * Math.random();
                this.genCube(x,0,w*2,h*2)
            }
            setTimeout( this.genBallsAndCubes.bind(this) , 100);
        }else{
            window.global_var.print();
            return;
        }
    }

    genBall(x = 0 ,y = 0,r = 2){
        window.global_var.num = this._balls.length + this._cubes.length;
        //生成一个绘图句柄
        let ob = this.drawCircle(x,y,r);
        //生成一个物理句柄
        let body = this.genPhyCircle(x,y,r*4);
        this._balls.push([
            ob,
            body
        ])
    }

    genCube(x = 0 ,y = 0,w = 2,h = 2){
        window.global_var.num = this._balls.length + this._cubes.length;
        //生成一个绘图句柄
        let ob = this.drawRect(x,y,w,h);
        //生成一个物理句柄
        let body = this.genPhyRect(x,y,w,h);
        this._cubes.push([
            ob,
            body
        ])
    }

    animate(){
        this.fp_++;
        let deltaTime = 1.0 / 60;
        this.updatePhysics(deltaTime * 4);
        // setTimeout(
        //     this.animate.bind(this)
        // ,deltaTime)
        requestAnimationFrame(this.animate.bind(this))
    }

    updatePhysics(delta){
        let start = new Date().getTime();
        this.world.Step( delta , 6 , 2);

        let end = new Date().getTime();
        let d = end - start;
        window.global_var.push(d);

        this.world.ClearForces();
        for(let i in this._balls){
            let ball = this._balls[i];
            let pos = ball[1].GetPosition();
            ball[0].x = pos.x / 2;
            ball[0].y = pos.y / -2; 
        }
        for(let i in this._cubes){
            let cube = this._cubes[i];
            let pos = cube[1].GetPosition();
            let rotation = cube[1].GetAngle();
            cube[0].x = pos.x / 2;
            cube[0].y = pos.y / -2; 
            cube[0].rotation = rotation;
            
        }
    }
    
}