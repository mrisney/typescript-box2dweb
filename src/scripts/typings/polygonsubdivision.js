var PolygonSubdivision;
(function (PolygonSubdivision) {
    var Point = (function () {
        function Point(x, y) {
            this.x = x;
            this.y = y;
        }
        return Point;
    }());
    PolygonSubdivision.Point = Point;
    var WeightedPoint = (function () {
        function WeightedPoint(point, weight) {
            this.point = point;
            this.weight = weight;
        }
        return WeightedPoint;
    }());
    PolygonSubdivision.WeightedPoint = WeightedPoint;
    var ChaikinCurve = (function () {
        function ChaikinCurve() {
        }
        ChaikinCurve.prototype.subdivide = function (points, epsilon) {
            do {
                var numOfPoints = points.length;
                points.push(points[0]);
                for (var i = 1; i < (numOfPoints - 1); i += 1) {
                    var j = i - 1;
                    var p1 = points[j];
                    var p2 = points[j + 1];
                    var weightedPoints = new Array();
                    weightedPoints.push(new WeightedPoint(p1, 1));
                    weightedPoints.push(new WeightedPoint(p2, 1));
                    points.push(this.affineCombination(weightedPoints));
                    var p3 = points[j + 2];
                    weightedPoints.push(new WeightedPoint(p1, 1));
                    weightedPoints.push(new WeightedPoint(p2, 6));
                    weightedPoints.push(new WeightedPoint(p3, 1));
                    points.push(this.affineCombination(weightedPoints));
                }
                var k = numOfPoints - 2;
                var p4 = points[k];
                var p5 = points[k + 1];
                var weightedPoints = new Array();
                weightedPoints.push(new WeightedPoint(p4, 1));
                weightedPoints.push(new WeightedPoint(p5, 1));
                points.push(this.affineCombination(weightedPoints));
                points.push(points[numOfPoints - 1]);
                for (var l = 0; l < numOfPoints; ++l)
                    points.shift();
            } while (--epsilon > 0);
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
    }());
    PolygonSubdivision.ChaikinCurve = ChaikinCurve;
    var BezierCurve = (function () {
        function BezierCurve() {
        }
        BezierCurve.prototype.subdivide = function (controlPoints, epsilon) {
            var results = new Array();
            var startPoint = controlPoints[0];
            var point1 = controlPoints[1];
            var point2 = controlPoints[2];
            var endPoint = controlPoints[3];
            for (var i = 0; i < epsilon; i += 0.01) {
                var ptOnCurve = this.getCubicBezierPointatIndex(startPoint, point1, point2, endPoint, i);
                results.push(ptOnCurve);
            }
            return results;
        };
        BezierCurve.prototype.getCubicBezierPointatIndex = function (startPt, controlPt1, controlPt2, endPt, T) {
            var x = this.CubicN(T, startPt.x, controlPt1.x, controlPt2.x, endPt.x);
            var y = this.CubicN(T, startPt.y, controlPt1.y, controlPt2.y, endPt.y);
            return new Point(x, y);
        };
        BezierCurve.prototype.CubicN = function (T, a, b, c, d) {
            var t2 = T * T;
            var t3 = t2 * T;
            return a + (-a * 3 + T * (3 * a - a * T)) * T
                + (3 * b + T * (-6 * b + b * 3 * T)) * T
                + (c * 3 - c * 3 * T) * t2
                + d * t3;
        };
        return BezierCurve;
    }());
    PolygonSubdivision.BezierCurve = BezierCurve;
    var PolylineSimplify = (function () {
        function PolylineSimplify() {
        }
        PolylineSimplify.prototype.getSqDist = function (p1, p2) {
            var dx = p1.x - p2.x, dy = p1.y - p2.y;
            return dx * dx + dy * dy;
        };
        PolylineSimplify.prototype.getSqSegDist = function (p, p1, p2) {
            var x = p1.x, y = p1.y, dx = p2.x - x, dy = p2.y - y;
            if (dx !== 0 || dy !== 0) {
                var t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
                if (t > 1) {
                    x = p2.x;
                    y = p2.y;
                }
                else if (t > 0) {
                    x += dx * t;
                    y += dy * t;
                }
            }
            dx = p.x - x;
            dy = p.y - y;
            return dx * dx + dy * dy;
        };
        PolylineSimplify.prototype.simplifyRadialDist = function (points, epsilon) {
            var prevPoint = points[0], newPoints = [prevPoint], point;
            for (var i = 1, len = points.length; i < len; i++) {
                point = points[i];
                if (this.getSqDist(point, prevPoint) > epsilon) {
                    newPoints.push(point);
                    prevPoint = point;
                }
            }
            if (prevPoint !== point)
                newPoints.push(point);
            return newPoints;
        };
        PolylineSimplify.prototype.simplifyDouglasPeucker = function (points, epsilon) {
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
                if (maxSqDist > epsilon) {
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
        PolylineSimplify.prototype.simplify = function (points, tolerance, highestQuality) {
            if (points.length <= 1)
                return points;
            var sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;
            points = highestQuality ? points : this.simplifyRadialDist(points, sqTolerance);
            points = this.simplifyDouglasPeucker(points, sqTolerance);
            return points;
        };
        return PolylineSimplify;
    }());
    PolygonSubdivision.PolylineSimplify = PolylineSimplify;
})(PolygonSubdivision || (PolygonSubdivision = {}));
