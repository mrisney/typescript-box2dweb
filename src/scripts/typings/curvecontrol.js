var Curves;
(function (Curves) {
    var CurveControl = (function () {
        function CurveControl(containerName, w, h) {
            Curves.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            Curves.controlPointLayer = new Kinetic.Layer();
            Curves.controlLineLayer = new Kinetic.Layer();
            Curves.simplifiedPoints = new Array();
            Curves.kineticControlPoints = new Array();
            Curves.chaikinCurve = new PolygonSubdivision.ChaikinCurve();
            Curves.bezierCurve = new PolygonSubdivision.BezierCurve();
            Curves.polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            Curves.drawPoints = new Array();
            this.curvePoints = new Array();
            this.controlPoints = new Array();
            Curves.lineTolerance = 1.0;
            Curves.curveControl = this;
        }
        CurveControl.prototype.getCurvePoints = function () {
            return this.curvePoints;
        };
        CurveControl.prototype.renderControlPoints = function () {
            console.log('hiding control points');
            Curves.stage.clear();
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
        CurveControl.prototype.setLineTolerance = function (lineTolerance) {
            Curves.simplifiedPoints = Curves.polylineSimplify.simplify(Curves.drawPoints, lineTolerance, true);
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
                kineticControlPoint.on('dragmove  touchmove', function () {
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
            var customEvent = document.createEvent('CustomEvent');
            customEvent.initCustomEvent('pointEditListener', true, true, curvePoints);
            document.dispatchEvent(customEvent);
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
            var event = document.createEvent('CustomEvent');
            event.initCustomEvent('pointEditListener', true, true, curvePoints);
            document.dispatchEvent(event);
        };
        CurveControl.prototype.drawBesizerCurve = function (controlPoints) {
            this.controlPoints = controlPoints;
            var curvePoints = Curves.bezierCurve.subdivide(controlPoints, 1);
            return curvePoints;
        };
        CurveControl.prototype.drawLine = function () {
            Curves.lineTolerance = 0;
            Curves.stage.clear();
            Curves.drawPoints.length = 0;
            var layer = new Kinetic.Layer();
            var background = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: Curves.stage.getWidth(),
                height: Curves.stage.getHeight(),
                fill: "transparent"
            });
            layer.add(background);
            layer.draw();
            Curves.stage.add(layer);
            layer.draw();
            var isMouseDown = false;
            var newline;
            var points = new Array();
            var tempPoints = [];
            background.on('mousedown touchstart', function () {
                isMouseDown = true;
                console.log('mouse down from curve control');
                tempPoints = [];
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
            background.on('mouseup touchend', function () {
                isMouseDown = false;
                console.log('mouse up from curve control');
                this.curvePoints = Curves.polylineSimplify.simplify(points, Curves.lineTolerance, true);
                var newpoints = Curves.polylineSimplify.simplify(points, Curves.lineTolerance, true);
                var event = document.createEvent('CustomEvent');
                event.initCustomEvent('pointEditListener', true, true, newpoints);
                document.dispatchEvent(event);
            });
            background.on('mousemove touchmove', function () {
                if (!isMouseDown) {
                    return;
                }
                ;
                points.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                Curves.drawPoints.push(new PolygonSubdivision.Point(Curves.stage.getPointerPosition().x, Curves.stage.getPointerPosition().y));
                tempPoints.push(Curves.stage.getPointerPosition().x);
                tempPoints.push(Curves.stage.getPointerPosition().y);
                layer.drawScene();
            });
            Curves.stage.add(layer);
            return points;
        };
        return CurveControl;
    }());
    Curves.CurveControl = CurveControl;
})(Curves || (Curves = {}));
