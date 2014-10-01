/// <reference path="./scripts/typings/jquery/jquery.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs-lib.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs.d.ts"/>
/// <reference path="./scripts/typings/createjs/easeljs.d.ts"/>
/// <reference path="./scripts/typings/preloadjs/preloadjs.d.ts"/>
/// <reference path="./scripts/typings/box2d/box2dweb.d.ts" />
/// <reference path="./scripts/typings/kinetic/kinetic.d.ts" />
/// <reference path="./scripts/typings/curvecontrol.ts" />


window.addEventListener('load', () => {
    var canvas = <HTMLCanvasElement> document.getElementById('surface');
    var main = new project.Main(canvas);

    // set up button events
    document.getElementById("btnReload").addEventListener("click", main.createBall);
    document.getElementById("btnPause").addEventListener("click", main.pause);
    document.getElementById("btnSettings").addEventListener("click", main.settings);

    // set up gravity slider
    var gravity = document.getElementById("gravity-range");
    gravity.addEventListener('mouseup', function () {
        main.changeGravity(this.value);
    });

})

module project {

    import b2c = Box2D.Common;
    import b2m = Box2D.Common.Math;
    import b2d = Box2D.Dynamics;
    import b2s = Box2D.Collision.Shapes;
    import b2j = Box2D.Dynamics.Joints;

    import KineticCurve = CurveControl.KineticCurve;

    var canvas: HTMLCanvasElement;
    var stage: createjs.Stage;

    var SCALE: number = 30;
    var bodies: any[] = new Array();
    var surfaces: any[] = new Array();
    export var world: Box2D.Dynamics.b2World;

    export class Main {

        stageW: number;
        stageH: number;
        gravity: number = 9.81;
        pauseStep: boolean = false;

        constructor(canvas: HTMLCanvasElement) {
            canvas = canvas;
            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);
            stage.mouseEnabled = true;
            this.stageW = canvas.width;
            this.stageH = canvas.height;

            world = new b2d.b2World(new b2m.b2Vec2(0, this.gravity * 10), true);
            stage.addEventListener('stagemousedown', this.createBall);
            this.createCurvedSurface();
            //this.createFlatSurface();



            createjs.Ticker.setFPS(60);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addEventListener('tick', this.tick);

            window.addEventListener("resize", this.onResizeHandler.bind(this), false);
            window.addEventListener("orientationchange", this.onResizeHandler.bind(this), false);

        }

        settings(): void {
            var curve = new KineticCurve("test", "test", "test");
            // curve.createAnchor();

            //var rect = new Kinetic.Rect({ width: 10, height: 10, cornerRadius: 5 });

            //alert('settings clicked');
        }

        pause(): void {

            if (this.pauseStep == false) {
                alert('pausing animation');
                this.pauseStep = true;
            } else {
                alert('running animation');
                this.pauseStep = false;
            }
        }

        reluanch(): void {
            alert('reload clicked');

        }


        createCurvedSurface(): void {


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
            var kineticCurve = new KineticCurve("container", this.stageW, this.stageH);
            var bezier = {
                start: kineticCurve.createAnchor(10, 0),
                control1: kineticCurve.createAnchor(250, 800),
                control2: kineticCurve.createAnchor(1200, 800),
                end: kineticCurve.createAnchor(1175, 400)
            };

            var ptOnCurve = this.getCubicBezierXYatT(bezier.start, bezier.control1, bezier.control2, bezier.end, 0);

            x1 = this.p2m(ptOnCurve.x);
            y1 = this.p2m(ptOnCurve.y);
            for (var i = 0; i < 1.00; i += 0.01) {
                ptOnCurve = this.getCubicBezierXYatT(bezier.start, bezier.control1, bezier.control2, bezier.end, i);
                x2 = this.p2m(ptOnCurve.x);
                y2 = this.p2m(ptOnCurve.y);
                var edgeShape = new b2s.b2PolygonShape();
                edgeShape.SetAsEdge(new b2m.b2Vec2(x1, y1), new b2m.b2Vec2(x2, y2));
                curvedSurface.CreateFixture2(edgeShape);
                x1 = x2;
                y1 = y2;
            }

            var debugDraw: b2d.b2DebugDraw = new b2d.b2DebugDraw();


            var canvas = <HTMLCanvasElement> document.getElementById('surface');
            var ctx = canvas.getContext('2d');

            debugDraw.SetSprite(ctx);
            debugDraw.SetDrawScale(SCALE);
            debugDraw.SetFlags(b2d.b2DebugDraw.e_shapeBit | b2d.b2DebugDraw.e_jointBit);
            world.SetDebugDraw(debugDraw);

        }



