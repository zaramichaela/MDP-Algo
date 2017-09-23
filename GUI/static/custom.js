/**
 * @file {custom.js} 
 * For receiving messages from back-end to update the UI and sending messages to initiate
 	algorithms.
* @author {Utsav Garg}
 */

document.addEventListener('DOMContentLoaded', function initialize(e) {

	// Getting elements of arena
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	const ROWS = 20, COLUMNS = 15;
	var roboPath = [];

	// Initializing arena to be unexplored
	var map = [];
	for (var i = 0; i < ROWS; i++){
		map[i] = [];
		for (var j = 0; j < COLUMNS; j++){
			map[i][j] = 0;
		}
	}

	function getStyle(cell) {
	    switch(cell) {
	        case 0: return "#1a1e24"; // unexplored
	        case 1: return "#F3F3F3"; // explored
	        case 2: return "#f44336"; // obstacle
	        case 3: return "#30807d"; // start
	        case 4: return "#08ae69"; // goal
	        case 5: return "#354458"; // robot
	        case 6: return "#7acdc8"; // path
	        case 7: return "#673ab7"; // way-point
	        default: return "#1a1e24";
	    }
	}

	function draw(map, center=null, head=null) {
        context.save();
        context.strokeStyle = "#252a33";
        context.lineWidth = 3;

        // Filling explored and unexplored cells
        for (var i = 0; i < ROWS; i++){
			for (var j = 0; j < COLUMNS; j++){
				context.beginPath();
				context.fillStyle = getStyle(map[i][j]);
				context.rect(30 * j, 30 * i, 30, 30);
				context.fill();
				context.stroke();
				context.closePath();
			}
		}

		// add path
		if (roboPath){
			for(var i=0; i<roboPath.length; i++){
				pt = roboPath[i];
				if (map[pt[0]][pt[1]] != 7){
					context.beginPath();
					context.fillStyle = getStyle(6);
					context.rect(30 * pt[1], 30 * pt[0], 30, 30);
					context.fill();
					context.stroke();
					context.closePath();
				}
			}
		}

		// marking robot
		if (center && head){
			context.beginPath();
			context.fillStyle = getStyle(5);
			context.moveTo(30*center[1] + 55, 30*center[0] + 15);
			context.arc(30*center[1] + 15, 30*center[0] + 15, 40, 0, 2 * Math.PI, true);
			context.fill();
			context.stroke();
			context.closePath();
			context.beginPath();
			context.fillStyle = getStyle(6);
			context.moveTo(30*head[1] + 20, 30*head[0] + 20);
			context.arc(30*head[1] + 15, 30*head[0] + 20, 5, 0, 2 * Math.PI, true);
			context.fill();
			context.closePath();
		}
        context.restore();
    }

    function log(area, time, msg){
    	// To fill the timer, area explored and log messages
    	var movementMap = {};
    	movementMap['A'] = "Turn Left";
    	movementMap['D'] = "Turn Right";
    	movementMap['W'] = "Move Forward";
    	if (area){
    		document.getElementById('area').innerHTML = area+' %';
    	}
    	if (time){
    		document.getElementById('timer').innerHTML = time+' s';
    		
    	}
    	if (msg){
    		msg = msg.split(', ');
    		var temp = "";
    		for (var i = 0; i < msg.length; i++) {;
    			temp = temp + movementMap[msg[i][1]] + "<br>";
    		}
    		document.getElementById('logs-content').innerHTML = temp;
    	}
    }

    document.getElementById('mapName').addEventListener('click', function(e){
		document.getElementById('mapname').style.display = 'block';
	});

	document.getElementById('loadMap').addEventListener('click', function(e){
		document.getElementById('mapname').style.display = 'none';
		var name = document.getElementById('map-name').value;
		var r = new XMLHttpRequest();
		r.open("GET", "/lm?name="+name);
		r.send();
	});

	document.getElementById('reset').addEventListener('click', function(e){
		var r = new XMLHttpRequest();
		roboPath = [];
		r.open("GET", "/reset");
		r.send();
	});

	document.getElementById('stop').addEventListener('click', function(e){
		var r = new XMLHttpRequest();
		r.open("GET", "/stop");
		r.send();
	});



	function parseJson(map){
		// Parsing string map to JavaScript array
		var parsedMap = [];
		map = map.slice(1, -1); // Removing extra brackets
		var tempCnt = 1; // For removing extra spaces
		for (i = 0; i < 20; i++){
			var row = map.slice(i*30+tempCnt, i*30+tempCnt + 30 - 1);
			tempCnt += 3;
			parsedMap.push([]);
			for (j = 0; j < 30; j+=2){
				parsedMap[i].push(parseInt(row[j]));
			}
		}
		return parsedMap;
	}

	document.getElementById('waypoint').addEventListener('click', function(e){
		document.getElementById('way-point').style.display = 'block';
	});

	document.getElementById('fsp').addEventListener('click', function(e){
		document.getElementById('way-point').style.display = 'none';
		var x = document.getElementById('way-x').value;
		var y = document.getElementById('way-y').value;
		var r = new XMLHttpRequest();
		r.open("GET", "/fsp?x="+x+"&y="+y);
		r.send();
	});

	document.getElementById('start').addEventListener('click', function(e){
		document.getElementById('explore').style.display = 'block';
	});

	document.getElementById('exp_start').addEventListener('click', function(e){
		document.getElementById('explore').style.display = 'none';
		var step = document.getElementById('time_step').value;
		var limit = document.getElementById('time').value;
		var coverage = document.getElementById('percentage').value;
		var r = new XMLHttpRequest();
		r.open("GET", "/start?step="+step+"&limit="+limit+"&coverage="+coverage);
		r.send();
	});

	function wsConnect() {
		this.ws = new WebSocket("ws://"+window.location.host+"/websocket?Id=" + Math.floor(Math.random() * 100));
	    this.ws.onopen = function() {
	        ws.send("Initializing connection");
	    };
	    this.ws.onmessage = function(evt){
	    	var data = JSON.parse(evt.data);
	    	var map = JSON.parse(data.map);
	    	var center = JSON.parse(data.center);
	    	var head = JSON.parse(data.head);
	    	var area = data.area;
	    	var time = data.time;
	    	var msg = data.msg;
	    	roboPath.push(center);
	    	draw(map, center, head);
	    	log(area, time, msg);
	    };
	    this.ws.onerror = function(evt){
	    	console.log('WebSocket Error: ' + error);
	    }
	    this.ws.onclose = function(evt){
	    	setTimeout(wsConnect, 1000);
	    	console.log(evt);
	    }
	}

	draw(map);
	wsConnect();

});
