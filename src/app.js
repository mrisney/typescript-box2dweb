/// <reference path="./kinetic/kinetic.d.ts" />
var Curves;
(function (Curves) {
    Curves.controlPointlayer;
    var CurveControl = (function () {
        function CurveControl(containerName, w, h) {
            this.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            Curves.controlPointlayer = new Kinetic.Layer();
        }
        CurveControl.prototype.createControlPoint = function (x, y) {
            var controlPoint = new Kinetic.Circle({
                x: x,
                y: y,
                radius: 10,
                stroke: '#666',
                fill: '#ddd',
                strokeWidth: 2,
                draggable: true
            });

            return controlPoint;
        };
        return CurveControl;
    })();
    Curves.CurveControl = CurveControl;
})(Curves || (Curves = {}));
/// <reference path="./scripts/typings/jquery/jquery.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs-lib.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs.d.ts"/>
/// <reference path="./scripts/typings/createjs/easeljs.d.ts"/>
/// <reference path="./scripts/typings/preloadjs/preloadjs.d.ts"/>
/// <reference path="./scripts/typings/box2d/box2dweb.d.ts" />
/// <reference path="./scripts/typings/kinetic/kinetic.d.ts" />
/// <reference path="./scripts/typings/curvecontrol.ts" />
window.addEventListener('load', function () {
    var canvas = document.getElementById('surface');
    var slopePhysics = new SlopePhysics.Main(canvas);

    // set up button events
    document.getElementById("btnReload").addEventListener("click", slopePhysics.createBall);
    document.getElementById("btnPause").addEventListener("click", slopePhysics.pause);
    document.getElementById("btnSettings").addEventListener("click", slopePhysics.settings);

    // set up gravity slider
    var gravity = document.getElementById("gravity-range");
    gravity.addEventListener('mouseup', function () {
        slopePhysics.changeGravity(this.value);
    });
});

