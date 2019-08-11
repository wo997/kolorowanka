const svgns = "http://www.w3.org/2000/svg";

var circle;

var svg;
var stroke;
var rect;

var mouseX, mouseY;

var fillElement = null;
var fillPoints = [];
var TTL;

var img;
var imageData;

var svgWidth, svgHeight;
var ratio; // scaling image
var svgContainer;

var holding = null, holdTime, holdX, holdY, forcePutDown;
var pencil, pencilPlaceholder, pencilColorPath;
var rubber, rubberPlaceholder;
var filler, fillerPlaceholder;

window.addEventListener('load', function() {
	svg = document.getElementById("svg");
	rect = document.getElementById("rect");
	canvas = document.getElementById('canvas');

	pencil = document.getElementById('pencil');
	pencilPlaceholder = document.getElementById('pencilPlaceholder');
	pencilColorPath = document.getElementById('pencilColorPath');

	rubber = document.getElementById('rubber');
	rubberPlaceholder = document.getElementById('rubberPlaceholder');

	filler = document.getElementById('filler');
	fillerPlaceholder = document.getElementById('fillerPlaceholder');

	stroke = document.createElement("g");
	stroke.className = "Stroke";
	svg.appendChild(stroke);

	svg.addEventListener('mousedown', mouseDown);
	window.addEventListener('mousemove', mouseMove);
	window.addEventListener('mouseup', mouseUp);

	var paths = document.getElementsByTagName("path");

	var len = paths.length;
	for (i=0;i<len;i++)
	{
		if (paths[i].style == null) continue;

		var fill = paths[i].getAttribute("fill");
		var str = paths[i].getAttribute("stroke");

		var white = ["#FFFFFF","#FFF","white"];
		var black = ["black","#000","#000000",""];

		var strokeTop = paths[i].cloneNode(true);
		strokeTop.setAttribute('class', "ignore");
		if (black.indexOf(str) != -1)
		{
			strokeTop.setAttribute('fill', "transparent");
			stroke.appendChild(strokeTop);
		}
		else
		{
			strokeTop.style.visibility = "hidden";
			svg.appendChild(strokeTop);
		}

		if (white.indexOf(fill) == -1 && black.indexOf(str) == -1)
		{
			paths[i].setAttribute('fill', "transparent");
			paths[i].setAttribute('stroke', "transparent");
		}
	}

	svgContainer = document.getElementById("svgContainer")
	svgContainer.style.width = "1000px";

	svg.setAttribute("width",svg.clientWidth);
	svg.setAttribute("height",svg.clientHeight);

	svgWidth = svg.viewBox.baseVal.width;
	svgHeight = svg.viewBox.baseVal.height;

	img = new Image();
	var DOMURL = window.URL || window.webkitURL || window;
    var svgBlob = new Blob([svg.outerHTML], {type: 'image/svg+xml'});
    var url = DOMURL.createObjectURL(svgBlob);

	scaleSvgContainer();

	img.onload = function(){
		var width = svg.clientWidth;
		var height = svg.clientHeight;

		// to export to mozilla and scale
		svg.removeAttribute("width");
		svg.removeAttribute("height");

		img.width = width*0.5;
		img.height = height*0.5;
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext('2d');
		ctx.drawImage(img, 0, 0);
		DOMURL.revokeObjectURL(url);
		var picture = ctx.getImageData(0, 0, width, height);
		imageData = picture.data;

		// clear everything except black to make transparent overlay
		var n = imageData.length;
		for (i=0; i<n; i+=4) {
			if (imageData[i] > 200 || imageData[i+1] > 200 || imageData[i+2] > 200)
				imageData[i+3] = 0;
		}
		picture.data = imageData;
		ctx.putImageData(picture, 0, 0);

		ratio = width / svgWidth;

		var ignored = document.getElementsByClassName("ignore");
		for (i=ignored.length-1;i>=0;i--)
		{
			ignored[i].style.visibility = "";
			ignored[i].removeAttribute('class');
		}

		placeStuff();

		pencilPlaceholder.onclick = function() { startHolding(pencil, this); };
		rubberPlaceholder.onclick = function() { startHolding(rubber, this); };
		fillerPlaceholder.onclick = function() { startHolding(filler, this); };
	};
	img.src = url;
});

function placeStuff()
{
	place(pencil,pencilPlaceholder);
	place(rubber,rubberPlaceholder);
	place(filler,fillerPlaceholder);
}

