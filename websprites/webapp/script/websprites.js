
function testDraw(canvas) {
	var display = new Display(canvas);
	
//	var v1 = display.createViewport("v1", 100, 80, 500, 200);
//	var v2 = display.createViewport("v2", 0, 80, 98, 200);
//	
//	v1.setScrollOffset(-20, -30);
//	v2.setScrollOffset(0, -30);
	
	var star = (function(c) {c.transform(1, 0, 0, 1, -110, -110); c.moveTo(210.0,110.0);c.lineTo(210.0,110.0);c.lineTo(44.5139266054715,185.57495743542586);c.lineTo(95.76851617267148,11.017855811906728);c.lineTo(194.1253532831181,164.06408174555975);c.lineTo(14.050702638550263,138.17325568414296);c.lineTo(151.5415013001886,19.03680046454815);c.lineTo(151.54150130018866,200.96319953545185);c.lineTo(14.050702638550248,81.82674431585706);c.lineTo(194.1253532831181,55.93591825444025);c.lineTo(95.7685161726715,208.9821441880933);c.lineTo(44.51392660547148,34.425042564574184);c.lineTo(210.0,110.0);c.stroke(); });
	
	var box = function(c) {
		c.beginPath();
		c.moveTo(0, -8);
		c.lineTo(8, 0);
		c.lineTo(0, 8);
		c.lineTo(-8, 0);
		c.closePath();
		c.stroke();
	}
	
	var p1 = display.createPoint();
	var p2 = display.createPoint();
	var p3 = display.createPoint();

	var d = display.createDistance(p1, p2);
	var a = display.createVectorAngle(p1, p2);
	
	var bar = display.createShape();
	bar.activeRotation(a);
	
	bar.beginPath();
	bar.moveTo(0, -5);
	bar.lineTo(d, -5);
	bar.lineTo(d, 5);
	bar.lineTo(0, 5);
	bar.closePath();
	bar.stroke();
	
	display.createSprite(p1, bar);
	p1.moveTo(100,100);
	p2.moveTo(300,200);
	
	var shape = display.createShape();
	box(shape);
//	star(shape);
	
	var boxShape = display.createShape();
	box(boxShape);
	
	var builder = new RegionBuilder();
	builder.beginPath();
	builder.moveTo(0, -8);
	builder.lineTo(8, 0);
	builder.lineTo(0, 8);
	builder.lineTo(-8, 0);
	builder.closePath();
	var region = builder.getRegion();
	
	display.createHandle(p1, region);
	display.createSprite(p1, shape);
	
	display.createHandle(p2, region);
	display.createSprite(p2, shape);
	
	p1.moveTo(100, 100);
	p2.moveTo(300, 110);
	
	var h3 = display.createHandle(p3, region);
	display.createSprite(p3, boxShape);
	
// 	p3.setConstraint(display.createConstraintCircle(300, 110, 105));
	
	p3.moveTo(400, 150);
	
	var line = display.createLineThroughPoints(p1, p2);
	var p4 = display.createPointOnLine(line);
	p4.setDistance(50);
	display.createSprite(p4, boxShape);
	display.createHandle(p4, region);
	
	display.update();
}

function extend(sub, base) {
	// Avoid instantiating the base class just to setup inheritance
	// See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/create
	// for a polyfill
	// Also, do a recursive merge of two prototypes, so we don't overwrite 
	// the existing prototype, but still maintain the inheritance chain
	// Thanks to @ccnokes
	var origProto = sub.prototype;
	sub.prototype = Object.create(base.prototype);
	for (var key in origProto)  {
		sub.prototype[key] = origProto[key];
	}
	// Remember the constructor property was set wrong, let's fix it
	sub.prototype.constructor = sub;
	// In ECMAScript5+ (all modern browsers), you can make the constructor property
	// non-enumerable if you define it like this instead
	Object.defineProperty(sub.prototype, 'constructor', { 
		enumerable: false, 
		value: sub 
	});
}

