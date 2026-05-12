const form = document.getElementById("applicationForm");

if (form) {
  const successMessage = document.getElementById("successMessage");
  const fields = Array.from(document.querySelectorAll(".field"));
  const preferredContactSelect = document.getElementById(
    "medioContactoPreferido"
  );
  const preferredContactRadios = Array.from(
    document.querySelectorAll('input[name="medioContactoPreferido"]')
  );
  const preferredContactError = document.querySelector(
    '[data-error-for="medioContactoPreferido"]'
  );
  const phoneContainer = document.getElementById("telefonoContainer");
  const phoneInput = document.getElementById("telefonoContacto");
  const isEnglish = (document.documentElement.lang || "")
    .toLowerCase()
    .startsWith("en");

  const t = {
    required: isEnglish ? "This field is required." : "Este campo es obligatorio.",
    invalidEmail: isEnglish
      ? "Email must include @ and a valid domain."
      : "El correo debe incluir @ y un dominio válido.",
    invalidPhone: isEnglish
      ? "Enter a valid phone number with optional + at start (7 to 15 digits)."
      : "Ingresa un teléfono válido con + opcional al inicio (7 a 15 dígitos).",
    companyName: isEnglish
      ? "Company name must have at least 2 characters."
      : "El nombre de empresa debe tener al menos 2 caracteres.",
    consultation: isEnglish
      ? "Message must contain between 20 and 1200 characters."
      : "La consulta debe tener entre 20 y 1200 caracteres.",
    minChars: (minLength) =>
      isEnglish
        ? `Enter at least ${minLength} characters.`
        : `Debes ingresar al menos ${minLength} caracteres.`,
    maxChars: (maxLength) =>
      isEnglish
        ? `You can enter up to ${maxLength} characters.`
        : `Puedes ingresar hasta ${maxLength} caracteres.`,
  };

  const getErrorNode = (input) =>
    document.querySelector(`[data-error-for="${input.id}"]`);

  const setInvalid = (input, message) => {
    const errorNode = getErrorNode(input);
    input.classList.remove("border-white/20", "focus:ring-cyan-200/60");
    input.classList.add("border-rose-400/70", "focus:ring-rose-300/70");
    if (errorNode) {
      errorNode.textContent = message;
    }
  };

  const setValid = (input) => {
    const errorNode = getErrorNode(input);
    input.classList.remove("border-rose-400/70", "focus:ring-rose-300/70");
    input.classList.add("border-emerald-400/60", "focus:ring-emerald-200/70");
    if (errorNode) {
      errorNode.textContent = "";
    }
  };

  const setNeutral = (input) => {
    if (!input) {
      return;
    }
    const errorNode = getErrorNode(input);
    input.classList.remove(
      "border-rose-400/70",
      "focus:ring-rose-300/70",
      "border-emerald-400/60",
      "focus:ring-emerald-200/70"
    );
    input.classList.add("border-white/20", "focus:ring-cyan-200/60");
    if (errorNode) {
      errorNode.textContent = "";
    }
  };

  const togglePhoneField = () => {
    const selectedRadio = preferredContactRadios.find((radio) => radio.checked);
    const selectedValue = preferredContactSelect
      ? preferredContactSelect.value
      : selectedRadio?.value;
    const phoneSelected = selectedValue === "telefono";
    phoneContainer.classList.toggle("hidden", !phoneSelected);
    phoneContainer.setAttribute("aria-hidden", String(!phoneSelected));
    phoneInput.required = phoneSelected;
    phoneInput.disabled = !phoneSelected;

    if (!phoneSelected) {
      phoneInput.value = "";
      setNeutral(phoneInput);
    }
  };

  const customValidation = (input) => {
    const value = input.value.trim();

    if (input.id === "nombreEmpresa" && value.length < 2) {
      return t.companyName;
    }

    if (input.id === "correoEmpresa") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      if (!value.includes("@") || !emailRegex.test(value)) {
        return t.invalidEmail;
      }
    }

    if (input.id === "consultaLogistica") {
      if (value.length < 20 || value.length > 1200) {
        return t.consultation;
      }
    }

    if (input.id === "telefonoContacto" && input.required) {
      const phoneRegex = /^\+?[0-9]{7,15}$/;
      if (!phoneRegex.test(value)) {
        return t.invalidPhone;
      }
    }

    return "";
  };

  const getNativeMessage = (input) => {
    if (input.validity.valueMissing) {
      return t.required;
    }
    if (input.validity.typeMismatch) {
      return input.type === "email" ? t.invalidEmail : t.required;
    }
    if (input.validity.tooShort) {
      return t.minChars(input.minLength);
    }
    if (input.validity.tooLong) {
      return t.maxChars(input.maxLength);
    }
    if (input.validity.patternMismatch) {
      return input.id === "telefonoContacto" ? t.invalidPhone : t.required;
    }
    return "";
  };

  const validateField = (input) => {
    if (input.id === "telefonoContacto" && !input.required) {
      setNeutral(input);
      return true;
    }

    const nativeMessage = getNativeMessage(input);
    const customMessage = nativeMessage ? "" : customValidation(input);
    const message = nativeMessage || customMessage;

    if (message) {
      setInvalid(input, message);
      return false;
    }

    setValid(input);
    return true;
  };

  fields.forEach((field) => {
    field.addEventListener("input", () => {
      validateField(field);
      successMessage.classList.add("hidden");
    });

    field.addEventListener("blur", () => {
      validateField(field);
    });
  });

  if (preferredContactSelect) {
    preferredContactSelect.addEventListener("change", () => {
      togglePhoneField();
      if (preferredContactError) {
        preferredContactError.textContent = "";
      }
      validateField(phoneInput);
      successMessage.classList.add("hidden");
    });
  }

  preferredContactRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      togglePhoneField();
      if (preferredContactError) {
        preferredContactError.textContent = "";
      }
      validateField(phoneInput);
      successMessage.classList.add("hidden");
    });
  });

  window.addEventListener("pageshow", () => {
    togglePhoneField();
  });

  form.addEventListener("reset", () => {
    successMessage.classList.add("hidden");
    fields.forEach((field) => {
      setTimeout(() => setNeutral(field), 0);
    });
    setTimeout(() => togglePhoneField(), 0);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    togglePhoneField();

    let isFormValid = true;

    const selectedRadio = preferredContactRadios.find((radio) => radio.checked);
    const hasPreferredValue = preferredContactSelect
      ? Boolean(preferredContactSelect.value)
      : Boolean(selectedRadio);

    if (!hasPreferredValue) {
      isFormValid = false;
      if (preferredContactError) {
        preferredContactError.textContent = t.required;
      }
    } else if (preferredContactError) {
      preferredContactError.textContent = "";
    }

    fields.forEach((field) => {
      const isFieldValid = validateField(field);
      if (!isFieldValid) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      successMessage.classList.add("hidden");
      const firstInvalid = fields.find((field) => !validateField(field));
      if (firstInvalid) {
        firstInvalid.focus();
      } else if (preferredContactSelect && !preferredContactSelect.value) {
        preferredContactSelect.focus();
      } else if (!selectedRadio && preferredContactRadios[0]) {
        preferredContactRadios[0].focus();
      }
      return;
    }

    form.reset();
    successMessage.classList.remove("hidden");
  });

  togglePhoneField();
}
