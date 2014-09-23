/// <reference path="./scripts/typings/jquery/jquery.d.ts"/>
/// <reference path="./scripts/typings/createjs/createjs.d.ts"/>
/// <reference path="./scripts/typings/createjs/easeljs.d.ts"/>
/// <reference path="./scripts/typings/preloadjs/preloadjs.d.ts"/>
/// <reference path="./scripts/typings/box2d/box2dweb.d.ts" />
/// <reference path="./scripts/typings/kinetic/kinetic.d.ts" />
window.addEventListener('load', function () {
    var canvas = document.getElementById('surface');
    var main = new project.Main(canvas);

    // set up button events
    document.getElementById("btnReload").addEventListener("click", main.reload);
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

    var canvas;
    var stage;

    var SCALE = 30;
    var bodies = new Array();
    var surfaces = new Array();
    project.world;

    var Main = (function () {
        function Main(canvas) {
            this.gravity = 9.81;
            canvas = canvas;
            stage = new createjs.Stage(canvas);
            createjs.Touch.enable(stage);
            stage.mouseEnabled = true;
            this.stageW = canvas.width;
            this.stageH = canvas.height;

            project.world = new b2d.b2World(new b2m.b2Vec2(0, this.gravity * 10), true);
            stage.addEventListener('stagemousedown', this.createBall);

            createjs.Ticker.setFPS(60);
            createjs.Ticker.useRAF = true;
            createjs.Ticker.addEventListener('tick', this.tick);

            window.addEventListener("resize", this.onResizeHandler.bind(this), false);
            window.addEventListener("orientationchange", this.onResizeHandler.bind(this), false);
        }
        Main.prototype.settings = function () {
            alert('settings clicked');
        };

        Main.prototype.pause = function () {
            alert('pause clicked');
        };

        Main.prototype.reload = function () {
            alert('reload clicked');
        };

        Main.prototype.setupFlatSurface = function () {
            // create ground
            var fixDef = new b2d.b2FixtureDef();
            fixDef.density = 1;
            fixDef.friction = 0.5;

            var bodyDef = new b2d.b2BodyDef();
            bodyDef.type = b2d.b2Body.b2_staticBody;
            bodyDef.position.x = this.stageW / 2 / SCALE;
            bodyDef.position.y = this.stageH / SCALE;
            bodyDef.userData = 'terrain';
            var shape = new b2s.b2PolygonShape();
            shape.SetAsBox(this.stageW / 2 / SCALE, 20 / SCALE);

            fixDef.shape = shape;

            var surface = project.world.CreateBody(bodyDef);
            surface.CreateFixture(fixDef);

            //body.SetAwake(true);
            //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());
            //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);
            //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));
            surfaces.push(surface);

            var debugDraw = new b2d.b2DebugDraw();
            debugDraw.SetSprite(stage.canvas.getContext("2d"));
            debugDraw.SetDrawScale(SCALE);
            debugDraw.SetFlags(b2d.b2DebugDraw.e_shapeBit | b2d.b2DebugDraw.e_jointBit);
            project.world.SetDebugDraw(debugDraw);
        };

        Main.prototype.tick = function () {
            stage.update();
            draw();

            //world.DrawDebugData();
            project.world.Step(1 / 60, 10, 10);
        };

        Main.prototype.changeGravity = function (value) {
            this.gravity = value * 10;
            project.world.SetGravity(new b2m.b2Vec2(0, this.gravity));
        };

        Main.prototype.createBall = function (event) {
            console.log('clicked at ' + event.stageX + ',' + event.stageY);

            removeBodies();
            var fixDef = new b2d.b2FixtureDef();
            fixDef.density = 0.5;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.9;
            var bodyDef = new b2d.b2BodyDef();
            bodyDef.userData = 'ball';
            bodyDef.type = b2d.b2Body.b2_dynamicBody;
            bodyDef.position.x = event.stageX / SCALE;
            bodyDef.position.y = event.stageY / SCALE;
            fixDef.shape = new b2s.b2CircleShape(30 / SCALE);

            var body = project.world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);

            //body.SetAwake(true);
            //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());
            //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);
            //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));
            bodies.push(body);
        };

        //    getCubicBezierXYatT(startPt:, controlPt1, controlPt2, endPt, T): Any {
        //       var x:number = CubicN(T, startPt.attrs.x, controlPt1.attrs.x, controlPt2.attrs.x, endPt.attrs.x);
        //      var y:number = CubicN(T, startPt.attrs.y, controlPt1.attrs.y, controlPt2.attrs.y, endPt.attrs.y);
        //      return ({ x: x, y: y });
        //  }
        Main.prototype.CubicN = function (T, a, b, c, d) {
            var t2 = T * T;
            var t3 = t2 * T;
            return a + (-a * 3 + T * (3 * a - a * T)) * T + (3 * b + T * (-6 * b + b * 3 * T)) * T + (c * 3 - c * 3 * T) * t2 + d * t3;
        };

        Main.prototype.onResizeHandler = function (event) {
            removeBodies();
            removeSurfaces();

            stage.canvas.width = window.innerWidth;
            stage.canvas.height = window.innerHeight;
            stage.update();

            this.stageW = window.innerWidth;
            ;
            this.stageH = window.innerHeight;
            this.setupFlatSurface();
        };
        return Main;
    })();
    project.Main = Main;

    function removeSurfaces() {
        while (surfaces.length) {
            var surface = surfaces.pop();
            project.world.DestroyBody(surface);
        }
        stage.update();
    }

    function removeBodies() {
        while (bodies.length) {
            var body = bodies.pop();
            project.world.DestroyBody(body);
        }
        stage.update();
    }

    function draw() {
        var ctx = document.getElementById('surface').getContext('2d');
        ctx.clearRect(0, 0, 1200, 400); // 600px x 420px is the size of the canvas
        var body = project.world.GetBodyList();
        while (body) {
            if (body.GetType() == 0 || body.GetType() == 2) {
                var fixture = body.GetFixtureList();
                while (fixture) {
                    var shape = fixture.GetShape();
                    var shapeType = shape.GetType();
                    if (shapeType == b2s.b2Shape.e_polygonShape) {
                        var polygonShape = shape;

                        var X = polygonShape.GetVertices()[1].x - polygonShape.GetVertices()[0].x;
                        var Y = polygonShape.GetVertices()[2].y - polygonShape.GetVertices()[1].y;
                        var pos = body.GetPosition();

                        ctx.save();
                        ctx.translate(pos.x * SCALE, pos.y * SCALE);
                        ctx.translate(-pos.x * SCALE, -pos.y * SCALE);

                        ctx.lineWidth = 1;
                        ctx.strokeStyle = "rgb(0, 0, 0)";
                        ctx.strokeRect(((pos.x * SCALE) - (X * SCALE / 2)), ((pos.y * SCALE) - (Y * SCALE / 2)), X * SCALE, Y * SCALE);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * SCALE) - (X * SCALE / 2)), ((pos.y * SCALE) - (Y * SCALE / 2)), X * SCALE, Y * SCALE);

                        ctx.restore();
                    } else if (shapeType == b2s.b2Shape.e_circleShape) {
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
                    fixture = fixture.GetNext();
                }
            }
            body = body.GetNext();
        }
    }
})(project || (project = {}));
//# sourceMappingURL=app.js.map