function Display(canvas) {
	this.canvas = canvas;
	this.context = canvas.getContext('2d');
	this.viewports = {};
	this.nextId = 0;
	this.handles = [];
	this.sprites = [];
	
	var self = this;
	this.canvas.addEventListener('mousedown', function(event) {self.onMouseDown(event); }, false);
	this.canvas.addEventListener('mouseup', function(event) {self.onMouseUp(event); }, false);
	this.canvas.addEventListener('mousemove', function(event) {self.onMouseMove(event); }, false);
	
	this.drag = null;
	this.invalidRect = new Rect(0, 0, canvas.width, canvas.width);
}

Display.prototype = {
	
	createId: function() {
		return "e" + this.nextId++;
	},
	
	createHandle: function(point, area) {
		var id = this.createId();
		var result = new Handle(this, id, point, area);
		this.handles.push(result);
		return result;
	},

	createShape: function() {
		return new Shape();
	},
	
	createPoint: function() {
		return new Point(this.createId());
	},
	
	createDirection: function(p1, p2) {
		return new Direction(this.createId(), p1, p2);
	},
	
	createLineThroughPoints: function(p1, p2) {
		return this.createLineBaseDirection(p1, this.createDirection(p1, p2));
	},
	
	createLineBaseDirection: function(p1, p2) {
		return new Line(this.createId(), p1, p2);
	},
	
	createPointOnLine: function(line) {
		return new PointOnLine(this.createId(), line);
	},
	
	createDistance: function(p1, p2) {
		return new PointDistance(this.createId(), p1, p2);
	},
	
	createVectorAngle: function(p1, p2) {
		return new VectorAngle(this.createId(), p1, p2);
	},
	
	createConstraintCircle: function(x, y, r) {
		return new ConstraintCircle(this.createId(), x, y, r);
	},
	
	createSprite: function(point, shape) {
		var id = this.createId();
		var result = new Sprite(this, id, point, shape);
		this.sprites.push(result);
		return result;
	},
	
	onMouseDown: function(event) {
		var pos = this.getMousePos(event);
		
		for (var n = 0, cnt = this.handles.length; n < cnt; n++) {
			var handle = this.handles[n];
			if (handle.containsCoordinate(pos.x, pos.y)) {
				this.drag = handle.createDrag(pos);
				break;
			}
		}
	},

	onMouseUp: function(event) {
		this.drag = null;
	},
	
	onMouseMove: function(event) {
		if (this.drag != null) {
			var pos = this.getMousePos(event);
			this.drag.moveToCoordinate(pos);
			
			this.update();
		}
	},

	getMousePos: function(event) {
		var rect = this.canvas.getBoundingClientRect();
		var x = event.clientX - rect.left;
		var y = event.clientY - rect.top;
		return new Coordinate(x, y);
	},
	
	createViewport: function(id, x, y, width, height) {
		var result = new ViewPort(this.context, id, x, y, width, height);
		this.viewports[id] = result;
		return result;
	},
	
	invalidate: function(rect) {
		if (this.invalidRect == null) {
			this.invalidRect = rect.copy();
		} else {
			this.invalidRect.joinRect(rect);
		}
	},
	
	update: function() {
		if (this.invalidRect == null) {
			return;
		}
		
		var context = this.context;
		context.save();
		this.invalidRect.grow(5);
		Util.clipRect(context, this.invalidRect);
		Util.clearRect(context, this.invalidRect);

		// Debug update region.
//		context.rect(this.invalidRect.x1, this.invalidRect.y1, this.invalidRect.x2 - this.invalidRect.x1, this.invalidRect.y2 - this.invalidRect.y1);
//		context.stroke();
		
		for (var n = 0, cnt = this.sprites.length; n < cnt; n++) {
			var sprite = this.sprites[n];
			sprite.render(context);
		}
		context.restore();
		
		this.invalidRect = null;
	}
}

function ViewPort(context, id, x1, y1, x2, y2) {
	this.context = context;
	this.id = id;
	this.x1 = x1;
	this.y1 = y1;
	this.x2 = x2;
	this.y2 = y2;
	
	this.fillStyle = "white"
	
	this.offsetX = 0;
	this.offsetY = 0;
	
	this.shape = new Shape();
}

