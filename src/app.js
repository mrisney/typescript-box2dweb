var PolygonSubdivision;
(function (PolygonSubdivision) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    })();
    PolygonSubdivision.Point = Point;
    var WeightedPoint = (function () {
        function WeightedPoint(point, weight) {
            this.point = point;
            this.weight = weight;
        }
        return WeightedPoint;
    })();
    PolygonSubdivision.WeightedPoint = WeightedPoint;

    var ChaikinCurve = (function () {
        function ChaikinCurve() {
        }
        ChaikinCurve.prototype.subdivide = function (points, subdivisions) {
            do {
                var numOfPoints = points.length;

                // keep the first point
                points.push(points[0]);

                for (var i = 1; i < (numOfPoints - 1); i += 1) {
                    var j = i - 1;

                    // first point
                    var p1 = points[j];
                    var p2 = points[j + 1];
                    var weightedPoints = new Array();
                    weightedPoints.push(new WeightedPoint(p1, 1));
                    weightedPoints.push(new WeightedPoint(p2, 1));
                    points.push(this.affineCombination(weightedPoints));

                    // second point
                    var p3 = points[j + 2];
                    weightedPoints.push(new WeightedPoint(p1, 1));
                    weightedPoints.push(new WeightedPoint(p2, 6));
                    weightedPoints.push(new WeightedPoint(p3, 1));
                    points.push(this.affineCombination(weightedPoints));
                }

                // third point
                var k = numOfPoints - 2;
                var p4 = points[k];
                var p5 = points[k + 1];
                var weightedPoints = new Array();
                weightedPoints.push(new WeightedPoint(p4, 1));
                weightedPoints.push(new WeightedPoint(p5, 1));
                points.push(this.affineCombination(weightedPoints));

                // finally, push the last point
                points.push(points[numOfPoints - 1]);

                for (var l = 0; l < numOfPoints; ++l)
                    points.shift();
            } while(--subdivisions > 0);
            return points;
        };

        ChaikinCurve.prototype.affineCombination = function (weightedPoints) {
            var result = new Point(0, 0);
            var sum = 0;

            for (var i = 0; i < weightedPoints.length; i++) {
                sum += weightedPoints[i].weight;
            }

            for (var j = 0; j < weightedPoints.length; j++) {
                result = this.plus(result, this.scale(weightedPoints[j].point, weightedPoints[j].weight / sum));
            }
            return result;
        };

        ChaikinCurve.prototype.plus = function (point1, point2) {
            return new Point(point1.x + point2.x, point1.y + point2.y);
        };

        ChaikinCurve.prototype.scale = function (point, scale) {
            return new Point(point.x * scale, point.y * scale);
        };
        return ChaikinCurve;
    })();
    PolygonSubdivision.ChaikinCurve = ChaikinCurve;

    var BezierCurve = (function () {
        function BezierCurve() {
        }
        BezierCurve.prototype.subdivide = function (controlPoints, subdivisions) {
            var results;
            subdivisions = subdivisions / 100;
            var startPoint = controlPoints[0];
            var point1 = controlPoints[1];
            var point2 = controlPoints[2];
            var endPoint = controlPoints[3];

            for (var i = 0; i < subdivisions; i += 0.01) {
                var ptOnCurve = this.getCubicBezierPointatIndex(startPoint, point1, point2, endPoint, i);
                results.push(ptOnCurve);
            }
            return results;
        };
        BezierCurve.prototype.getCubicBezierPointatIndex = function (startPt, controlPt1, controlPt2, endPt, i) {
            var x = this.CubicN(i, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
            var y = this.CubicN(i, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
            return new Point(x, y);
        };

        BezierCurve.prototype.CubicN = function (T, a, b, c, d) {
            var t2 = T * T;
            var t3 = t2 * T;
            return a + (-a * 3 + T * (3 * a - a * T)) * T + (3 * b + T * (-6 * b + b * 3 * T)) * T + (c * 3 - c * 3 * T) * t2 + d * t3;
        };
        return BezierCurve;
    })();
    PolygonSubdivision.BezierCurve = BezierCurve;

    var PolylineSimplify = (function () {
        function PolylineSimplify() {
        }
        // square distance between 2 points
        PolylineSimplify.prototype.getSqDist = function (p1, p2) {
            var dx = p1.x - p2.x, dy = p1.y - p2.y;
            return dx * dx + dy * dy;
        };

        // square distance from a point to a segment
        PolylineSimplify.prototype.getSqSegDist = function (p, p1, p2) {
            var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;

            if (dx !== 0 || dy !== 0) {
                var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
                if (t > 1) {
                    x = p2.x;
                    y = p2.y;
                } else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }

            dx = p.x - x;
            dy = p.y - y;

            return dx * dx + dy * dy;
        };

        // basic distance-based simplification
        PolylineSimplify.prototype.simplifyRadialDist = function (points, sqTolerance) {
            var prevPoint = points[0], newPoints = [prevPoint], point;

            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];

                if (this.getSqDist(point, prevPoint) > sqTolerance) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }

            if (prevPoint !== point)
                newPoints.push(point);

            return newPoints;
        };

        // simplification using optimized Douglas - Peucker algorithm with recursion elimination
        PolylineSimplify.prototype.simplifyDouglasPeucker = function (points, sqTolerance) {
            var len = points.length, MarkerArray, markers = new Uint8Array(len), first = 0, last = len - 1, stack = [], newPoints = [], i, maxSqDist, sqDist, index;

            markers[first] = markers[last] = 1;

            while (last) {
                maxSqDist = 0;

                for (i = first + 1; i < last; i++) {
                    sqDist = this.getSqSegDist(points[i], points[first], points[last]);

                    if (sqDist > maxSqDist) {
                        index = i;
                        maxSqDist = sqDist;
                    }
                }

                if (maxSqDist > sqTolerance) {
                    markers[index] = 1;
                    stack.push(first, index, index, last);
                }

                last = stack.pop();
                first = stack.pop();
            }

            for (i = 0; i < len; i++) {
                if (markers[i])
                    newPoints.push(points[i]);
            }
            return newPoints;
        };

        // both algorithms combined for awesome performance
        PolylineSimplify.prototype.simplify = function (points, tolerance, highestQuality) {
            if (points.length <= 1)
                return points;
            var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
            points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
            points = this.simplifyDouglasPeucker(points, sqTolerance);
            return points;
        };
        return PolylineSimplify;
    })();
    PolygonSubdivision.PolylineSimplify = PolylineSimplify;
})(PolygonSubdivision || (PolygonSubdivision = {}));
/// <reference path="./kinetic/kinetic.d.ts" />
/// <reference path="./polygonsubdivision.ts" />
var Curves;
(function (Curves) {
    Curves.controlPointLayer;
    Curves.controlLineLayer;
    Curves.simplifiedPoints;
    Curves.kineticControlPoints;

    Curves.subdivisionPoint;
    Curves.chaikinCurve;
    Curves.polylineSimplify;
    Curves.stage;
    Curves.lineTolerance;

    Curves.curveControl;
    Curves.drawPoints;

    var CurveControl = (function () {
        function CurveControl(containerName, w, h) {
            Curves.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            Curves.controlPointLayer = new Kinetic.Layer();
            Curves.controlLineLayer = new Kinetic.Layer();
            Curves.simplifiedPoints = new Array();
            Curves.kineticControlPoints = new Array();

            Curves.chaikinCurve = new PolygonSubdivision.ChaikinCurve();
            Curves.drawPoints = new Array();
            Curves.lineTolerance = 1.0;
            Curves.curveControl = this;
        }
        CurveControl.prototype.addControlPoint = function (x, y) {
            var controlPoint = new Kinetic.Circle({
                x: x,
                y: y,
                radius: 10,
                stroke: '#666',
                fill: '#ddd',
                strokeWidth: 2,
                text: 'p1',
                draggable: true
            });
            Curves.controlPointLayer.add(controlPoint);

            //controlPoints.push(controlPoint);
            // console.log('control points =' + JSON.stringify(this.controlPoints));
            var point1 = new PolygonSubdivision.Point(x, y);
            var point2 = new PolygonSubdivision.Point(x + 1, y + 1);
            var point3 = new PolygonSubdivision.Point(x + 2, y + 2);
            var points = new Array();
            points.push(point1);
            points.push(point2);
            points.push(point3);

            var curvePoints = Curves.chaikinCurve.subdivide(points, 7);
            //console.log(curvePoints);
        };
        CurveControl.prototype.getCurvePoints = function () {
            var points = new Array();
            return points;
        };

        CurveControl.prototype.createControlPoint = function (x, y) {
            var controlPoint = new Kinetic.Circle({
                x: x,
                y: y,
                radius: 10,
                stroke: '#666',
                fill: '#ddd',
                strokeWidth: 2,
                text: 'p1',
                draggable: true
            });

            return controlPoint;
        };

        CurveControl.prototype.setLineTolerance = function (event) {
            var toleranceSlider = document.getElementById("line-tolerance-range");
            Curves.lineTolerance = +toleranceSlider.value;
            Curves.simplifiedPoints = Curves.polylineSimplify.simplify(Curves.drawPoints, Curves.lineTolerance, true);

            Curves.stage.clear();
            Curves.controlLineLayer.removeChildren();
            Curves.controlPointLayer.removeChildren();
            var kineticLinePoints = [];
            Curves.kineticControlPoints.length = 0;

            for (var i = 0; i < Curves.simplifiedPoints.length; i++) {
                var x = Curves.simplifiedPoints[i].x;
                var y = Curves.simplifiedPoints[i].y;

                kineticLinePoints.push(x);
                kineticLinePoints.push(y);

                var kineticControlPoint = new Kinetic.Circle({
                    x: x,
                    y: y,
                    radius: 10,
                    stroke: '#666',
                    fill: '#ddd',
                    strokeWidth: 2,
                    draggable: true
                });
                kineticControlPoint.on('dragstart dragmove', function () {
                    Curves.curveControl.updateControlLines();
                });
                Curves.kineticControlPoints.push(kineticControlPoint);
                Curves.controlPointLayer.add(kineticControlPoint);
            }

            var redLine = new Kinetic.Line({
                points: kineticLinePoints,
                stroke: "red",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = Curves.chaikinCurve.subdivide(Curves.simplifiedPoints, 4);
            console.log('number of curve Points = ' + JSON.stringify(curvePoints.length));

            for (var j in curvePoints) {
                plotpoints.push(curvePoints[j].x);
                plotpoints.push(curvePoints[j].y);
            }
            var blueLine = new Kinetic.Line({
                points: plotpoints,
                stroke: "#ADD8E6",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });

            Curves.controlLineLayer.add(blueLine);
            Curves.controlLineLayer.drawScene();
            Curves.controlPointLayer.drawScene();
            Curves.stage.add(Curves.controlPointLayer);
            Curves.stage.add(Curves.controlLineLayer);
        };

        CurveControl.prototype.updateControlLines = function () {
            Curves.controlLineLayer.removeChildren();
            Curves.controlPointLayer.drawScene();
            var simplifiedPoints = new Array();

            var kineticLinePoints = [];
            for (var i in Curves.kineticControlPoints) {
                var x = Curves.kineticControlPoints[i].getAbsolutePosition().x;
                var y = Curves.kineticControlPoints[i].getAbsolutePosition().y;

                var point = new PolygonSubdivision.Point(x, y);
                simplifiedPoints.push(point);
                kineticLinePoints.push(x);
                kineticLinePoints.push(y);
            }

            var redLine = new Kinetic.Line({
                points: kineticLinePoints,
                stroke: "red",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = Curves.chaikinCurve.subdivide(simplifiedPoints, 7);
            console.log('number of curve Points = ' + JSON.stringify(curvePoints.length));

            for (var j in curvePoints) {
                plotpoints.push(curvePoints[j].x);
                plotpoints.push(curvePoints[j].y);
            }
            var blueLine = new Kinetic.Line({
                points: plotpoints,
                stroke: "#ADD8E6",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });

            Curves.controlLineLayer.add(blueLine);
            Curves.controlLineLayer.drawScene();
            //stage.add(controlLineLayer);
        };

        CurveControl.prototype.drawBesizerCurve = function (event) {
            /*
            controlPoints.startPoint.on('touchstart mousedown', function () {
            controlPoints.main.createBall();
            });
            
            
            
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
            
            // layer.add(controlPoints.point1);
            layer.add(controlPoints.point2);
            layer.add(controlPoints.endPoint);
            
            
            
            //layer.add(circle);
            stage.add(layer);
            // kineticCurve.createAnchor(10, 10);
            // kineticCurve.drawCurves();
            /// var jsonString = JSON.stringify(kineticCurve);
            // console.log(jsonString);
            */
        };

        CurveControl.prototype.drawLine = function (event) {
            Curves.lineTolerance = 0;

            Curves.polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            Curves.stage.clear();
            Curves.drawPoints.length = 0;
            var layer = new Kinetic.Layer();
            var background = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: Curves.stage.getWidth(),
                height: Curves.stage.getHeight(),
                fill: "white"
            });
            layer.add(background);
            layer.draw();
            Curves.stage.add(layer);
            layer.draw();

            // a flag we use to see if we're dragging the mouse
            var isMouseDown = false;

            // a reference to the line we are currently drawing
            var newline;

            // a reference to the array of points making newline
            var points = new Array();
            var tempPoints = [];

            // on the background
            // listen for mousedown, mouseup and mousemove events
            background.on('mousedown', function () {
                isMouseDown = true;
                console.log('mouse down');
                tempPoints = [];
                Curves.drawPoints.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                points.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                tempPoints = [];
                tempPoints.push(Curves.stage.getPointerPosition().x);
                tempPoints.push(Curves.stage.getPointerPosition().y);
                var line = new Kinetic.Line({
                    points: tempPoints,
                    stroke: "blue",
                    strokeWidth: 1,
                    lineCap: 'round',
                    lineJoin: 'round'
                });
                layer.add(line);

                newline = line;
            });
            background.on('mouseup', function () {
                isMouseDown = false;

                var newpoints = Curves.polylineSimplify.simplify(points, Curves.lineTolerance, true);
            });
            background.on('mousemove', function () {
                if (!isMouseDown) {
                    return;
                }
                ;

                //console.log('mouse moving' + stage.getPointerPosition().x);
                points.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                Curves.drawPoints.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                tempPoints.push(Curves.stage.getPointerPosition().x);
                tempPoints.push(Curves.stage.getPointerPosition().y);

                //newline.setPoints(points);
                // use layer.drawScene
                // this is faster since the "hit" canvas is not refreshed
                layer.drawScene();
            });
            Curves.stage.add(layer);
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
/// <reference path="./scripts/typings/polygonsubdivision.ts" />
window.addEventListener('load', function () {
    var canvas = document.getElementById('surface');
    var slopePhysics = new SlopePhysics.Main(canvas);

    // set up button events
    document.getElementById("btnReload").addEventListener("click", slopePhysics.createBall);
    document.getElementById("btnSettings").addEventListener("click", slopePhysics.settings);

    // if the user draws, reset the line smoothing range slider
    document.getElementById("btnDraw").addEventListener("click", function () {
        document.getElementById("line-tolerance-range").value = "0.0";
    });

    // set up gravity slider for event
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

    SlopePhysics.curveControl;
    SlopePhysics.subdivisionPoint;
    SlopePhysics.chaikinCurve;
    SlopePhysics.polylineSimplify;
    SlopePhysics.bezierCurve;

    var canvas;
    var stage;
    var context;
    var lineTolerance = 1.0;
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
            SlopePhysics.polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            SlopePhysics.bezierCurve = new PolygonSubdivision.BezierCurve;

            SlopePhysics.curveControl = new Curves.CurveControl('container', stageW, stageH);
            controlPoints = new ControlPoints();
            controlPoints.startPoint = SlopePhysics.curveControl.createControlPoint(10, 0);
            controlPoints.point1 = SlopePhysics.curveControl.createControlPoint(250, 800);
            controlPoints.point2 = SlopePhysics.curveControl.createControlPoint(1200, 800);
            controlPoints.endPoint = SlopePhysics.curveControl.createControlPoint(1175, 400);
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

            var lineToleranceSlider = document.getElementById("line-tolerance-range");
            lineToleranceSlider.addEventListener("mouseup", SlopePhysics.curveControl.setLineTolerance.bind(this), false);

            var drawButton = document.getElementById("btnDraw");
            drawButton.addEventListener("click", SlopePhysics.curveControl.drawLine.bind(this), false);
        }
        Main.prototype.settings = function () {
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
            SlopePhysics.curveControl.addControlPoint(100, 400);

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
            SlopePhysics.curveControl = new Curves.CurveControl('container', stageW, stageH);
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
