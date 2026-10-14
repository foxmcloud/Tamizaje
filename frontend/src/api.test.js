import { describe, it, expect, vi, afterEach } from "vitest";
import { request, questionnaire, age } from "./api";
afterEach(() => vi.unstubAllGlobals());
describe("Contrato con la API", () => {
  it("envía parámetros codificados para registrar pacientes", async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue({ ok: true, text: async () => "Paciente registrado" });
    vi.stubGlobal("fetch", fetch);
    expect(
      await request("/pacientes", {
        method: "POST",
        params: { fecha_nacimiento: "1980-01-01", sexo: "F" },
      }),
    ).toBe("Paciente registrado");
    expect(fetch.mock.calls[0][0]).toBe(
      "/api/pacientes?fecha_nacimiento=1980-01-01&sexo=F",
    );
  });
  it("conserva el mensaje de error del servidor", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue({
          ok: false,
          status: 409,
          text: async () => "El id de registro ya existe",
        }),
    );
    await expect(request("/tamizajes")).rejects.toThrow(
      "El id de registro ya existe",
    );
  });
  it("convierte respuestas negativas a booleanos y limpia antecedentes", () => {
    expect(
      questionnaire({
        actividadFisica: "false",
        frutasVerduras: "true",
        medicacion: "false",
        antecedenteFamiliar: "NO",
        tiposAntecedentes: "DIABETES",
      }),
    ).toMatchObject({
      actividadFisica: false,
      frutasVerduras: true,
      medicacion: false,
      tiposAntecedentes: [],
    });
  });
  it("mantiene antecedentes seleccionados", () => {
    expect(
      questionnaire({
        antecedenteFamiliar: "PRIMER_GRADO",
        tiposAntecedentes: "DIABETES",
      }).tiposAntecedentes,
    ).toEqual(["DIABETES"]);
  });
  it("calcula edad según cumpleaños", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-14T12:00:00"));
    expect(age("2000-10-15")).toBe(25);
    expect(age("2000-10-14")).toBe(26);
    vi.useRealTimers();
  });
});
