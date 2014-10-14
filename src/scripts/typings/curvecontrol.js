define(["require", "exports"], function(require, exports) {
    /// <reference path="./kinetic/kinetic.d.ts" />
    (function (Curves) {
        var CurveControl = (function () {
            function CurveControl(stageName, width, height) {
                this.stageName = stageName;
                this.width = width;
                this.height = height;
                this.w = width;
                this.h = height;
                this.stage = new Kinetic.Stage({
                    container: stageName,
                    width: width,
                    height: height
                });
            }
            return CurveControl;
        })();
        Curves.CurveControl = CurveControl;
    })(exports.Curves || (exports.Curves = {}));
    var Curves = exports.Curves;
});
//# sourceMappingURL=curvecontrol.js.map
