/// <reference path="./kinetic/kinetic.d.ts" />

module CurveControl {
    export class KineticCurve {
        w: number;
        h: number;
        stage: Kinetic.Stage;
        anchorLayer: Kinetic.Layer;
        lineLayer: Kinetic.Layer;
        curveLayer: Kinetic.Layer;
        bezierPts;

        constructor(public stageName, public width, public height) {
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

        createAnchor(x, y): Kinetic.Circle {
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
        }

        drawKineticCurves(): void {
            var context = this.curveLayer.getContext();
            context.clear();
            // draw bezier
            context.beginPath();
            // context.moveTo(this.bezierPts[0].start.attrs.x, bezierPts[0].start.attrs.y);
            //context.bezierCurveTo(bezier.control1.attrs.x, bezier.control1.attrs.y, bezier.control2.attrs.x, bezier.control2.attrs.y, bezier.end.attrs.x, bezier.end.attrs.y);
            //context.setAttr('strokeStyle', 'blue');
            //context.setAttr('lineWidth', 2);
            //context.stroke();

        }

        updateDottedLines(): void {
            //var q = quad;
            var b = this.bezierPts;

            // var quadLine = lineLayer.get('#quadLine')[0];
            //var bezierLine = this.lineLayer.get('#bezierLine')[0];

            //bezierLine.setPoints([b.start.attrs.x, b.start.attrs.y, b.control1.attrs.x, b.control1.attrs.y, b.control2.attrs.x, b.control2.attrs.y, b.end.attrs.x, b.end.attrs.y]);
            //lineLayer.draw();
        }



        drawCurves(): void {
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
        }
    }
}
