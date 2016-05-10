
window.addEventListener('load',() => {
    var canvas = <HTMLCanvasElement> document.getElementById('surface');
    var main = new Application.Main(canvas);
})

module Application {

    import point =  PolygonSubdivision.Point;
    import curveControl = Curves.CurveControl;
    import chaikinCurve =  PolygonSubdivision.ChaikinCurve;
    import polylineSimplify = PolygonSubdivision.PolylineSimplify;
    import bezierCurve = PolygonSubdivision.BezierCurve;

    import b2c = Box2D.Common;
    import b2m = Box2D.Common.Math;
    import b2d = Box2D.Dynamics;
    import b2s = Box2D.Collision.Shapes;
    import b2j = Box2D.Dynamics.Joints;

    let canvas: HTMLCanvasElement;
    let stage: createjs.Stage;
    let context: CanvasRenderingContext2D;

    let lineTolerance: number = 1.0;
    let bodies: any[] = new Array();
    let surfaces: any[] = new Array();
    let surfacePoints: any[] = new Array();

    let world: Box2D.Dynamics.b2World;
    let inEditMode: Boolean = false;
    let scale: number = 30;
    let step: number = 20;

    export class Main {
        public gravity: number = 9.81;
        constructor(_canvas: HTMLCanvasElement) {
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

            let reloadButton = <HTMLInputElement>document.getElementById("btnReload");
            reloadButton.addEventListener("click", this.createBall.bind(this), false);

            let settingsButton = <HTMLInputElement>document.getElementById("btnSettings");
            settingsButton.addEventListener("click", this.settings.bind(this), false);

            let drawButton = <HTMLInputElement>document.getElementById("btnDraw");
            drawButton.addEventListener("click", this.createDrawnSurface.bind(this), false);

            let bezierButton = <HTMLInputElement>document.getElementById("btnBezier");
            bezierButton.addEventListener("click", this.createBezierSurface.bind(this), false);


            let lineSimplificationUI =  <HTMLInputElement>document.getElementById("line-simplification");
            lineSimplificationUI.addEventListener("change", this.lineSimplificaton.bind(this),false);



        }
        public settings(): void {

            if (!inEditMode) {
                //curveControl.renderControlPoints();
            }

            inEditMode = !inEditMode;
        }

        public createDrawnSurface(): void {
            this.clearSurfaces();
            this.removeBodies();
            var that = this;

            // Create a point EditListener for the event
            var listener = function (event: Event) {
                //that.removeBodies();
                that.clearSurfaces();
                var points = <Array<PolygonSubdivision.Point>> (<any>event).detail;
                that.setSurfacePoints(points);
            }
            document.addEventListener("pointEditListener", listener);
            inEditMode = true;
        //    curveControl.drawLine();
        }

        public createBezierSurface(): void {
            this.removeBodies();
            this.clearSurfaces();


            let width = canvas.width;
            let height = canvas.height;


            // first point - flush with edge of canvas left side (0),  1/16 of the way from the top
            let pt1x = 0;
            let pt1y = Math.floor(height / 16);

            // second point : x - 1/16 from canvas left side, y at the bottom
            let pt2x = Math.floor(width/16);
            let pt2y = Math.floor(height);

            // third point : x -  1/16 from canvas left side, y at the bottom
            let pt3x = Math.floor(15 * (width / 16));
            let pt3y = Math.floor(height);

            // third point - flush to the from canvas right side, 1/16 from the bottom
            let pt4x = width;
            let pt4y = Math.floor(height / 16);


            let controlPts = new Array<PolygonSubdivision.Point>();
            controlPts[0] = new PolygonSubdivision.Point(pt1x, pt1y);
            controlPts[1] = new PolygonSubdivision.Point(pt2x, pt2y);
            controlPts[2] = new PolygonSubdivision.Point(pt3x, pt3y);
            controlPts[3] = new PolygonSubdivision.Point(pt4x, pt4y);

            //let points = curveControl.drawBesizerCurve(controlPts);
            //this.setSurfacePoints(points);
        }