ViewPort.prototype = {
	
	setBackground: function(fillStyle) {
		this.fillStyle = fillStyle;
	},
	
	setScrollOffset: function(offsetX, offsetY) {
		this.offsetX = offsetX;
		this.offsetY = offsetY;
	},
	
	update: function() {
		var context = this.context;
		
		context.save();
		
		var x1 = this.x1;
		var x2 = this.x2;
		var y1 = this.y1;
		var y2 = this.y2;
		
		var width = x2 - x1;
		var height = y2 - y1;
		
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(x1, y1, width, height);
		
		context.beginPath();
		context.moveTo(x1, y1);
		context.lineTo(x2, y1);
		context.lineTo(x2, y2);
		context.lineTo(x1, y2);
		context.closePath();
		context.clip();
		
		context.setTransform(1, 0, 0, 1, this.offsetX, this.offsetY);
		this.shape.render(context);
		
		context.restore();
	}
}

function Shape() {
	this.observableById = {};
	this.observables = [];
	this.commands = [];
	
	this.stack = [];
	this.boundingBox = null;
}

Shape.prototype = {
	save: function() {
		this.add(function(context, box) {context.save(); });
		this.stack.push(this.t.copy());
	},
	
	restore: function() {
		this.add(function(context, box) {context.restore(); });
		this.t = this.stack.pop();
	},
	
	beginPath: function() {
		this.add(function(context, box) {context.beginPath(); });
	},
	
	moveTo: function(x, y) {
		if (this.addObservable(x) | this.addObservable(y)) {
			var self = this;
			this.add(
				function(context, box) {
					var xValue = self.valueScalar(x);
					var yValue = self.valueScalar(y);
					context.moveTo(xValue, yValue); 
					box.addPoint(xValue, yValue);
				}
			);
		} else {
			this.add(
				function(context, box) {
					context.moveTo(x, y); 
					box.addPoint(x, y);
				}
			);
		}
	},

	lineTo: function(x, y) {
		if (this.addObservable(x) | this.addObservable(y)) {
			var self = this;
			this.add(
				function(context, box) {
					var xValue = self.valueScalar(x);
					var yValue = self.valueScalar(y);
					context.lineTo(xValue, yValue); 
					box.addPoint(xValue, yValue);
				}
			);
		} else {
			this.add(
				function(context, box) {
					context.lineTo(x, y); 
					box.addPoint(x, y);
				}
			);
		}
	},
	
	rect: function(x, y, w, h) {
		if (this.addObservable(x) | this.addObservable(y) |
			this.addObservable(w) | this.addObservable(h)) {
			var self = this;
			this.add(
				function(context, box) {
					var xValue = self.valueScalar(x);
					var yValue = self.valueScalar(y);
					var wValue = self.valueScalar(w);
					var hValue = self.valueScalar(h);
					context.rect(xValue, yValue, wValue, hValue); 
					box.addPoint(xValue, yValue); 
					box.addPoint(xValue + wValue, yValue + hValue);
				}
			);
		} else {
			this.add(
				function(context, box) {
					context.rect(x, y, w, h); 
					box.addPoint(x, y); 
					box.addPoint(x+ w, y + h);
				}
			);
		}
	},
	
	addObservable: function(observable) {
		if (typeof(observable) == "number") {
			return false;
		}
		
		this.observableById[observable.id] = observable;
		this.observables.push(observable);
		return true;
	},
	
	valueScalar: function(scalar) {
		if (typeof(scalar) == "number") {
			return scalar;
		} else {
			return scalar.getValue();
		}
	},
	
	transform: function(a, b, c, d, e, f) {
		this.add(function(context, box) {context.transform(a, b, c, d, e, f); box.transform(a, b, c, d, e, f); });
	},
	
	activeOrigin: function(point) {
		this.addObservable(point);
		this.add(
			function(context, box) {
				var coordinate = point.getValue();
				var x = coordinate.x;
				var y = coordinate.y;
				context.transform(1, 0, 0, 1, x, y); 
				box.transform(1, 0, 0, 1, x, y);
			}
		);
	},
	
	activeRotation: function(angle) {
		this.addObservable(angle);
		this.add(
			function(context, box) {
				var alpha = angle.getValue();
				var cos = Math.cos(alpha);
				var sin = Math.sin(alpha);
				context.transform(cos, sin, -sin, cos, 0, 0); 
				box.transform(cos, sin, -sin, cos, 0, 0);
			}
		);
	},
	
	closePath: function() {
		this.add(function(context, box) {context.closePath(); });
	},
	
	stroke: function() {
		this.add(function(context, box) {context.stroke(); });
	},
	
	render: function(context, box) {
		context.beginPath();
		for (var n = 0, cnt = this.commands.length; n < cnt; n++) {
			var command = this.commands[n];
			command(context, box);
		}
		// Apply missing restores.
		for (var n = this.stack.length; n > 0; n--) {
			context.restore();
		}
	},
	
	add: function(command) {
		this.commands.push(command);
	}
	
}

