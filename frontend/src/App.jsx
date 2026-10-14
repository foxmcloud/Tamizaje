import React, { useEffect, useState, useRef } from "react";
import {
  Activity,
  Users,
  ClipboardList,
  HeartPulse,
  Plus,
  ArrowUpRight,
  Search,
  Check,
  RefreshCw,
  Stethoscope,
  Printer,
  X,
} from "lucide-react";
import { request, label, age, questionnaire } from "./api";
const sections = [
  ["inicio", "Resumen", Activity],
  ["tamizajes", "Tamizajes", ClipboardList],
  ["pacientes", "Pacientes", Users],
  ["equipo", "Equipo de salud", Stethoscope],
];
const sexes = [
  ["F", "Femenino"],
  ["M", "Masculino"],
  ["O", "Otro"],
];
function Field({ name, label: title, options, ...props }) {
  return (
    <label className="field">
      <span>{title}</span>
      {options ? (
        <select name={name} required {...props}>
          <option value="">Seleccionar…</option>
          {options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </select>
      ) : (
        <input name={name} required {...props} />
      )}
    </label>
  );
}
function Form({ children, onSave, submit = "Guardar", disabled = false }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          await onSave(
            (() => {
              const formData = new FormData(e.currentTarget);
              const values = Object.fromEntries(formData);
              if (formData.has("tiposAntecedentes"))
                values.tiposAntecedentes = formData.getAll("tiposAntecedentes");
              return values;
            })(),
          );
        } catch (err) {
          setError(err.message || "No se pudo conectar con el servidor");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="form-grid">{children}</div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button disabled={busy || disabled} className="primary" type="submit">
        {busy ? "Guardando…" : submit}
      </button>
    </form>
  );
}
function Badge({ value }) {
  return (
    <span className={`badge ${String(value).toLowerCase()}`}>
      {label(value)}
    </span>
  );
}
function Empty({ text }) {
  return (
    <div className="empty">
      <ClipboardList size={30} />
      <h3>{text}</h3>
      <p>Los registros guardados aparecerán aquí.</p>
    </div>
  );
}
export default function App() {
  const dialogRef = useRef(null);
  const [page, setPage] = useState("inicio"),
    [data, setData] = useState({
      pacientes: [],
      enfermeros: [],
      tamizajes: [],
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState(null),
    [selected, setSelected] = useState(null),
    [query, setQuery] = useState("");
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const [pacientes, enfermeros, tamizajes] = await Promise.all(
        ["pacientes", "enfermeros", "tamizajes"].map((p) => request(`/${p}`)),
      );
      setData({ pacientes, enfermeros, tamizajes });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    reload();
  }, []);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    const handle = (e) => {
      if (e.key === "Escape") setModal(null);
      if (e.key === "Tab") {
        const items = [
          ...dialogRef.current.querySelectorAll(
            "button:not(:disabled),input:not(:disabled),select:not(:disabled)",
          ),
        ];
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      previous?.focus();
    };
  }, [modal]);
  async function save(path, values, params = false) {
    await request(path, {
      method: "POST",
      ...(params ? { params: values } : { body: values }),
    });
    setModal(null);
    setNotice("Registro guardado correctamente.");
    await reload();
  }
  function navigate(next) {
    setSelected(null);
    setPage(next);
    setQuery("");
  }
  const matches = (row) =>
    JSON.stringify(row).toLowerCase().includes(query.toLowerCase());
  return (
    <div className="app">
      <aside>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("inicio");
          }}
        >
          <span className="brand-icon">
            <HeartPulse />
          </span>
          <span>
            Tamizaje<small>SALUD PREVENTIVA</small>
          </span>
        </a>
        <div className="nav-label">ESPACIO DE TRABAJO</div>
        <nav>
          {sections.map(([key, title, Icon]) => (
            <button
              key={key}
              className={page === key ? "active" : ""}
              onClick={() => navigate(key)}
            >
              <Icon size={19} />
              {title}
              {key === page && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" /> Atención preventiva
          <p>
            Una evaluación a tiempo
            <br />
            hace la diferencia.
          </p>
        </div>
        <div className="sidebar-footer">
          <div className="avatar">CS</div>
          <div>
            Centro de salud<small>Gestión de tamizajes</small>
          </div>
        </div>
      </aside>
      <main>
        <header>
          <span>
            Centro de salud <span className="divider">/</span>{" "}
            {sections.find((s) => s[0] === page)?.[1]}
          </span>
          <time>
            {new Intl.DateTimeFormat("es-AR", {
              dateStyle: "long",
              timeZone: "America/Argentina/Ushuaia",
            }).format(new Date())}
          </time>
        </header>
        <div className="content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">CUIDADO QUE EMPIEZA CON PREVENCIÓN</p>
              <h1>
                {selected
                  ? "Ficha de tamizaje"
                  : {
                      inicio: "Una mirada a la salud de tu comunidad",
                      pacientes: "Pacientes",
                      equipo: "Equipo de salud",
                      tamizajes: "Tamizajes",
                    }[page]}
              </h1>
              <p className="muted">
                {selected
                  ? `Registro ${selected.id_registro}`
                  : "Registrá, evaluá y acompañá cada paso de la atención."}
              </p>
            </div>
            <button
              className="primary"
              onClick={() =>
                setModal(
                  page === "pacientes"
                    ? "paciente"
                    : page === "equipo"
                      ? "enfermero"
                      : "tamizaje",
                )
              }
            >
              <Plus size={18} />
              {page === "pacientes"
                ? "Nuevo paciente"
                : page === "equipo"
                  ? "Agregar integrante"
                  : "Nuevo tamizaje"}
            </button>
          </div>
          {error && (
            <div className="error" role="alert">
              No se pudo cargar la API: {error}{" "}
              <button onClick={reload}>Reintentar</button>
            </div>
          )}
          {notice && (
            <div className="notice" role="status">
              <Check size={18} />
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {selected ? (
            <Detail
              key={selected.id}
              screening={selected}
              onBack={() => setSelected(null)}
            />
          ) : (
            <>
              {page === "inicio" && (
                <>
                  <div className="stats">
                    {[
                      [
                        ClipboardList,
                        "Tamizajes registrados",
                        data.tamizajes.length,
                      ],
                      [
                        Users,
                        "Pacientes en seguimiento",
                        data.pacientes.length,
                      ],
                      [Stethoscope, "Profesionales", data.enfermeros.length],
                    ].map(([Icon, title, count]) => (
                      <div className="stat" key={title}>
                        <div className="stat-icon">
                          <Icon size={21} />
                        </div>
                        <span>{title}</span>
                        <strong>{loading ? "—" : count}</strong>
                        <small>Registros de la comunidad</small>
                      </div>
                    ))}
                  </div>
                  <div className="hero">
                    <div>
                      <span className="eyebrow">CADA CONTROL CUENTA</span>
                      <h2>
                        Prevenir hoy.
                        <br />
                        Cuidar el mañana.
                      </h2>
                      <p>
                        Completá una evaluación integral para identificar
                        <br />
                        factores de riesgo y orientar el cuidado.
                      </p>
                      <button onClick={() => setModal("tamizaje")}>
                        Iniciar una evaluación <ArrowUpRight size={18} />
                      </button>
                    </div>
                    <div className="hero-art">
                      <HeartPulse size={86} strokeWidth={1} />
                      <span>Salud en cada paso</span>
                    </div>
                  </div>
                </>
              )}
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2>
                      {page === "inicio"
                        ? "Últimos tamizajes"
                        : sections.find((s) => s[0] === page)?.[1]}
                    </h2>
                    <p className="muted">
                      {page === "pacientes"
                        ? "Información demográfica y registro"
                        : page === "equipo"
                          ? "Personal responsable de las evaluaciones"
                          : "Consultá las fichas y continuá las evaluaciones."}
                    </p>
                  </div>
                  <div className="tools">
                    <label className="search">
                      <Search size={17} />
                      <input
                        aria-label="Buscar registros"
                        placeholder="Buscar registros…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </label>
                    <button
                      className="icon-button"
                      aria-label="Actualizar registros"
                      onClick={reload}
                    >
                      <RefreshCw size={18} />
                    </button>
                  </div>
                </div>
                {loading ? (
                  <p className="empty" role="status">
                    Cargando registros…
                  </p>
                ) : (
                  <div className="table-wrap">
                    {(page === "pacientes"
                      ? data.pacientes
                      : page === "equipo"
                        ? data.enfermeros
                        : data.tamizajes
                    ).filter(matches).length === 0 ? (
                      <Empty
                        text={
                          query
                            ? "Sin coincidencias"
                            : "Todavía no hay registros"
                        }
                      />
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            {(page === "pacientes"
                              ? [
                                  "Paciente",
                                  "Fecha de nacimiento",
                                  "Edad",
                                  "Sexo",
                                  "Fecha de registro",
                                ]
                              : page === "equipo"
                                ? ["Profesional", "Rol", "Turno"]
                                : ["Registro", "Fecha", "Consentimiento", ""]
                            ).map((t, i) => (
                              <th key={i}>{t}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(page === "pacientes"
                            ? data.pacientes
                            : page === "equipo"
                              ? data.enfermeros
                              : data.tamizajes
                          )
                            .filter(matches)
                            .slice(0, page === "inicio" ? 5 : undefined)
                            .map((row) => (
                              <tr key={row.id ?? row.id_paciente}>
                                {page === "pacientes" ? (
                                  <>
                                    <td>
                                      <strong>
                                        Paciente #{row.id_paciente}
                                      </strong>
                                    </td>
                                    <td>{row.fecha_nacimiento}</td>
                                    <td>{age(row.fecha_nacimiento)} años</td>
                                    <td>
                                      {
                                        sexes.find(
                                          (s) => s[0] === row.sexo,
                                        )?.[1]
                                      }
                                    </td>
                                    <td>{row.fecha_registro?.split("T")[0]}</td>
                                  </>
                                ) : page === "equipo" ? (
                                  <>
                                    <td>
                                      <strong>
                                        {row.nombre} {row.apellido}
                                      </strong>
                                    </td>
                                    <td>
                                      <Badge value={row.rol} />
                                    </td>
                                    <td>{label(row.turno)}</td>
                                  </>
                                ) : (
                                  <>
                                    <td>
                                      <strong>{row.id_registro}</strong>
                                      <small>Ficha #{row.id}</small>
                                    </td>
                                    <td>
                                      {row.timestamp
                                        ?.replace("T", " · ")
                                        .slice(0, 18)}
                                    </td>
                                    <td>
                                      <Badge
                                        value={
                                          row.consent ? "Aceptado" : "Pendiente"
                                        }
                                      />
                                    </td>
                                    <td>
                                      <button
                                        className="text-button"
                                        onClick={() => {
                                          setPage("tamizajes");
                                          setSelected(row);
                                        }}
                                      >
                                        Abrir ficha <ArrowUpRight size={15} />
                                      </button>
                                    </td>
                                  </>
                                )}
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </section>
            </>
          )}
          <footer>
            PREVENCIÓN · SEGUIMIENTO · CUIDADO
            <span>Tamizaje / Salud comunitaria</span>
          </footer>
        </div>
      </main>
      {modal && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <section
            ref={dialogRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="panel-head">
              <h2 id="modal-title">
                {modal === "paciente"
                  ? "Registrar paciente"
                  : modal === "enfermero"
                    ? "Agregar profesional"
                    : "Iniciar tamizaje"}
              </h2>
              <button
                autoFocus
                className="icon-button"
                aria-label="Cerrar formulario"
                onClick={() => setModal(null)}
              >
                <X />
              </button>
            </div>
            {modal === "paciente" ? (
              <Form
                onSave={(v) => {
                  const years = age(v.fecha_nacimiento);
                  if (years < 14 || years > 120)
                    throw new Error("La edad debe estar entre 14 y 120 años.");
                  return save("/pacientes", v, true);
                }}
              >
                <Field
                  name="fecha_nacimiento"
                  label="Fecha de nacimiento"
                  type="date"
                />
                <Field name="sexo" label="Sexo" options={sexes} />
              </Form>
            ) : modal === "enfermero" ? (
              <Form
                onSave={(v) =>
                  save(
                    "/enfermeros",
                    Object.fromEntries(
                      Object.entries(v).map(([k, val]) => [k, val.trim()]),
                    ),
                    true,
                  )
                }
              >
                <Field name="nombre" label="Nombre" maxLength={80} />
                <Field name="apellido" label="Apellido" maxLength={80} />
                <Field
                  name="rol"
                  label="Rol"
                  options={["ENFERMERO", "SUPERVISOR"].map((x) => [
                    x,
                    label(x),
                  ])}
                />
                <Field
                  name="turno"
                  label="Turno"
                  options={["MAÑANA", "TARDE", "VESPERTINO"].map((x) => [
                    x,
                    label(x),
                  ])}
                />
              </Form>
            ) : (
              <>
                <p className="muted">
                  Seleccioná un paciente y al personal responsable. Registrá al
                  paciente y al equipo antes de comenzar.
                </p>
                <Form
                  disabled={!data.pacientes.length || !data.enfermeros.length}
                  submit="Crear ficha"
                  onSave={async (v) => {
                    const code = v.id_registro.trim();
                    if (!code) throw new Error("Ingresá un identificador.");
                    await request("/tamizajes", {
                      method: "POST",
                      body: {
                        id_registro: code,
                        consent: true,
                        paciente: { id_paciente: Number(v.paciente) },
                        operador: { id: Number(v.operador) },
                        supervisor: v.supervisor
                          ? { id: Number(v.supervisor) }
                          : null,
                      },
                    });
                    const rows = await request("/tamizajes");
                    const created = rows.find((r) => r.id_registro === code);
                    setModal(null);
                    await reload();
                    setPage("tamizajes");
                    setSelected(created);
                    setNotice("Ficha creada. Completá los controles.");
                  }}
                >
                  <Field
                    name="id_registro"
                    label="Identificador de registro"
                    placeholder="Ej. TAM-2026-001"
                    maxLength={100}
                  />
                  <Field
                    name="paciente"
                    label="Paciente"
                    options={data.pacientes.map((p) => [
                      p.id_paciente,
                      `Paciente #${p.id_paciente} · ${age(p.fecha_nacimiento)} años`,
                    ])}
                  />
                  <Field
                    name="operador"
                    label="Operador"
                    options={data.enfermeros
                      .filter((p) => p.rol === "ENFERMERO")
                      .map((p) => [p.id, `${p.nombre} ${p.apellido}`])}
                  />
                  <Field
                    name="supervisor"
                    label="Supervisor (opcional)"
                    required={false}
                    options={data.enfermeros
                      .filter((p) => p.rol === "SUPERVISOR")
                      .map((p) => [p.id, `${p.nombre} ${p.apellido}`])}
                  />
                  <label className="checkbox wide">
                    <input type="checkbox" name="consent" required /> El
                    paciente acepta el consentimiento para la evaluación.
                  </label>
                </Form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
function Detail({ screening, onBack }) {
  const [controls, setControls] = useState(null),
    [error, setError] = useState(""),
    [result, setResult] = useState(null),
    [tab, setTab] = useState("antropometria"),
    [editing, setEditing] = useState(null),
    [busy, setBusy] = useState(false);
  const base = `/tamizajes/${screening.id}`;
  async function optional(path) {
    try {
      return await request(path);
    } catch (e) {
      if (e.message.includes("no encontrad")) return null;
      throw e;
    }
  }
  async function load() {
    try {
      const [anthro, pressure, res, questions] = await Promise.all([
        optional(`${base}/antropometria`),
        request(`${base}/tomas-presion`),
        optional(`${base}/resultado`),
        optional(`${base}/cuestionario`),
      ]);
      setControls({ anthro, pressure, questions });
      setResult(res);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [screening.id]);
  async function add(path, body, method = "POST") {
    await request(path, { method, body });
    await load();
  }
  return (
    <>
      <button className="text-button back" onClick={onBack}>
        ← Volver a tamizajes
      </button>
      <div className="detail-intro">
        <span className="stat-icon">
          <HeartPulse />
        </span>
        <div>
          <h2>{screening.id_registro}</h2>
          <p className="muted">
            Ficha #{screening.id} · Consentimiento{" "}
            {screening.consent ? "aceptado" : "pendiente"}
          </p>
        </div>
        <Badge value={result ? "Evaluado" : "En curso"} />
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
          <button onClick={load}>Reintentar</button>
        </p>
      )}
      <div className="tabs" role="tablist">
        {[
          ["antropometria", "01 · Antropometría"],
          ["presion", "02 · Presión arterial"],
          ["cuestionario", "03 · Cuestionario"],
          ["resultado", "04 · Resultado"],
        ].map(([key, title]) => (
          <button
            role="tab"
            aria-selected={tab === key}
            key={key}
            onClick={() => setTab(key)}
            className={tab === key ? "active" : ""}
          >
            {title}
          </button>
        ))}
      </div>
      <section className="panel detail-panel">
        {!controls ? (
          <p role="status">Cargando controles…</p>
        ) : tab === "antropometria" ? (
          <>
            <h2>Medidas antropométricas</h2>
            <p className="muted">
              Ingresá las medidas tomadas durante la evaluación.
            </p>
            {controls.anthro ? (
              <div className="stats compact">
                {[
                  ["Peso", `${controls.anthro.pesoKg} kg`],
                  ["Talla", `${controls.anthro.tallacm} cm`],
                  ["IMC", controls.anthro.imc.toFixed(1)],
                ].map(([k, v]) => (
                  <div className="stat" key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <Form
                onSave={(v) =>
                  add(
                    `${base}/antropometria`,
                    Object.fromEntries(
                      Object.entries(v).map(([k, val]) => [k, Number(val)]),
                    ),
                  )
                }
              >
                <Field
                  name="pesoKg"
                  label="Peso (kg)"
                  type="number"
                  min="30"
                  max="300"
                  step="0.1"
                />
                <Field
                  name="tallacm"
                  label="Talla (cm)"
                  type="number"
                  min="120"
                  max="220"
                  step="0.1"
                />
                <Field
                  name="cinturacm"
                  label="Cintura (cm)"
                  type="number"
                  min="1"
                  max="300"
                  step="0.1"
                />
              </Form>
            )}
          </>
        ) : tab === "presion" ? (
          <>
            <h2>Presión arterial</h2>
            <p className="muted">
              El resultado utiliza la última toma válida. Podés agregar varias
              mediciones.
            </p>
            <Form
              key={editing?.idControl || "new"}
              submit={editing ? "Actualizar toma" : "Registrar toma"}
              onSave={async (v) => {
                if (Number(v.sistolicaMmHg) <= Number(v.diastolicaMmHg))
                  throw new Error(
                    "La presión sistólica debe superar la diastólica.",
                  );
                await add(
                  editing
                    ? `/tomas-presion/${editing.idControl}`
                    : `${base}/tomas-presion`,
                  {
                    sistolicaMmHg: Number(v.sistolicaMmHg),
                    diastolicaMmHg: Number(v.diastolicaMmHg),
                  },
                  editing ? "PUT" : "POST",
                );
                setEditing(null);
              }}
            >
              <Field
                name="sistolicaMmHg"
                label="Sistólica (mmHg)"
                type="number"
                min="70"
                max="260"
                defaultValue={editing?.sistolicaMmHg}
              />
              <Field
                name="diastolicaMmHg"
                label="Diastólica (mmHg)"
                type="number"
                min="40"
                max="150"
                defaultValue={editing?.diastolicaMmHg}
              />
            </Form>
            {editing && (
              <button className="text-button" onClick={() => setEditing(null)}>
                Cancelar edición
              </button>
            )}
            <div className="pressure-list">
              {controls.pressure.map((p) => (
                <div key={p.idControl}>
                  <span>Toma {p.numeroToma}</span>
                  <strong>
                    {p.sistolicaMmHg} / {p.diastolicaMmHg} <small>mmHg</small>
                  </strong>
                  <button onClick={() => setEditing(p)}>Editar</button>
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (!window.confirm("¿Eliminar esta toma de presión?"))
                        return;
                      setBusy(true);
                      try {
                        await request(`/tomas-presion/${p.idControl}`, {
                          method: "DELETE",
                        });
                        await load();
                      } catch (e) {
                        setError(e.message);
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : tab === "cuestionario" ? (
          <QuestionForm base={base} add={add} existing={controls.questions} />
        ) : (
          <>
            <h2>Resultado de la evaluación</h2>
            <p className="muted">
              Completá antropometría, presión y cuestionario antes de calcular.
              Los resultados se obtienen del servidor. Recalculá después de
              modificar los controles para actualizar el informe.
            </p>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setError("");
                try {
                  setResult(
                    await request(`${base}/resultado`, { method: "POST" }),
                  );
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy
                ? "Calculando…"
                : result
                  ? "Recalcular resultado"
                  : "Calcular resultado"}
            </button>
            {result && (
              <div className="result">
                <div className="result-heading">
                  <h3>Evaluación integral</h3>
                  <Badge value={result.semaforoGlobal} />
                </div>
                {result.derivacionInmediata && (
                  <p className="error">
                    Derivación inmediata · Avisar al docente responsable.
                  </p>
                )}
                <div className="stats compact">
                  <div className="stat">
                    <span>FINDRISC</span>
                    <strong>{result.puntajeFindrisc}</strong>
                    <small>{result.categoriaFindrisc}</small>
                  </div>
                  <div className="stat">
                    <span>Riesgo cardiovascular</span>
                    <strong className="smaller">
                      {label(result.riesgoCardiovascular)}
                    </strong>
                    <Badge value={result.semaforoRiesgoCardiovascular} />
                  </div>
                  <div className="stat">
                    <span>IMC / Presión</span>
                    <Badge value={result.semaforoImc} />
                    <Badge value={result.semaforoPresion} />
                  </div>
                </div>
                <p>{result.observaciones}</p>
                <p>Derivación: {result.deriva ? "Sí" : "No"}</p>
                <button className="text-button" onClick={() => window.print()}>
                  <Printer size={16} /> Imprimir informe
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
function QuestionForm({ base, add, existing }) {
  const [family, setFamily] = useState(""),
    [done, setDone] = useState(false);
  return (
    <>
      <h2>Hábitos y antecedentes</h2>
      <p className="muted">
        Respondé junto al paciente. Cada respuesta forma parte de la evaluación.
      </p>
      {existing || done ? (
        <>
          <p className="notice" role="status">
            Cuestionario guardado correctamente.
          </p>
          {existing && (
            <dl className="answers">
              {Object.entries(existing)
                .filter(([k]) => k !== "idControl")
                .map(([k, v]) => (
                  <div key={k}>
                    <dt>
                      {
                        {
                          actividadFisica: "Actividad física",
                          frutasVerduras: "Frutas y verduras",
                          medicacion: "Medicación",
                          tabaquismo: "Tabaquismo",
                          antecedenteFamiliar: "Antecedentes familiares",
                          tiposAntecedentes: "Tipos de antecedentes",
                        }[k]
                      }
                    </dt>
                    <dd>
                      {typeof v === "boolean"
                        ? v
                          ? "Sí"
                          : "No"
                        : Array.isArray(v)
                          ? v.map(label).join(", ") || "Sin antecedentes"
                          : label(v)}
                    </dd>
                  </div>
                ))}
            </dl>
          )}
        </>
      ) : (
        <Form
          onSave={async (v) => {
            if (
              v.antecedenteFamiliar !== "NO" &&
              (!v.tiposAntecedentes || !v.tiposAntecedentes.length)
            )
              throw new Error("Seleccioná un antecedente familiar.");
            await add(`${base}/cuestionario`, questionnaire(v));
            setDone(true);
          }}
        >
          {[
            ["actividadFisica", "¿Realiza actividad física diariamente?"],
            ["frutasVerduras", "¿Consume frutas y verduras diariamente?"],
            ["medicacion", "¿Toma medicación para la hipertensión?"],
          ].map(([name, title]) => (
            <Field
              key={name}
              name={name}
              label={title}
              options={[
                ["true", "Sí"],
                ["false", "No"],
              ]}
            />
          ))}
          <Field
            name="tabaquismo"
            label="Tabaquismo"
            options={[
              ["NUNCA", "Nunca fumó"],
              ["EX", "Exfumador"],
              ["ACTUAL", "Fumador actual"],
            ]}
          />
          <Field
            name="antecedenteFamiliar"
            label="Antecedentes familiares"
            options={[
              ["NO", "Sin antecedentes"],
              ["SEGUNDO_GRADO", "Abuelos, tíos o sobrinos"],
              ["PRIMER_GRADO", "Padres, hermanos o hijos"],
            ]}
            onChange={(e) => setFamily(e.target.value)}
          />
          {family && family !== "NO" && (
            <fieldset className="wide">
              <legend>Tipos de antecedentes (seleccioná al menos uno)</legend>
              {[
                "DIABETES",
                "HIPERTENSION",
                "ENFERMEDAD_CARDIOVASCULAR",
                "OTRO",
              ].map((x) => (
                <label key={x} className="checkbox">
                  <input name="tiposAntecedentes" type="checkbox" value={x} />
                  {label(x)}
                </label>
              ))}
            </fieldset>
          )}
        </Form>
      )}
    </>
  );
}
