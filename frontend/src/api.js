export async function request(path, { method = "GET", body, params } = {}) {
  const response = await fetch(
    `/api${path}${params ? `?${new URLSearchParams(params)}` : ""}`,
    {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    },
  );
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  if (!response.ok)
    throw new Error(
      typeof data === "string"
        ? data || `Error ${response.status}`
        : data.message ||
            `No se pudo completar la operación (${response.status})`,
    );
  return data;
}
export const label = (value) =>
  String(value ?? "—")
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (s) => s.toUpperCase());
export function age(date) {
  const today = new Date();
  const birth = new Date(`${date}T12:00:00`);
  return (
    today.getFullYear() -
    birth.getFullYear() -
    (today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())
      ? 1
      : 0)
  );
}
export function questionnaire(values) {
  return {
    ...values,
    actividadFisica: values.actividadFisica === "true",
    frutasVerduras: values.frutasVerduras === "true",
    medicacion: values.medicacion === "true",
    tiposAntecedentes:
      values.antecedenteFamiliar === "NO"
        ? []
        : Array.isArray(values.tiposAntecedentes)
          ? values.tiposAntecedentes
          : [values.tiposAntecedentes],
  };
}