function BoundingBox() {
	this.t = new Transform(1, 0, 0, 1, 0, 0);
	this.rect = null;
}

BoundingBox.prototype = {
	addPoint: function(x, y) {
		var tx = this.t.transformX(x, y);
		var ty = this.t.transformY(x, y);
		if (this.rect == null) {
			this.rect = new Rect(tx, ty, tx, ty);
		} else {
			this.rect.joinPoint(tx, ty);
		}
	},
	
	transform: function(a, b, c, d, e, f) {
		this.t.apply(a, b, c, d, e, f);
	},
	
	popRect: function() {
		var result = this.rect;
		this.clear();
		return result;
	},
	
	clear: function() {
		this.rect = null;
		this.t.set(1, 0, 0, 1, 0, 0);
	}
}

function Sprite(display, id, point, shape) {
	AbstractListener.call(this);
	
	this.display = display;
	this.id = id;
	this.point = point;
	this.shape = shape;
	this.box = new BoundingBox();
	this.isAttached = false;
}

Sprite.prototype = {
	render: function(context) {
		context.save();
		this.box.clear();
		var x = this.point.getX();
		var y = this.point.getY();
		context.setTransform(1, 0, 0, 1, x, y);
		this.box.transform(1, 0, 0, 1, x, y);
		this.shape.render(context, this.box);
		context.restore();
		
		this.attach();
	},
	
	attach: function() {
		this.isAttached = true;
		
		this.point.addListener(this);
		
		var observables = this.shape.observables;
		for (var n = 0, cnt = observables.length; n < cnt; n++) {
			var observable = observables[n];
			
			observable.addListener(this);
		}
	},
	
	notifyChanged: function(event) {
		this.invalidate();
	},
	
	detach: function() {
		this.point.removeListener(this);
		
		var observables = this.shape.observables;
		for (var n = 0, cnt = observables.length; n < cnt; n++) {
			var observable = observables[n];
			
			observable.removeListener(this);
		}
		
		this.isAttached = false;
	},
	
	invalidate: function() {
		if (!this.isAttached) {
			return;
		}
		this.detach();
		var rect = this.box.popRect();
		if (rect != null) {
			this.display.invalidate(rect);
		}
	}
	
}

extend(Sprite, AbstractListener);

function Handle(display, id, point, area) {
	this.display = display;
	this.id = id;
	this.point = point;
	this.area = area;
}

Handle.prototype = {
	
	moveToCoordinate: function(coordinate) {
		this.point.moveToCoordinate(coordinate);
	},

	containsCoordinate: function(x, y) {
		var deltaX = x - this.point.getX();
		var deltaY = y - this.point.getY();
		
		return this.area.containsCoordinate(deltaX, deltaY);
	},
	
	createDrag: function(mouseCoordinate) {
		return new Drag(this, mouseCoordinate, this.point.copyCoordinate());
	}
	
}

function Drag(handle, mouseStartCoordinate, handleStartCoordinate) {
	this.handle = handle;
	this.mouseStartCoordinate = mouseStartCoordinate;
	this.handleStartCoordinate = handleStartCoordinate;
}

Drag.prototype = {
	moveToCoordinate: function(mouseCoordinate) {
		var p = mouseCoordinate.copy();
		p.subCoordinate(this.mouseStartCoordinate);
		p.addCoordinate(this.handleStartCoordinate);
		this.handle.moveToCoordinate(p);
	}
}

function ConstraintCircle(id, x, y, r) {
	AbstractObservable.call(this);
	
	this.id = id;
	this.center = new Coordinate(x, y);
	this.r = r;
}

