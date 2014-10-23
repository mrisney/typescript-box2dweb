module PolygonSubdivision {

    export interface IPoint {
        x: number;
        y: number;
    }
    export interface IWeightedPoint {
        point: Point;
        weight: number;
    }
    export class Point implements IPoint {
        constructor(public x: number, public y: number) {
        }
    }
    export class WeightedPoint implements IWeightedPoint {
        constructor(public point: Point, public weight: number) {
        }
    }
    export class ChaikinCurve {
        constructor() {
        }

        public subdivide(points: Array<Point>, epsilon: number): Array<Point> {

            do {
                var numOfPoints: number = points.length;
                // keep the first point
                points.push(points[0]);
                // for each point, create 2 points
                for (var i: number = 1; i < (numOfPoints - 1); i += 1) {
                    var j: number = i - 1;
                    // first point
                    var p1 = points[j];
                    var p2 = points[j + 1];
                    var weightedPoints: Array<WeightedPoint> = new Array<WeightedPoint>();
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
                var k: number = numOfPoints - 2;
                var p4 = points[k];
                var p5 = points[k + 1];
                var weightedPoints: Array<WeightedPoint> = new Array<WeightedPoint>();
                weightedPoints.push(new WeightedPoint(p4, 1));
                weightedPoints.push(new WeightedPoint(p5, 1));
                points.push(this.affineCombination(weightedPoints));

                // finally, push the last point
                points.push(points[numOfPoints - 1]);

                // update the points array
                for (var l = 0; l < numOfPoints; ++l)
                    points.shift();

            } while (--epsilon > 0);
            return points;
        }

        private affineCombination(weightedPoints: Array<WeightedPoint>): Point {
            var result: Point = new Point(0, 0);
            var sum: number = 0;

            for (var i = 0; i < weightedPoints.length; i++) {
                sum += weightedPoints[i].weight;
            }

            for (var j: number = 0; j < weightedPoints.length; j++) {
                result = this.plus(result, this.scale(weightedPoints[j].point, weightedPoints[j].weight / sum));
            }
            return result;
        }

        private plus(point1: Point, point2: Point): Point {
            return new Point(point1.x + point2.x, point1.y + point2.y);
        }

        private scale(point: Point, scale: number) {
            return new Point(point.x * scale, point.y * scale);
        }
    }

    export class BezierCurve {
        constructor() {
        }

        public subdivide(controlPoints: Array<Point>, epsilon: number): Array<Point> {
            var results: Array<Point>;
            epsilon = epsilon / 100;
            var startPoint: Point = controlPoints[0];
            var point1: Point = controlPoints[1];
            var point2: Point = controlPoints[2];
            var endPoint: Point = controlPoints[3];

            for (var i = 0; i < epsilon; i += 0.01) {
                var ptOnCurve: Point = this.getCubicBezierPointatIndex(startPoint, point1, point2, endPoint, i);
                results.push(ptOnCurve);
            }
            return results;
        }
        public getCubicBezierPointatIndex(startPt: Point, controlPt1: Point, controlPt2: Point, endPt: Point, T: number): Point {
            var x: number = this.CubicN(T, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
            var y: number = this.CubicN(T, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
            return new Point(x, y);
        }

        private CubicN(T: number, a: number, b: number, c: number, d: number): number {
            var t2: number = T * T;
            var t3: number = t2 * T;
            return a + (-a * 3 + T * (3 * a - a * T)) * T
                + (3 * b + T * (-6 * b + b * 3 * T)) * T
                + (c * 3 - c * 3 * T) * t2
                + d * t3;
        }
    }

    export class PolylineSimplify {

        // square distance between 2 points
        private getSqDist(p1: Point, p2: Point): number {
            var dx = p1.x - p2.x,
                dy = p1.y - p2.y;
            return dx * dx + dy * dy;
        }

        // square distance from a point to a segment
        private getSqSegDist(p: Point, p1: Point, p2: Point): number {
            var x = p1.x,
                y = p1.y,
                dx = p2.x - x,
                dy = p2.y - y;

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
        }

        // basic distance-based simplification
        public simplifyRadialDist(points: Array<Point>, epsilon: number): Array<Point> {

            var prevPoint = points[0],
                newPoints = [prevPoint],
                point;

            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];

                if (this.getSqDist(point, prevPoint) > epsilon) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }

            if (prevPoint !== point) newPoints.push(point);

            return newPoints;
        }

        // classic simplification Douglas-Peucker algorithm with recursion elimination
        public simplifyDouglasPeucker(points: Array<Point>, epsilon: number) {

            var len = points.length,
                MarkerArray: Uint8Array,
                markers = new Uint8Array(len),
                first = 0,
                last = len - 1,
                stack = [],
                newPoints = [],
                i, maxSqDist, sqDist, index;

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

                if (maxSqDist > epsilon) {
                    markers[index] = 1;
                    stack.push(first, index, index, last);
                }

                last = stack.pop();
                first = stack.pop();
            }

            for (i = 0; i < len; i++) {
                if (markers[i]) newPoints.push(points[i]);
            }
            return newPoints;
        }

        // both algorithms combined for awesome performance
        public simplify(points: Array<Point>, tolerance: number, highestQuality: boolean) {
            if (points.length <= 1) return points;
            var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
            points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
            points = this.simplifyDouglasPeucker(points, sqTolerance);
            return points;
        }
    }
}