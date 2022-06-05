window.shared = false;
window.gui = {
	loadScript: function (src,callback) {
		var tmpscript = document.createElement("script");
		tmpscript.src = window.getDirectory().gui + "/" + src + "?n=1"; //added update so they update once changed
		document.body.appendChild(tmpscript);
		tmpscript.onload = callback;
		return tmpscript;
	},
	blocks: {
		addExtension: function (json) {
			Blockly.defineBlocksWithJsonArray(json.blocks);
			toolboxHTML += "<category name='"+json.title+"' colour='"+json.color+"'>"+json.contents+"</category>";
			workspace.updateToolbox("<xml>"+toolboxHTML+"</xml>")
		}
	},
	editorToJsonText:function (type) {
		var loadingScreen = document.getElementById("loadingscreen");
		return JSON.stringify({
			blocklyXML:Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(workspace)),
			files:fileResourcesArray,
			title:document.getElementById("gameTitle").value,
			thumb:document.getElementById("gameScreen").toDataURL(),
			shared:window.shared,
			dis:document.getElementById("discription").value,
			code:vm.code
		});
	},
	jsonTextToEditor:function (JsonText,type) {
		var loadingScreen = document.getElementById("loadingscreen");
		loadingScreen.hidden = false;
		clearResources();
		var JsonTextParsed = JSON.parse(JsonText);
		var i = 0;
		while (JsonTextParsed.files.length > i) {
			readFileAsResource(JsonTextParsed.files[i].data,JsonTextParsed.files[i].name,JsonTextParsed.files[i].type);
			i += 1;
		}
		workspace.clear();
		document.getElementById("gameTitle").value = JsonTextParsed.title
		Blockly.Xml.domToWorkspace(Blockly.Xml.textToDom(JsonTextParsed.blocklyXML),workspace);
		if (type == "file") {
			
		} else {
			if (JsonTextParsed.shared) {
				window.shared = JsonTextParsed.shared;
			}
		}
		document.getElementById("discription").value = JsonTextParsed.dis;
		loadingScreen.hidden = true;
	}
}
console.log("[gui]:starting up.");
var toolbox = document.getElementById('toolbox');
var toolboxHTML = document.getElementById('toolbox').innerHTML;
//blockly injection starts
var blocklyArea = document.getElementById('blocklyArea');
var blocklyDiv = document.getElementById('blocklyDiv');
window.workspace = Blockly.inject(blocklyDiv,{
	toolbox: toolbox,
	collapse:false,
	sounds:true,
	move:{
		scrollbars: {
			horizontal: true,
			vertical: true
		},
		drag: true,
		wheel: false
	},
    zoom:{
		controls: true,
		wheel: false,
		startScale: 1.0,
		maxScale: 3,
		minScale: 0.3,
		scaleSpeed: 1.2,
		pinch: false
	},
	trashcan:false,
	grid:{
		spacing: 20,
		length: 3,
		colour: '#bac8ff',
		snap: true
	},
	theme: Blockly.Themes.GGM,
	renderer:"custom_renderer",
	media:"./blockly/media/"
});
console.log("[gui]:injected blockly.");
var onresize = function(e) {
	// Compute the absolute coordinates and dimensions of blocklyArea.
	var element = blocklyArea;
	var x = 0;
	var y = 0;
	do {
		x += element.offsetLeft;
		y += element.offsetTop;
		element = element.offsetParent;
	} while (element);
	// Position blocklyDiv over blocklyArea.
	blocklyDiv.style.left = x + 'px';
	blocklyDiv.style.top = y + 'px';
	blocklyDiv.style.width = blocklyArea.offsetWidth + 'px';
	blocklyDiv.style.height = blocklyArea.offsetHeight + 'px';
	Blockly.svgResize(workspace);
};
window.addEventListener('resize', onresize, false);
onresize();
Blockly.svgResize(workspace);
console.log("[gui]:loading blocks...");
gui.loadScript("blocks/index.js");
renderer.canvas = document.getElementById("gameScreen");
vm.code = "";
vm.attachRenderer(renderer);
vm.attachAudioEngine(audioEngine);
function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: ((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width)/2,
        y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
    };
}
document.getElementById("gameScreen").onmousemove = function (event) {
	var pos = getMousePos(document.getElementById("gameScreen"), event);// get adjusted coordinates as above
    var x = Math.round(pos.x/1)-(document.getElementById("gameScreen").width/2)/2;
    var y = Math.round(pos.y*-1)+(document.getElementById("gameScreen").height/2);
	
	vm.setMousePos({
		x:x,
		y:y
	});
}
document.getElementById("gameScreen").onmousedown = function (event) {
	event.preventDefault();
	vm.setMouseDown(true);
}
document.body.onmouseup = function (event) {
	event.preventDefault();
	vm.setMouseDown(false);
}
setInterval(function () {
	document.getElementById("testPos").innerHTML = vm.project.mouseX+","+vm.project.mouseY+", down:"+ vm.project.mouseDown;
},1);
document.getElementById("gameArea").onkeydown = function (event) {
	vm.simulateKey({
		key:event.key,
		down:true
	});
	event.preventDefault();
}
document.body.onkeyup = function (event) {
	vm.simulateKey({
		key:event.key,
		down:false
	});
}
/*
some test to test if the mouse on center:
var sprite = vm.project.block.makeSprite();
sprite.image = document.getElementById("testImage");
function test(){sprite.x=vm.project.mouseX*1;sprite.y=vm.project.mouseY*1;}vm.project.events.tick.push(test);*/

/*overide the console with the html one*/
vm.console.log = function (text) {
	document.getElementById('console').innerHTML += text+"<br>";
}
vm.console.error = function (text) {
	document.getElementById('console').innerHTML += "Error:"+text+"<br>";
	vm.stop();
}
vm.console.clear = function (text) {
	document.getElementById('console').innerHTML = "";
}
/*resources*/
var resoureupload = document.getElementById('resourceupload');
var files = document.getElementById('files');
window.fileResources = [];
window.fileResourcesArray = [];
resoureupload.accept = "audio/*,image/*";
function clearResources() {
	files.innerHTML = "";
	window.fileResources = [];
	window.fileResourcesArray = [];
}
function readFileAsResource(data,name,type) {
	var div = document.createElement("div");
	div.innerHTML = name+`:
	`;
	resourceupload.files[0]
	if (type == "image") {
		var image = document.createElement("img");
		image.src = data;
		div.appendChild(image);
		image.width = "200";
	}
	if (type == "audio") {
		var audio = document.createElement("audio");
		audio.src = data;
		audio.controls = true;
		div.appendChild(audio);
	}
	div.innerHTML += "<br>";
	files.appendChild(div);
	window.fileResources[name] = ({data:data,name:name,type:type});
	window.fileResourcesArray.push({data:data,name:name,type:type});
	window.vm.project.resources = fileResources;
}
resoureupload.onchange = function () {
	var reader = new FileReader();
	reader.onload = function () {
		readFileAsResource(reader.result,resourceupload.files[0].name,resourceupload.files[0].type.split('/')[0]);
		resourceupload.value = "";
	}
	if (resourceupload.files[0]) {
		console.log(resourceupload.files[0].size);
		if (resourceupload.files[0].size > 7000000 && window.options.addMaxFileSize) {
			window.alert("file is too big! for reasons you cant upload something too big, if its music, please compress and find loops, it should help you");
		} else {
			reader.readAsDataURL(resourceupload.files[0]);
		}
	}
};

