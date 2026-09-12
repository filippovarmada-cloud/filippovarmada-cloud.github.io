/* Быстрая настройка контактов и отправки заявок — замените значения ниже. */
const SITE_CONFIG = {
  phoneDisplay: '+7 (919) 486-03-61',
  phoneHref: '+79194860361',
  email: 'habinvest-059@mail.ru',
  messengerUrl: '', // пример: https://wa.me/73421234567
  formEndpoint: '', // Необязательный внешний endpoint. На Tilda заявки передаются через встроенную форму.
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
document.querySelectorAll('.contact-lines, .footer__grid > div').forEach((block) => {
  if (!SITE_CONFIG.email || block.querySelector(`a[href="mailto:${SITE_CONFIG.email}"]`)) return;
  const phone = block.querySelector('.js-phone');
  if (!phone) return;
  const email = document.createElement('a');
  email.href = `mailto:${SITE_CONFIG.email}`;
  email.textContent = SITE_CONFIG.email;
  phone.insertAdjacentElement('afterend', email);
  if (block.matches('.footer__grid > div')) email.insertAdjacentElement('beforebegin', document.createElement('br'));
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
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true; button.textContent = 'Отправляем…'; status.textContent = '';
    try {
      const payload = Object.fromEntries(new FormData(form).entries());
      payload.form_name = form.dataset.formName;
      payload.page_url = location.href;
      payload.consent_version = '10.09.2026';
      payload.consent_given_at = new Date().toISOString();
      if (SITE_CONFIG.formEndpoint) {
        const response = await fetch(SITE_CONFIG.formEndpoint, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
        if (!response.ok) throw new Error('Request failed');
      } else {
        const nativeForm = [...document.querySelectorAll('form.t-form')]
          .find((candidate) => !candidate.classList.contains('js-lead-form'));
        if (!nativeForm) throw new Error('Tilda form is unavailable');

        const labels = {
          form_name: 'Форма', name: 'Имя', phone: 'Телефон', deal_type: 'Интерес',
          type: 'Тип помещения', quantity: 'Количество', city: 'Город', object: 'Объект',
          duration: 'Срок', comment: 'Комментарий', utm_source: 'UTM source',
          utm_medium: 'UTM medium', utm_campaign: 'UTM campaign', utm_content: 'UTM content',
          utm_term: 'Ключевой запрос', yclid: 'Yandex Click ID', page_url: 'Страница'
        };
        Object.entries(payload).forEach(([key, value]) => {
          if (!value || key === 'personal_data_consent') return;
          let input = nativeForm.querySelector(`[name="${CSS.escape(key)}"]`);
          if (!input) {
            input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.dataset.tildaReq = '0';
            nativeForm.appendChild(input);
          }
          input.value = value;
          input.dataset.tildaRule = key === 'phone' ? 'phone' : '';
          input.dataset.tildaFld = labels[key] || key;
        });
        nativeForm.requestSubmit();
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
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
