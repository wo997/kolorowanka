const svgns = "http://www.w3.org/2000/svg";

var circle;

var svg;
var stroke;
var rect;

var fillElement = null;
var fillPoints = [];
var TTL;

var img;
var imageData;

var svgWidth, svgHeight;
var ratio; // scaling image
var svgContainer;

window.addEventListener('load', function() {
	svg = document.getElementById("svg");
	rect = document.getElementById("rect");
	canvas = document.getElementById('canvas');
	
	stroke = document.createElement("g");
	stroke.className = "Stroke";
	svg.appendChild(stroke);
		
	svg.addEventListener('mousedown', mouseDown);
	svg.addEventListener('mousemove', mouseMove);
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
	
	// firefox support - needs to be removed before exporting
	
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
		
		/*var rate = 1;
		if (width > 700)
		{
			rate = 700/width;
		}
		if (height > 600)
		{
			var changeRate = 600/height;
			if (changeRate < rate)
				rate = changeRate;
		}
		console.log(rate);
		
		width *= rate;
		height *= rate;*/
		
		//width *= 0.5;
		//height *= 0.5;
		
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
		for (i=0;i<ignored.length;i++)
		{
			ignored[i].style.visibility = "";
		}
		
		stroke.remove();
	};
	img.src = url;
});

var initTimeout; 
window.addEventListener('resize', function() {
	
	canvas.style.transform = "scale("+(svg.clientWidth/canvas.clientWidth).toPrecision(4)+")";
	canvas.style.transformOrigin = "left";
	
	scaleSvgContainer();
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
	
	
	//console.log(transformScale,maxRatio);
	
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
	
	if (document.getElementById("pisak").checked)
		pen(x,y);
	else
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
	
	svg.appendChild(newpath);
}

function getColor()
{
	if (document.getElementById("gumka").checked)
		return "white";
	return "rgb("+Math.floor(Math.random()*190+50)+","+Math.floor(Math.random()*190+50)+","+Math.floor(Math.random()*190+50)+")";
}

function mouseMove(e)
{
	if (!newpath) return;
	
	// pen
	
	var rect = svg.getBoundingClientRect();	
	var x = (e.clientX - rect.x) * svgWidth/svg.clientWidth/transformScale;
	var y = (e.clientY - rect.y) * svgHeight/svg.clientHeight/transformScale;

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
	svg.appendChild(fillElement);
	
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
				
				if (len > 3)//(previousStopped ? 10 : 20))
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

/*window.addEventListener('load', function() {
    var paths = document.getElementById("Color").childNodes;
	for (i=0;i<paths.length;i++)
	{
		if (paths[i].style == null) continue;

		paths[i].style.strokeWidth = 6;
		paths[i].style.fill = "rgba(0,0,0,0)";
		paths[i].id = "bottomTop"+i;
		
		var strokeTop = paths[i].cloneNode(true);
		strokeTop.style.fill = "transparent";
		strokeTop.id = "Top"+i;
		document.getElementById("Stroke").appendChild(strokeTop);
		
		strokeTop.addEventListener('click',function(){
			if (document.getElementById("pisak").checked) return;
			
			var elem = document.getElementById("bottom"+this.id);
			var parent = elem.parentNode;
			parent.removeChild(elem);
			parent.appendChild(elem); // bring to top
			setTimeout(()=>{
				elem.style.fill = "rgb("+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+")";
			},0);
		}, false);
	}

	document.getElementById("svg").addEventListener('mousemove', mouseMove);
	document.getElementById("svg").addEventListener('mousedown', mouseDown);
	window.addEventListener('mouseup', mouseUp);
});
function mouseUp(e)
{
	newpath = null;
}
var newpath = null;
var newpathData = "";
var lastX = 0;
var lastY = 0;
function mouseDown(e)
{
	if (!document.getElementById("pisak").checked) return;
	
	var svg = document.getElementById("svg");
	var pt = svg.createSVGPoint(), svgP, circle;

	pt.x = e.clientX;
	pt.y = e.clientY;
	svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
	
	lastX = svgP.x;
	lastY = svgP.y;
	
	newpath = document.createElementNS("http://www.w3.org/2000/svg","path");
	newpathData = "M "+lastX+" "+lastY+" L "+lastX+" "+lastY;
	newpath.setAttribute("d",newpathData);  
	newpath.setAttribute("stroke", "rgb("+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+","+Math.floor(Math.random()*255)+")");
	newpath.setAttribute("fill", "none");
	newpath.setAttribute("stroke-width", 30);
	newpath.setAttribute("stroke-linecap", "round");
	newpath.setAttribute("stroke-linejoin", "round");

	var color = document.getElementById("Color");
	color.appendChild(newpath);
}

function mouseMove(e)
{
	if (!newpath) return;
	
	var svg = document.getElementById("svg");
	var pt = svg.createSVGPoint(), svgP, circle;

	pt.x = e.clientX;
	pt.y = e.clientY;
	svgP = pt.matrixTransform(svg.getScreenCTM().inverse());

	if (square(lastX-svgP.x) + square(lastY-svgP.y) < 100) return;
	
	lastX = svgP.x;
	lastY = svgP.y;
	
	newpathData += " L "+svgP.x+" "+svgP.y;
	newpath.setAttribute("d",newpathData);  
}

function square(x)
{
	return x*x;
}*/