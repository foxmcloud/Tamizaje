import React from "react";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, it, expect, afterEach } from "vitest";
import App from "./App";
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function api() {
  const fetch = vi.fn(async (url, options = {}) => {
    let body = {};
    if (url === "/api/pacientes")
      body = [{ id_paciente: 1, fecha_nacimiento: "1980-01-01", sexo: "F" }];
    else if (url === "/api/enfermeros")
      body = [
        {
          id: 1,
          nombre: "Ana",
          apellido: "Pérez",
          rol: "ENFERMERO",
          turno: "MAÑANA",
        },
      ];
    else if (url === "/api/tamizajes")
      body = [{ id: 1, id_registro: "TAM-001", consent: true }];
    else if (url.endsWith("/tomas-presion")) body = [];
    else if (url.endsWith("/cuestionario"))
      body = {
        idControl: 3,
        actividadFisica: false,
        frutasVerduras: true,
        medicacion: false,
        tabaquismo: "NUNCA",
        antecedenteFamiliar: "NO",
        tiposAntecedentes: [],
      };
    else
      return {
        ok: false,
        status: 404,
        text: async () => "Control no encontrado",
      };
    return { ok: true, text: async () => JSON.stringify(body) };
  });
  vi.stubGlobal("fetch", fetch);
  return fetch;
}
it("abre una ficha y recupera el cuestionario guardado", async () => {
  api();
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("button", { name: /Abrir ficha/ }));
  await user.click(screen.getByRole("tab", { name: /Cuestionario/ }));
  expect(
    await screen.findByText("Cuestionario guardado correctamente."),
  ).toBeTruthy();
  expect(screen.getByText("Nunca")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Guardar" })).toBeNull();
});
it("impide enviar presión sistólica menor a diastólica", async () => {
  const fetch = api();
  const user = userEvent.setup();
  render(<App />);
  await user.click(await screen.findByRole("button", { name: /Abrir ficha/ }));
  await user.click(screen.getByRole("tab", { name: /Presión arterial/ }));
  await user.type(await screen.findByLabelText("Sistólica (mmHg)"), "80");
  await user.type(screen.getByLabelText("Diastólica (mmHg)"), "90");
  await user.click(screen.getByRole("button", { name: "Registrar toma" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(fetch.mock.calls.some(([, opts]) => opts?.method === "POST")).toBe(
    false,
  );
});
it("expone errores de conexión y permite reintentar", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("Conexión interrumpida")),
  );
  render(<App />);
  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toContain(
      "Conexión interrumpida",
    ),
  );
  expect(screen.getByRole("button", { name: "Reintentar" })).toBeTruthy();
});