        createFlatSurface(): void {

            // create surface defintion
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = this.stageW / 2 / SCALE;
            surfaceDef.position.y = this.stageH / SCALE;
            surfaceDef.userData = 'flat-surface';

            // create surface fixture defintion
            var surfaceFixtureDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            var shape: b2s.b2PolygonShape = new b2s.b2PolygonShape();
            var width: number = this.stageW / SCALE;
            var height: number = 20 / SCALE;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;

            var flatSurface = world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
            surfaces.push(flatSurface);

            console.log('surface created, width : ' + width + ', height : ' + height);
        }


        tick(): void {
            stage.update();
            draw();
            //world.DrawDebugData();
            world.Step(1 / 30, 10, 10);
        }

        changeGravity(value: number): void {
            alert('gravity : ' + value);
            this.gravity = value * 10;
            world.SetGravity(new b2m.b2Vec2(0, this.gravity));
        }

        //createBall(event: createjs.MouseEvent): void {
           public createBall = (): void => {

            //console.log('clicked at ' + event.stageX + ',' + event.stageY);
            this.removeBodies();

            var bodyDef = new b2d.b2BodyDef();

            bodyDef.type = b2d.b2Body.b2_dynamicBody;
            bodyDef.position.x = 100 / SCALE;
            bodyDef.position.y = 200 / SCALE;
            bodyDef.userData = 'ball';

            var fixDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            fixDef.userData = 'ball';
            fixDef.density = 0.5;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.9;
            fixDef.shape = new b2s.b2CircleShape(30 / SCALE);
            fixDef.userData = 'ball';

            var body = world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);

            //body.SetAwake(true);

            //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());

            //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);

            //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));



            bodies.push(body);
        }

        private p2m(x): number {
            return x / SCALE;
        }

        private getCubicBezierXYatT(startPt, controlPt1, controlPt2, endPt, T): any {

            var x: number = this.CubicN(T, startPt.attrs.x, controlPt1.attrs.x, controlPt2.attrs.x, endPt.attrs.x);
            var y: number = this.CubicN(T, startPt.attrs.y, controlPt1.attrs.y, controlPt2.attrs.y, endPt.attrs.y);

            return ({ x: x, y: y });
        }

        private CubicN(T: number, a: number, b: number, c: number, d: number): number {

            var t2: number = T * T;
            var t3: number = t2 * T;

            return a + (-a * 3 + T * (3 * a - a * T)) * T
                + (3 * b + T * (-6 * b + b * 3 * T)) * T
                + (c * 3 - c * 3 * T) * t2
                + d * t3;
        }

        private onResizeHandler(event: Event): void {

            this.removeBodies();
            this.removeSurfaces();

            stage.canvas.width = window.innerWidth;
            stage.canvas.height = window.innerHeight;
            stage.update();

            this.stageW = window.innerWidth;;
            this.stageH = window.innerHeight;
            this.createCurvedSurface();
            //this.createFlatSurface();
        }


        private removeSurfaces(): void {
            while (surfaces.length) {
                var surface = surfaces.pop();
                world.DestroyBody(surface);
            }
            stage.update();
        }


        private removeBodies(): void {
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
                        ctx.translate(pos.x * SCALE, pos.y * SCALE);
                        ctx.translate(-pos.x * SCALE, -pos.y * SCALE);

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.strokeRect(((pos.x * SCALE) - (x * SCALE / 2)), ((pos.y * SCALE) - (y * SCALE / 2)), x * SCALE, y * SCALE);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * SCALE) - (x * SCALE / 2)), ((pos.y * SCALE) - (y * SCALE / 2)), x * SCALE, y * SCALE);
                        ctx.restore();
                    }
                } else if (userData == 'curved-surface') {
                    var fixture = body.GetFixtureList();
                    while (fixture) {
                        var shape = fixture.GetShape();
                        fixture = fixture.GetNext();

                        ctx.beginPath();
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        var vs = shape.GetVertices();
                        for (var i = 0; i < vs.length; i++) {
                            var x = vs[i].x * SCALE
                            var y = vs[i].y * SCALE
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
                        ctx.translate(position.x * SCALE, position.y * SCALE);
                        ctx.rotate(angle * (Math.PI / 180));
                        ctx.translate(-position.x * SCALE, -position.y * SCALE);
                        ctx.beginPath();
                        ctx.arc(position.x * SCALE, position.y * SCALE, radius * SCALE, 0, 2 * Math.PI, false);
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