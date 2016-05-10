window.addEventListener('load', function () {
    var canvas = document.getElementById('surface');
    var main = new Application.Main(canvas);
});
var Application;
(function (Application) {
    var b2m = Box2D.Common.Math;
    var b2d = Box2D.Dynamics;
    var b2s = Box2D.Collision.Shapes;
    var canvas;
    var stage;
    var context;
    var lineTolerance = 1.0;
    var bodies = new Array();
    var surfaces = new Array();
    var surfacePoints = new Array();
    var world;
    var inEditMode = false;
    var scale = 30;
    var step = 20;
    var Main = (function () {
        function Main(_canvas) {
            var _this = this;
            this.gravity = 9.81;
            this.createBall = function () {
                _this.removeBodies();
                var x = 20;
                var y = 0;
                var bodyDef = new b2d.b2BodyDef();
                bodyDef.type = b2d.b2Body.b2_dynamicBody;
                bodyDef.position.x = x / scale;
                bodyDef.position.y = y / scale;
                bodyDef.userData = 'ball';
                var fixDef = new b2d.b2FixtureDef();
                fixDef.userData = 'ball';
                fixDef.density = 0.5;
                fixDef.friction = 0.5;
                fixDef.restitution = 0.9;
                fixDef.shape = new b2s.b2CircleShape(30 / scale);
                fixDef.userData = 'ball';
                var body = world.CreateBody(bodyDef);
                body.CreateFixture(fixDef);
                bodies.push(body);
            };
            this.clearSurfaces = function () {
                while (surfaces.length) {
                    var surface = surfaces.pop();
                    world.DestroyBody(surface);
                }
                stage.update();
            };
            console.log("test");
            canvas = _canvas;
            context = _canvas.getContext("2d");
            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);
            stage.mouseEnabled = true;
            world = new b2d.b2World(new b2m.b2Vec2(0, this.gravity * 10), true);
            createjs.Ticker.setFPS(60);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addEventListener('tick', this.tick);
            window.addEventListener("resize", this.onResizeHandler.bind(this), false);
            window.addEventListener("orientationchange", this.onResizeHandler.bind(this), false);
            var reloadButton = document.getElementById("btnReload");
            reloadButton.addEventListener("click", this.createBall.bind(this), false);
            var settingsButton = document.getElementById("btnSettings");
            settingsButton.addEventListener("click", this.settings.bind(this), false);
            var drawButton = document.getElementById("btnDraw");
            drawButton.addEventListener("click", this.createDrawnSurface.bind(this), false);
            var bezierButton = document.getElementById("btnBezier");
            bezierButton.addEventListener("click", this.createBezierSurface.bind(this), false);
            var lineSimplificationUI = document.getElementById("line-simplification");
            lineSimplificationUI.addEventListener("change", this.lineSimplificaton.bind(this), false);
        }
        Main.prototype.settings = function () {
            if (!inEditMode) {
            }
            inEditMode = !inEditMode;
        };
        Main.prototype.createDrawnSurface = function () {
            this.clearSurfaces();
            this.removeBodies();
            var that = this;
            var listener = function (event) {
                that.clearSurfaces();
                var points = event.detail;
                that.setSurfacePoints(points);
            };
            document.addEventListener("pointEditListener", listener);
            inEditMode = true;
        };
        Main.prototype.createBezierSurface = function () {
            this.removeBodies();
            this.clearSurfaces();
            var width = canvas.width;
            var height = canvas.height;
            var pt1x = 0;
            var pt1y = Math.floor(height / 16);
            var pt2x = Math.floor(width / 16);
            var pt2y = Math.floor(height);
            var pt3x = Math.floor(15 * (width / 16));
            var pt3y = Math.floor(height);
            var pt4x = width;
            var pt4y = Math.floor(height / 16);
            var controlPts = new Array();
            controlPts[0] = new PolygonSubdivision.Point(pt1x, pt1y);
            controlPts[1] = new PolygonSubdivision.Point(pt2x, pt2y);
            controlPts[2] = new PolygonSubdivision.Point(pt3x, pt3y);
            controlPts[3] = new PolygonSubdivision.Point(pt4x, pt4y);
        };
        Main.prototype.createFlatSurface = function () {
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = canvas.width / 2 / scale;
            surfaceDef.position.y = canvas.height / scale;
            surfaceDef.userData = 'flat-surface';
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;
            var shape = new b2s.b2PolygonShape();
            var width = canvas.width / scale;
            var height = 20 / scale;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;
            var flatSurface = world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
            surfaces.push(flatSurface);
            console.log('surface created, width : ' + width + ', height : ' + height);
        };
        Main.prototype.tick = function () {
            stage.update();
            draw();
            world.Step(1 / step, 10, 10);
        };
        Main.prototype.changeGravity = function (value) {
            this.gravity = value * 10;
            world.SetGravity(new b2m.b2Vec2(0, this.gravity));
        };
        Main.prototype.lineSimplificaton = function (n) {
            console.log("slider value =" + n.value);
        };
        Main.prototype.setSurfacePoints = function (points) {
            var surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.userData = 'curved-surface';
            var surfaceFixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;
            var shape = new b2s.b2PolygonShape();
            var ptArray = new Array();
            var x1, y1, x2, y2;
            var curvedSurface = world.CreateBody(surfaceDef);
            var ptOnCurve = points[0];
            x1 = this.p2m(ptOnCurve.x);
            y1 = this.p2m(ptOnCurve.y);
            for (var i = 1; i < points.length; i++) {
                var pt = points[i];
                x2 = this.p2m(pt.x);
                y2 = this.p2m(pt.y);
                var edgeShape = new b2s.b2PolygonShape();
                edgeShape.SetAsEdge(new b2m.b2Vec2(x1, y1), new b2m.b2Vec2(x2, y2));
                curvedSurface.CreateFixture2(edgeShape);
                x1 = x2;
                y1 = y2;
            }
            surfaces.push(curvedSurface);
        };
        Main.prototype.p2m = function (x) {
            return x / scale;
        };
        Main.prototype.onResizeHandler = function (event) {
            if (event === void 0) { event = null; }
            this.removeBodies();
            var width = (document.documentElement.offsetWidth - 25);
            var height = (document.documentElement.clientHeight - 150);
            stage.canvas.width = width;
            stage.canvas.height = height;
            stage.update();
        };
        Main.prototype.removeBodies = function () {
            while (bodies.length) {
                var body = bodies.pop();
                world.DestroyBody(body);
            }
            stage.update();
        };
        return Main;
    }());
    Application.Main = Main;
    function draw() {
        var canvas = document.getElementById('surface');
        var ctx = canvas.getContext('2d');
        var deletionBuffer = 4;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var node = world.GetBodyList();
        while (node) {
            var body = node;
            node = node.GetNext();
            var position = body.GetPosition();
            if (position.x < -deletionBuffer || position.x > (canvas.width + 4)) {
                world.DestroyBody(body);
                continue;
            }
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
                        ctx.translate(pos.x * scale, pos.y * scale);
                        ctx.translate(-pos.x * scale, -pos.y * scale);
                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.strokeRect(((pos.x * scale) - (x * scale / 2)), ((pos.y * scale) - (y * scale / 2)), x * scale, y * scale);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * scale) - (x * scale / 2)), ((pos.y * scale) - (y * scale / 2)), x * scale, y * scale);
                        ctx.restore();
                    }
                }
                else if (userData == 'curved-surface' && (!inEditMode)) {
                    var fixture = body.GetFixtureList();
                    while (fixture) {
                        var shape = fixture.GetShape();
                        fixture = fixture.GetNext();
                        ctx.beginPath();
                        ctx.lineWidth = 0.5;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        var vs = shape.GetVertices();
                        for (var i = 0; i < vs.length; i++) {
                            var x = vs[i].x * scale;
                            var y = vs[i].y * scale;
                            if (i == 0) {
                                ctx.moveTo(x, y);
                            }
                            else {
                                ctx.lineTo(x, y);
                            }
                        }
                        ctx.stroke();
                    }
                }
            }
            else if (body.GetType() == b2d.b2Body.b2_dynamicBody) {
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
})(Application || (Application = {}));