function save() {
	var a = document.createElement("a");
	const contents = gui.editorToJsonText();
	const blob = new Blob([contents], {type : 'ggm2g'});
	a.href = URL.createObjectURL(blob);
	a.download = document.getElementById("gameTitle").value+".ggm2g";
	a.click();
}
function load() {
	document.getElementById("gameFileUpload").click();
}
document.getElementById("gameFileUpload").onchange = function () {
	var reader = new FileReader();
	reader.onload = function () {
		gui.jsonTextToEditor(reader.result,"file");
		document.getElementById("gameFileUpload").value = "";
	};
	if (document.getElementById("gameFileUpload").files[0]) {
		reader.readAsText(document.getElementById("gameFileUpload").files[0]);
	}
}
//dialogs
var dialogBox = document.getElementById("dialogBox");
var dialogBackground = document.getElementById("dialogBackground");
var dialogOptions = {
	inputs:{
		txt:document.getElementById("dialogInput")
	},
	
	buttons:{
		ok:document.getElementById("dialogButtonOk"),
		
		cancel:document.getElementById("dialogButtonCancel")
		
	},
	name:document.getElementById("dialogName"),
	
	txt:document.getElementById("dialogText"),
	
	hideAll: function () {
		document.getElementById("dialogInput").hidden = true;
		document.getElementById("dialogText").hidden = true;
		document.getElementById("dialogButtonOk").hidden = false;
		document.getElementById("dialogButtonCancel").hidden = false;
	}
};
var app = document.getElementById("app");
dialogBackground.style.display = "none";
window.gui.dialogs = {
	alert: (function(message, callback) {
		dialogBackground.style.display = "block";
		
		dialogBox.style.display = "block";
		
		dialogOptions.hideAll();
		
		dialogOptions.name.innerHTML = message;
		
		document.getElementById("dialogButtonCancel").hidden = true;
		
		dialogOptions.buttons.ok.onclick = function () {
			try{app.hidden = false;
				try {callback();} catch(e) {}
				dialogBackground.style.display = "none";
				dialogBox.style.display = "none";
			}catch(e){}
		};
		
		dialogOptions.buttons.cancel.onclick = function () {
			try{try {callback();} catch(e) {}
			dialogBackground.style.display = "none";
			dialogBox.style.display = "none";
		}catch(e){}
		};
	}),
	confirm: (function(message, callback) {
		dialogBackground.style.display = "block";
		
		dialogBox.style.display = "block";
		
		dialogOptions.hideAll();
		
		dialogOptions.name.innerHTML = message;
		
		dialogOptions.buttons.ok.onclick = function () {
			try{app.hidden = false;
			try {callback(true);} catch(e) {}
			dialogBackground.style.display = "none";
			dialogBox.style.display = "none";}catch(e){}
		};
		
		dialogOptions.buttons.cancel.onclick = function () {
			try{try {callback(false);} catch(e) {}
			dialogBackground.style.display = "none";
			dialogBox.style.display = "none";}catch(e){}
		};
	}),
	prompt: (function(message, defaultValue, callback) {
		dialogBackground.style.display = "block";
		
		
		dialogBox.style.display = "block";
		
		
		dialogOptions.hideAll();
		
		
		dialogOptions.name.innerHTML = message;
		
		dialogOptions.inputs.txt.value = defaultValue;
		
		
		dialogOptions.inputs.txt.hidden = false;
		
		
		let dialogInput = dialogOptions.inputs.txt;
		
		
		dialogOptions.buttons.ok.onclick = function () {
			try {callback(dialogInput.value);} catch(e) {}
			dialogBackground.style.display = "none";
			dialogBox.style.display = "none";
		};
		
		
		dialogOptions.buttons.cancel.onclick = function () {
			try {callback(null);} catch(e) {}
			dialogBackground.style.display = "none";
			dialogBox.style.display = "none";
		};
	})
}
Blockly.alert = (function(message, callback) {
	dialogBackground.style.display = "block";
	
	dialogBox.style.display = "block";
	
	dialogOptions.hideAll();
	
	dialogOptions.name.innerHTML = message;
	
	document.getElementById("dialogButtonCancel").hidden = true;
	
	dialogOptions.buttons.ok.onclick = function () {
		try {callback();} catch(e) {}
		dialogBackground.style.display = "none";
		dialogBox.style.display = "none";
	};
	
	dialogOptions.buttons.cancel.onclick = function () {
		try {callback();} catch(e) {}
		dialogBackground.style.display = "none";
		dialogBox.style.display = "none";
	};
});

Blockly.confirm = (function(message, callback) {
	dialogBackground.style.display = "block";
	
	dialogBox.style.display = "block";
	
	dialogOptions.hideAll();
	
	dialogOptions.name.innerHTML = message;
	
	dialogOptions.buttons.ok.onclick = function () {
		try {callback(true);} catch(e) {}
		dialogBackground.style.display = "none";
		dialogBox.style.display = "none";
	};
	
	dialogOptions.buttons.cancel.onclick = function () {
		try {callback(false);} catch(e) {}
		dialogBackground.style.display = "none";
		dialogBox.style.display = "none";
	};
});

Blockly.prompt = (function(message, defaultValue, callback) {
	dialogBackground.style.display = "block";
	
	
	dialogBox.style.display = "block";
	
	
	dialogOptions.hideAll();
	
	
	dialogOptions.name.innerHTML = message;
	
	dialogOptions.inputs.txt.value = defaultValue;
	
	
	dialogOptions.inputs.txt.hidden = false;
	
	
	let dialogInput = dialogOptions.inputs.txt;
	
	
	dialogOptions.buttons.ok.onclick = function () {
		try {callback(dialogInput.value);} catch(e) {}
		dialogBackground.style.display = "none";
		dialogBox.style.display = "none";
	};
	
	
	dialogOptions.buttons.cancel.onclick = function () {
		try {callback(null);} catch(e) {}
		dialogBackground.style.display = "none";
		dialogBox.style.display = "none";
	};
});

//Toolbox Management

window.toolboxManagement = class {
	constructor () {
		this.blockly = Blockly;
		this.workspace = workspace;
		this.addCategory = function (info) {
			document.getElementById("toolbox").innerHTML += `
			<category name='${info.name}' colour='${info.color}'>
			${this.blockXML}
			</category>
			`;
			this.workspace.updateToolbox("<xml>"+document.getElementById("toolbox").innerHTML+"</xml>")
		};
		this.blockXML = "";
		this.log = function (text) {
			console.log("extension: " + text)
		};
		this.vm = window.vm;
	}
};


/*var vardiv = variables.newVarDiv(0,0,{dragable:true});
vardiv.inside.style.height = 32+"px";
vardiv.inside.style.width = 32+"px";
vardiv.inside.style.background = "black";
document.body.appendChild(vardiv.inside);*/

//exporting

