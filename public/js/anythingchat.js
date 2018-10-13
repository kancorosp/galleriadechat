$('.chatstart').hover(function(){
    $('.chatstart-after1').stop().fadeToggle();
});

$('.chatstart').hover(function(){
    $('.chatstart-after2').stop().fadeToggle();
});

$('.chatstart').on('click',function(){
     $('.attention').fadeOut(20);
});


// $('.container1 div').hover(function(){
//     $(this).children('.p-box').stop().fadeToggle();
// });

// new WOW().init();