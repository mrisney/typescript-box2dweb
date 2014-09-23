module CurveControl {
    export class ClassOne {
        fullname: string;
        constructor(public firstname, public middleinitial, public lastname) {
            this.fullname = firstname + " " + middleinitial + " " + lastname;
        }

        testMethod(): void {
            alert(this.fullname);
        }
    }
}
