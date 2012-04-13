$(function(){

	var dropbox = $('#dropbox'),
		message = $('.message', dropbox);
		delay = 500;
	dropbox.filedrop({
		// The name of the $_FILES entry:
		paramname:'files',
	
		maxfiles: 5,
		maxfilesize: 2,
		url: '/quiz/upload',
	
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

$(function(){

	$( "#iPicture" ).iPicture({
		animation: true,
		animationBg: "bgblack",
		animationType: "ltr-slide",
		pictures: ["picture1","picture2","picture3","picture4","picture5"],
		button: "moreblack",
		moreInfos:{					
			"picture1": [{
					    "id": "tooltip1",
					    "descr": "furniture: 299$",
					    "top": "185px",
					    "left": "393px"
					},
					{
					    "id": "tooltip2",
					    "descr": "sofa: 199$",
					    "top": "346px",
					    "left": "483px"
					},
					{
					    "id": "tooltip3",
					    "descr": "silver candle: 2.99$",
					    "top": "461px",
					    "left": "556px"
					}],
			"picture2": [{
					    "id": "tooltip4",
					    "descr": "window",
					    "top": "71px",
					    "left": "423px"
					},
					{
					    "id": "tooltip5",
					    "descr": "basket",
					    "top": "438px",
					    "left": "192px"
					},
					{
					    "id": "tooltip6",
					    "descr": "hoven",
					    "top": "460px",
					    "left": "673px"
					}],
			"picture3": [{
					    "id": "tooltip7",
					    "descr": "Organize the kitchen!",
					    "top": "391px",
					    "left": "560px"
					},
					{
					    "id": "tooltip8",
					    "descr": "Hoven: 399$",
					    "top": "160px",
					    "left": "268px"
					},
					{
					    "id": "tooltip9",
					    "descr": "chest of drawers",
					    "top": "386px",
					    "left": "180px"
					}],
			"picture4": [{
					    "id": "tooltip10",
					    "descr": "pasta maker",
					    "top": "277px",
					    "left": "672px"
					},
					{
					    "id": "tooltip11",
					    "descr": "stool",
					    "top": "291px",
					    "left": "281px"
					},
					{
					    "id": "tooltip12",
					    "descr": "shelf",
					    "top": "144px",
					    "left": "579px"
					},
					{
					    "id": "tooltip13",
					    "descr": "Dishes",
					    "top": "183px",
					    "left": "181px"
					}],
			"picture5": [{
					    "id": "tooltip14",
					    "descr": "bed: 199$",
					    "top": "398px",
					    "left": "351px"
					},
					{
					    "id": "tooltip15",
					    "descr": "asian style lamp",
					    "top": "146px",
					    "left": "380px"
					},
					{
					    "id": "tooltip16",
					    "descr": "console: 105$",
					    "top": "273px",
					    "left": "567px"
					}]},
		modify: true,
		initialize: false,
		onSave: function(widget){
			console.log(widget);
			var data = JSON.stringify(widget.options.moreInfos);
			$.post("/quiz/save", {'layout': data }, function(){ alert("Save success") })
		}
	});



  
});