        public createFlatSurface(): void {

            // create surface defintion
            let surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.position.x = canvas.width / 2 / scale;
            surfaceDef.position.y = canvas.height / scale;
            surfaceDef.userData = 'flat-surface';

            // create surface fixture defintion
            let surfaceFixtureDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            let shape: b2s.b2PolygonShape = new b2s.b2PolygonShape();
            let width: number = canvas.width / scale;
            let height: number = 20 / scale;
            shape.SetAsBox(width, height);
            surfaceFixtureDef.shape = shape;

            let flatSurface = world.CreateBody(surfaceDef).CreateFixture(surfaceFixtureDef);
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

        public lineSimplificaton(n: any): void {



          console.log("slider value ="+n.value);

        //  console.log('line value = '+n);
            //this.clearSurfaces();
            //curveControl.setLineTolerance(value);
        }



        //createBall(event: createjs.MouseEvent): void {
        public createBall = (): void => {
            //console.log('curve control points = ' + curveControl.getCurvePoints().length);
            //this.removeSurfaces();
            //this.createCurvedSurfaces(curveControl.getCurvePoints());

            //console.log('clicked at ' + event.stageX + ',' + event.stageY);
            this.removeBodies();
            let x: number = 20;
            let y: number = 0;

            let bodyDef = new b2d.b2BodyDef();

            bodyDef.type = b2d.b2Body.b2_dynamicBody;
            bodyDef.position.x = x / scale;
            bodyDef.position.y = y / scale;
            bodyDef.userData = 'ball';

            let fixDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            fixDef.userData = 'ball';
            fixDef.density = 0.5;
            fixDef.friction = 0.5;
            fixDef.restitution = 0.9;
            fixDef.shape = new b2s.b2CircleShape(30 / scale);
            fixDef.userData = 'ball';

            let body = world.CreateBody(bodyDef);
            body.CreateFixture(fixDef);

            //body.SetAwake(true);

            //body.ApplyImpulse(new b2m.b2Vec2(gravity, 0), body.GetWorldCenter());

            //body.SetPositionAndAngle(new b2m.b2Vec2(10, 0), Math.PI / 3);

            //body.ApplyForce(new b2m.b2Vec2(10000, 100), body.GetWorldPoint(new b2m.b2Vec2(0, -3)));



            bodies.push(body);
        }

        public setSurfacePoints(points: Array<PolygonSubdivision.Point>): void {

            // create surface defintion
            let surfaceDef = new b2d.b2BodyDef();
            surfaceDef.type = b2d.b2Body.b2_staticBody;
            surfaceDef.userData = 'curved-surface'

            // create surface fixture defintion
            let surfaceFixtureDef: b2d.b2FixtureDef = new b2d.b2FixtureDef();
            surfaceFixtureDef.density = 1;
            surfaceFixtureDef.friction = 0.5;

            let shape: b2s.b2PolygonShape = new b2s.b2PolygonShape();

            let ptArray = new Array();
            let x1, y1, x2, y2;

            let curvedSurface = world.CreateBody(surfaceDef);
            let ptOnCurve = points[0];

            x1 = this.p2m(ptOnCurve.x);
            y1 = this.p2m(ptOnCurve.y);


            for (let i = 1; i < points.length; i++) {
                let pt: PolygonSubdivision.Point = points[i];
                x2 = this.p2m(pt.x);
                y2 = this.p2m(pt.y);
                let edgeShape = new b2s.b2PolygonShape();
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

            let width = (document.documentElement.offsetWidth - 25);
            var height = (document.documentElement.clientHeight - 150);


            stage.canvas.width = width;
            stage.canvas.height = height;
            //curveControl = new Curves.CurveControl('container', width, height);

            stage.update();

            //this.createSurfaces();
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
                        ctx.strokeRect(((pos.x * scale) - (x * scale / 2)),((pos.y * scale) - (y * scale / 2)), x * scale, y * scale);
                        ctx.fillStyle = "rgb(255, 255, 255)";
                        ctx.fillRect(((pos.x * scale) - (x * scale / 2)),((pos.y * scale) - (y * scale / 2)), x * scale, y * scale);
                        ctx.restore();
                    }
                } else if (userData == 'curved-surface' && (!inEditMode)) {
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
