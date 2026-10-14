/** Same-origin API client and form validation shared by the Vue application. */
export async function request(
  path,
  { method = "GET", body, params, signal } = {},
) {
  const query = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value))
        value.forEach((item) => query.append(key, String(item)));
      else query.set(key, String(value));
    }
  }
  const suffix = query.toString();
  const url = `/api${path.startsWith("/") ? path : `/${path}`}${suffix ? `${path.includes("?") ? "&" : "?"}${suffix}` : ""}`;
  const options = { method, signal, headers: { Accept: "application/json" } };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new Error(
      "No se pudo conectar con el servidor. Revisá la conexión e intentá nuevamente.",
      { cause: error },
    );
  }
  const raw = await response.text();
  let data = null;
  if (raw.trim()) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = raw;
    }
  }
  if (!response.ok) {
    const serverMessage =
      typeof data === "string"
        ? data
        : data?.message || data?.detail || data?.error;
    const error = new Error(
      serverMessage || `La solicitud falló (HTTP ${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function optionalRequest(path) {
  try {
    return await request(path);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

function calendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day
    ? parsed
    : null;
}

export function age(date, today = new Date()) {
  const birthday = calendarDate(date);
  const current = today instanceof Date ? today : calendarDate(today);
  if (!birthday || !current || !Number.isFinite(current.getTime())) return null;
  let years = current.getFullYear() - birthday.getFullYear();
  if (
    current.getMonth() < birthday.getMonth() ||
    (current.getMonth() === birthday.getMonth() &&
      current.getDate() < birthday.getDate())
  )
    years -= 1;
  return years;
}

const labels = {
  NO: "Sin antecedentes",
  PRIMER_GRADO: "Padres, hermanos o hijos",
  SEGUNDO_GRADO: "Abuelos, tíos o sobrinos",
  NUNCA: "Nunca fumó",
  EX: "Exfumador",
  ACTUAL: "Fuma actualmente",
  DIABETES: "Diabetes",
  HIPERTENSION: "Hipertensión",
  ENFERMEDAD_CARDIOVASCULAR: "Enfermedad cardiovascular",
  OTRO: "Otro",
  VERDE: "Verde",
  AMARILLO: "Amarillo",
  ROJO: "Rojo",
  MAÑANA: "Mañana",
  TARDE: "Tarde",
  VESPERTINO: "Vespertino",
  ENFERMERO: "Enfermero",
  SUPERVISOR: "Supervisor",
  BAJO: "Bajo",
  LIGERAMENTE_ELEVADO: "Ligeramente elevado",
  MODERADO: "Moderado",
  ALTO: "Alto",
  MUY_ALTO: "Muy alto",
};

export function label(value) {
  if (value === true || value === "true") return "Sí";
  if (value === false || value === "false") return "No";
  if (value === null || value === undefined || value === "")
    return "Sin registrar";
  return (
    labels[value] ||
    String(value)
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/^./, (first) => first.toUpperCase())
  );
}

export function sexLabel(value) {
  return { M: "Masculino", F: "Femenino", O: "Otro" }[value] || "Sin registrar";
}

export function dateFormat(value) {
  if (!value) return "Sin registrar";
  const parsed = calendarDate(value) || new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Fecha inválida";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function badgeClass(value) {
  return (
    {
      VERDE: "text-bg-success",
      AMARILLO: "text-bg-warning",
      ROJO: "text-bg-danger",
    }[value] || "text-bg-secondary"
  );
}

export function normalizeQuestionnaire(values) {
  const normalized = { ...values };
  for (const field of ["actividadFisica", "frutasVerduras", "medicacion"]) {
    const answer = values[field];
    if (answer === true || answer === "true") normalized[field] = true;
    else if (answer === false || answer === "false") normalized[field] = false;
    else throw new Error("Respondé todas las preguntas del cuestionario.");
  }
  if (!["NUNCA", "EX", "ACTUAL"].includes(values.tabaquismo))
    throw new Error("Seleccioná una respuesta sobre tabaquismo.");
  if (
    !["NO", "PRIMER_GRADO", "SEGUNDO_GRADO"].includes(
      values.antecedenteFamiliar,
    )
  )
    throw new Error("Seleccioná los antecedentes familiares.");
  if (values.antecedenteFamiliar === "NO") normalized.tiposAntecedentes = [];
  else {
    const types = values.tiposAntecedentes;
    if (
      !Array.isArray(types) ||
      !types.length ||
      types.some(
        (type) =>
          ![
            "DIABETES",
            "HIPERTENSION",
            "ENFERMEDAD_CARDIOVASCULAR",
            "OTRO",
          ].includes(type),
      )
    ) {
      throw new Error("Seleccioná al menos un tipo de antecedente familiar.");
    }
    normalized.tiposAntecedentes = [...new Set(types)];
  }
  return normalized;
}

function numeric(value, message) {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    (typeof value === "string" && !value.trim())
  )
    throw new Error(message);
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(message);
  return number;
}

export function validatePressure(values) {
  const sistolicaMmHg = numeric(
    values.sistolicaMmHg,
    "Ingresá una presión sistólica válida.",
  );
  const diastolicaMmHg = numeric(
    values.diastolicaMmHg,
    "Ingresá una presión diastólica válida.",
  );
  if (
    !Number.isInteger(sistolicaMmHg) ||
    sistolicaMmHg < 70 ||
    sistolicaMmHg > 260
  )
    throw new Error(
      "La presión sistólica debe ser un número entero entre 70 y 260 mmHg.",
    );
  if (
    !Number.isInteger(diastolicaMmHg) ||
    diastolicaMmHg < 40 ||
    diastolicaMmHg > 150
  )
    throw new Error(
      "La presión diastólica debe ser un número entero entre 40 y 150 mmHg.",
    );
  if (sistolicaMmHg <= diastolicaMmHg)
    throw new Error("La presión sistólica debe ser mayor que la diastólica.");
  return { ...values, sistolicaMmHg, diastolicaMmHg };
}

export function validateAnthropometry(values) {
  const pesoKg = numeric(values.pesoKg, "Ingresá un peso válido.");
  const tallacm = numeric(values.tallacm, "Ingresá una talla válida.");
  if (pesoKg < 30 || pesoKg > 300)
    throw new Error("El peso debe estar entre 30 y 300 kg.");
  if (tallacm < 120 || tallacm > 220)
    throw new Error("La talla debe estar entre 120 y 220 cm.");
  const waist = values.cinturacm;
  const cinturacm =
    waist === undefined ||
    waist === null ||
    (typeof waist === "string" && !waist.trim())
      ? 0
      : numeric(waist, "Ingresá una medida de cintura válida.");
  if (cinturacm !== 0 && (cinturacm <= 0 || cinturacm > 300))
    throw new Error("La cintura debe ser mayor que 0 y como máximo 300 cm.");
  if (
    waist !== undefined &&
    waist !== null &&
    String(waist).trim() &&
    cinturacm === 0
  )
    throw new Error("La cintura debe ser mayor que 0 y como máximo 300 cm.");
  return { ...values, pesoKg, tallacm, cinturacm };
}

export function validatePatient(values) {
  const years = age(values.fecha_nacimiento);
  if (years === null || years < 14 || years > 120)
    throw new Error(
      "La fecha de nacimiento debe corresponder a una edad entre 14 y 120 años.",
    );
  if (!["M", "F", "O"].includes(values.sexo))
    throw new Error("Seleccioná el sexo del paciente.");
  return {
    ...values,
    fecha_nacimiento: values.fecha_nacimiento,
    sexo: values.sexo,
  };
}
