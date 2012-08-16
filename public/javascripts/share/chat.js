// TODO: Hardcoded for now
var username = 'test';

$('#message').keydown(function (e) {
	if ((e.keyCode || e.which) == 13) {
		if (!e.srcElement.value) return;
		// enter was pressed
		$state.submitOp({
			p: ['chat',0],
			li: {
				from: username,
				message: e.srcElement.value
			}
		});
		e.srcElement.value = '';
	}
})

var grid = {width: 10, height: 10},
gridAt = function (g,x,y) {
	return g.values[y*g.width+x];
},
colorStyle = function (color) {
	return 'rgb(' + color[0] + ',' + color[1] + ',' + color[2] + ')';
};

function hslToRgb(h, s, l){
	var r, g, b;

	if(s == 0){
		r = g = b = l; // achromatic
	} else {
		function hue2rgb(p, q, t) {
			if(t < 0) t += 1;
			if(t > 1) t -= 1;
			if(t < 1/6) return p + (q - p) * 6 * t;
			if(t < 1/2) return q;
			if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		}

		var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		var p = 2 * l - q;
		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return '#' + Math.round(r * 255).toString(16) + Math.round(g * 255).toString(16) + Math.round(b * 255).toString(16);
};

function colorForName(name) {
	var x = 0;
	var p = 31;
	for (var i = 0; i < name.length; i++) {
		var c = name.charCodeAt(i);
		x += c * p;
		p *= p;
		x = x % 4294967295;
	}
	var h = (x % 89)/89;
	var color = hslToRgb(h, 0.7, 0.3)
	return color;
}

function addChatMessage(m) {
	var msg = $('<div class="message"><div class="user"></div><div class="text"></div></div>');
	$('.text', msg).text(m.message);
	$('.user', msg).text(m.from);
	$('.user', msg).css('color',colorForName(m.from));
	$('#chat #messages').append(msg);
	var allMsgs = $('.message')
	if (allMsgs.length > 15) {
		allMsgs.slice(0, Math.max(0,allMsgs.length - 15)).each(function () {
			var e = $(this);
			e.fadeOut('slow', function () {
				e.remove();
			});
		});
	}
}

function stateUpdated(op) {
	if (op) {
		var opel = $('<div class="op" style="display:none">');
		opel.fadeIn('fast')
		var allOps = $('.op');
		if (allOps.length > 10) {
			allOps.slice(0, Math.max(0,allOps.length - 10)).each(function () {
				var e = $(this);
				e.fadeOut('fast', function () {
					e.remove();
				});
			});
		}
		op.forEach(function (c) {
			if (c.p[0] == 'chat' && c.li) {
				addChatMessage(c.li)
			}
		})
	} else {
		// first run
		$state.snapshot.chat.slice(0, 10).reverse().forEach(addChatMessage)
	}
}

var $state;
var docname = 'hex:' + document.location.hash.slice(1)

sharejs.open(docname, 'json', function(error, doc) {
	$state = doc;
	doc.on('change', function (op) {
		stateUpdated(op)
	})
	if (doc.created) {
		doc.submitOp([{p:[],od:null,oi:{grid:grid,playerTurn:1,chat:[]}}])
	} else {
		stateUpdated()
	}
})