$(function(){

	var dropbox = $('#dropbox'),
			message = $('.message', dropbox),
			prefix = (typeof quiz_prefix !== 'undefined') ? quiz_prefix : 'quiz_',
			sub_prefix = (typeof quiz_sub_prefix !== 'undefined') ? quiz_sub_prefix : 'choice_',
			delay = 500,
			upload_url = '/quiz/upload',
			save_url = "/quiz/save";
			

	var template = '<div class="preview">'+
						'<span class="imageHolder">'+
							'<img />'+
							'<span class="uploaded"></span>'+
						'</span>'+
						'<div class="progressHolder">'+
							'<div class="progress progress-striped active"><div class="bar" style="width:0"></div></div>'+
						'</div>'+
					'</div>'; 

	var imgs = [];

	initUploader();


	function createImage(file){

		var preview = $(template), 
			image = $('img', preview);
		
		var reader = new FileReader();
	
		image.width = 100;
		image.height = 100;
	
		reader.onload = function(e){
		
			// e.target.result holds the DataURL which
			// can be used as a source of the image:
		
			image.attr('src', e.target.result);
		};
	
		// Reading the file as a DataURL. When finished,
		// this will trigger the onload function above:
		reader.readAsDataURL(file);
	
		message.hide();
		preview.appendTo(dropbox);
	
		// Associating a preview container
		// with the file, using jQuery's $.data():
	
		$.data(file,preview);
	}

	function showMessage(msg){
		message.html(msg);
	}
	

	function initUploader(){
		
		dropbox.filedrop({
			// The name of the $_FILES entry:
			'paramname':'files',

			'maxfiles': 5,
			'maxfilesize': 2, //in MB
			'url': upload_url,

			uploadFinished:function(i,file,res){
				if ( res.status === "success") {	
					setTimeout(function(){
						var f = $.data(file);				
						f.addClass('done');
						f.find('.uploaded').text("Success!");
					}, delay*2)
					imgs.push(res.src);
				}
			},
			afterAll: function(){
				// response is the JSON object that post_file.php returns
				callNext(imgs)
			},
			error: function(err, file) {
				switch(err) {
					case 'BrowserNotSupported':
						showMessage('Your browser does not support HTML5 file uploads!');
						break;
					case 'TooManyFiles':
						alert('Too many files! Please select **'+this.maxfiles+'** at most!');
						break;
					case 'FileTooLarge':
						alert(file.name+' is too large! Please upload files up to **'+this.maxfilesize+'MB**');
						break;
					default:
						break;
				}
			},
			beforeEach: function(file){
				if(!file.type.match(/^image\//)){
					alert('Only images are allowed!');
					return false;
				}
			},
	
			uploadStarted:function(i, file, len){ createImage(file); },

			progressUpdated: function(i, file, progress) {
				$.data(file).find('.progress .bar').width(progress+"%");
				if (progress >= 100){
					var p = $.data(file).find('.progress');
					setTimeout(function(){
						p.removeClass('active');
						setTimeout(function(){
							p.addClass('progress-success');
						}, delay);
					}, delay)
			
				}
		
			}
	 
		});
	}
	
	function callNext(imgs){
		console.log("Processing Uploads...", imgs)
		$('a.nextstep').show();
		initNext(imgs);
	}
	
	function initNext(imgs){
		var url = save_url;
		var x0 = 120, y0 = 100;
		var h = 32;
		var bm = 4;
		var infos = {};
		var keys = []
		var k = 0;
		
		var frame_template = '<div class="slide quiz-pane quiz">'+
														'<div class="quiz quiz-bg"></div>'+
														'<div class="quiz quiz-wrapper"><div class="quiz quiz-inner"></div></div>'+
													'</div>';
		$.each(imgs, function(i, src){
			
			var choices = ['A', 'B', 'C', 'D'];
			var _x = x0, _y = y0;
			var key = prefix+i;
			var inf = []
			$.each(choices, function(j, cho){
				_x += h + bm;
				var o = {
					id: prefix + sub_prefix + k,
					descr: cho,
					top: _x,
					left: _y
				};
				inf.push(o);
				k++;
			})
			infos[key] = inf;
			keys.push(key);
			
			var frame = $(frame_template);
			frame.find('div.quiz-bg').append($("<img>", { 'src': src }))
			frame.find('div.quiz-inner').attr('id', key);
			frame.appendTo("#iPicture");
		})
		
		
		
		$( "#iPicture" ).iPicture({
			animation: true,
			animationBg: "bgblack",
			animationType: "ltr-slide",
			pictures: keys,
			button: "moreblack",
			moreInfos:infos,
			modify: true,
			initialize: false,
			onSave: function(widget){
				console.log(widget);
				var data = JSON.stringify(widget.options.moreInfos);
				$.post(url, {'layout': data }, function(){ alert("Save success") })
			}
		});
	}

});
