/* ==========================================================
   НАСТРОЙКА: endpoint формы.
   1) Зарегистрируйтесь на https://formspree.io, создайте форму.
   2) Вставьте её адрес вида https://formspree.io/f/xxxxxxxx ниже.
   Подойдёт любой сервис, принимающий POST с JSON
   (Getform, Basin, собственный backend и т. п.).
   Пока адрес не задан, форма работает в демо-режиме:
   заявки никуда не уходят, но показывается экран успеха.
   ========================================================== */
const FORM_ENDPOINT = "https://formspree.io/f/YOUR_FORM_ID";

(function () {
  "use strict";

  /* ---------- появление блоков при скролле ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  // небольшая «лесенка» задержек внутри одного родителя
  revealEls.forEach((el) => {
    const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty("--d", Math.min(i * 0.1, 0.5) + "s");
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-visible");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- форма ---------- */
  const form = document.getElementById("registration-form");
  const success = document.getElementById("form-success");
  if (!form) return;

  const statusEl = form.querySelector(".form__status");
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn.querySelector(".btn__label");
  const currentYear = new Date().getFullYear();

  const rules = {
    name(v) {
      if (!v) return "Укажите имя и фамилию";
      if (v.length < 3 || !/\s/.test(v)) return "Укажите и имя, и фамилию";
      return "";
    },
    email(v) {
      if (!v) return "Укажите email";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Проверьте адрес почты";
      return "";
    },
    phone(v) {
      if (!v) return "Укажите телефон";
      const digits = v.replace(/\D/g, "");
      if (!/^[+\d\s()\-]+$/.test(v) || digits.length < 10 || digits.length > 15) return "Проверьте номер телефона";
      return "";
    },
    graduation_year(v) {
      if (!v) return "";
      const y = Number(v);
      if (!/^\d{4}$/.test(v) || y < 1950 || y > currentYear + 6) return "Год в формате ГГГГ";
      return "";
    },
  };

  function validateField(input) {
    const rule = rules[input.name];
    if (!rule) return true;
    const msg = rule(input.value.trim());
    const field = input.closest(".field");
    field.classList.toggle("is-invalid", !!msg);
    field.querySelector(".field__error").textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  // проверка при уходе с поля, повторная — при вводе, если уже была ошибка
  Object.keys(rules).forEach((name) => {
    const input = form.elements[name];
    if (!input) return;
    input.addEventListener("blur", () => { if (input.value.trim()) validateField(input); });
    input.addEventListener("input", () => {
      if (input.closest(".field").classList.contains("is-invalid")) validateField(input);
    });
  });

  // год — только цифры
  form.elements.graduation_year.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 4);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "";

    let firstInvalid = null;
    Object.keys(rules).forEach((name) => {
      const input = form.elements[name];
      if (input && !validateField(input) && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    // бот заполнил ловушку — молча «успех»
    if (form.elements._gotcha.value) { showSuccess(); return; }

    const data = Object.fromEntries(new FormData(form).entries());
    data._subject = "Регистрация: встреча выпускников НГУ и ФМШ, 28.11.2026";

    setLoading(true);
    try {
      if (FORM_ENDPOINT.includes("YOUR_FORM_ID")) {
        console.warn("[форма] FORM_ENDPOINT не задан — демо-режим, данные не отправлены:", data);
        await new Promise((r) => setTimeout(r, 700));
      } else {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
      }
      showSuccess();
    } catch (err) {
      console.error(err);
      statusEl.textContent = "Не удалось отправить заявку. Проверьте соединение и попробуйте ещё раз.";
    } finally {
      setLoading(false);
    }
  });

  function setLoading(on) {
    submitBtn.disabled = on;
    submitLabel.textContent = on ? "Отправляем…" : "Зарегистрироваться";
  }

  function showSuccess() {
    form.hidden = true;
    success.hidden = false;
    success.focus({ preventScroll: true });
    success.scrollIntoView({ behavior: "smooth", block: "center" });
    // через пару секунд мягко подводим к QR-коду
    setTimeout(() => {
      const qrSection = document.getElementById("confirm");
      qrSection.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelector(".qr").classList.add("is-highlighted");
    }, 2200);
  }
})();
