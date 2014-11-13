/// <reference path="./kinetic/kinetic.d.ts" />
/// <reference path="./polygonsubdivision.ts" />
var Curves;
(function (Curves) {
    Curves.controlPointLayer;
    Curves.controlLineLayer;
    Curves.simplifiedPoints;
    Curves.kineticControlPoints;
    Curves.stage;
    Curves.lineTolerance;
    Curves.drawPoints;

    Curves.subdivisionPoint;
    Curves.chaikinCurve;
    Curves.polylineSimplify;

    Curves.curveControl;

    var CurveControl = (function () {
        function CurveControl(containerName, w, h) {
            Curves.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            Curves.controlPointLayer = new Kinetic.Layer();
            Curves.controlLineLayer = new Kinetic.Layer();
            Curves.simplifiedPoints = new Array();
            Curves.kineticControlPoints = new Array();

            Curves.chaikinCurve = new PolygonSubdivision.ChaikinCurve();
            Curves.polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            Curves.drawPoints = new Array();
            this.curvePoints = new Array();
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

            var point1 = new PolygonSubdivision.Point(x, y);
            var point2 = new PolygonSubdivision.Point(x + 1, y + 1);
            var point3 = new PolygonSubdivision.Point(x + 2, y + 2);
            var points = new Array();
            points.push(point1);
            points.push(point2);
            points.push(point3);

            var curvePoints = Curves.chaikinCurve.subdivide(points, 7);
        };
        CurveControl.prototype.getCurvePoints = function () {
            return this.curvePoints;
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
            this.curvePoints = Curves.simplifiedPoints;
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
            var curvePoints = Curves.chaikinCurve.subdivide(Curves.simplifiedPoints, 7);

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
                stroke: 'red',
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            Curves.controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = Curves.chaikinCurve.subdivide(simplifiedPoints, 7);
            console.log('number of curve Points = ' + JSON.stringify(curvePoints.length));
            this.curvePoints = curvePoints;

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

                //drawPoints.push(new PolygonSubdivision.Point(stage.getPointerPosition().x, stage.getPointerPosition().y));
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
//# sourceMappingURL=curvecontrol.js.map