function exportGame() {
	var html = `
<!DOCTYPE HTML>
<html>
	<head>
		<title>Loading...</title>
		<style>
			/* The animation code */
			@keyframes logo {
			  0%   {width:350px;margin-left:-175px;filter: brightness(1.6);}
			  50%  {width:300px;margin-left:-150px;filter: brightness(1);transition: 0.01s;}
			  100%   {width:350px;margin-left:-175px;filter: brightness(1.6);}
			}

			/* The element to apply the animation to */
			#logo {
			  animation: rotation 0 linear;
			  animation-name: logo;
			  animation-duration: 2s;
			  animation-delay: 0s;
			  animation-iteration-count: infinite;
			  transition: 0.5s;
			}
			/* The animation code */
			@keyframes example {
			  0%   {transform: rotate(0deg);}
			  100%  {transform: rotate(360deg);}
			}

			/* The element to apply the animation to */
			.loading {
			  width: 100px;
			  height: 100px;
			  animation: rotation 8s infinite linear;
			  animation-name: example;
			  animation-duration: 0.5s;
			  animation-delay: 0s;
			  animation-iteration-count: infinite;
			  position:fixed;
			  top:50%;
			  left:50%;
			  margin-top:-50px;
			  margin-left:-50px;
			  transition: 0.5s;
			}
		</style>
	</head>
	<body style="background:black;overflow:hidden;">
		<img id="loading" class="loading" selectable=false draggable=false src="data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSI4NyIgaGVpZ2h0PSI4NyIgdmlld0JveD0iMCwwLDg3LDg3Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTk2LjUsLTEzNi41KSI+PGcgZGF0YS1wYXBlci1kYXRhPSJ7JnF1b3Q7aXNQYWludGluZ0xheWVyJnF1b3Q7OnRydWV9IiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZS13aWR0aD0iMTAiIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS1kYXNoYXJyYXk9IiIgc3Ryb2tlLWRhc2hvZmZzZXQ9IjAiIHN0eWxlPSJtaXgtYmxlbmQtbW9kZTogbm9ybWFsIj48cGF0aCBkPSJNMjAxLjUsMTgwYzAsLTIxLjI2Mjk2IDE3LjIzNzA0LC0zOC41IDM4LjUsLTM4LjVjMjEuMjYyOTYsMCAzOC41LDE3LjIzNzA0IDM4LjUsMzguNWMwLDIxLjI2Mjk2IC0xNy4yMzcwNCwzOC41IC0zOC41LDM4LjVjLTIxLjI2Mjk2LDAgLTM4LjUsLTE3LjIzNzA0IC0zOC41LC0zOC41eiIgc3Ryb2tlPSIjZmZmZmZmIi8+PHBhdGggZD0iTTIwNi40MjE0NiwxOTguNDQxOTdjLTMuMTM3NzgsLTUuNDE1MzggLTQuOTIxNDYsLTExLjYyOTE3IC00LjkyMTQ2LC0xOC4yMzYwNmMwLC0xMC4wNzQ3NSA0LjE0NzU2LC0xOS4yMzU0NyAxMC45MTk0NywtMjYuMDQ0OTIiIHN0cm9rZT0iI2E3YTdhNyIvPjwvZz48L2c+PC9zdmc+">
		<div id="app" hidden>
			<img id="logo" style="position:fixed;top:50%;left:50%;margin-left:-150px;margin-top:-100px;" width=300 height=200 src="data:image/svg+xml;base64,PHN2ZyB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHdpZHRoPSIzMDMuOTEwNDYiIGhlaWdodD0iMTEwLjM3NzExIiB2aWV3Qm94PSIwLDAsMzAzLjkxMDQ2LDExMC4zNzcxMSI+PGRlZnM+PGxpbmVhckdyYWRpZW50IHgxPSIxMzUuMjgzMTEiIHkxPSIxMzUuMTQzOTUiIHgyPSIxMzUuMjgzMTEiIHkyPSIyMzIuODcwNjYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBpZD0iY29sb3ItMSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjYjBiMGIwIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNTY1ZTYzIi8+PC9saW5lYXJHcmFkaWVudD48bGluZWFyR3JhZGllbnQgeDE9IjEyOC42MTY0NSIgeTE9IjEyOC4xNDM5NSIgeDI9IjEyOC42MTY0NSIgeTI9IjIyNS44NzA2NiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGlkPSJjb2xvci0yIj48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNlZmYwZjAiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM4MThkOTQiLz48L2xpbmVhckdyYWRpZW50PjxyYWRpYWxHcmFkaWVudCBjeD0iMTQ3Ljc0NTYxIiBjeT0iMTM1LjMzMzMzIiByPSI2LjUiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBpZD0iY29sb3ItMyI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZmZmZmZmIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZmZmZmZmIiBzdG9wLW9wYWNpdHk9IjAiLz48L3JhZGlhbEdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCB4MT0iMjEzLjk0OTc4IiB5MT0iMTM0Ljk3NzI4IiB4Mj0iMjEzLjk0OTc4IiB5Mj0iMjMyLjcwMzk5IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImNvbG9yLTQiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2IwYjBiMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzU2NWU2MyIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IHgxPSIyMDguNjE2NDUiIHkxPSIxMjguNjQzOTUiIHgyPSIyMDguNjE2NDUiIHkyPSIyMjYuMzcwNjYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIiBpZD0iY29sb3ItNSI+PHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZWZmMGYwIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjODE4ZDk0Ii8+PC9saW5lYXJHcmFkaWVudD48cmFkaWFsR3JhZGllbnQgY3g9IjIyNi40MTIyOCIgY3k9IjEzNiIgcj0iNi41IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImNvbG9yLTYiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI2ZmZmZmZiIgc3RvcC1vcGFjaXR5PSIwIi8+PC9yYWRpYWxHcmFkaWVudD48bGluZWFyR3JhZGllbnQgeDE9IjI3My41Njk3MyIgeTE9IjE5Ny41MDY0NiIgeDI9IjI3My41Njk3MyIgeTI9IjIzMS4wMDY0NiIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGlkPSJjb2xvci03Ij48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNiMGIwYjAiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM1NjVlNjMiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCB4MT0iMjY5LjkwMzA3IiB5MT0iMTkyLjUwNjQ2IiB4Mj0iMjY5LjkwMzA3IiB5Mj0iMjI2LjAwNjQ2IiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgaWQ9ImNvbG9yLTgiPjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iI2VmZjBmMCIvPjxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzgxOGQ5NCIvPjwvbGluZWFyR3JhZGllbnQ+PHJhZGlhbEdyYWRpZW50IGN4PSIzODAuNzQ1NjEiIGN5PSIxMzciIHI9IjYuNSIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIGlkPSJjb2xvci05Ij48c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmZmZmZmYiLz48c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNmZmZmZmYiIHN0b3Atb3BhY2l0eT0iMCIvPjwvcmFkaWFsR3JhZGllbnQ+PC9kZWZzPjxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC05MS4wNTMxNSwtMTI0LjYyOTM1KSI+PGcgZGF0YS1wYXBlci1kYXRhPSJ7JnF1b3Q7aXNQYWludGluZ0xheWVyJnF1b3Q7OnRydWV9IiBmaWxsLXJ1bGU9Im5vbnplcm8iIHN0cm9rZS1saW5lY2FwPSJidXR0IiBzdHJva2UtbGluZWpvaW49Im1pdGVyIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS1kYXNoYXJyYXk9IiIgc3Ryb2tlLWRhc2hvZmZzZXQ9IjAiIHN0eWxlPSJtaXgtYmxlbmQtbW9kZTogbm9ybWFsIj48Zz48cGF0aCBkPSJNMTAxLjQwODU3LDE3Mi4wNjIxYzIuMTI4MzQsLTE0LjQ4MDM2IDEzLjkzMDM2LC0yOC42NDI4MSAyNS4zMzkzMiwtMzMuMjM0MTdjMTYuMzkzMjMsLTYuNTk3MTkgMzQuMDcxODQsLTIuMzIxNDcgMzQuMDcxODQsLTIuMzIxNDdsMC4xNjI4NywxNy41MTM5NmMwLDAgLTE3LjE1NzIyLC0wLjE3OTQ3IC0yOS40MzA3OCw0LjU4NDA0Yy03LjIxNzUyLDIuODAxMiAtMTIuMDkyMDQsOC4yOTMwMSAtMTIuNTQ4MTgsMTMuOTA3MDRjLTAuNzI1NzYsOC45MzI0NyAtMi4xODA2NywyNC41NzQyIDYuMjUwOTgsMzMuNDc3MjFjNS4xMTQ0LDUuNDAwMzIgMjMuNjczNzUsNi41ODY3OSAyMy42NzM3NSw2LjU4Njc5bC0wLjM0OTQ1LC0xOC44OTcxNGwtMjAuMDkxMzQsMC40NjgzM2wwLjY3Njg3LC0xOS45Mzg1bDQxLjE4MTkzLC0wLjYyNTUybC0wLjUyNjY2LDU4LjkyMzc5bC0zMS40NjIxNCwwLjM2MzA3YzAsMCAtNDYuMDQwNSwxLjA0NzE0IC0zNi45NDkwMiwtNjAuODA3NDN6IiBmaWxsPSJ1cmwoI2NvbG9yLTEpIiBzdHJva2U9IiM0MjQyNDIiIHN0cm9rZS13aWR0aD0iNSIvPjxwYXRoIGQ9Ik05NC43NDE5MSwxNjUuMDYyMWMyLjEyODM0LC0xNC40ODAzNiAxMy45MzAzNiwtMjguNjQyODEgMjUuMzM5MzIsLTMzLjIzNDE3YzE2LjM5MzIzLC02LjU5NzE5IDM0LjA3MTg0LC0yLjMyMTQ3IDM0LjA3MTg0LC0yLjMyMTQ3bDAuMTYyODcsMTcuNTEzOTZjMCwwIC0xNy4xNTcyMiwtMC4xNzk0NyAtMjkuNDMwNzgsNC41ODQwNGMtNy4yMTc1MiwyLjgwMTIgLTEyLjA5MjA0LDguMjkzMDEgLTEyLjU0ODE4LDEzLjkwNzA0Yy0wLjcyNTc2LDguOTMyNDcgLTIuMTgwNjcsMjQuNTc0MiA2LjI1MDk4LDMzLjQ3NzIxYzUuMTE0NCw1LjQwMDMyIDIzLjY3Mzc1LDYuNTg2NzkgMjMuNjczNzUsNi41ODY3OWwtMC4zNDk0NSwtMTguODk3MTRsLTIwLjA5MTM0LDAuNDY4MzNsMC42NzY4NywtMTkuOTM4NWw0MS4xODE5MywtMC42MjU1MmwtMC41MjY2Niw1OC45MjM3OWwtMzEuNDYyMTQsMC4zNjMwN2MwLDAgLTQ2LjA0MDUsMS4wNDcxNCAtMzYuOTQ5MDIsLTYwLjgwNzQzeiIgZmlsbD0idXJsKCNjb2xvci0yKSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjUiLz48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCI+PHBhdGggZD0iTTEzOC4xNjY2NiwxMzcuNWMwLC0zLjU4OTg1IDIuOTEwMTUsLTYuNSA2LjUsLTYuNWMzLjU4OTg1LDAgNi41LDIuOTEwMTUgNi41LDYuNWMwLDMuNTg5ODUgLTIuOTEwMTUsNi41IC02LjUsNi41Yy0zLjU4OTg1LDAgLTYuNSwtMi45MTAxNSAtNi41LC02LjV6IiBmaWxsPSJ1cmwoI2NvbG9yLTMpIi8+PHBhdGggZD0iTTE0My44Njg0MiwxMzUuNTYxNGMwLC0wLjY3MDEyIDEuMzY2NDIsLTAuNDAxODUgMS43ODcxLC0wLjg1ODg2YzAuNDY4OSwtMC41MDkzOSAwLjAzMTc2LC0xLjcwNjkzIDAuNzc4NjgsLTEuNzA2OTNjMC45NDg1MSwwIDAuNDgyMzUsMC45NzY5OCAwLjkyNjQsMS43NDIzYzAuMjE5MzQsMC4zNzgwNCAxLjYzOTM5LDAuMzU0OTUgMS42MzkzOSwwLjgyMzQ5YzAsMS4wMTYzIC0wLjY4MzM1LDAuNDE1MjMgLTEuNTQwMzEsMC44MzA3MWMtMC4zMzc5MiwwLjE2MzgzIC0wLjYyNDc0LDEuNzM1MDggLTEuMDI1NDgsMS43MzUwOGMtMC41ODk0MSwwIC0wLjM0NjQ4LC0xLjQ5MzE5IC0wLjc3OTcsLTEuODI3MzFjLTAuNjA4MzIsLTAuNDY5MTggLTEuNzg2MDksMC4wODkxNyAtMS43ODYwOSwtMC43Mzg0N3oiIGZpbGw9IiNmZmZmZmYiLz48L2c+PC9nPjxnPjxwYXRoIGQ9Ik0xODAuMDc1MjQsMTcxLjg5NTQzYzIuMTI4MzQsLTE0LjQ4MDM2IDEzLjkzMDM3LC0yOC42NDI4MSAyNS4zMzkzMiwtMzMuMjM0MTdjMTYuMzkzMjMsLTYuNTk3MTkgMzQuMDcxODQsLTIuMzIxNDcgMzQuMDcxODQsLTIuMzIxNDdsMC4xNjI4NywxNy41MTM5NmMwLDAgLTE3LjE1NzIyLC0wLjE3OTQ3IC0yOS40MzA3OCw0LjU4NDA0Yy03LjIxNzUyLDIuODAxMiAtMTIuMDkyMDUsOC4yOTMwMSAtMTIuNTQ4MTgsMTMuOTA3MDRjLTAuNzI1NzYsOC45MzI0NyAtMi4xODA2NywyNC41NzQyIDYuMjUwOTgsMzMuNDc3MjFjNS4xMTQ0LDUuNDAwMzIgMjMuNjczNzUsNi41ODY3OSAyMy42NzM3NSw2LjU4Njc5bC0wLjM0OTQ1LC0xOC44OTcxNGwtMjAuMDkxMzQsMC40NjgzM2wwLjY3Njg3LC0xOS45Mzg1bDQxLjE4MTkzLC0wLjYyNTUybC0wLjUyNjY2LDU4LjkyMzc5bC0zMS40NjIxNCwwLjM2MzA3YzAsMCAtNDYuMDQwNSwxLjA0NzE0IC0zNi45NDkwMywtNjAuODA3NDN6IiBmaWxsPSJ1cmwoI2NvbG9yLTQpIiBzdHJva2U9IiM0MjQyNDIiIHN0cm9rZS13aWR0aD0iNSIvPjxwYXRoIGQ9Ik0xNzQuNzQxOTEsMTY1LjU2MjFjMi4xMjgzNCwtMTQuNDgwMzYgMTMuOTMwMzcsLTI4LjY0MjgxIDI1LjMzOTMyLC0zMy4yMzQxN2MxNi4zOTMyMywtNi41OTcxOSAzNC4wNzE4NCwtMi4zMjE0NyAzNC4wNzE4NCwtMi4zMjE0N2wwLjE2Mjg3LDE3LjUxMzk2YzAsMCAtMTcuMTU3MjIsLTAuMTc5NDcgLTI5LjQzMDc4LDQuNTg0MDRjLTcuMjE3NTIsMi44MDEyIC0xMi4wOTIwNSw4LjI5MzAxIC0xMi41NDgxOCwxMy45MDcwNGMtMC43MjU3Niw4LjkzMjQ3IC0yLjE4MDY3LDI0LjU3NDIgNi4yNTA5OCwzMy40NzcyMWM1LjExNDQsNS40MDAzMiAyMy42NzM3NSw2LjU4Njc5IDIzLjY3Mzc1LDYuNTg2NzlsLTAuMzQ5NDUsLTE4Ljg5NzE0bC0yMC4wOTEzNCwwLjQ2ODMzbDAuNjc2ODcsLTE5LjkzODVsNDEuMTgxOTMsLTAuNjI1NTJsLTAuNTI2NjYsNTguOTIzNzlsLTMxLjQ2MjE0LDAuMzYzMDdjMCwwIC00Ni4wNDA1LDEuMDQ3MTQgLTM2Ljk0OTAzLC02MC44MDc0M3oiIGZpbGw9InVybCgjY29sb3ItNSkiIHN0cm9rZT0iIzAwMDAwMCIgc3Ryb2tlLXdpZHRoPSI1Ii8+PGcgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjAiPjxwYXRoIGQ9Ik0yMTYuODMzMzMsMTM4LjE2NjY3YzAsLTMuNTg5ODUgMi45MTAxNSwtNi41IDYuNSwtNi41YzMuNTg5ODUsMCA2LjUsMi45MTAxNSA2LjUsNi41YzAsMy41ODk4NSAtMi45MTAxNSw2LjUgLTYuNSw2LjVjLTMuNTg5ODUsMCAtNi41LC0yLjkxMDE1IC02LjUsLTYuNXoiIGZpbGw9InVybCgjY29sb3ItNikiLz48cGF0aCBkPSJNMjIyLjUzNTA5LDEzNi4yMjgwN2MwLC0wLjY3MDEyIDEuMzY2NDIsLTAuNDAxODUgMS43ODcxLC0wLjg1ODg2YzAuNDY4OSwtMC41MDkzOSAwLjAzMTc1LC0xLjcwNjkzIDAuNzc4NjgsLTEuNzA2OTNjMC45NDg1MSwwIDAuNDgyMzUsMC45NzY5OCAwLjkyNjQsMS43NDIzYzAuMjE5MzQsMC4zNzgwNCAxLjYzOTM5LDAuMzU0OTUgMS42MzkzOSwwLjgyMzQ5YzAsMS4wMTYzIC0wLjY4MzM0LDAuNDE1MjMgLTEuNTQwMzEsMC44MzA3MWMtMC4zMzc5MiwwLjE2MzgzIC0wLjYyNDc0LDEuNzM1MDggLTEuMDI1NDgsMS43MzUwOGMtMC41ODk0MSwwIC0wLjM0NjQ4LC0xLjQ5MzE5IC0wLjc3OTcsLTEuODI3MzFjLTAuNjA4MzIsLTAuNDY5MTggLTEuNzg2MDksMC4wODkxNyAtMS43ODYwOSwtMC43Mzg0N3oiIGZpbGw9IiNmZmZmZmYiLz48L2c+PC9nPjxnPjxwYXRoIGQ9Ik0yNTUuODE5NzMsMjMyLjUwNjQ2bDU5LjE1ODcxLC04OS44OTUyNmMwLDAgMy40NDE2MywtMTAuOTE4OTMgMTUuMDgwMTgsLTEwLjQ2ODI3YzkuNTYyMywwLjM3MDI2IDcuOTYyNTUsNjAuOTg4OTggNy45NjI1NSw2MC45ODg5OGMwLDAgOC44OTc1MiwtMTMuNTUxOTIgMTcuNzMwMDEsLTI4LjI2Njg0YzkuNTQxNTQsLTE1Ljg5NjIyIDE1LjQyNDY5LC0zMi4wNjYxNiAyNS42NTM4NywtMzIuNjMwNTljMy45MjgxOCwtMC4yMTY3NSAxMC40MzM2OSw5LjM3NzY1IDEwLjQzMzY5LDkuMzc3NjVsMC42MDgxMSw4OC4zODI5NmwtMTkuNzk1NSwwLjU3NTAzbDEuMTY4MzksLTYwLjA2MzY2bC0yOC40NjU3OCw0NS41MjY5MWMwLDAgLTEzLjAzNzQ5LDE2LjI4MDYxIC0xNy4xMzE1NywxNi4xMjE3MmMtOS4zMjA3NiwtMC4zNjE3NSAtMTIuOTM5MzUsLTExLjM1ODE4IC0xMi45MzkzNSwtMTEuMzU4MThsLTAuNDY3MzgsLTQ3LjY1MjgzbC0zNi45OTU5Myw1OS4zNjIzOHoiIGZpbGw9InVybCgjY29sb3ItNykiIHN0cm9rZT0iIzQyNDI0MiIgc3Ryb2tlLXdpZHRoPSI1Ii8+PHBhdGggZD0iTTI1Mi4xNTMwNywyMjcuNTA2NDZsNTkuMTU4NzEsLTg5Ljg5NTI2YzAsMCAzLjQ0MTYzLC0xMC45MTg5MyAxNS4wODAxOCwtMTAuNDY4MjdjOS41NjIzLDAuMzcwMjYgNy45NjI1NSw2MC45ODg5OCA3Ljk2MjU1LDYwLjk4ODk4YzAsMCA4Ljg5NzUyLC0xMy41NTE5MiAxNy43MzAwMSwtMjguMjY2ODRjOS41NDE1NCwtMTUuODk2MjIgMTUuNDI0NjksLTMyLjA2NjE2IDI1LjY1Mzg3LC0zMi42MzA1OWMzLjkyODE4LC0wLjIxNjc1IDEwLjQzMzY5LDkuMzc3NjUgMTAuNDMzNjksOS4zNzc2NWwwLjYwODExLDg4LjM4Mjk2bC0xOS43OTU1LDAuNTc1MDNsMS4xNjgzOSwtNjAuMDYzNjZsLTI4LjQ2NTc4LDQ1LjUyNjkxYzAsMCAtMTMuMDM3NDksMTYuMjgwNjEgLTE3LjEzMTU3LDE2LjEyMTcyYy05LjMyMDc2LC0wLjM2MTc1IC0xMi45MzkzNSwtMTEuMzU4MTggLTEyLjkzOTM1LC0xMS4zNTgxOGwtMC40NjczOCwtNDcuNjUyODNsLTM2Ljk5NTkzLDU5LjM2MjM4eiIgZmlsbD0idXJsKCNjb2xvci04KSIgc3Ryb2tlPSIjMDAwMDAwIiBzdHJva2Utd2lkdGg9IjUiLz48ZyBzdHJva2U9Im5vbmUiIHN0cm9rZS13aWR0aD0iMCI+PHBhdGggZD0iTTM3MS4xNjY2NywxMzkuMTY2NjdjMCwtMy41ODk4NSAyLjkxMDE1LC02LjUgNi41LC02LjVjMy41ODk4NSwwIDYuNSwyLjkxMDE1IDYuNSw2LjVjMCwzLjU4OTg1IC0yLjkxMDE1LDYuNSAtNi41LDYuNWMtMy41ODk4NSwwIC02LjUsLTIuOTEwMTUgLTYuNSwtNi41eiIgZmlsbD0idXJsKCNjb2xvci05KSIvPjxwYXRoIGQ9Ik0zNzYuODY4NDIsMTM3LjIyODA3YzAsLTAuNjcwMTIgMS4zNjY0MywtMC40MDE4NSAxLjc4NzExLC0wLjg1ODg2YzAuNDY4OSwtMC41MDkzOSAwLjAzMTc1LC0xLjcwNjkzIDAuNzc4NjgsLTEuNzA2OTNjMC45NDg1MSwwIDAuNDgyMzYsMC45NzY5OCAwLjkyNjQsMS43NDIzYzAuMjE5MzUsMC4zNzgwNSAxLjYzOTM5LDAuMzU0OTUgMS42MzkzOSwwLjgyMzQ5YzAsMS4wMTYzIC0wLjY4MzM1LDAuNDE1MjMgLTEuNTQwMzEsMC44MzA3MWMtMC4zMzc5MSwwLjE2MzgzIC0wLjYyNDc0LDEuNzM1MDggLTEuMDI1NDgsMS43MzUwOGMtMC41ODk0MSwwIC0wLjM0NjQ4LC0xLjQ5MzE5IC0wLjc3OTY5LC0xLjgyNzMyYy0wLjYwODMxLC0wLjQ2OTE3IC0xLjc4NjEsMC4wODkxNyAtMS43ODYxLC0wLjczODQ3eiIgZmlsbD0iI2ZmZmZmZiIvPjwvZz48L2c+PC9nPjwvZz48L3N2Zz4=">
			<center id="text">
				<h1 style="font-family:arial;color:white;position:fixed;top:50%;left:50%;margin-left:-230px;margin-top:100px;">
				made with gvbvdxx game maker<br>please click to play</h1>
			</center>
			<center>
				<canvas id="gameScreen" hidden width=600 height=360 style="width:88.5%;height:calc(100vh - 20px);image-rendering:pixelated;"></canvas>
			</center>
		</div>
		<!--TODO: replace the vm src with the compressed vm-->
		<script src="
			data:text/plain;charset=utf-8;base64,d2luZG93LmF1ZGlvRW5naW5lPXtzZng6e2F1ZGlvOm51bGwscGxheTpmdW5jdGlvbih0KXt0aGlzLmF1ZGlvPWRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoImF1ZGlvIiksdGhpcy5hdWRpby5zcmM9dCx0aGlzLmF1ZGlvLnBsYXkoKX19LGJnbTp7YXVkaW86ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiYXVkaW8iKSxpc1BsYXlpbmc6ITEscGxheTpmdW5jdGlvbigpe3RyeXt0aGlzLmF1ZGlvLnBsYXkoKSx0aGlzLmlzUGxheWluZz0hMH1jYXRjaCh0KXtjb25zb2xlLndhcm4oIltBdWRpb0VuZ2luZV06ZXJyb3IgaWdub3JlZCIrdCl9fSxzZXRTcmM6ZnVuY3Rpb24odCl7dGhpcy5hdWRpby5zcmM9dH19LHN0b3A6ZnVuY3Rpb24oKXt0cnl7dGhpcy5zZnguYXVkaW8mJih0aGlzLnNmeC5hdWRpby5wYXVzZSgpLHRoaXMuc2Z4LmF1ZGlvPW51bGwpLHRoaXMuYmdtLmlzUGxheWluZz0hMX1jYXRjaCh0KXtjb25zb2xlLndhcm4oIltBdWRpb0VuZ2luZV06ZXJyb3IgaWdub3JlZCIrdCl9fSx0aWNrQXVkaW86ZnVuY3Rpb24oKXsxPT13aW5kb3cuYXVkaW9FbmdpbmUuYmdtLmlzUGxheWluZz93aW5kb3cuYXVkaW9FbmdpbmUuYmdtLmF1ZGlvLnBsYXkoKTp3aW5kb3cuYXVkaW9FbmdpbmUuYmdtLmF1ZGlvLnBhdXNlKCl9fSx3aW5kb3cuYXVkaW9FbmdpbmUuYmdtLmF1ZGlvLmxvb3A9ITAsc2V0SW50ZXJ2YWwod2luZG93LmF1ZGlvRW5naW5lLnRpY2tBdWRpbywxKSx3aW5kb3cudm09e2lkY291bnRlcjowLGNvbnRyb2w6e3N0YXJ0OmZ1bmN0aW9uKGEpe2lmKCF2bS5hdWRpb0VuZ2luZSl0aHJvdyBFcnJvcigiQXVkaW9FbmdpbmUgTXVzdCBCZSBBdHRhY2hlZCIpO2lmKCF2bS5yZW5kZXJlcil0aHJvdyBFcnJvcigiUmVuZGVyZXIgTXVzdCBCZSBBdHRhY2hlZCIpO3ZtLmNvbnRyb2wuc3RvcCgpLHZtLmNvbnRyb2wucnVubmluZz0hMCx2bS5pZGNvdW50ZXI9MCx2bS5wcm9qZWN0Lm1vbml0b3JzPVtdLHdpbmRvdy52bS5yZW5kZXJlci5iZy5zcmM9IiI7dHJ5e2V2YWwodm0uY29kZSl9Y2F0Y2goZSl7dm0uY29uc29sZS5lcnJvcigiRXJyb3IgaW4gc2NyaXB0OiIrZSl9fSxzdG9wOmZ1bmN0aW9uKCl7dm0uaWRjb3VudGVyPTAsdm0uY29udHJvbC5ydW5uaW5nPSExLHZtLnByb2plY3Quc3ByaXRlcz1bXSx2bS5wcm9qZWN0LmV2ZW50cy50aWNrPVtdLHZtLnByb2plY3Quc3ByaXRlcz1bXSx2bS5wcm9qZWN0LmtleXNQcmVzc2VkPVtdLHZtLmF1ZGlvRW5naW5lLnN0b3AoKTt0cnl7d2luZG93LnZtLm9uc3RvcCgpfWNhdGNoKHQpe2NvbnNvbGUuZXJyb3IodCl9fSxydW5uaW5nOiExfSxjb2RlOiIiLHJlbmRlcmVyOm51bGwsYXR0YWNoUmVuZGVyZXI6ZnVuY3Rpb24odCl7cmV0dXJuIHZtLnJlbmRlcmVyPXQsdm0ucmVuZGVyZXIuc3RhcnQoKSx0fSxhdHRhY2hBdWRpb0VuZ2luZTpmdW5jdGlvbih0KXtyZXR1cm4gdm0uYXVkaW9FbmdpbmU9dH0scHJvamVjdDp7bW91c2VEb3duOiExLG1vdXNlWDowLG1vdXNlWTowLGtleXNQcmVzc2VkOltdLHNwcml0ZXM6W10sZXZlbnRzOnt0aWNrOltdfSxtb25pdG9yczpbXSxyZXNvdXJjZXM6W10sYmxvY2s6e21vdmVTdGVwczpmdW5jdGlvbih0LGUpe3RyeXt2YXIgcj1lLG89OTAtdC5kaXJlY3Rpb24sbj1NYXRoLmNvcyhvKihNYXRoLlBJLzE4MCkpKnIscj1NYXRoLnNpbihvKihNYXRoLlBJLzE4MCkpKnIsbj1uK247dC54PXQueCtuLHQueT10LnkrKHIrcil9Y2F0Y2godCl7dm0uY29uc29sZS5lcnJvcigiRXJyb3IgaW4gc2NyaXB0OiIrdCl9fSxkZWxldGVMaXN0OmZ1bmN0aW9uKHQsZSl7dHJ5e2RlbGV0ZSB0W2VdO2Zvcih2YXIgcj0wLG89W107dC5sZW5ndGg+cjspbnVsbCE9dFtyXSYmby5wdXNoKHRbcl0pLHIrPTE7cmV0dXJuIG99Y2F0Y2godCl7dm0uY29uc29sZS5lcnJvcigiRXJyb3IgaW4gc2NyaXB0OiIrdCl9fSxtYWtlU3ByaXRlOmZ1bmN0aW9uKCl7dHJ5e3ZtLmlkY291bnRlcis9MTt2YXIgdD17ZGlyZWN0aW9uOjkwLHg6MCx5OjAsd2lkdGg6MzIsaGVpZ2h0OjMyLGltYWdlOm51bGwsZmxpcDoibm9uZSIsaWQ6dm0uaWRjb3VudGVyLGdob3N0OjAsY2xpY2tlZDpbXX07cmV0dXJuIHRoaXMuc2hvd1Nwcml0ZSh0KSx0fWNhdGNoKHQpe319LG1ha2VNb25pdG9yOmZ1bmN0aW9uKCl7dHJ5e3ZhciB0PXt4OjAseTowLHZhbHVlOjAsbmFtZToibW9uaXRvciIsdmlzaWJsZTohMCxjbGlja2VkOltdfTtyZXR1cm4gd2luZG93LnZtLnByb2plY3QubW9uaXRvcnMucHVzaCh0KSx0fWNhdGNoKHQpe3ZtLmNvbnNvbGUuZXJyb3IoIkVycm9yIGluIHNjcmlwdDoiK3QpfX0sc2hvd1Nwcml0ZTpmdW5jdGlvbih0KXt0cnl7dGhpcy5oaWRlU3ByaXRlKHQpLHZtLnByb2plY3Quc3ByaXRlcy5wdXNoKHQpfWNhdGNoKHQpe3ZtLmNvbnNvbGUuZXJyb3IoIkVycm9yIGluIHNjcmlwdDoiK3QpfX0saGlkZVNwcml0ZTpmdW5jdGlvbih0KXt0cnl7dmFyIGU9dm0ucHJvamVjdC5zcHJpdGVzLmluZGV4T2YodCk7LTE8ZSYmdm0ucHJvamVjdC5zcHJpdGVzLnNwbGljZShlLDEpfWNhdGNoKHQpe319LGNvczpmdW5jdGlvbih0KXt0cnl7cmV0dXJuIE1hdGguY29zKHQqKE1hdGguUEkvMTgwKSl9Y2F0Y2godCl7dm0uY29uc29sZS5lcnJvcih0KX19LHNpbjpmdW5jdGlvbih0KXt0cnl7cmV0dXJuIE1hdGguc2luKHQqKE1hdGguUEkvMTgwKSl9Y2F0Y2godCl7dm0uY29uc29sZS5lcnJvcih0KX19LGdldE1vc2VEYXRhOmZ1bmN0aW9uKCl7dHJ5e3JldHVybnt4OnZtLnByb2plY3QubW91c2VYLHk6dm0ucHJvamVjdC5tb3VzZVksZG93bjp2bS5wcm9qZWN0Lm1vdXNlRG93bn19Y2F0Y2godCl7fX0sZGF0YVRvSW1nOmZ1bmN0aW9uKHQpe3RyeXt2YXIgZT1kb2N1bWVudC5jcmVhdGVFbGVtZW50KCJpbWciKTtyZXR1cm4gZS5zcmM9dCxlLnNldEF0dHJpYnV0ZSgic3R5bGUiLCJpbWFnZS1yZW5kZXJpbmc6IHBpeGVsYXRlZDsiKSxlfWNhdGNoKHQpe319LHJhbmRvbTpmdW5jdGlvbih0LGUpe3ZhciByO3JldHVybiBlPHQmJihyPXQsdD1lLGU9ciksTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpKihlLXQrMSkrdCl9LGlzVG91Y2hpbmc6ZnVuY3Rpb24odCxlLHIpe3RyeXtyZXR1cm4gdm0uX19fQ0hFQ0tDT0xMSURFKHQsZSl9Y2F0Y2godCl7dm0uY29uc29sZS5lcnJvcigiRXJyb3IgaW4gc2NyaXB0OiIrdCl9fSxnZXRLZXlQcmVzc2VkOmZ1bmN0aW9uKHQpe3RyeXtyZXR1cm4hIXZtLnByb2plY3Qua2V5c1ByZXNzZWRbdF19Y2F0Y2godCl7fX0sd2FpdDpmdW5jdGlvbih0LGUpe3RyeXtzZXRUaW1lb3V0KCgpPT57d2luZG93LnZtLmNvbnRyb2wucnVubmluZyYmZSgpfSwxZTMqdCl9Y2F0Y2godCl7fX0sZ2V0VG91Y2hNb3VzZTpmdW5jdGlvbih0KXtyZXR1cm4gd2luZG93LnZtLl9fX0NIRUNLQ09MTElERSh7eDp3aW5kb3cudm0ucHJvamVjdC5tb3VzZVgseTp3aW5kb3cudm0ucHJvamVjdC5tb3VzZVksd2lkdGg6MSxoZWlnaHQ6MX0sdCl9fX0sdmFyaWFibGVzOntjYW5EcmFnOiExfSx2bVRpY2s6ZnVuY3Rpb24oKXtpZih2bS5jb250cm9sLnJ1bm5pbmcpe2Zvcih2YXIgdCBpbiB2bS5wcm9qZWN0LmV2ZW50cy50aWNrKXRyeXt2bS5wcm9qZWN0LmV2ZW50cy50aWNrW3RdKCl9Y2F0Y2godCl7dm0uY29uc29sZS5lcnJvcih0KX10cnl7dm0ucmVuZGVyZXIudGljayh2bS5wcm9qZWN0LnNwcml0ZXMsdm0ucHJvamVjdC5tb25pdG9ycyl9Y2F0Y2godCl7fXRoaXMudGlja3MrPTA7dHJ5e3dpbmRvdy52bS5vbnRpY2soKX1jYXRjaCh0KXtjb25zb2xlLmVycm9yKHQpfX1lbHNlIHRoaXMudGlja3M9MDt3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHZtLnZtVGljayl9LHN0YXJ0OmZ1bmN0aW9uKCl7dm0uY29udHJvbC5zdGFydCgpfSxzdG9wOmZ1bmN0aW9uKCl7dm0uY29udHJvbC5zdG9wKCl9LHNldE1vdXNlUG9zOmZ1bmN0aW9uKHQpe3RoaXMucHJvamVjdC5tb3VzZVg9dC54LHRoaXMucHJvamVjdC5tb3VzZVk9dC55fSxzZXRNb3VzZURvd246ZnVuY3Rpb24odCl7aWYoMT09dClmb3IodmFyIGUgaW4gdm0ucHJvamVjdC5zcHJpdGVzKXRyeXtpZih0aGlzLl9fX0NIRUNLQ09MTElERSh7eDp0aGlzLnByb2plY3QubW91c2VYLHk6dGhpcy5wcm9qZWN0Lm1vdXNlWSx3aWR0aDoxLGhlaWdodDoxfSx2bS5wcm9qZWN0LnNwcml0ZXNbZV0pKXt2YXIgcixvPXZtLnByb2plY3Quc3ByaXRlc1tlXTtmb3IociBpbiBvLmNsaWNrZWQpdHJ5e28uY2xpY2tlZFtyXSgpfWNhdGNoKHQpe3ZtLmNvbnNvbGUuZXJyb3IodCl9fX1jYXRjaCh0KXtjb25zb2xlLmVycm9yKHQpfXRoaXMucHJvamVjdC5tb3VzZURvd249dH0sY29uc29sZTp7bG9nOmZ1bmN0aW9uKHQpe2NvbnNvbGUubG9nKCJbdm0gLSBwcm9ncmFtXTogIit0KX0sZXJyb3I6ZnVuY3Rpb24odCl7Y29uc29sZS5lcnJvcigiW3ZtIC0gcHJvZ3JhbV06ICIrdCksdm0uc3RvcCgpfSxjbGVhcjpmdW5jdGlvbih0KXtjb25zb2xlLmNsZWFyKCl9fSxzaW11bGF0ZUtleTpmdW5jdGlvbih0KXt0LmRvd24/dGhpcy5wcm9qZWN0LmtleXNQcmVzc2VkW3Qua2V5XT0hMDp0aGlzLnByb2plY3Qua2V5c1ByZXNzZWRbdC5rZXldPSExfSxjb2xsaWRlV2lkdGg6MCxjb2xsaWRlSGVpZ2h0OjAsX19fQ0hFQ0tDT0xMSURFOmZ1bmN0aW9uKHQsZSl7cmV0dXJuITF9LGNvbGxpZGVEaXY6ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgiZGl2IiksYWRkRXZlbnRMaXN0ZW5lcjpmdW5jdGlvbih0LGUpe3RoaXNbIm9uIit0XT1lfSxvbnRpY2s6ZnVuY3Rpb24oKXt9LG9uc3ByaXRlY3JlYXRlOmZ1bmN0aW9uKHQpe30sb25zdG9wOmZ1bmN0aW9uKCl7fSxfX2RlY29kZURhdGFCYXNlNjRVUkk6ZnVuY3Rpb24odCl7cmV0dXJuIGF0b2IodC5zcGxpdCgiOyIpLnBvcCgpLnNwbGl0KCIsIikucG9wKCkpfX0sdm0uX19fQ0hFQ0tDT0xMSURFPWZ1bmN0aW9uKHQsZSl7dmFyIHI9K3Qud2lkdGgsbz10LmhlaWdodCxuPXQueC12bS5yZW5kZXJlci5jYW52YXMud2lkdGgvMixpPXQueS12bS5yZW5kZXJlci5jYW52YXMuaGVpZ2h0LzIsYz0rZS53aWR0aCxzPWUuaGVpZ2h0LHQ9ZS54LXZtLnJlbmRlcmVyLmNhbnZhcy53aWR0aC8yLGU9ZS55LXZtLnJlbmRlcmVyLmNhbnZhcy5oZWlnaHQvMjtyZXR1cm4hKGkrbzxlfHxlK3M8aXx8MipuK3I8Mip0fHwyKnQrYzwyKm4pfSx3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHZtLnZtVGljayksd2luZG93LnJlbmRlcmVyPXtjYW52YXM6bnVsbCxiZzpkb2N1bWVudC5jcmVhdGVFbGVtZW50KCJpbWciKSxiYWNrZ3JvdW5kSW1nOm51bGwsc3RhcnQ6ZnVuY3Rpb24oKXt0aGlzLmNvbnRleHQ9dGhpcy5jYW52YXMuZ2V0Q29udGV4dCgiMmQiKSx0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGE9MSx0aGlzLmNvbnRleHQuc3Ryb2tlU3R5bGU9dGhpcy5jb2xvcix0aGlzLmNvbnRleHQuZmlsbFN0eWxlPXRoaXMuY29sb3IsdGhpcy5jb250ZXh0LmJlZ2luUGF0aCgpLHRoaXMuY29udGV4dC5maWxsUmVjdCgwLDAsdGhpcy5jYW52YXMud2lkdGgrMix0aGlzLmNhbnZhcy5oZWlnaHQrMiksdGhpcy5jb250ZXh0LnN0cm9rZSgpLHRoaXMudGVzdD0wLHRoaXMuY2FudmFzLnN0eWxlLmltYWdlUmVuZGVyaW5nPSJQaXhlbGF0ZWQifSx0aWNrOmZ1bmN0aW9uKHQsZSl7dGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhPTEsdGhpcy5jb250ZXh0LmZpbGxTdHlsZT10aGlzLmNvbG9yLHRoaXMuY29udGV4dC5zdHJva2VTdHlsZT10aGlzLmNvbG9yLHRoaXMuY29udGV4dC5iZWdpblBhdGgoKSx0aGlzLmNvbnRleHQuZmlsbFJlY3QoMCwwLHRoaXMuY2FudmFzLndpZHRoKzIsdGhpcy5jYW52YXMuaGVpZ2h0KzIpLHRoaXMuY29udGV4dC5zdHJva2UoKSx0aGlzLmNvbnRleHQud2Via2l0SW1hZ2VTbW9vdGhpbmdFbmFibGVkPSExLHRoaXMuY29udGV4dC5tb3pJbWFnZVNtb290aGluZ0VuYWJsZWQ9ITEsdGhpcy5jb250ZXh0LmltYWdlU21vb3RoaW5nRW5hYmxlZD0hMTt0cnl7dGhpcy5jb250ZXh0LmRyYXdJbWFnZSh0aGlzLmJnLDAsMCx0aGlzLmNhbnZhcy53aWR0aCx0aGlzLmNhbnZhcy5oZWlnaHQpfWNhdGNoKHQpe31mb3IodmFyIHIgaW4gdCl0W3JdLHRoaXMuX2RyYXdTcHJpdGUodFtyXSk7Zm9yKHZhciByIGluIGUpZVtyXSx0aGlzLl9kcmF3TW9uaXRvcihlW3JdKX0sX2RyYXdTcHJpdGU6ZnVuY3Rpb24odCl7dGhpcy5jb250ZXh0LnNhdmUoKTt0cnl7dmFyIGU9dC54LHI9MC10Lnksbz10Lmdob3N0OzEwMDxvJiYobz0xMDApLG88MCYmKG89MCksdGhpcy5jb250ZXh0Lmdsb2JhbEFscGhhPTEtby8xMDAsdGhpcy5jb250ZXh0LnRyYW5zbGF0ZSh0aGlzLmNhbnZhcy53aWR0aC8yK3QueCtlLHRoaXMuY2FudmFzLmhlaWdodC8yK3IpLHRoaXMuY29udGV4dC5yb3RhdGUoKHQuZGlyZWN0aW9uLTkwKSpNYXRoLlBJLzE4MCksImhvciI9PXQuZmxpcD90aGlzLmNvbnRleHQuc2NhbGUoLTEsMSk6InZlciI9PXQuZmxpcCYmdGhpcy5jb250ZXh0LnNjYWxlKDEsLTEpLHRoaXMuY29udGV4dC5kcmF3SW1hZ2UodC5pbWFnZSx0LndpZHRoLy0yLHQuaGVpZ2h0Ly0yLHQud2lkdGgsdC5oZWlnaHQpfWNhdGNoKHQpe310aGlzLmNvbnRleHQucmVzdG9yZSgpfSxfZHJhd01vbml0b3I6ZnVuY3Rpb24odCl7dGhpcy5jb250ZXh0LnNhdmUoKTt0cnl7aWYodC52aXNpYmxlKXt0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGE9MSx0aGlzLmNvbnRleHQudHJhbnNsYXRlKDAsMCkscmVuZGVyZXIuY29udGV4dC5mb250PSIxNXB4IGFyaWFsIjt2YXIgZT1yZW5kZXJlci5jb250ZXh0Lm1lYXN1cmVUZXh0KHQudmFsdWUpLndpZHRoLHI9cmVuZGVyZXIuY29udGV4dC5tZWFzdXJlVGV4dCh0Lm5hbWUpLndpZHRoLTI1O3JldHVybiB0aGlzLmNvbnRleHQuZ2xvYmFsQWxwaGE9MSxyZW5kZXJlci5jb250ZXh0LmZpbGxTdHlsZT0iIzg2OGU5NiIscmVuZGVyZXIuY29udGV4dC5maWxsUmVjdCh0LngtMix0LnktMiw3NCtyK2UsMjQpLHJlbmRlcmVyLmNvbnRleHQuZmlsbFN0eWxlPSIjY2VkNGRhIixyZW5kZXJlci5jb250ZXh0LmZpbGxSZWN0KHQueCx0LnksNzArcitlLDIwKSxyZW5kZXJlci5jb250ZXh0LmZpbGxTdHlsZT0iI2ZmOGMwMCIscmVuZGVyZXIuY29udGV4dC5maWxsUmVjdCh0LngrNjAsdC55KzMsNStyK2UsMTUpLHJlbmRlcmVyLmNvbnRleHQuZmlsbFN0eWxlPSJ3aGl0ZSIscmVuZGVyZXIuY29udGV4dC5maWxsVGV4dCh0LnZhbHVlLHQueCs2MCx0LnkrMTUpLHJlbmRlcmVyLmNvbnRleHQuZmlsbFN0eWxlPSJibGFjayIscmVuZGVyZXIuY29udGV4dC5maWxsVGV4dCh0Lm5hbWUsdC54KzYsdC55KzE1KSx7d2lkdGg6NzQrcitlLGhlaWdodDoyNCx4OnQueCx5OnQueX19fWNhdGNoKHQpe2NvbnNvbGUuZXJyb3IodCl9dGhpcy5jb250ZXh0LnJlc3RvcmUoKX0sY29sb3I6IiNmZmZmZmYifSx3aW5kb3cudmFyaWFibGVzPXt2bTp3aW5kb3cudm19Ow==
			"></script>
		<script>
			
			document.getElementById("app").hidden = false;
			document.getElementById("loading").hidden = true;
			var file = (${gui.editorToJsonText()});
			document.title = file.title;
			document.onclick = function () {
				renderer.canvas = document.getElementById("gameScreen");
				vm.code = "";
				vm.attachRenderer(renderer);
				vm.attachAudioEngine(audioEngine);
				function getMousePos(canvas, evt) {
					var rect = canvas.getBoundingClientRect();
					return {
						x: ((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width)/2,
						y: (evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height
					};
				}
				function readFiles(files) {
					var index = 0;
					while (index < files.length) {
						window.vm.project.resources[files[index].name] = {
							name:files[index].name,
							data:files[index].data,
							type:files[index].type
						};
						index += 1;
					}
				}
				document.getElementById("gameScreen").onmousemove = function (event) {
					var pos = getMousePos(document.getElementById("gameScreen"), event);// get adjusted coordinates as above
					var x = Math.round(pos.x/1)-(document.getElementById("gameScreen").width/2)/2;
					var y = Math.round(pos.y*-1)+(document.getElementById("gameScreen").height/2);
					
					vm.setMousePos({
						x:x,
						y:y
					});
				}
				document.getElementById("gameScreen").onmousedown = function (event) {
					event.preventDefault();
					vm.setMouseDown(true);
				}
				document.body.onmouseup = function (event) {
					event.preventDefault();
					vm.setMouseDown(false);
				}
				document.body.onkeydown = function (event) {
					vm.simulateKey({
						key:event.key,
						down:true
					});
					event.preventDefault();
				};
				document.body.onkeyup = function (event) {
					vm.simulateKey({
						key:event.key,
						down:false
					});
				};
				readFiles(file.files)
				vm.code = file.code;
				document.getElementById("gameScreen").hidden = false;
				document.getElementById("logo").hidden = true;
				document.getElementById("text").hidden = true;
				vm.start();
				document.onclick = null;
			};
		</script>
	</body>
</html>
	`;
	var a = document.createElement("a");
	const contents = html;
	const blob = new Blob([contents], {type : 'html'});
	a.href = URL.createObjectURL(blob);
	a.download = document.getElementById("gameTitle").value+".html";
	a.click();
}

//make it so a dailog will show when the user closes the page
if (window.options.confirmDialog) {
	setInterval(() => {
		window.onbeforeunload = function() {
			return "empty";
		};
	});
}

//new game
document.getElementById("New_Game").onclick = function () {
	if (window.confirm('Do You Want To Start Over? Once You Click Ok, You Cannot Recover It.')) {
		workspace.clear();
		clearResources();loadDefaultGame();
	}
};