ConstraintCircle.prototype = {
	applyConstraint: function(current) {
		var p = current.copy();
		p.subCoordinate(this.center);
		var length = p.getLength();
		if (length < 0.5) {
			p.setCoordinate(this.center);
			p.addX(this.r);
		} else {
			p.multiply(this.r / length);
			p.addCoordinate(this.center);
		}
		return p;
	}
}

NO_CONSTRAINT = {
	applyConstraint: function(p) {
		return p;
	}
}

function Rect(x1, y1, x2, y2) {
	if (x1 < x2) {
		this.x1 = x1;
		this.x2 = x2;
	} else {
		this.x1 = x2;
		this.x2 = x1;
	}
	if (y1 < y2) {
		this.y1 = y1;
		this.y2 = y2;
	} else {
		this.y1 = y2;
		this.y2 = y1;
	}
}

Rect.prototype = {
	setTopLeft: function(x, y) {
		this.x1 = x
		this.y1 = y
	},
	
	setBottomRight: function(x, y) {
		this.x2 = x
		this.y2 = y
	},
	
	containsCoordinate: function(x, y) {
		if (x < this.x1) {
			return false;
		}
		if (y < this.y1) {
			return false;
		}
		if (x > this.x2) {
			return false;
		}
		if (y > this.y2) {
			return false;
		}
		return true;
	},
	
	joinRect: function(other) {
		this.x1 = Math.min(this.x1, other.x1);
		this.y1 = Math.min(this.y1, other.y1);
		this.x2 = Math.max(this.x2, other.x2);
		this.y2 = Math.max(this.y2, other.y2);
	},
	
	joinPoint: function(x, y) {
		this.x1 = Math.min(this.x1, x);
		this.y1 = Math.min(this.y1, y);
		this.x2 = Math.max(this.x2, x);
		this.y2 = Math.max(this.y2, y);
	},
	
	createTranslated: function(coordinate) {
		return copy().translate(coordinate);
	},

	copy: function() {
		return new Rect(this.x1, this.y1, this.x2, this.y2);
	},
	
	translate: function(coordinate) {
		this.x1 += coordinate.x;
		this.x2 += coordinate.x;
		this.y1 += coordinate.y;
		this.y2 += coordinate.y;
	},
	
	translateBack: function(coordinate) {
		this.x1 -= coordinate.x;
		this.x2 -= coordinate.x;
		this.y1 -= coordinate.y;
		this.y2 -= coordinate.y;
	},
	
	grow: function(delta) {
		this.x1 -= delta;
		this.y1 -= delta;
		this.x2 += delta;
		this.y2 += delta;
	}
	
}

/**
 * Coordinate in the two-dimensional space.
 */
function Coordinate(x, y) {
	this.x = x;
	this.y = y;
}

Coordinate.prototype = {
	set: function(x, y) {
		this.x = x;
		this.y = y;
	},

	copy: function() {
		return new Coordinate(this.x, this.y);
	},
	
	getLength: function() {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	},
	
	getAngle: function() {
		if (this.x * this.x + this.y * this.y < 0.1) {
			return 0;
		}
		return Math.atan2(this.y, this.x);
	},
	
	scalarProduct: function(vector) {
		return this.x * vector.x + this.y * vector.y;
	},
	
	setCoordinate: function(coordinate) {
		this.x = coordinate.x;
		this.y = coordinate.y;
	},
	
	addCoordinate: function(coordinate) {
		this.x += coordinate.x;
		this.y += coordinate.y;
	},
	
	subCoordinate: function(coordinate) {
		this.x -= coordinate.x;
		this.y -= coordinate.y;
	},
	
	setX: function(x) {
		this.x = x;
	},
	
	setY: function(x) {
		this.y = y;
	},
	
	addX: function(x) {
		this.x += x;
	},
	
	addY: function(x) {
		this.y += y;
	},
	
	subX: function(x) {
		this.x -= x;
	},
	
	subY: function(x) {
		this.y -= y;
	},
	
	multiply: function(f) {
		this.x *= f;
		this.y *= f;
	},
	
	rot90: function(f) {
		var x = this.x;
		var y = this.y;
		this.x = -y;
		this.y = x;
	},
	
	dx: function(coordinate) {
		return this.x - coordinate.x;
	},
	
	dy: function(coordinate) {
		return this.y - coordinate.y;
	}
}

