var CurveControl;
(function (CurveControl) {
    var ClassOne = (function () {
        function ClassOne(firstname, middleinitial, lastname) {
            this.firstname = firstname;
            this.middleinitial = middleinitial;
            this.lastname = lastname;
            this.fullname = firstname + " " + middleinitial + " " + lastname;
        }
        ClassOne.prototype.testMethod = function () {
            alert(this.fullname);
        };
        return ClassOne;
    })();
    CurveControl.ClassOne = ClassOne;
})(CurveControl || (CurveControl = {}));
//# sourceMappingURL=curvecontrol.js.map
