/*
$('.do-chat').on('click',function(){
     $('.sub-menu').slideToggle();
});
*/
$(".sub-menu").hide();

$(".do-chat").hover(
    function() {
        $(".sub-menu").slideDown('medium')
    },
    function() {
        $(".sub-menu").slideUp('medium');
    });

$('.sp').on('click', function() {
    $('.top-menu').slideToggle();
});

new WOW().init();


// $('.container1 div').hover(function(){
//     $(this).children('.p-box').stop().fadeToggle();
// });

// new WOW().init();