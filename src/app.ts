/// <reference path="./scripts/typings/jquery/jquery.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs-lib.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs.d.ts"/>
/// <reference path="./scripts/typings/createjs/easeljs.d.ts"/>
/// <reference path="./scripts/typings/preloadjs/preloadjs.d.ts"/>
/// <reference path="./scripts/typings/box2d/box2dweb.d.ts" />
/// <reference path="./scripts/typings/kinetic/kinetic.d.ts" />


/// <reference path="./scripts/typings/curvecontrol.ts" />
/// <reference path="./scripts/typings/polygonsubdivision.ts" />

window.addEventListener('load', () => {
    var canvas = <HTMLCanvasElement> document.getElementById('surface');
    var slopePhysics = new SlopePhysics.Main(canvas);

    // set up button events
    //document.getElementById("btnReload").addEventListener("click", slopePhysics.createBall);
    //document.getElementById("btnSettings").addEventListener("click", slopePhysics.settings);
    //document.getElementById("btnDraw").addEventListener("click", slopePhysics.createDrawnSurface);
    //document.getElementById("btnBezier").addEventListener("click", slopePhysics.createBezierSurface);


    //document.getElementById("btnDraw").addEventListener("click", function () {
       //slopePhysics.createSurfaces(true);
   //     (<HTMLInputElement>document.getElementById("line-tolerance-range")).value = "0,0";
   // });


    // set up gravity slider for event
    var gravity = document.getElementById("gravity-range");
    gravity.addEventListener('mouseup', function () {
        slopePhysics.changeGravity(this.value);
    });
})

module SlopePhysics {

    import b2c = Box2D.Common;
    import b2m = Box2D.Common.Math;
    import b2d = Box2D.Dynamics;
    import b2s = Box2D.Collision.Shapes;
    import b2j = Box2D.Dynamics.Joints;


    var canvas: HTMLCanvasElement;
    var stage: createjs.Stage;
    var context: CanvasRenderingContext2D;

    var stageW: number;
    var stageH: number;
    

    export var curveControl: Curves.CurveControl;
    export var subdivisionPoint: PolygonSubdivision.Point
    export var chaikinCurve: PolygonSubdivision.ChaikinCurve;
    export var polylineSimplify: PolygonSubdivision.PolylineSimplify;
    export var bezierCurve: PolygonSubdivision.BezierCurve;

    var lineTolerance: number = 1.0;
    var bodies: any[] = new Array();
    var surfaces: any[] = new Array();
    var surfacePoints: any[] = new Array();


    export var world: Box2D.Dynamics.b2World;
    export var scale: number = 30;
    export var step: number = 20;
   
   
    export class Main {
        public gravity: number = 9.81;
        public canvas: HTMLCanvasElement;
        
        constructor(canvas: HTMLCanvasElement) {
            
            this.canvas = canvas;
            context = canvas.getContext("2d");
            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);
            stage.mouseEnabled = true;
            stageW = canvas.width;
            stageH = canvas.height;
            polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            bezierCurve = new PolygonSubdivision.BezierCurve;

            curveControl = new Curves.CurveControl('container',  stageW, stageH);
    
            world = new b2d.b2World(new b2m.b2Vec2(0, this.gravity * 10), true);
   //         stage.addEventListener('stagemousedown', this.createBall);
            
   
            createjs.Ticker.setFPS(60);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addEventListener('tick', this.tick);

            window.addEventListener("resize", this.onResizeHandler.bind(this), false);
            window.addEventListener("orientationchange", this.onResizeHandler.bind(this), false);

            var lineToleranceSlider = <HTMLInputElement>document.getElementById("line-tolerance-range");
            lineToleranceSlider.addEventListener("mouseup", curveControl.setLineTolerance.bind(this), false);

            //var gravitySlider = <HTMLInputElement>document.getElementById("gravity-range");
            //gravitySlider.addEventListener("mouseup", this.changeGravity.bind(this), false);


            var drawButton = <HTMLInputElement>document.getElementById("btnDraw");
            drawButton.addEventListener("click", this.createDrawnSurface.bind(this), false);

