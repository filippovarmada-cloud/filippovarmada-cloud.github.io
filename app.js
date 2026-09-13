      } else {
        const nativeForm = [...document.querySelectorAll('form.t-form')]
          .find((candidate) => !candidate.classList.contains('js-lead-form'));
        if (!nativeForm) throw new Error('Tilda form is unavailable');


        const nativeRecord = nativeForm.closest('.t-rec') || nativeForm.parentElement;
        nativeRecord?.classList.add('hubinvest-tilda-bridge');




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
        const findNativeField = (matcher) => [...nativeForm.querySelectorAll('input, textarea')]
          .find((field) => matcher(`${field.name || ''} ${field.type || ''} ${field.dataset.tildaRule || ''} ${field.dataset.tildaFld || ''}`.toLowerCase()));
        const nativePhone = findNativeField((meta) => meta.includes('phone') || meta.includes('телефон'));
        const nativeName = findNativeField((meta) => meta.includes('name') || meta.includes('имя'));
        const nativeEmail = findNativeField((meta) => meta.includes('email') || meta.includes('почт'));
        const nativeComment = [...nativeForm.querySelectorAll('textarea')][0] || findNativeField((meta) => meta.includes('comment') || meta.includes('коммент'));
        if (nativePhone) nativePhone.value = payload.phone || '';
        if (nativeName) nativeName.value = payload.name || 'Заявка с сайта ХАБИНВЕСТ';
        if (nativeEmail) nativeEmail.value = SITE_CONFIG.email;
        if (nativeComment) nativeComment.value = Object.entries(payload).filter(([key, value]) => value && key !== 'personal_data_consent').map(([key, value]) => `${labels[key] || key}: ${value}`).join('\n');
        [...nativeForm.querySelectorAll('input[required], textarea[required]')].forEach((field) => {
          if (field.type === 'checkbox' || field.type === 'radio') field.checked = true;
          else if (!field.value) field.value = field.type === 'email' ? SITE_CONFIG.email : 'Заявка с сайта';
        });
        if (!nativeForm.checkValidity()) throw new Error('Tilda form validation failed');
        nativeForm.requestSubmit();
        await new Promise((resolve) => setTimeout(resolve, 1600));
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