function AbstractObservable() {
	this.listeners = [];
}

AbstractObservable.prototype = {
	notifyListeners: function() {
		var listeners = this.listeners.slice();
		for (var n = 0, cnt = listeners.length; n < cnt; n++) {
			var listener = listeners[n];
			listener.notifyChanged(this);
		}
	},
	
	addListener: function(newListener) {
		for (var n = 0, cnt = this.listeners.length; n < cnt; n++) {
			var listener = this.listeners[n];
			if (newListener === listener) {
				return;
			}
		}
		this.listeners.push(newListener);
	},
	
	removeListener: function(newListener) {
		for (var n = this.listeners.length - 1; n >= 0; n--) {
			var listener = this.listeners[n];
			if (newListener === listener) {
				this.listeners.splice(n, 1);
				return;
			}
		}
	}
}

function AbstractListener() {
	
}

AbstractListener.prototype = {
	notifyChanged: function(sender) {
		throw new Error("Abstract method 'notifyChanged' called.");
	}
}

/**
 * Observable Coordinate.
 */
function Point(id) {
	AbstractObservable.call(this);
	
	this.id = id;
	this.value = new Coordinate(0, 0);
	this.isValid = false;
}

Point.prototype = {
	getValue: function() {
		this.validate();
		return this.value;
	},
	
	// Only relevant for subclasses that attach to other observables.
	notifyChanged: function(sender) {
		this.invalidate();
	},

	invalidate: function() {
		if (this.isValid) {
			this.isValid = false;
			this.notifyListeners();
		}
	},
	
	validate: function() {
		if (this.isValid) {
			return;
		}
		
		this.isValid = true;
		this.adapt(this.value);
	},
	
	adapt: function(coordinate) {
		// Hook for subclasses.
	},

	copyCoordinate: function() {
		return this.getValue().copy();
	},
	
	getX: function() {
		return this.getValue().x;
	},
	
	getY: function() {
		return this.getValue().y;
	},
	
	getCoordinate: function() {
		return this.getValue();
	},
	
	moveTo: function(x, y) {
		this.moveToCoordinate(new Coordinate(x, y));
	},
	
	moveToCoordinate: function(value) {
		this.value = value;
		this.invalidate();
	}
}

extend(Point, AbstractObservable);

function Direction(id, p1, p2) {
	Point.call(this, id);
	
	this.p1 = p1;
	this.p2 = p2;
	
	this.p1.addListener(this);
	this.p2.addListener(this);
}

Direction.prototype = {
	adapt: function(value) {
		value.setCoordinate(this.p2.getCoordinate());
		value.subCoordinate(this.p1.getCoordinate());
		var length = value.getLength();
		if (length < 0.1) {
			value.set(1, 0);
		} else {
			value.multiply(1 / length);
		}
	}
}

extend(Direction, Point);

function PointOnLine(id, line) {
	Point.call(this, id);
	
	this.line = line;
	this.distance = 0;
	
	this.line.addListener(this);
}

PointOnLine.prototype = {
	adapt: function(coordinate) {
		this.line.capture(coordinate);
	},
	
	setDistance: function(distance) {
		this.distance = distance;
		this.updateCoordinate();
	},
	
	updateCoordinate: function() {
		this.moveToCoordinate(this.line.coordinateInDistance(this.distance));
	}
}

extend(PointOnLine, Point);

function DependentValue(id, dependencies) {
	AbstractObservable.call(this);
	
	this.id = id;
	this.dependencies = dependencies;
	this.isValid = false;
	this.attach();
}

DependentValue.prototype = {
	
	attach: function() {
		for (var n = 0, cnt = this.dependencies.length; n < cnt; n++) {
			var dependency = this.dependencies[n];
			dependency.addListener(this);
		}
	},
	
	detach: function() {
		for (var n = 0, cnt = this.dependencies.length; n < cnt; n++) {
			var dependency = this.dependencies[n];
			dependency.removeListener(this);
		}
	},
	
	notifyChanged: function(sender) {
		this.invalidate();
	},

	invalidate: function() {
		if (this.isValid) {
			this.isValid = false;
			this.notifyListeners();
		}
	},
	
	validate: function() {
		if (this.isValid) {
			return;
		}
		this.isValid = true;
		this.update();
	},
	
	update: function() {
		// Hook for subclasses.
	},
	
	dispose: function() {
		this.detach();
	}
	
}

