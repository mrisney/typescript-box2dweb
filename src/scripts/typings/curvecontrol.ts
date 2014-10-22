/// <reference path="./kinetic/kinetic.d.ts" />
/// <reference path="./polygonsubdivision.ts" />
module Curves {
    export var controlPointlayer: Kinetic.Layer;
    export var controlPoints: Array <PolygonSubdivision.Point>;
        
    export var subdivisionPoint: PolygonSubdivision.Point
    export var chaikinCurve: PolygonSubdivision.ChaikinCurve;
    export var polylineSimplify: PolygonSubdivision.PolylineSimplify
    export var stage: Kinetic.Stage;
    export var lineTolerance: number;
    export var drawPoints: Array<PolygonSubdivision.Point>;

    export class CurveControl {
        constructor(containerName: String, w: number, h: number) {
            stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            controlPointlayer = new Kinetic.Layer();
            controlPoints = new Array<PolygonSubdivision.Point>();

            chaikinCurve = new PolygonSubdivision.ChaikinCurve();
            drawPoints = new Array<PolygonSubdivision.Point>();
            lineTolerance = 1.0;
        }
        public addControlPoint(x: number, y: number): void {
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
            controlPointlayer.add(controlPoint);
            //controlPoints.push(controlPoint);
            // console.log('control points =' + JSON.stringify(this.controlPoints));
            var point1: PolygonSubdivision.Point = new PolygonSubdivision.Point(x, y);
            var point2: PolygonSubdivision.Point = new PolygonSubdivision.Point(x + 1, y + 1);
            var point3: PolygonSubdivision.Point = new PolygonSubdivision.Point(x + 2, y + 2);
            var points: Array<PolygonSubdivision.Point> = new Array<PolygonSubdivision.Point>();
            points.push(point1);
            points.push(point2);
            points.push(point3);

            var curvePoints: Array<PolygonSubdivision.Point> = chaikinCurve.subdivide(points, 7);
            //console.log(curvePoints);

        }
        public getCurvePoints(): Array<PolygonSubdivision.Point> {
            var points = new Array<PolygonSubdivision.Point>();
           return points;
        }

        public createControlPoint(x: number, y: number): Kinetic.Circle {
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
        }

        public setLineTolerance(event: MouseEvent): void {
            var toleranceSlider = <HTMLInputElement>document.getElementById("line-tolerance-range");
            lineTolerance = +toleranceSlider.value;
           
            controlPoints = polylineSimplify.simplify(drawPoints, lineTolerance, true);
            console.log('number of simplified points = ' + JSON.stringify(controlPoints.length));
            stage.clear(); 
            var layer = new Kinetic.Layer();
            
            var simplepoints = [];
            var kineticControlPoints = new Array<Kinetic.Circle>();


            for (var i = 0; i < controlPoints.length; i++) {
                var x = controlPoints[i].x;
                var y = controlPoints[i].y;

                simplepoints.push(x);
                simplepoints.push(y);

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
                    console.log(this.getAbsolutePosition().x);
                });
                layer.add(kineticControlPoint);
                kineticControlPoints.push(kineticControlPoint);
            }
            
         
            var line1 = new Kinetic.Line({
                points: simplepoints,
                stroke: "red",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            layer.add(line1);
            var plotpoints = [];
            var curvePoints = chaikinCurve.subdivide(controlPoints, 4);
            console.log('number of curve Points = ' + JSON.stringify(curvePoints.length));

            for (var j in curvePoints) {
                plotpoints.push(curvePoints[j].x);
                plotpoints.push(curvePoints[j].y);
            }
            var line2 = new Kinetic.Line({
                points: plotpoints,
                stroke: "blue",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });

            layer.add(line2);
            layer.drawScene();
            stage.add(layer);
        }

        public drawBesizerCurve(event: MouseEvent) {
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


        }

        public drawLine(event: MouseEvent): void {
            lineTolerance = 0;
            
            polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            stage.clear();
            drawPoints.length = 0;
            var layer = new Kinetic.Layer();
            var background = new Kinetic.Rect({
                x: 0,
                y: 0,
                width: stage.getWidth(),
                height: stage.getHeight(),
                fill: "white"
            });
            layer.add(background);
            layer.draw();
            stage.add(layer);
            layer.draw();
            // a flag we use to see if we're dragging the mouse
            var isMouseDown = false;
            // a reference to the line we are currently drawing
            var newline;
            // a reference to the array of points making newline
            var points = new Array<PolygonSubdivision.Point>();
            var tempPoints = [];

            // on the background
            // listen for mousedown, mouseup and mousemove events
            background.on('mousedown', function () {
                isMouseDown = true;
                console.log('mouse down');
                tempPoints = [];
                drawPoints.push(new PolygonSubdivision.Point(stage.getPointerPosition().x, stage.getPointerPosition().y));
                points.push(new PolygonSubdivision.Point(stage.getPointerPosition().x, stage.getPointerPosition().y));
                tempPoints = [];
                tempPoints.push(stage.getPointerPosition().x);
                tempPoints.push(stage.getPointerPosition().y);
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
                
               
                var newpoints = polylineSimplify.simplify(points, lineTolerance, true);
               
            });
            background.on('mousemove', function () {
                if (!isMouseDown) {
                    return;

                };
                //console.log('mouse moving' + stage.getPointerPosition().x);
                points.push(new PolygonSubdivision.Point(stage.getPointerPosition().x, stage.getPointerPosition().y));
                drawPoints.push(new PolygonSubdivision.Point(stage.getPointerPosition().x, stage.getPointerPosition().y));
                tempPoints.push(stage.getPointerPosition().x);
                tempPoints.push(stage.getPointerPosition().y)

                //newline.setPoints(points);
                // use layer.drawScene
                // this is faster since the "hit" canvas is not refreshed
                layer.drawScene();
            });
            stage.add(layer);
        }
    }
}

