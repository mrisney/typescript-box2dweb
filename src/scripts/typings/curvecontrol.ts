﻿/// <reference path="./kinetic/kinetic.d.ts" />
/// <reference path="./polygonsubdivision.ts" />
module Curves {
    export var controlPointLayer: Kinetic.Layer;
    export var controlLineLayer: Kinetic.Layer;
    export var simplifiedPoints: Array<PolygonSubdivision.Point>;
    export var kineticControlPoints: Array<Kinetic.Circle>;
    export var stage: Kinetic.Stage;
    export var lineTolerance: number;
    export var drawPoints: Array<PolygonSubdivision.Point>;
     
    export var subdivisionPoint: PolygonSubdivision.Point
    export var chaikinCurve: PolygonSubdivision.ChaikinCurve;
    export var polylineSimplify: PolygonSubdivision.PolylineSimplify

    export var curveControl: Curves.CurveControl;

    export class CurveControl {
        public curvePoints: Array<PolygonSubdivision.Point>;
        constructor(containerName: String, w: number, h: number) {
            stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            controlPointLayer = new Kinetic.Layer();
            controlLineLayer = new Kinetic.Layer();
            simplifiedPoints = new Array<PolygonSubdivision.Point>();
            kineticControlPoints = new Array<Kinetic.Circle>();

            chaikinCurve = new PolygonSubdivision.ChaikinCurve();
            polylineSimplify = new PolygonSubdivision.PolylineSimplify();
            drawPoints = new Array<PolygonSubdivision.Point>();
            this.curvePoints = new Array<PolygonSubdivision.Point>();
            lineTolerance = 1.0;
            curveControl = this;
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
            controlPointLayer.add(controlPoint);

            var point1: PolygonSubdivision.Point = new PolygonSubdivision.Point(x, y);
            var point2: PolygonSubdivision.Point = new PolygonSubdivision.Point(x + 1, y + 1);
            var point3: PolygonSubdivision.Point = new PolygonSubdivision.Point(x + 2, y + 2);
            var points: Array<PolygonSubdivision.Point> = new Array<PolygonSubdivision.Point>();
            points.push(point1);
            points.push(point2);
            points.push(point3);

            var curvePoints: Array<PolygonSubdivision.Point> = chaikinCurve.subdivide(points, 7);

        }
        public getCurvePoints(): Array<PolygonSubdivision.Point> {
            return this.curvePoints;
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
            simplifiedPoints = polylineSimplify.simplify(drawPoints, lineTolerance, true);
            this.curvePoints = simplifiedPoints; 
            stage.clear();
            controlLineLayer.removeChildren();
            controlPointLayer.removeChildren();
            var kineticLinePoints = [];
            kineticControlPoints.length = 0;

            for (var i = 0; i < simplifiedPoints.length; i++) {
                var x = simplifiedPoints[i].x;
                var y = simplifiedPoints[i].y;

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
                    curveControl.updateControlLines();
                });
                kineticControlPoints.push(kineticControlPoint);
                controlPointLayer.add(kineticControlPoint);
            }

            var redLine = new Kinetic.Line({
                points: kineticLinePoints,
                stroke: "red",
                strokeWidth: 1,
                lineCap: 'round',
                lineJoin: 'round'
            });
            controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = chaikinCurve.subdivide(simplifiedPoints, 7);

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

            controlLineLayer.add(blueLine);
            controlLineLayer.drawScene();
            controlPointLayer.drawScene();
            stage.add(controlPointLayer);
            stage.add(controlLineLayer);
        }

        public updateControlLines(): void {

            controlLineLayer.removeChildren();
            controlPointLayer.drawScene();
            var simplifiedPoints = new Array<PolygonSubdivision.Point>();

            var kineticLinePoints = [];
            for (var i in kineticControlPoints) {
                var x = kineticControlPoints[i].getAbsolutePosition().x;
                var y = kineticControlPoints[i].getAbsolutePosition().y;

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
            controlLineLayer.add(redLine);
            var plotpoints = [];
            var curvePoints = chaikinCurve.subdivide(simplifiedPoints, 7);
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

            controlLineLayer.add(blueLine);
            controlLineLayer.drawScene();
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
                //drawPoints.push(new PolygonSubdivision.Point(stage.getPointerPosition().x, stage.getPointerPosition().y));
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

