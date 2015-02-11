var b2d = {
    b2Vec2: Box2D.Common.Math.b2Vec2,
    b2BodyDef: Box2D.Dynamics.b2BodyDef,
    b2Body: Box2D.Dynamics.b2Body,
    b2FixtureDef: Box2D.Dynamics.b2FixtureDef,
    b2Fixture: Box2D.Dynamics.b2Fixture,
    b2RevoluteJointDef: Box2D.Dynamics.Joints.b2RevoluteJointDef,
    b2World: Box2D.Dynamics.b2World,
    b2MassData: Box2D.Collision.Shapes.b2MassData,
    b2PolygonShape: Box2D.Collision.Shapes.b2PolygonShape,
    b2CircleShape: Box2D.Collision.Shapes.b2CircleShape,
    b2DebugDraw: Box2D.Dynamics.b2DebugDraw,
    b2Listener: Box2D.Dynamics.b2ContactListener,
};

var canvas, context, stage, world, w, h;

// globals
var curveLayer, lineLayer, anchorLayer, bezier
var objectsToDestroy = new Array();
var DEBUG = "debug" in urlParams;

// Constants
var SCALE = 32;
var GRAVITY = 100;
var FRICTION = 0.0;
var DROP_INTERVAL_MS = 1000;

var character;

var _action;

function init() {
    outlineCurve();
    stage = new createjs.Stage("canvas");
    context = document.getElementById('canvas').getContext('2d');
    w = stage.canvas.width;
    h = stage.canvas.height;

    stage.addEventListener('stagemousedown', mouseDown);
    setupPhysics();
    createjs.Ticker.addEventListener("tick", handleTick);
    createjs.Ticker.setFPS(60);
    createjs.Ticker.useRAF = true;
}


// cubic bezier T is 0-1
function getCubicBezierXYatT(startPt, controlPt1, controlPt2, endPt, T) {
    var x = CubicN(T, startPt.attrs.x, controlPt1.attrs.x, controlPt2.attrs.x, endPt.attrs.x);
    var y = CubicN(T, startPt.attrs.y, controlPt1.attrs.y, controlPt2.attrs.y, endPt.attrs.y);
    return ({x: x,y: y});
}

// cubic helper formula at T distance
function CubicN(T, a,b,c,d) {
    var t2 = T * T;
    var t3 = t2 * T;
    return a + (-a * 3 + T * (3 * a - a * T)) * T
    + (3 * b + T * (-6 * b + b * 3 * T)) * T
    + (c * 3 - c * 3 * T) * t2
    + d * t3;
}

function mouseDown(event) {
    createSnowboarder(event.stageX + 50, event.stageY);
}

function actionSelect(action) {
    _action = "_" + action;
}

function changeArc(event) {}

function p2m(x) {
    return x / SCALE;
}


function createTerrain(world, fixDef) {

    var bodyDef = new b2d.b2BodyDef;
    bodyDef.type = b2d.b2Body.b2_staticBody;
    bodyDef.userData = 'terrain';

    var fixDef = new b2d.b2FixtureDef;
    fixDef.density = 10.0;
    fixDef.friction = 0.5;
    fixDef.restitution = .5;
    fixDef.shape = new b2d.b2PolygonShape;

    var ptArray = new Array();
    var x1, y1, x2, y2;

	var curve = world.CreateBody(bodyDef);
	var ptOnCurve = getCubicBezierXYatT(bezier.start, bezier.control1, bezier.control2, bezier.end, 0);

    x1 = p2m(ptOnCurve.x);
    y1 = p2m(ptOnCurve.y);
    for (i = 0; i < 1.00; i += 0.01) {
        ptOnCurve = getCubicBezierXYatT(bezier.start, bezier.control1, bezier.control2, bezier.end, i);
        x2 = p2m(ptOnCurve.x);
        y2 = p2m(ptOnCurve.y);
        var edgeShape = new b2d.b2PolygonShape();
        edgeShape.SetAsEdge(new b2d.b2Vec2(x1, y1), new b2d.b2Vec2(x2, y2));
        curve.CreateFixture2(edgeShape);
        x1 = x2;
        y1 = y2;
    }
}

function createSnowboarder(x,y) {
    removeSnowboarders();
  	console.log("adding figure @ " +x+","+y);

    character = new Snowboarder(x,y);
    stage.addChild(character.view);
    objectsToDestroy.push(character);
}

function removeSnowboarders() {
    while (objectsToDestroy.length) {
        character = objectsToDestroy.pop();
        world.DestroyBody(character.view.body);
        world.DestroyBody(character.view.wheel1);
        world.DestroyBody(character.view.wheel2);
        stage.removeChild(character.view.label);
        stage.removeChild(character.view);
    }
}

