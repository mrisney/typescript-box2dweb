/// <reference path="./kinetic/kinetic.d.ts" />
module Curves {
    export var controlPointlayer: Kinetic.Layer;
    export class CurveControl {
        public stage: Kinetic.Stage;
        public controlPointlayer: Kinetic.Layer;

        constructor(containerName: String, w: number, h: number) {
            this.stage = new Kinetic.Stage({ container: containerName, width: w, height: h });
            controlPointlayer = new Kinetic.Layer();
        }
        public createControlPoint(x: number, y: number): Kinetic.Circle {
            var controlPoint = new Kinetic.Circle({
                x: x,
                y: y,
                radius: 10,
                stroke: '#666',
                fill: '#ddd',
                strokeWidth: 2,
                draggable: true
            });

            return controlPoint;
        }
    }
}