extend(DependentValue, AbstractObservable);

function Line(id, base, direction) {
	DependentValue.call(this, id, [base, direction]);
	
	this.base = base;
	this.direction = direction;
}

Line.prototype = {
	getBase: function() {
		this.validate();
		return this.base;
	},
	
	getDirection: function() {
		this.validate();
		return this.direction;
	},
	
	invalidate: function() {
		if (this.isValid) {
			this.isValid = false;
			this.notifyListeners();
		}
	},
	
	capture: function(coordinate) {
		this.validate();
		
		// Vector from base to given coordinate
		coordinate.subCoordinate(this.base.getCoordinate());
		
		// Distance of projection to line from base.
		var distance = coordinate.scalarProduct(this.direction.getCoordinate());
		
		coordinate.setCoordinate(this.direction.getCoordinate());
		coordinate.multiply(distance);
		coordinate.addCoordinate(this.base.getCoordinate());
	},
	
	coordinateInDistance: function(distance) {
		this.validate();
		
		var coordinate = this.direction.copyCoordinate();
		coordinate.multiply(distance);
		coordinate.addCoordinate(this.base.getCoordinate());
		return coordinate;
	}
}

extend(Line, DependentValue);

function AbstractDependency(id) {
	AbstractObservable.call(this);
	
	this.id = id;
	this.isValid = false;
	this.value = null;
}

AbstractDependency.prototype = {
	
	getValue: function() {
		this.validate();
		return this.value;
	},
	
	validate: function() {
		if (this.isValid) {
			return;
		}
		this.isValid = true;
		this.update();
	},
	
	update: function() {
		throw new Error("Abstract method 'update' called.");
	},
	
	notifyChanged: function(event) {
		if (this.isValid) {
			this.isValid = false;
			this.notifyListeners(this)
		}
	}
	
}

extend(AbstractDependency, AbstractObservable);

function TwoPointDependency(id, p1, p2) {
	AbstractDependency.call(this, id);
	
	this.p1 = p1;
	this.p2 = p2;
	
	p1.addListener(this);
	p2.addListener(this);
}

TwoPointDependency.prototype = {
	dispose: function() {
		this.p1.removeListener(this);
		this.p2.removeListener(this);
	}
}

extend(TwoPointDependency, AbstractDependency);

function PointDistance(id, p1, p2) {
	TwoPointDependency.call(this, id, p1, p2);
}

PointDistance.prototype = {
	update: function() {
		var d = this.p2.copyCoordinate();
		d.subCoordinate(this.p1.getCoordinate());
		this.value = d.getLength();
	}
}

extend(PointDistance, TwoPointDependency);

function VectorAngle(id, p1, p2) {
	TwoPointDependency.call(this, id, p1, p2);
}

VectorAngle.prototype = {
	update: function() {
		var d = this.p2.copyCoordinate();
		d.subCoordinate(this.p1.getCoordinate());
		this.value = d.getAngle();
	}
}

extend(VectorAngle, TwoPointDependency);

/**
 * Observable Scalar value.
 */
function Scalar() {
	AbstractObservable.call(this);
	this.value = 0;
}

Scalar.prototype = {
	set: function(value) {
		var cnt = this.listeners.length;
		if (cnt > 0) {
			this.value = value;
			this.notifyListeners(this);
		} else {
			this.value = value;
		}
	}
}

extend(Scalar, AbstractObservable);

/**
 * Affine transformation of Coordinate instances.
 */
function Transform(a, b, c, d, e, f) {
	this.a = a;
	this.b = b;
	this.c = c;
	this.d = d;
	this.e = e;
	this.f = f;
}