function place(obj,placeholder)
{
	var pos = placeholder.getBoundingClientRect();

	obj.style.left = pos.x + "px";
	obj.style.top = pos.y + "px";
	obj.style.width = pos.width + "px";
	obj.style.height = pos.height + "px";
}

function startHolding(obj, placeholder)
{
	if (holding != null)
	{
		forcePutDown = true;
		holdTime = 0;
		holding.classList.remove("held");
		putDownAnimation(holding, document.getElementById(holding.id+"Placeholder"));
		return;
	}

	forcePutDown = false;

	obj.classList.add("held");
	holding = obj;

	var pos = obj.getBoundingClientRect();
	holdX = pos.x;
	holdY = pos.y;
	holdTime = 0;

	holdingAnimation(obj, placeholder);
}

function holdingAnimation(obj, placeholder)
{
	if (forcePutDown) return;

	if (holdTime < 1)
		holdTime += 0.05;

	var pos = placeholder.getBoundingClientRect();

	var scale = pos.width;

	var targetX = mouseX;
	holdX = (1-holdTime) * holdX + holdTime * targetX;
	var targetY = mouseY;
	holdY = (1-holdTime) * holdY + holdTime * targetY;

	obj.style.width = pos.width + "px";
	obj.style.height = pos.height + "px";

	obj.style.left = holdX + "px";
	obj.style.top = holdY + "px";

	requestAnimationFrame(function(){holdingAnimation(obj, placeholder);});
}

function putDownAnimation(obj, placeholder)
{
	if (holdTime < 1)
		holdTime += 0.05;
	else
	{
		holding = null;
		return;
	}

	var pos = placeholder.getBoundingClientRect();

	var scale = pos.width;

	var targetX = pos.x;
	holdX = (1-holdTime) * holdX + holdTime * targetX;
	var targetY = pos.y;
	holdY = (1-holdTime) * holdY + holdTime * targetY;

	obj.style.width = pos.width + "px";
	obj.style.height = pos.height + "px";

	obj.style.left = holdX + "px";
	obj.style.top = holdY + "px";

	requestAnimationFrame(function(){putDownAnimation(obj, placeholder);});
}

var initTimeout;
window.addEventListener('resize', function() {

	canvas.style.transform = "scale("+(svg.clientWidth/canvas.clientWidth).toPrecision(4)+")";
	canvas.style.transformOrigin = "left";

	scaleSvgContainer();

	placeStuff();
});

var transformScale = 1;
function scaleSvgContainer()
{
	var scale1 = 1 * svgContainer.parentNode.clientWidth / svgContainer.clientWidth;
	var scale2 = 0.63 * svgContainer.parentNode.clientHeight / svgContainer.clientHeight;

	if (scale1 > 0.87 * scale2)
		scale1 = 0.87 * scale2;

	if (scale1 < scale2)
		transformScale = scale1;
	else
		transformScale = scale2;

	svgContainer.style.transform = " scale("+transformScale.toPrecision(4)+") translate(-50%,-50%)";
}


var newpath = null;
var newpathData = "";
var lastX = 0;
var lastY = 0;

function mouseUp(e)
{
	newpath = null;
}

function mouseDown(e)
{
	var rect = svg.getBoundingClientRect();
	var x = (e.clientX - rect.x) * svgWidth/svg.clientWidth/transformScale;
	var y = (e.clientY - rect.y) * svgHeight/svg.clientHeight/transformScale;

	if (holding == pencil || holding == rubber)
		pen(x,y);
	else if (holding == filler)
		paint(x,y);
}

var newpath = null;
var newpathData = "";
var lastX = 0;
var lastY = 0;
var pathLength = 0;

function pen(x,y)
{
	lastX = x;
	lastY = y;
	pathLength = 0;

	color = getColor();

	newpath = document.createElementNS("http://www.w3.org/2000/svg","path");
	newpathData = "M "+lastX+" "+lastY+" L "+lastX+" "+lastY;
	newpath.setAttribute("d",newpathData);
	newpath.setAttribute("stroke", color);
	newpath.setAttribute("fill", "none");
	newpath.setAttribute("stroke-width", 30);
	newpath.setAttribute("stroke-linecap", "round");
	newpath.setAttribute("stroke-linejoin", "round");

	svg.insertBefore(newpath,stroke);
}