var SlopePhysics;
(function (SlopePhysics) {
    var b2m = Box2D.Common.Math;
    var b2d = Box2D.Dynamics;
    var b2s = Box2D.Collision.Shapes;

    var curves = Curves;

    var canvas;
    var stage;
    var context;

    var stageW;
    var stageH;
    var bodies = new Array();
    var surfaces = new Array();

    SlopePhysics.world;
    SlopePhysics.scale = 30;
    SlopePhysics.step = 20;
    var ControlPoints = (function () {
        function ControlPoints() {
        }
        return ControlPoints;
    })();
    SlopePhysics.ControlPoints = ControlPoints;
    var controlPoints;
    var curveControl;

    var Main = (function () {
        function Main(canvas) {
            var _this = this;
            this.gravity = 9.81;
            //createBall(event: createjs.MouseEvent): void {
            this.createBall = function () {
                //console.log('clicked at ' + event.stageX + ',' + event.stageY);
                _this.removeBodies();

                var x = controlPoints.startPoint.getAttr('x');
                var y = controlPoints.startPoint.getAttr('y');

                var bodyDef = new b2d.b2BodyDef();

                bodyDef.type = b2d.b2Body.b2_dynamicBody;
                bodyDef.position.x = x / SlopePhysics.scale;
                bodyDef.position.y = y / SlopePhysics.scale;
                bodyDef.userData = 'ball';

                var fixDef = new b2d.b2FixtureDef();
                fixDef.userData = 'ball';
                fixDef.density = 0.5;
                fixDef.friction = 0.5;
                fixDef.restitution = 0.9;
                fixDef.shape = new b2s.b2CircleShape(30 / SlopePhysics.scale);
                fixDef.userData = 'ball';

                var body = SlopePhysics.world.CreateBody(bodyDef);
                body.CreateFixture(fixDef);

                //body.SetAwake(true);
                //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());
                //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);
                //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));
                bodies.push(body);
            };
            this.canvas = canvas;
            context = canvas.getContext("2d");
            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);
            stage.mouseEnabled = true;
            stageW = canvas.width;
            stageH = canvas.height;

            curveControl = new curves.CurveControl('container', stageW, stageH);
            controlPoints = new ControlPoints();
            controlPoints.startPoint = curveControl.createControlPoint(10, 0);
            controlPoints.point1 = curveControl.createControlPoint(250, 800);
            controlPoints.point2 = curveControl.createControlPoint(1200, 800);
            controlPoints.endPoint = curveControl.createControlPoint(1175, 400);
            controlPoints.main = this;

            SlopePhysics.world = new b2d.b2World(new b2m.b2Vec2(0, this.gravity * 10), true);
            stage.addEventListener('stagemousedown', this.createBall);
            this.createCurvedSurface();

            //this.createFlatSurface();
            createjs.Ticker.setFPS(60);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addEventListener('tick', this.tick);

            window.addEventListener("resize", this.onResizeHandler.bind(this), false);
            window.addEventListener("orientationchange", this.onResizeHandler.bind(this), false);
        }
        Main.prototype.settings = function () {
            var stage = new Kinetic.Stage({ container: 'container', width: stageW, height: stageH });
            stage.clear();
            var layer = new Kinetic.Layer();

            controlPoints.startPoint.on('dragstart dragmove', function () {
                controlPoints.main.removeSurfaces();
                controlPoints.main.createCurvedSurface();
            });

            controlPoints.point1.on('dragstart dragmove', function () {
                controlPoints.main.removeSurfaces();
                controlPoints.main.createCurvedSurface();
            });

            controlPoints.point2.on('dragstart dragmove', function () {
                controlPoints.main.removeSurfaces();
                controlPoints.main.createCurvedSurface();
            });

            controlPoints.endPoint.on('dragstart dragmove', function () {
                controlPoints.main.removeSurfaces();
                controlPoints.main.createCurvedSurface();
            });

            layer.add(controlPoints.startPoint);

            layer.add(controlPoints.point1);
            layer.add(controlPoints.point2);
            layer.add(controlPoints.endPoint);

            // var canvas = new Kinetic.Layer().getCanvas()._canvas;
            //  var circle = new Kinetic.Circle({
            //      x: stage.getWidth() / 2,
            //      y: stage.getHeight() / 2,
            //      radius: 25,
            //      fill: '#666',
            //      stroke: '#ddd',
            //      strokeWidth: 4,
            //      draggable: true
            //  });
            //layer.add(circle);
            stage.add(layer);
            // kineticCurve.createAnchor(10, 10);
            // kineticCurve.drawCurves();
            /// var jsonString = JSON.stringify(kineticCurve);
            // console.log(jsonString);
        };

        Main.prototype.pause = function () {
            if (SlopePhysics.step == 0) {
                SlopePhysics.step = 20;
            } else {
                SlopePhysics.step = 0;
            }
        };

        Main.prototype.reluanch = function () {
            alert('reload clicked');
        };

        Main.prototype.createCurvedSurface = function () {
            console.log('creating curved surface');

            // create surface defintion
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.userData = 'curved-surface';

            // create surface fixture defintion
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            var shape = new b2s.b2PolygonShape();

            var ptArray = new Array();
            var x1, y1, x2, y2;

            var curvedSurface = SlopePhysics.world.CreateBody(surfaceDef);

            var ptOnCurve = this.getCubicBezierXYatT(controlPoints.startPoint, controlPoints.point1, controlPoints.point2, controlPoints.endPoint, 0);

            x1 = this.p2m(ptOnCurve.x);
            y1 = this.p2m(ptOnCurve.y);
            for (var i = 0; i < 1.00; i += 0.01) {
                ptOnCurve = this.getCubicBezierXYatT(controlPoints.startPoint, controlPoints.point1, controlPoints.point2, controlPoints.endPoint, i);
                x2 = this.p2m(ptOnCurve.x);
                y2 = this.p2m(ptOnCurve.y);
                var edgeShape = new b2s.b2PolygonShape();
                edgeShape.SetAsEdge(new b2m.b2Vec2(x1, y1), new b2m.b2Vec2(x2, y2));
                curvedSurface.CreateFixture2(edgeShape);
                x1 = x2;
                y1 = y2;
            }

            surfaces.push(curvedSurface);
        };

        Main.prototype.createFlatSurface = function () {
            // create surface defintion
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = stageW / 2 / SlopePhysics.scale;
            surfaceDef.position.y = stageH / SlopePhysics.scale;
            surfaceDef.userData = 'flat-surface';

            // create surface fixture defintion
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            var shape = new b2s.b2PolygonShape();
            var width = stageW / SlopePhysics.scale;
            var height = 20 / SlopePhysics.scale;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;

            var flatSurface = SlopePhysics.world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
            surfaces.push(flatSurface);

            console.log('surface created, width : ' + width + ', height : ' + height);
        };

        Main.prototype.tick = function () {
            stage.update();
            draw();

            //world.DrawDebugData();
            SlopePhysics.world.Step(1 / SlopePhysics.step, 10, 10);
        };

        Main.prototype.changeGravity = function (value) {
            this.gravity = value * 10;
            SlopePhysics.world.SetGravity(new b2m.b2Vec2(0, this.gravity));
        };

        Main.prototype.p2m = function (x) {
            return x / SlopePhysics.scale;
        };

        Main.prototype.getCubicBezierXYatT = function (startPt, controlPt1, controlPt2, endPt, T) {
            var x = this.CubicN(T, startPt.attrs.x, controlPt1.attrs.x, controlPt2.attrs.x, endPt.attrs.x);
            var y = this.CubicN(T, startPt.attrs.y, controlPt1.attrs.y, controlPt2.attrs.y, endPt.attrs.y);

            return ({ x: x, y: y });
        };

        Main.prototype.CubicN = function (T, a, b, c, d) {
            var t2 = T * T;
            var t3 = t2 * T;

            return a + (-a * 3 + T * (3 * a - a * T)) * T + (3 * b + T * (-6 * b + b * 3 * T)) * T + (c * 3 - c * 3 * T) * t2 + d * t3;
        };

        Main.prototype.onResizeHandler = function (event) {
            if (typeof event === "undefined") { event = null; }
            this.removeBodies();
            this.removeSurfaces();

            stage.canvas.width = window.innerWidth;
            stage.canvas.height = window.innerHeight;
            stage.update();

            stageW = window.innerWidth;
            ;
            stageH = window.innerHeight;
            this.createCurvedSurface();
            //this.createFlatSurface();
        };

        Main.prototype.removeSurfaces = function () {
            while (surfaces.length) {
                var surface = surfaces.pop();
                SlopePhysics.world.DestroyBody(surface);
            }
            stage.update();
        };

        Main.prototype.removeBodies = function () {
            while (bodies.length) {
                var body = bodies.pop();
                SlopePhysics.world.DestroyBody(body);
            }
            stage.update();
        };
        return Main;
    })();
    SlopePhysics.Main = Main;

    function draw() {
        var canvas = document.getElementById('surface');
        var ctx = canvas.getContext('2d');
        var deletionBuffer = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var node = SlopePhysics.world.GetBodyList();
        while (node) {
            var body = node;
            node = node.GetNext();
            var position = body.GetPosition();

            // remove body that have floated off screen
            if (position.x < -deletionBuffer || position.x > (canvas.width + 4)) {
                SlopePhysics.world.DestroyBody(body);
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

                        var polygonShape = shape;
                        var x = polygonShape.GetVertices()[1].x - polygonShape.GetVertices()[0].x;
                        var y = polygonShape.GetVertices()[2].y - polygonShape.GetVertices()[1].y;
                        var pos = body.GetPosition();

                        ctx.save();
                        ctx.translate(pos.x * SlopePhysics.scale, pos.y * SlopePhysics.scale);
                        ctx.translate(-pos.x * SlopePhysics.scale, -pos.y * SlopePhysics.scale);

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.strokeRect(((pos.x * SlopePhysics.scale) - (x * SlopePhysics.scale / 2)), ((pos.y * SlopePhysics.scale) - (y * SlopePhysics.scale / 2)), x * SlopePhysics.scale, y * SlopePhysics.scale);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * SlopePhysics.scale) - (x * SlopePhysics.scale / 2)), ((pos.y * SlopePhysics.scale) - (y * SlopePhysics.scale / 2)), x * SlopePhysics.scale, y * SlopePhysics.scale);
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
                            var x = vs[i].x * SlopePhysics.scale;
                            var y = vs[i].y * SlopePhysics.scale;
                            if (i == 0) {
                                ctx.moveTo(x, y);
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
                        var circleShape = shape;
                        var radius = circleShape.GetRadius();
                        ctx.save();
                        ctx.translate(position.x * SlopePhysics.scale, position.y * SlopePhysics.scale);
                        ctx.rotate(angle * (Math.PI / 180));
                        ctx.translate(-position.x * SlopePhysics.scale, -position.y * SlopePhysics.scale);
                        ctx.beginPath();
                        ctx.arc(position.x * SlopePhysics.scale, position.y * SlopePhysics.scale, radius * SlopePhysics.scale, 0, 2 * Math.PI, false);
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
})(SlopePhysics || (SlopePhysics = {}));
//# sourceMappingURL=app.js.map