            var bezierButton = <HTMLInputElement>document.getElementById("btnBezier");
            bezierButton.addEventListener("click", this.createBezierSurface.bind(this), false);

            var reloadButton = <HTMLInputElement>document.getElementById("btnReload");
            reloadButton.addEventListener("click", this.createBall.bind(this), false);

      

        }
        public settings(): void {
        }

        public createDrawnSurface(): void {
            console.log("drawing surface");
            this.clearSurfaces();
            this.removeBodies();
            var that = this;
            document.addEventListener("pointEditListener", function () {
                that.clearSurfaces();
                that.clearSurfaces();
                var points = <Array<PolygonSubdivision.Point>> event.detail;
                that.setSurfacePoints(points);
            });

            curveControl.drawLine();
       }        

        public createBezierSurface(): void {
            console.log("bezier surface");
            this.clearSurfaces();
            this.removeBodies();

            var controlPts = new Array<PolygonSubdivision.Point>();
            controlPts[0] = new PolygonSubdivision.Point(10, 200);
            controlPts[1] = new PolygonSubdivision.Point(250, 800);
            controlPts[2] = new PolygonSubdivision.Point(1200, 800);
            controlPts[3] = new PolygonSubdivision.Point(1175, 400);

            var points = curveControl.drawBesizerCurve(controlPts);

            this.setSurfacePoints(points);
        }


        public createFlatSurface(): void {

            // create surface defintion
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = stageW / 2 / scale;
            surfaceDef.position.y = stageH / scale;
            surfaceDef.userData = 'flat-surface';

            // create surface fixture defintion
            var surfaceFixtureDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            var shape: b2s.b2PolygonShape = new b2s.b2PolygonShape();
            var width: number = stageW / scale;
            var height: number = 20 / scale;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;

            var flatSurface = world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
            surfaces.push(flatSurface);

            console.log('surface created, width : ' + width + ', height : ' + height);
        }


        public tick(): void {
            stage.update();
            draw();
            //world.DrawDebugData();
            world.Step(1 / step, 10, 10);
        }

        public changeGravity(value: number): void {
            this.gravity = value * 10;
            world.SetGravity(new b2m.b2Vec2(0, this.gravity));
        }



        //createBall(event: createjs.MouseEvent): void {
        public createBall = (): void => {
            console.log('curve control points = ' + curveControl.getCurvePoints().length);
            //this.removeSurfaces();
            //this.createCurvedSurfaces(curveControl.getCurvePoints());

            //console.log('clicked at ' + event.stageX + ',' + event.stageY);
            this.removeBodies();

            var x: number = 20;
            var y: number = 0;

            var bodyDef = new b2d.b2BodyDef();

            bodyDef.type = b2d.b2Body.b2_dynamicBody;
            bodyDef.position.x = x / scale;
            bodyDef.position.y = y / scale;
            bodyDef.userData = 'ball';

            var fixDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            fixDef.userData = 'ball';
            fixDef.density = 0.5;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.9;
            fixDef.shape = new b2s.b2CircleShape(30 / scale);
            fixDef.userData = 'ball';

            var body = world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);

            //body.SetAwake(true);

            //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());

            //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);

            //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));



