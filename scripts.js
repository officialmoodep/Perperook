$(document).ready(function () {

    // ستون‌ها یکی‌یکی بیفتند پایین
    $(".food-col").each(function (i) {
        let col = $(this);
        setTimeout(() => {
            col.css("top", "0");
        }, i * 400);
    });

    // با کلیک → ستون‌ها یکی‌یکی برگردند بالا
    $("body").on("click", function () {

        $(".food-col").each(function (i) {
            let col = $(this);
            setTimeout(() => {
                col.css("top", "-120vh");
            }, i * 400);
        });

        // ✅ بعد از بالا رفتن ستون‌ها → چند ثانیه بعد برو به صفحه‌ای که خودت می‌خوای
        let totalTime = ($(".food-col").length * 400) + 1500;

        setTimeout(() => {
            window.location.href = "start.html";  
            // ✅ اینجا لینک صفحه‌ای که می‌خوای واردش بشه رو بزار
        }, totalTime);

    });

});
