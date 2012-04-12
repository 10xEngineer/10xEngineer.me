$(function(){

	var dropbox = $('#dropbox'),
		message = $('.message', dropbox);
		delay = 500;
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'files',
	
		maxfiles: 5,
		maxfilesize: 2,
		url: '/quiz/edit',
	
		uploadFinished:function(i,file,res){
			var f = $.data(file);
			f.addClass('done');
			f.find('.uploaded').text("Success!");
			// response is the JSON object that post_file.php returns
			callNext(res)
		},
	
		error: function(err, file) {
			switch(err) {
				case 'BrowserNotSupported':
					showMessage('Your browser does not support HTML5 file uploads!');
					break;
				case 'TooManyFiles':
					alert('Too many files! Please select 5 at most! (configurable)');
					break;
				case 'FileTooLarge':
					alert(file.name+' is too large! Please upload files up to 2mb (configurable).');
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

	var template = '<div class="preview">'+
						'<span class="imageHolder">'+
							'<img />'+
							'<span class="uploaded"></span>'+
						'</span>'+
						'<div class="progressHolder">'+
							'<div class="progress progress-striped active"><div class="bar" style="width:0"></div></div>'+
						'</div>'+
					'</div>'; 


	function createImage(file){

		var preview = $(template), 
			image = $('img', preview);
		
		var reader = new FileReader();
	
		image.width = 100;
		image.height = 100;
	
		reader.onload = function(e){
		
			// e.target.result holds the DataURL which
			// can be used as a source of the image:
		
			image.attr('src',e.target.result);
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
	
	function callNext(res){
		$('a.nextstep').show();
	}

});