function getColor()
{
	var color = "white";
	if (holding != rubber)
		color = "rgb("+Math.floor(Math.random()*190+50)+","+Math.floor(Math.random()*190+50)+","+Math.floor(Math.random()*190+50)+")";
	pencilColorPath.style.fill = color;
	return color;
}

function mouseMove(e)
{
	mouseX = e.clientX;
	mouseY = e.clientY;

	if (!newpath) return;

	// pen

	var rect = svg.getBoundingClientRect();
	var x = (mouseX - rect.x) * svgWidth/svg.clientWidth/transformScale;
	var y = (mouseY - rect.y) * svgHeight/svg.clientHeight/transformScale;

	if (square(lastX-x) + square(lastY-y) < 40) return;

	lastX = x;
	lastY = y;

	newpathData += " L "+x+" "+y;
	newpath.setAttribute("d",newpathData);

	pathLength++;

	if (pathLength > 10)
	{
		mouseUp(e);
		mouseDown(e);
	}
}

function square(x)
{
	return x*x;
}

function paint(x,y)
{
	fillElement = document.createElementNS("http://www.w3.org/2000/svg","path");
	color = getColor();
	fillElement.setAttribute("fill", color);
	fillElement.setAttribute("stroke", color);
	fillElement.setAttribute("stroke-width", 5);
	fillElement.setAttribute("stroke-linejoin", "round");
	fillElement.setAttribute("pointer-events", "none");
	svg.insertBefore(fillElement,stroke);

	fillPoints = [[x-2,y-2,true],[x+2,y-2,true],[x+2,y+2,true],[x-2,y+2,true]];

	TTL = 35;

	run();
}

function run()
{
	if (TTL-- < 0) return;

	for (a=0;a<3;a++)
	{
		var pathString = "";
		var anythingMoves = false;
		var previousStopped = false;

		for (i=0;i<fillPoints.length;i++)
		{
			var x = Math.floor(fillPoints[i][0] * ratio);
			var y = Math.floor(fillPoints[i][1] * ratio);

			var index = (x + y * canvas.width) * 4;
			var empty = imageData[index+3] == 0 || (imageData[index] == 255 && imageData[index+1] == 255 && imageData[index+2] == 255);

			var nowDeleted = false;

			if (fillPoints[i][2] && x > 0 && x < svgWidth && y > 0 && y < svgHeight && empty)
			{
				anythingMoves = true;

				var neighbour1 = i-1;
				var neighbour2 = i+1;
				if (neighbour1 < 0) neighbour1 = fillPoints.length-1;
				if (neighbour2 > fillPoints.length-1) neighbour2 = 0;

				var p1 = fillPoints[neighbour1];
				var p2 = fillPoints[neighbour2];

				var dx = p1[0] - p2[0];
				var dy = p1[1] - p2[1];

				var moveX = -dy;
				var moveY = dx;

				var len = Math.sqrt(dx*dx+dy*dy)+0.01;

				var speed = 1;
				if (TTL<10) speed = 0.1 * (TTL+1);
				speed /= len;

				fillPoints[i][0] += speed*moveX;
				fillPoints[i][1] += speed*moveY;

				var p = fillPoints[i];

				var dx = p1[0] - p[0];
				var dy = p1[1] - p[1];

				var len = Math.sqrt(dx*dx+dy*dy);

				if (len > 5)//(previousStopped ? 10 : 20))
				{
					fillPoints.splice(i, 0, [(p[0]+p1[0])*0.5,(p[1]+p1[1])*0.5, true]);
					i++;
				}
				else if (len < 1)
				{
					fillPoints.splice(i, 1);
					i--;
					nowDeleted = true;
				}

				previousStopped = false;
			}
			else
			{
				previousStopped = true;
				fillPoints[i][2] = false; // stop
			}

			if (!nowDeleted)
			{
				if (pathString == "")
					pathString += "M ";
				else
					pathString += "L ";

				var point = svg.createSVGPoint();
				point.x = fillPoints[i][0];
				point.y = fillPoints[i][1];
				position = point.matrixTransform(svg.getScreenCTM());

				pathString += point.x+" "+point.y+" ";
			}
		}

		pathString += "z";

		fillElement.setAttribute("d",pathString);

		if (anythingMoves && a == 2)
			requestAnimationFrame(run);
	}
}
