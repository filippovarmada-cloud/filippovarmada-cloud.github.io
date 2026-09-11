/* Быстрая настройка контактов и отправки заявок — замените значения ниже. */
const SITE_CONFIG = {
  phoneDisplay: '+7 (919) 486-03-61',
  phoneHref: '+79194860361',
  email: 'habinvest-059@mail.ru',  messengerUrl: '', // пример: https://wa.me/73421234567
  formEndpoint: '', // URL вебхука CRM / формы. При пустом значении заявка не отправляется.
  metrikaId: '' // номер счётчика Яндекс.Метрики
};

const params = new URLSearchParams(location.search);
const trackingKeys = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','yclid'];
trackingKeys.forEach((key) => {
  const incoming = params.get(key);
  if (incoming) sessionStorage.setItem(key, incoming);
  document.querySelectorAll(`input[name="${key}"]`).forEach((input) => {
    input.value = incoming || sessionStorage.getItem(key) || '';
  });
});

document.querySelectorAll('.js-phone').forEach((link) => {
  link.textContent = link.classList.contains('phone') ? '' : SITE_CONFIG.phoneDisplay;
  if (link.classList.contains('phone')) {
    link.innerHTML = `<span class="phone__label">Отдел аренды</span><strong>${SITE_CONFIG.phoneDisplay}</strong>`;
  }
  if (SITE_CONFIG.phoneHref) link.href = `tel:${SITE_CONFIG.phoneHref}`;
});
document.querySelectorAll('.js-messenger').forEach((link) => {
  if (SITE_CONFIG.messengerUrl) { link.href = SITE_CONFIG.messengerUrl; link.target = '_blank'; link.rel = 'noopener'; }
});

function goal(name) {
  if (SITE_CONFIG.metrikaId && typeof window.ym === 'function') window.ym(SITE_CONFIG.metrikaId, 'reachGoal', name);
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name });
}
document.querySelectorAll('.js-track').forEach((el) => el.addEventListener('click', () => goal(el.dataset.event || 'cta_click')));

document.querySelectorAll('.lead-quiz').forEach((quiz) => {
  const steps = [...quiz.querySelectorAll('.quiz-step')];
  const bars = [...quiz.closest('.quote-card').querySelectorAll('.quiz-progress span')];
  let current = 0;
  const showStep = (index) => {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, i) => step.classList.toggle('is-active', i === current));
    bars.forEach((bar, i) => bar.classList.toggle('is-active', i <= current));
    const legend = steps[current].querySelector('legend');
    if (legend) legend.focus?.();
  };
  quiz.querySelectorAll('.quiz-next').forEach((button) => button.addEventListener('click', () => {
    const fields = [...steps[current].querySelectorAll('input, select, textarea')];
    if (!fields.every((field) => field.reportValidity())) return;
    showStep(current + 1);
    goal(`quiz_step_${current + 1}`);
  }));
  quiz.querySelectorAll('.quiz-back').forEach((button) => button.addEventListener('click', () => showStep(current - 1)));
  quiz.resetQuiz = () => showStep(0);
});

document.querySelectorAll('.js-lead-form').forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = form.querySelector('.form-status');
    if (!form.reportValidity()) return;
    if (!SITE_CONFIG.formEndpoint) {
      status.className = 'form-status is-error';
      status.textContent = 'Форма пока не подключена. Укажите рабочий телефон или endpoint в app.js перед запуском.';
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Отправляем…'; status.textContent = '';
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.form_name = form.dataset.formName;
      payload.page_url = location.href;
      payload.consent_version = '10.09.2026';
      payload.consent_given_at = new Date().toISOString();
      const response = await fetch(SITE_CONFIG.formEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (!response.ok) throw new Error('Request failed');
      goal('lead_success');
      status.className = 'form-status is-success'; status.textContent = 'Спасибо! Заявка отправлена. Мы свяжемся с вами.';
      form.reset();
      if (form.resetQuiz) form.resetQuiz();
    } catch (_) {
      status.className = 'form-status is-error'; status.textContent = 'Не удалось отправить. Позвоните нам или повторите попытку.';
    } finally {
      button.disabled = false; button.textContent = form.dataset.formName === 'footer' ? 'Отправить заявку' : 'Получить расчёт';
    }
  });
});
document.getElementById('year').textContent = new Date().getFullYear();
