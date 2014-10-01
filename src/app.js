/// <reference path="./kinetic/kinetic.d.ts" />
var CurveControl;
(function (CurveControl) {
    var KineticCurve = (function () {
        function KineticCurve(stageName, width, height) {
            this.stageName = stageName;
            this.width = width;
            this.height = height;
            this.w = width;
            this.h = height;
            this.stage = new Kinetic.Stage({
                container: stageName,
                width: width,
                height: height
            });
            this.anchorLayer = new Kinetic.Layer();
            this.lineLayer = new Kinetic.Layer();
            this.curveLayer = new Kinetic.Layer();
            this.bezierPts = {
                start: this.createAnchor(10, 0),
                control1: this.createAnchor(250, 800),
                control2: this.createAnchor(1200, 800),
                end: this.createAnchor(1175, 400)
            };

            this.anchorLayer.on('beforeDraw', function () {
                //this.drawKineticCurves();
                //this.updateDottedLines();
            });
        }
        KineticCurve.prototype.createAnchor = function (x, y) {
            var anchor = new Kinetic.Circle({
                x: x,
                y: y,
                radius: 10,
                stroke: '#666',
                fill: '#ddd',
                strokeWidth: 2,
                draggable: true
            });

            anchor.on('mouseover', function () {
                document.body.style.cursor = 'pointer';
                this.setStrokeWidth(4);
                this.anchorLayer.draw();
            });
            anchor.on('mouseout', function () {
                document.body.style.cursor = 'default';
                this.setStrokeWidth(2);
                this.anchorLayer.draw();
            });
            anchor.on('dragend', function () {
                this.drawKineticCurves();
                this.updateDottedLines();
            });
            this.anchorLayer.add(anchor);

            return anchor;
        };

        KineticCurve.prototype.drawKineticCurves = function () {
            var context = this.curveLayer.getContext();
            context.clear();

            // draw bezier
            context.beginPath();
            // context.moveTo(this.bezierPts[0].start.attrs.x, bezierPts[0].start.attrs.y);
            //context.bezierCurveTo(bezier.control1.attrs.x, bezier.control1.attrs.y, bezier.control2.attrs.x, bezier.control2.attrs.y, bezier.end.attrs.x, bezier.end.attrs.y);
            //context.setAttr('strokeStyle', 'blue');
            //context.setAttr('lineWidth', 2);
            //context.stroke();
        };

        KineticCurve.prototype.updateDottedLines = function () {
            //var q = quad;
            var b = this.bezierPts;
            // var quadLine = lineLayer.get('#quadLine')[0];
            //var bezierLine = this.lineLayer.get('#bezierLine')[0];
            //bezierLine.setPoints([b.start.attrs.x, b.start.attrs.y, b.control1.attrs.x, b.control1.attrs.y, b.control2.attrs.x, b.control2.attrs.y, b.end.attrs.x, b.end.attrs.y]);
            //lineLayer.draw();
        };

        KineticCurve.prototype.drawCurves = function () {
            this.stage.clear();
            var layer = new Kinetic.Layer();

            var quadLine = new Kinetic.Line({
                dashArray: [10, 10, 0, 10],
                strokeWidth: 3,
                stroke: 'black',
                lineCap: 'round',
                id: 'quadLine',
                opacity: 0.3,
                points: [0, 0]
            });

            var bezierLine = new Kinetic.Line({
                dashArray: [10, 10, 0, 10],
                strokeWidth: 3,
                stroke: 'black',
                lineCap: 'round',
                id: 'bezierLine',
                opacity: 0.3,
                points: [0, 0]
            });

            //layer.add(quadLine);
            //layer.add(bezierLine);
            //layer.add(bezierLine);
            this.stage.add(this.anchorLayer);
        };
        return KineticCurve;
    })();
    CurveControl.KineticCurve = KineticCurve;
})(CurveControl || (CurveControl = {}));
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
});