Transform.prototype = {
	set: function(a, b, c, d, e, f) {
		this.a = a;
		this.b = b;
		this.c = c;
		this.d = d;
		this.e = e;
		this.f = f;
	},
	
	copy: function() {
		return new Transform(this.a, this.b, this.c, this.d, this.e, this.f);
	},
	
	transformCoordinate: function(p) {
		var x = this.transformX(p.x, p.y);
		var y = this.transformXY(p.x, p.y);
		return new Coordinate(x, y);
	},
	
	apply: function(a2, b2, c2, d2, e2, f2) {
		a1 = this.a;
		b1 = this.b;
		c1 = this.c;
		d1 = this.d;
		e1 = this.e;
		f1 = this.f;
		this.a = a1 * a2 + c1 * b2 + e1;
		this.b = b1 * a2 + d1 * b2 + f1;
		this.c = a1 * c2 + c1 * d2 + e1;
		this.d = b1 * c2 + d1 * d2 + f1;
		this.e = a1 * e2 + c1 * f2;
		this.f = b1 * e2 + d1 * f2;
	},
	
	transformX: function(x, y) {
		return this.a * x + this.c * y + this.e;
	},
	
	transformY: function(x, y) {
		return this.b * x + this.d * y + this.f;
	}
	
}

function RegionBuilder() {
	this.areas = [];
	
	this.start = new Coordinate(0, 0);
	this.cursor = new Coordinate(0, 0);
	this.closed = true;
}

RegionBuilder.prototype = {
	beginPath: function() {
		if (!this.closed) {
			this.closePath();
		}
	},
	
	moveTo: function(x, y) {
		this.beginPath();
		this.start.set(x, y);
	},
	
	lineTo: function(x, y) {
		var area;
		if (this.closed) {
			this.closed = false;
			area = new Area(this.start.copy());
			this.areas.push(area);
			this.cursor.setCoordinate(this.start);
		} else {
			area = this.currentArea();
		}
		
		var vector = new Coordinate(x, y);
		vector.subCoordinate(this.cursor);
		area.add(vector);

		this.cursor.set(x, y);
	},
	
	closePath: function() {
		if (this.closed) {
			return;
		}
		this.lineTo(this.start.x, this.start.y);
		this.closed = true;
	},
	
	getRegion: function() {
		this.closePath();
		if (this.areas.length == 1) {
			return this.areas[0];
		} else {
			return new Region(this.areas);
		}
	},
	
	currentArea: function() {
		return this.areas[this.areas.length - 1];
	}
}

function Region(areas) {
	this.areas = areas;
}

Region.prototype = {
	containsCoordinate: function(x, y) {
		for (var n = 0, cnt = this.areas.length; n < cnt; n++) {
			if (!(this.areas[n].containsCoordinate(x, y))) {
				return false;
			}
		}
		return true;
	}
}

function Area(start) {
	this.start = start;
	this.vectors = [];
}

Area.prototype = {
	add: function(vector) {
		if (vector.getLength() > 0.1) {
			this.vectors.push(vector);
		}
	},
	
	containsCoordinate: function(x, y) {
		var test = new Coordinate(x, y);
		
		var current = this.start.copy();
		for (var n = 0, cnt = this.vectors.length; n < cnt; n++) {
			var vector = this.vectors[n];
			
			test.subCoordinate(current);
			test.rot90();
			var direction = vector.scalarProduct(test);
			if (direction > 0) {
				return false;
			}
			
			current.addCoordinate(vector);
			test.set(x, y);
		}
		return true;
	}

}

Util = {
	clipRect: function(context, rect) {
		context.beginPath();
		var x1 = rect.x1;
		var y1 = rect.y1;
		var x2 = rect.x2;
		var y2 = rect.y2;
		context.rect(x1, y1, x2 - x1, y2 - y1);
		context.clip();
	},
	
	clearRect: function(context, rect) {
		var x1 = rect.x1;
		var y1 = rect.y1;
		var x2 = rect.x2;
		var y2 = rect.y2;
		context.clearRect(x1, y1, x2 - x1, y2 - y1);
	},
	
	fillRect: function(context, rect) {
		var x1 = rect.x1;
		var y1 = rect.y1;
		var x2 = rect.x2;
		var y2 = rect.y2;
		context.fillRect(x1, y1, x2 - x1, y2 - y1);
	}
}

