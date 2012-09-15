$(function () {
    $('.header .left, .header .right')
        .mouseover(function () {
            $('.header').stop().animate({top:0});
        })
        .mouseout(function () {
            $('.header').stop().animate({top:-85});
        });
    $('#editor').css({height:'800px'});
});