var project;
(function (project) {
    var b2m = Box2D.Common.Math;
    var b2d = Box2D.Dynamics;
    var b2s = Box2D.Collision.Shapes;

    var KineticCurve = CurveControl.KineticCurve;

    var canvas;
    var stage;

    var SCALE = 30;
    var bodies = new Array();
    var surfaces = new Array();
    project.world;

    var Main = (function () {
        function Main(canvas) {
            var _this = this;
            this.gravity = 9.81;
            this.pauseStep = false;
            //createBall(event: createjs.MouseEvent): void {
            this.createBall = function () {
                //console.log('clicked at ' + event.stageX + ',' + event.stageY);
                _this.removeBodies();

                var bodyDef = new b2d.b2BodyDef();

                bodyDef.type = b2d.b2Body.b2_dynamicBody;
                bodyDef.position.x = 100 / SCALE;
                bodyDef.position.y = 200 / SCALE;
                bodyDef.userData = 'ball';

                var fixDef = new b2d.b2FixtureDef();
                fixDef.userData = 'ball';
                fixDef.density = 0.5;
                fixDef.friction = 0.5;
                fixDef.restitution = 0.9;
                fixDef.shape = new b2s.b2CircleShape(30 / SCALE);
                fixDef.userData = 'ball';

                var body = project.world.CreateBody(bodyDef);
                body.CreateFixture(fixDef);

                //body.SetAwake(true);
                //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());
                //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);
                //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));
                bodies.push(body);
            };
            canvas = canvas;
            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);
            stage.mouseEnabled = true;
            this.stageW = canvas.width;
            this.stageH = canvas.height;

            project.world = new b2d.b2World(new b2m.b2Vec2(0, this.gravity * 10), true);
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
            var curve = new KineticCurve("test", "test", "test");
            // curve.createAnchor();
            //var rect = new Kinetic.Rect({ width: 10, height: 10, cornerRadius: 5 });
            //alert('settings clicked');
        };

        Main.prototype.pause = function () {
            if (this.pauseStep == false) {
                alert('pausing animation');
                this.pauseStep = true;
            } else {
                alert('running animation');
                this.pauseStep = false;
            }
        };

        Main.prototype.reluanch = function () {
            alert('reload clicked');
        };

        Main.prototype.createCurvedSurface = function () {
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

            var curvedSurface = project.world.CreateBody(surfaceDef);
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

            var debugDraw = new b2d.b2DebugDraw();

            var canvas = document.getElementById('surface');
            var ctx = canvas.getContext('2d');

            debugDraw.SetSprite(ctx);
            debugDraw.SetDrawScale(SCALE);
            debugDraw.SetFlags(b2d.b2DebugDraw.e_shapeBit | b2d.b2DebugDraw.e_jointBit);
            project.world.SetDebugDraw(debugDraw);
        };

        Main.prototype.createFlatSurface = function () {
            // create surface defintion
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = this.stageW / 2 / SCALE;
            surfaceDef.position.y = this.stageH / SCALE;
            surfaceDef.userData = 'flat-surface';

            // create surface fixture defintion
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            var shape = new b2s.b2PolygonShape();
            var width = this.stageW / SCALE;
            var height = 20 / SCALE;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;

            var flatSurface = project.world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
            surfaces.push(flatSurface);

            console.log('surface created, width : ' + width + ', height : ' + height);
        };

        Main.prototype.tick = function () {
            stage.update();
            draw();

            //world.DrawDebugData();
            project.world.Step(1 / 30, 10, 10);
        };

        Main.prototype.changeGravity = function (value) {
            alert('gravity : ' + value);
            this.gravity = value * 10;
            project.world.SetGravity(new b2m.b2Vec2(0, this.gravity));
        };

        Main.prototype.p2m = function (x) {
            return x / SCALE;
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
            this.removeBodies();
            this.removeSurfaces();

            stage.canvas.width = window.innerWidth;
            stage.canvas.height = window.innerHeight;
            stage.update();

            this.stageW = window.innerWidth;
            ;
            this.stageH = window.innerHeight;
            this.createCurvedSurface();
            //this.createFlatSurface();
        };

        Main.prototype.removeSurfaces = function () {
            while (surfaces.length) {
                var surface = surfaces.pop();
                project.world.DestroyBody(surface);
            }
            stage.update();
        };

        Main.prototype.removeBodies = function () {
            while (bodies.length) {
                var body = bodies.pop();
                project.world.DestroyBody(body);
            }
            stage.update();
        };
        return Main;
    })();
    project.Main = Main;

    function draw() {
        var canvas = document.getElementById('surface');
        var ctx = canvas.getContext('2d');
        var deletionBuffer = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var node = project.world.GetBodyList();
        while (node) {
            var body = node;
            node = node.GetNext();
            var position = body.GetPosition();

            // remove body that have floated off screen
            if (position.x < -deletionBuffer || position.x > (canvas.width + 4)) {
                project.world.DestroyBody(body);
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
                            var x = vs[i].x * SCALE;
                            var y = vs[i].y * SCALE;
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
})(project || (project = {}));
//# sourceMappingURL=app.js.map