            bodies.push(body);
        }

        public setSurfacePoints(points: Array<PolygonSubdivision.Point>): void {

            console.log('creating curved surface with ' + points.length + ' number of points, yeah !');


            // create surface defintion
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.userData = 'curved-surface'

            // create surface fixture defintion
            var surfaceFixtureDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            var shape: b2s.b2PolygonShape = new b2s.b2PolygonShape();

            var ptArray = new Array();
            var x1, y1, x2, y2;

            var curvedSurface = world.CreateBody(surfaceDef);
            var ptOnCurve = points[0];

            x1 = this.p2m(ptOnCurve.x);
            y1 = this.p2m(ptOnCurve.y);


            for (var i = 1; i < points.length; i++) {
                var pt: PolygonSubdivision.Point = points[i];
                x2 = this.p2m(pt.x);
                y2 = this.p2m(pt.y);
                var edgeShape = new b2s.b2PolygonShape();
                edgeShape.SetAsEdge(new b2m.b2Vec2(x1, y1), new b2m.b2Vec2(x2, y2));
                curvedSurface.CreateFixture2(edgeShape);
                x1 = x2;
                y1 = y2;
            }

            surfaces.push(curvedSurface);
        }

        private p2m(x): number {
            return x / scale;
        }

 
        private onResizeHandler(event: Event = null): void {

            this.removeBodies();
            //this.removeSurfaces();

            stage.canvas.width = window.innerWidth;
            stage.canvas.height = window.innerHeight;
            stage.update();

            stageW = window.innerWidth;;
            stageH = window.innerHeight;

            curveControl = new Curves.CurveControl('container', stageW, stageH);
           // this.createSurfaces();
        }

        
        public clearSurfaces = (): void => {
            while (surfaces.length) {
                var surface = surfaces.pop();
                world.DestroyBody(surface);
            }
            stage.update();
        }


        public removeBodies(): void {
            while (bodies.length) {
                var body = bodies.pop();
                world.DestroyBody(body);
            }
            stage.update();
        }
    }

  

    function draw() {

        var canvas = <HTMLCanvasElement> document.getElementById('surface');
        var ctx = canvas.getContext('2d');
        var deletionBuffer = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var node = world.GetBodyList();
        while (node) {
            var body = node;
            node = node.GetNext();
            var position = body.GetPosition();
            // remove body that have floated off screen
            if (position.x < -deletionBuffer || position.x > (canvas.width + 4)) {
                world.DestroyBody(body);
                continue;
            }
            // draw static objects
            if (body.GetType() == b2d.b2Body.b2_staticBody) {
                var userData = body.GetUserData();
                if (userData == 'flat-surface') {
                    var fixture = body.GetFixtureList();
                    while (fixture) {
                        var shape = fixture.GetShape();
                        var shapeType = shape.GetType();
                        fixture = fixture.GetNext();

                        var polygonShape = <b2s.b2PolygonShape> shape;
                        var x = polygonShape.GetVertices()[1].x - polygonShape.GetVertices()[0].x;
                        var y = polygonShape.GetVertices()[2].y - polygonShape.GetVertices()[1].y;
                        var pos = body.GetPosition();

                        ctx.save();
                        ctx.translate(pos.x * scale, pos.y * scale);
                        ctx.translate(-pos.x * scale, -pos.y * scale);

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.strokeRect(((pos.x * scale) - (x * scale / 2)), ((pos.y * scale) - (y * scale / 2)), x * scale, y * scale);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * scale) - (x * scale / 2)), ((pos.y * scale) - (y * scale / 2)), x * scale, y * scale);
                        ctx.restore();
                    }
                } else if (userData == 'curved-surface') {
                    var fixture = body.GetFixtureList();
                    while (fixture) {
                        var shape = fixture.GetShape();
                        fixture = fixture.GetNext();

                        ctx.beginPath();
                        ctx.lineWidth = 0.5;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        var vs = shape.GetVertices();
                        for (var i = 0; i < vs.length; i++) {
                            var x = vs[i].x * scale
                            var y = vs[i].y * scale
                            if (i == 0) {
                                ctx.moveTo(x, y)
                            } else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.stroke();
                    }
                }
                // draw dynamic bodies
            } else if (body.GetType() == b2d.b2Body.b2_dynamicBody) {
                var fixture = body.GetFixtureList();
                while (fixture) {
                    var shape = fixture.GetShape();
                    fixture = fixture.GetNext();
                    var shapeType = shape.GetType();
                    if (shapeType == b2s.b2Shape.e_circleShape) {
                        var position = body.GetPosition();
                        var angle = body.GetAngle() * (180 / Math.PI);
                        var circleShape = <b2s.b2CircleShape> shape;
                        var radius = circleShape.GetRadius();
                        ctx.save();
                        ctx.translate(position.x * scale, position.y * scale);
                        ctx.rotate(angle * (Math.PI / 180));
                        ctx.translate(-position.x * scale, -position.y * scale);
                        ctx.beginPath();
                        ctx.arc(position.x * scale, position.y * scale, radius * scale, 0, 2 * Math.PI, false);
                        ctx.closePath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.stroke();
                        ctx.fill();
                        ctx.restore();
                    }
                }
            }
        }
    }
}