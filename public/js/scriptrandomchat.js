$('.chatstart').hover(function(){
    $('.chatstart-after').stop().fadeToggle();
});

$('.chatstart').on('click',function(){
     $('.attention').fadeOut(20);
});


// $('.container1 div').hover(function(){
//     $(this).children('.p-box').stop().fadeToggle();
// });

// new WOW().init();