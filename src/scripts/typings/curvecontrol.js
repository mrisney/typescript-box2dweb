/// <reference path="./kinetic/kinetic.d.ts" />
/// <reference path="./polygonsubdivision.ts" />
var Curves;
(function (Curves) {
    Curves.controlPointlayer;
    Curves.subdivisionPoint;
    Curves.chaikinCurve;

    var CurveControl = (function () {
        function CurveControl(containerName, w, h) {
            this.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            this.controlPointlayer = new Kinetic.Layer();
            this.controlPoints = new Array();
            Curves.chaikinCurve = new PolygonSubdivision.ChaikinCurve();
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
            this.controlPointlayer.add(controlPoint);
            this.controlPoints.push(controlPoint);
            console.log('control points =' + JSON.stringify(this.controlPoints));
            var point1 = new PolygonSubdivision.Point(x, y);
            var point2 = new PolygonSubdivision.Point(x + 1, y + 1);
            var point3 = new PolygonSubdivision.Point(x + 2, y + 2);
            var points = new Array();
            points.push(point1);
            points.push(point2);
            points.push(point3);

            var curvePoints = Curves.chaikinCurve.subdivide(points, 7);
            console.log(curvePoints);
        };
        CurveControl.prototype.getCurvePoints = function () {
            var points = new Array();
            for (var ctrlPoint in this.controlPoints) {
                var point = new PolygonSubdivision.Point(ctrlPoint.getAttr('x'), ctrlPoint.getAttr('y'));
                points.push(point);
            }
            var curvePoints = Curves.chaikinCurve.subdivide(points, 7);
            return curvePoints;
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

        CurveControl.prototype.drawLine = function () {
            this.stage.clear();
            var layer = new Kinetic.Layer();

            var background = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: this.stage.getWidth(),
                height: this.stage.getHeight(),
                fill: "white"
            });

            var line = new Kinetic.Line({
                points: [0, 0, 50, 50],
                stroke: "red"
            });

            layer.add(background);
            layer.add(line);
            this.stage.add(layer);

            var moving = false;

            this.stage.on("mousedown", function () {
                if (moving) {
                    moving = false;
                    layer.draw();
                } else {
                    var mousePos = this.stage.getMousePosition();

                    //start point and end point are the same
                    line.points[0].x = mousePos.x;
                    line.points[0].y = mousePos.y;
                    line.points[1].x = mousePos.x;
                    line.points[1].y = mousePos.y;

                    moving = true;
                    layer.drawScene();
                }
            });

            this.stage.on("mousemove", function () {
                if (moving) {
                    var mousePos = this.stage.getMousePosition();
                    var x = mousePos.x;
                    var y = mousePos.y;
                    line.points[1].x = mousePos.x;
                    line.points[1].y = mousePos.y;
                    moving = true;
                    layer.drawScene();
                }
            });

            this.stage.on("mouseup", function () {
                moving = false;
            });

            this.stage.add(layer);
        };
        return CurveControl;
    })();
    Curves.CurveControl = CurveControl;
})(Curves || (Curves = {}));
//# sourceMappingURL=curvecontrol.js.map
