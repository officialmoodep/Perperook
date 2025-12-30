/*!
  script.js
  مدیریت منو، سبد خرید، اعلان‌ها و انیمیشن‌ها (jQuery)
  سازگار با index.html و style.css ارائه‌شده
*/
(function($){
  'use strict';

  /* =========================
     تنظیمات پایه
     ========================= */
  const CONFIG = {
    storageKey: 'perperook_master_cart',
    toastDuration: 3500,
    currencySymbol: 'تومان'
  };

  /* =========================
     وضعیت برنامه (بارگذاری از localStorage)
     ========================= */
  window.AppCart = (function(){
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || {};
    } catch(e) {
      return {};
    }
  })();

  /* =========================
     سرویس‌های کمکی
     ========================= */
  const Services = {
    formatPrice(num){
      const n = Number(num) || 0;
      return new Intl.NumberFormat('fa-IR').format(n) + ' ' + CONFIG.currencySymbol;
    },

    persist(){
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(window.AppCart));
      } catch(e) { /* ignore storage errors */ }
      $(document).trigger('cartUpdated');
    },

    notify(message, theme = 'success'){
      if (!$('#toast-wrapper').length) {
        $('body').append('<div id="toast-wrapper" class="toast-container position-fixed bottom-0 start-0 p-3" style="z-index:1060; display:none;"></div>');
      }
      $('#toast-wrapper').show();
      const id = 't-' + Math.random().toString(36).slice(2,10);
      const icon = theme === 'success' ? 'bi-check-circle-fill' : (theme === 'warning' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill');
      const $toast = $(`
        <div id="${id}" class="toast align-items-center text-bg-${theme} border-0 show shadow-lg mb-2" role="alert" aria-live="assertive" aria-atomic="true">
          <div class="d-flex">
            <div class="toast-body fw-bold text-white"><i class="bi ${icon} me-2"></i> ${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        </div>
      `);
      $('#toast-wrapper').append($toast);
      setTimeout(() => {
        $('#' + id).fadeOut(300, function(){ $(this).remove(); if ($('#toast-wrapper').children().length === 0) $('#toast-wrapper').hide(); });
      }, CONFIG.toastDuration);
    }
  };

  /* =========================
     رندر سبد خرید در offcanvas
     ========================= */
  window.refreshCartUI = function(){
    const $list = $('#cartItemsList');
    const $badge = $('#cartBadge');
    const $count = $('#cartCount');
    const $final = $('#finalPrice');
    let subtotal = 0;
    let itemCount = 0;

    $list.empty();

    if ($.isEmptyObject(window.AppCart)) {
      $('#emptyCartMsg').show();
    } else {
      $('#emptyCartMsg').hide();
      $.each(window.AppCart, function(id, item){
        const qty = Number(item.qty) || 0;
        const price = Number(item.price) || 0;
        subtotal += price * qty;
        itemCount += qty;

        const $row = $(`
          <div class="cart-item-row d-flex align-items-center justify-content-between p-3 mb-2 bg-white border rounded shadow-sm">
            <div class="d-flex align-items-center">
              <img src="${item.img || ''}" class="rounded-circle border me-2" style="width:48px;height:48px;object-fit:cover;" alt="${item.title}">
              <div>
                <h6 class="mb-0 fw-bold small">${item.title}</h6>
                <div class="small text-danger fw-bold">${Services.formatPrice(item.price)}</div>
              </div>
            </div>
            <div class="d-flex align-items-center gap-2">
              <button class="btn btn-sm btn-light border btn-mod" data-id="${id}" data-action="minus" aria-label="کم کردن">-</button>
              <span class="fw-bold px-2">${qty}</span>
              <button class="btn btn-sm btn-light border btn-mod" data-id="${id}" data-action="plus" aria-label="افزودن">+</button>
            </div>
          </div>
        `);
        $list.append($row);
      });
    }

    $badge.text(itemCount);
    $count.text(itemCount);
    $final.text(Services.formatPrice(subtotal));
    $('#cartTotalMobile').text(Services.formatPrice(subtotal));
    $('#checkoutBtnMobile').prop('disabled', itemCount === 0);
    $('#submitOrderBtn').prop('disabled', itemCount === 0);
  };

  /* اجرای اولیه UI */
  $(function(){ window.refreshCartUI(); });

  /* =========================
     انیمیشن Fly-to-Cart
     ========================= */
  function triggerFlyEffect($originBtn){
    try {
      const $cartTarget = $('#openCart');
      if (!$cartTarget.length) return;
      const $card = $originBtn.closest('.menu-card');
      const $img = $card.find('img').first();
      if (!$img.length) return;

      const $clone = $img.clone().css({
        opacity: 0.85,
        position: 'absolute',
        height: 120,
        width: 120,
        zIndex: 9999,
        borderRadius: '50%',
        border: '3px solid #dc3545'
      }).appendTo('body');

      const start = $img.offset();
      const end = $cartTarget.offset();
      $clone.offset({ top: start.top, left: start.left });

      $clone.animate({ top: end.top + 10, left: end.left + 10, width: 40, height: 40 }, 800, 'swing', function(){
        $clone.animate({ width: 0, height: 0, opacity: 0 }, 200, function(){ $clone.remove(); });
        $cartTarget.addClass('animate__animated animate__headShake');
        setTimeout(()=> $cartTarget.removeClass('animate__animated animate__headShake'), 900);
      });
    } catch(e) { /* silent */ }
  }

  /* =========================
     کنترل تعداد داخل کارت‌ها
     ========================= */
  $(document).on('click', '.plus', function(){
    const $span = $(this).siblings('.quantity');
    const val = parseInt($span.text(), 10) || 0;
    $span.text(val + 1);

    const $card = $(this).closest('.menu-card');
    const price = parseInt($card.data('price'), 10) || 0;
    $card.find('.item-subtotal').text(Services.formatPrice(price * (val + 1)));
  });

  $(document).on('click', '.minus', function(){
    const $span = $(this).siblings('.quantity');
    const val = parseInt($span.text(), 10) || 0;
    if (val > 0) {
      $span.text(val - 1);
      const $card = $(this).closest('.menu-card');
      const price = parseInt($card.data('price'), 10) || 0;
      $card.find('.item-subtotal').text(Services.formatPrice(price * (val - 1)));
    }
  });

  /* =========================
     افزودن به سبد خرید
     ========================= */
  $(document).on('click', '.add-to-cart', function(){
    const $btn = $(this);
    const $card = $btn.closest('.menu-card');
    const id = String($card.data('id') || '').trim();
    const qty = parseInt($card.find('.quantity').text(), 10) || 0;

    if (!id) { Services.notify('شناسه آیتم نامعتبر است', 'warning'); return; }
    if (qty <= 0) { Services.notify('لطفاً تعداد را مشخص کنید', 'warning'); return; }

    const title = $card.data('title') || $card.find('h5, h6').first().text().trim();
    const price = parseInt($card.data('price'), 10) || 0;
    const img = $card.find('img').attr('src') || '';

    if (window.AppCart[id]) {
      window.AppCart[id].qty = (Number(window.AppCart[id].qty) || 0) + qty;
    } else {
      window.AppCart[id] = { id, title, price, img, qty };
    }

    triggerFlyEffect($btn);
    $card.find('.quantity').text('0');
    $card.find('.item-subtotal').text(Services.formatPrice(0));
    Services.persist();
    Services.notify(`${title} به سبد اضافه شد`, 'success');
  });

  /* =========================
     ویرایش تعداد داخل سبد (offcanvas)
     ========================= */
  $(document).on('click', '.btn-mod', function(){
    const id = String($(this).data('id') || '');
    const action = $(this).data('action');
    if (!id || !window.AppCart[id]) return;

    if (action === 'plus') {
      window.AppCart[id].qty = (Number(window.AppCart[id].qty) || 0) + 1;
    } else if (action === 'minus') {
      if ((Number(window.AppCart[id].qty) || 0) > 1) window.AppCart[id].qty = Number(window.AppCart[id].qty) - 1;
      else delete window.AppCart[id];
    }
    Services.persist();
  });

  /* =========================
     پاکسازی کامل سبد
     ========================= */
  $('#clearAllBtn').on('click', function(){
    if (!confirm('آیا از حذف کامل سبد خرید مطمئن هستید؟')) return;
    window.AppCart = {};
    Services.persist();
    Services.notify('سبد خرید خالی شد', 'info');
  });

  /* =========================
     ثبت سفارش (نمونه محلی)
     ========================= */
  $('#submitOrderBtn').on('click', function(){
    if ($.isEmptyObject(window.AppCart)) { Services.notify('سبد خرید خالی است', 'warning'); return; }
    const $btn = $(this);
    $btn.prop('disabled', true).html('<span class="spinner-border spinner-border-sm"></span> در حال ثبت...');
    setTimeout(() => {
      alert('سفارش شما با موفقیت ثبت شد!');
      window.AppCart = {};
      Services.persist();
      $btn.prop('disabled', false).text('ثبت سفارش');
      const offEl = document.getElementById('cartSidebar');
      if (offEl && window.bootstrap && bootstrap.Offcanvas) {
        const off = bootstrap.Offcanvas.getInstance(offEl) || new bootstrap.Offcanvas(offEl);
        off.hide();
      }
    }, 1200);
  });

  /* =========================
     فرم تماس
     ========================= */
  $('#contactForm').on('submit', function(e){
    e.preventDefault();
    Services.notify('پیام شما با موفقیت ارسال شد', 'success');
    this.reset();
  });

  /* =========================
     دکمه موبایل برای باز کردن سایدبار پرداخت
     ========================= */
  $('#checkoutBtnMobile').on('click', function(){
    if ($.isEmptyObject(window.AppCart)) { Services.notify('سبد خرید خالی است', 'warning'); return; }
    const offEl = document.getElementById('cartSidebar');
    if (offEl && window.bootstrap && bootstrap.Offcanvas) {
      const off = bootstrap.Offcanvas.getOrCreateInstance(offEl);
      off.show();
    }
  });

  /* =========================
     فیلتر منو
     ========================= */
  $('[data-filter]').on('click', function(){
    const filter = $(this).data('filter');
    $('[data-filter]').removeClass('active btn-danger text-white').addClass('btn-outline-danger');
    $(this).addClass('active btn-danger text-white').removeClass('btn-outline-danger');

    $('.menu-card').each(function(){
      const cats = ($(this).attr('data-category') || '').split(' ').filter(Boolean);
      if (filter === 'all' || cats.includes(filter)) $(this).parent().show(300);
      else $(this).parent().hide(200);
    });
  });


  $(document).on('cartUpdated', function(){ window.refreshCartUI(); });


  $(window).on('load', function(){ window.refreshCartUI(); });

})(jQuery);
/* register-modal.js — منطق فرم ثبت‌نام داخل مودال */
(function($){
  'use strict';

  const STORAGE_KEY = 'perperook_users';

  function notify(msg, theme='success'){
    if (window.Services && typeof window.Services.notify === 'function') {
      window.Services.notify(msg, theme);
      return;
    }
    alert(msg);
  }

  function isValidEmail(email){
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidPhone(phone){
    return /^(09|9)\d{9}$/.test(phone.replace(/\s+/g, ''));
  }

  function passwordStrength(pwd){
    let score = 0;
    if (!pwd) return {score:0, label:'ضعیف'};
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    let label = 'ضعیف';
    if (score <= 2) label = 'ضعیف';
    else if (score <= 4) label = 'متوسط';
    else label = 'قوی';
    return {score, label};
  }

  function loadUsers(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch(e){ return []; }
  }

  function saveUsers(users){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }
    catch(e){ /* ignore */ }
  }

  function isDuplicate(email, phone){
    const users = loadUsers();
    return {
      emailExists: users.some(u => u.email && u.email.toLowerCase() === (email||'').toLowerCase()),
      phoneExists: users.some(u => u.phone === phone)
    };
  }

  // باز کردن مودال با کلیک روی دکمه
  $('#openRegisterBtn').on('click', function(){
    const modalEl = document.getElementById('registerModal');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modal = new bootstrap.Modal(modalEl);
      modal.show();
    }
  });

  // نمایش/مخفی کردن رمز
  $('#mPwdToggle').on('click', function(){
    const $pwd = $('#mRegPassword');
    const type = $pwd.attr('type') === 'password' ? 'text' : 'password';
    $pwd.attr('type', type);
    $(this).find('i').toggleClass('bi-eye bi-eye-slash');
  });

  // نوار قدرت رمز
  $('#mRegPassword').on('input', function(){
    const val = $(this).val() || '';
    const res = passwordStrength(val);
    const pct = Math.min(100, res.score * 20);
    const $bar = $('#mPwdStrengthBar');
    $bar.removeClass('pwd-weak pwd-medium pwd-strong');
    if (res.label === 'ضعیف') $bar.addClass('pwd-weak').css('width', pct + '%');
    else if (res.label === 'متوسط') $bar.addClass('pwd-medium').css('width', pct + '%');
    else $bar.addClass('pwd-strong').css('width', pct + '%');
    $('#mPwdStrengthText').text('قدرت رمز: ' + res.label);
  });

  // پاک کردن فرم هنگام بستن یا دکمه انصراف
  $('#registerModal').on('hidden.bs.modal', function(){
    $('#registerFormModal')[0].reset();
    $('#mPwdStrengthBar').css('width','0%').removeClass('pwd-weak pwd-medium pwd-strong');
    $('#mPwdStrengthText').text('قدرت رمز: نامشخص');
    $('#registerFormModal').find('.is-invalid').removeClass('is-invalid');
  });

  $('#mRegisterClear').on('click', function(){
    const modalEl = document.getElementById('registerModal');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    }
  });

  // ارسال فرم داخل مودال
  $('#registerFormModal').on('submit', function(e){
    e.preventDefault();
    const name = $('#mRegName').val().trim();
    const email = $('#mRegEmail').val().trim();
    const phone = $('#mRegPhone').val().trim();
    const address = $('#mRegAddress').val().trim();
    const pwd = $('#mRegPassword').val();
    const pwdConfirm = $('#mRegPasswordConfirm').val();
    const terms = $('#mRegTerms').is(':checked');

    let valid = true;
    $(this).find('.is-invalid').removeClass('is-invalid');

    if (!name) { $('#mRegName').addClass('is-invalid'); valid = false; }
    if (!isValidEmail(email)) { $('#mRegEmail').addClass('is-invalid'); $('#mRegEmailFeedback').text('ایمیل نامعتبر است.'); valid = false; }
    if (!isValidPhone(phone)) { $('#mRegPhone').addClass('is-invalid'); $('#mRegPhoneFeedback').text('شماره تماس نامعتبر است.'); valid = false; }
    if (!pwd || pwd.length < 8) { $('#mRegPassword').addClass('is-invalid'); valid = false; }
    if (pwd !== pwdConfirm) { $('#mRegPasswordConfirm').addClass('is-invalid'); $('#mPwdConfirmFeedback').text('رمزها یکسان نیستند.'); valid = false; }
    if (!terms) { $('#mRegTerms').addClass('is-invalid'); valid = false; }

    if (!valid) {
      notify('لطفاً خطاهای فرم را اصلاح کنید', 'warning');
      return;
    }

    const dup = isDuplicate(email, phone);
    if (dup.emailExists) {
      $('#mRegEmail').addClass('is-invalid'); $('#mRegEmailFeedback').text('این ایمیل قبلاً ثبت شده است.');
      notify('این ایمیل قبلاً استفاده شده است', 'warning');
      return;
    }
    if (dup.phoneExists) {
      $('#mRegPhone').addClass('is-invalid'); $('#mRegPhoneFeedback').text('این شماره قبلاً ثبت شده است.');
      notify('این شماره قبلاً استفاده شده است', 'warning');
      return;
    }

    // ذخیره کاربر (نمونه محلی)
    const users = loadUsers();
    users.push({
      id: 'u-' + Date.now(),
      name,
      email,
      phone,
      address,
      password: pwd, // هش کردن در محیط واقعی لازم است
      createdAt: new Date().toISOString()
    });
    saveUsers(users);

    notify('ثبت‌نام با موفقیت انجام شد. خوش آمدید ' + name, 'success');

    // بستن مودال
    const modalEl = document.getElementById('registerModal');
    if (modalEl && window.bootstrap && bootstrap.Modal) {
      const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
      modal.hide();
    }
  });

  // توابع کمکی محلی (تعریف شده در بالا)
  function loadUsers(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch(e){ return []; }
  }
  function saveUsers(users){
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }
    catch(e){ /* ignore */ }
  }

})(jQuery);
(function(){
  function fitHero(){
    const topbar = document.querySelector('.topbar');
    const navbar = document.querySelector('.navbar');
    const topOffset = (topbar ? topbar.getBoundingClientRect().height : 0) + (navbar ? navbar.getBoundingClientRect().height : 0);
    const hero = document.querySelector('.hero');
    if (!hero) return;
    hero.style.minHeight = (window.innerHeight - topOffset) + 'px';
  }
  window.addEventListener('load', fitHero);
  window.addEventListener('resize', fitHero);
})();
$(document).ready(function() {
    const scrollAmount = 300; // مقدار جابجایی پیکسل در هر کلیک

    // کلیک روی فلش سمت راست -> حرکت به سمت راست (مقدار مثبت)
    $('.right-arrow').click(function() {
        $('#category-slider').animate({
            scrollLeft: '+=' + scrollAmount
        }, 400);
    });

    // کلیک روی فلش سمت چپ -> حرکت به سمت چپ (مقدار منفی)
    $('.left-arrow').click(function() {
        $('#category-slider').animate({
            scrollLeft: '-=' + scrollAmount
        }, 400);
    });
});
$(document).ready(function() {
    // وقتی موس روی سایدبار میرود، کلاس فعال به بدنه اضافه شود
    $('#right-sidebar').hover(function() {
        $('body').addClass('sidebar-is-open');
    }, function() {
        $('body').removeClass('sidebar-is-open');
    });
});
document.addEventListener('DOMContentLoaded', function(){
  const modal = document.getElementById('modal');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.getElementById('close-modal');

  function openModal(content){
    modalBody.innerHTML = content;
    modal.style.display = 'block';
  }

  closeBtn.onclick = () => modal.style.display = 'none';
  window.onclick = (e) => { if(e.target === modal) modal.style.display = 'none'; };

  // عملکرد دکمه‌ها
  document.getElementById('btn-order').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>سفارش آنلاین</h2><p>اینجا فرم سفارش آنلاین نمایش داده می‌شود...</p>');
  };

  document.getElementById('btn-what').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>چی بخورم؟</h2><p>لیست غذاها و پیشنهادها...</p>');
  };

  document.getElementById('btn-chef').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>سرآشپز آنلاین</h2><p>معرفی سرآشپز و توضیحات...</p>');
  };

  document.getElementById('btn-pizza').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>پیتزا پارتی</h2><p>لیست پیتزاها و جشن پیتزا...</p>');
  };

  document.getElementById('btn-branches').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>شعب</h2><p>نقشه و لیست شعب...</p>');
  };

  document.getElementById('btn-news').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>اخبار</h2><p>آخرین اخبار و شبکه‌های اجتماعی...</p>');
  };

  document.getElementById('btn-account').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>حساب کاربری</h2><p>ورود یا ثبت‌نام کاربر...</p>');
  };

  document.getElementById('btn-coupon').onclick = (e) => {
    e.preventDefault();
    openModal('<h2>کوپن تخفیف</h2><p>کد تخفیف شما: OFF20 🎁</p>');
  };
});
$(document).ready(function() {
    // باز کردن کادر بر اساس ID
    function openPModal(target) {
        $('.p-modal').removeClass('active');
        $('#modal-overlay').addClass('active');
        $(target).addClass('active');
    }

    // بستن کادرها
    $('.close-modal, #modal-overlay').click(function() {
        $('.p-modal, #modal-overlay').removeClass('active');
    });

    // تنظیمات دکمه‌های سایدبار
    $('#btn-order').click(function(e) { e.preventDefault(); openPModal('#modal-order'); });
    $('#btn-chef').click(function(e) { e.preventDefault(); openPModal('#modal-chef'); });
    $('#btn-party').click(function(e) { e.preventDefault(); openPModal('#modal-party'); });
    $('#btn-branches').click(function(e) { e.preventDefault(); openPModal('#modal-branches'); });
    $('#btn-news').click(function(e) { e.preventDefault(); openPModal('#modal-news'); });
    $('#btn-team').click(function(e) { e.preventDefault(); openPModal('#modal-team'); });
    $('#btn-account').click(function(e) { e.preventDefault(); openPModal('#modal-account'); });
    $('#btn-coupon').click(function(e) { e.preventDefault(); openPModal('#modal-coupon'); });

    // عملکرد دکمه "چی بخورم؟" (اسکرول به اول سایت)
    $('#btn-what').click(function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // بستن هر کادری که شاید باز باشد
        $('.p-modal, #modal-overlay').removeClass('active');
    });
});