function setupPhysics() {

    //Gravity vector x, y - 10 m/s2 - thats earth!!
	    var gravity = new b2d.b2Vec2(0, 200);

    world = new b2d.b2World(gravity , true );


    var fixDef = new b2d.b2FixtureDef;
    fixDef.density = 0.0;
    fixDef.friction = FRICTION;
    fixDef.restitution = 0.0;

    createTerrain(world, fixDef);

    //setup debug draw
    var debugDraw = new b2d.b2DebugDraw();

    stage = new createjs.Stage("canvas");
    context = document.getElementById('canvas').getContext('2d');

    debugDraw.SetSprite(stage.canvas.getContext("2d"));
    debugDraw.SetDrawScale(SCALE);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(0.8);
    debugDraw.SetFlags(b2d.b2DebugDraw.e_shapeBit | b2d.b2DebugDraw.e_jointBit);
    world.SetDebugDraw(debugDraw);
};


function draw() {
    context.clearRect(0, 0, w, h);
    var body = world.GetBodyList();
    while (body) {
        if (body.GetType() == 0) {
            var fixture = body.GetFixtureList();
            while (fixture) {
                context.beginPath();
                var vs = fixture.GetShape().GetVertices();
                for (var i = 0; i < vs.length; i++) {
                    var x = vs[i].x * SCALE
                    var y = vs[i].y * SCALE
                    if (i == 0) {
                        context.moveTo(x, y)
                    } else {
                        context.lineTo(x, y);
                    }
                }
                context.stroke();
                fixture = fixture.GetNext();
            }
        }
        body = body.GetNext();
    }
}

function handleTick() {
    world.Step(1 / 60, 10, 10); //frame-rate,velocity iterations,position iterations
    if (DEBUG) {
        world.DrawDebugData();
    } else {
        draw();
    }
    world.ClearForces();
    stage.autoClear = false;
    stage.update();
}



function updateDottedLines() {
    //var q = quad;
    var b = bezier;

    // var quadLine = lineLayer.get('#quadLine')[0];
    var bezierLine = lineLayer.get('#bezierLine')[0];

    bezierLine.setPoints([b.start.attrs.x, b.start.attrs.y, b.control1.attrs.x, b.control1.attrs.y, b.control2.attrs.x, b.control2.attrs.y, b.end.attrs.x, b.end.attrs.y]);
    lineLayer.draw();
}

function buildAnchor(x, y) {
    var anchor = new Kinetic.Circle({
        x: x,
        y: y,
        radius: 10,
        stroke: '#666',
        fill: '#ddd',
        strokeWidth: 2,
        draggable: true
    });

    // add hover styling
    anchor.on('mouseover', function () {
        document.body.style.cursor = 'pointer';
        this.setStrokeWidth(4);
        anchorLayer.draw();
    });
    anchor.on('mouseout', function () {
        document.body.style.cursor = 'default';
        this.setStrokeWidth(2);
        anchorLayer.draw();

    });

    anchor.on('dragend', function () {
        drawKineticCurves();
        updateDottedLines();
    });

    anchorLayer.add(anchor);
    return anchor;
}

function drawKineticCurves() {
    var context = curveLayer.getContext();

    context.clear();

    // draw quad
    //  context.beginPath();
    //  context.moveTo(quad.start.attrs.x, quad.start.attrs.y);
    //  context.quadraticCurveTo(quad.control.attrs.x, quad.control.attrs.y, quad.end.attrs.x, quad.end.attrs.y);
    //  context.setAttr('strokeStyle', 'red');
    //  context.setAttr('lineWidth', 4);
    //  context.stroke();

    // draw bezier
    context.beginPath();
    context.moveTo(bezier.start.attrs.x, bezier.start.attrs.y);
    context.bezierCurveTo(bezier.control1.attrs.x, bezier.control1.attrs.y, bezier.control2.attrs.x, bezier.control2.attrs.y, bezier.end.attrs.x, bezier.end.attrs.y);
    context.setAttr('strokeStyle', 'blue');
    context.setAttr('lineWidth', 2);
    context.stroke();
}


function outlineCurve() {
    var stage = new Kinetic.Stage({
        container: 'container',
        width: 1200,
        height: 800,

    });





    anchorLayer = new Kinetic.Layer();
    lineLayer = new Kinetic.Layer;
    // curveLayer just contains a canvas which is drawn
    // onto with the existing canvas API
    curveLayer = new Kinetic.Layer();

    //curveLayer.getCanvas()._canvas = document.getElementById('canvas');

    //anchorLayer.getCanvas()._canvas = document.getElementById('canvas');

    //lineLayer.getCanvas()._canvas = document.getElementById('canvas');

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

    // add dotted line connectors
    // lineLayer.add(quadLine);
    lineLayer.add(bezierLine);

    //  quad = {
    //    start: buildAnchor(-10, 0),
    //    control: buildAnchor(600, 375),
    //    end: buildAnchor(1200, 10)
    //  };

    bezier = {
        start: buildAnchor(10, 0),
        control1: buildAnchor(250, 800),
        control2: buildAnchor(1200, 800),
        end: buildAnchor(1175, 400)
    };

    // keep curves insync with the lines
    anchorLayer.on('beforeDraw', function () {
        drawKineticCurves();
        updateDottedLines();
        //setupPhysics();
        //createSnowboarder();
    });

    anchorLayer.on('dragend', function () {
        setupPhysics();
    });

    stage.add(curveLayer);
    stage.add(lineLayer);
    stage.add(anchorLayer);

    drawKineticCurves();
    updateDottedLines();
    setupPhysics();
};
