import React, { useEffect, useState, useId } from "react";
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
import {
  Modal,
  Form as BootstrapForm,
  Badge as BootstrapBadge,
  InputGroup,
  Nav,
} from "react-bootstrap";
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
  const id = useId();
  return (
    <BootstrapForm.Group
      className="field col-12 col-md-6"
      controlId={`${id}-${name}`}
    >
      <BootstrapForm.Label>{title}</BootstrapForm.Label>
      {options ? (
        <BootstrapForm.Select name={name} required {...props}>
          <option value="">Seleccionar…</option>
          {options.map(([value, text]) => (
            <option key={value} value={value}>
              {text}
            </option>
          ))}
        </BootstrapForm.Select>
      ) : (
        <BootstrapForm.Control name={name} required {...props} />
      )}
    </BootstrapForm.Group>
  );
}
function StatCard({ children }) {
  return (
    <div className="col-12 col-md-4">
      <div className="stat card h-100">
        <div className="card-body d-flex flex-column align-items-start gap-2">
          {children}
        </div>
      </div>
    </div>
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
      <div className="form-grid row g-3">{children}</div>
      {error && (
        <p role="alert" className="alert alert-danger error">
          {error}
        </p>
      )}
      <button
        disabled={busy || disabled}
        className="btn btn-primary primary"
        type="submit"
      >
        {busy ? "Guardando…" : submit}
      </button>
    </form>
  );
}
function Badge({ value }) {
  const tone =
    {
      VERDE: "success",
      ACEPTADO: "success",
      EVALUADO: "success",
      BAJO: "success",
      ROJO: "danger",
      ALTO: "danger",
      AMARILLO: "warning",
      PENDIENTE: "warning",
      "EN CURSO": "warning",
    }[String(value).toUpperCase()] || "secondary";
  return (
    <BootstrapBadge
      bg={`${tone}-subtle`}
      className={`text-${tone}-emphasis status-badge`}
    >
      {label(value)}
    </BootstrapBadge>
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
      <aside className="workspace-sidebar">
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
        <Nav
          variant="pills"
          className="workspace-nav"
          activeKey={page}
          onSelect={navigate}
          aria-label="Secciones de Tamizaje"
        >
          {sections.map(([key, title, Icon]) => (
            <Nav.Item key={key}>
              <Nav.Link as="button" eventKey={key}>
                <Icon size={19} />
                {title}
                {key === page && <span className="nav-dot" />}
              </Nav.Link>
            </Nav.Item>
          ))}
        </Nav>

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
      <main className="workspace-main">
        <header className="workspace-header">
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
        <div className="content container-fluid">
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
              className="btn btn-primary primary"
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
            <div className="alert alert-danger error" role="alert">
              No se pudo cargar la API: {error}{" "}
              <button
                className="btn btn-outline-danger btn-sm ms-2"
                onClick={reload}
              >
                Reintentar
              </button>
            </div>
          )}
          {notice && (
            <div
              className="alert alert-success notice d-flex align-items-center gap-2"
              role="status"
            >
              <Check size={18} />
              {notice}
              <button
                className="btn btn-sm ms-auto"
                aria-label="Cerrar aviso"
                onClick={() => setNotice("")}
              >
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
                  <div className="stats row g-3">
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
                      <StatCard key={title}>
                        <div className="stat-icon">
                          <Icon size={21} />
                        </div>
                        <span>{title}</span>
                        <strong>{loading ? "—" : count}</strong>
                        <small>Registros de la comunidad</small>
                      </StatCard>
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
                      <button
                        className="btn btn-outline-primary d-inline-flex align-items-center gap-2"
                        onClick={() => setModal("tamizaje")}
                      >
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
              <section className="panel card">
                <div className="panel-head card-header">
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
                    <InputGroup size="sm" className="search">
                      <InputGroup.Text>
                        <Search size={17} />
                      </InputGroup.Text>
                      <BootstrapForm.Control
                        aria-label="Buscar registros"
                        placeholder="Buscar registros…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </InputGroup>

                    <button
                      className="btn btn-outline-secondary icon-button"
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
                  <div className="table-wrap table-responsive">
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
                      <table className="table table-hover align-middle mb-0">
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
                                      <small className="d-block text-body-secondary">
                                        Ficha #{row.id}
                                      </small>
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
                                        className="btn btn-link text-button"
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
      <Modal
        show={Boolean(modal)}
        onHide={() => setModal(null)}
        centered
        scrollable
        size="lg"
        className="registration-modal"
        dialogClassName="registration-dialog"
        aria-labelledby="modal-title"
      >
        <Modal.Header closeButton closeLabel="Cerrar formulario">
          <Modal.Title as="h2" id="modal-title">
            {modal === "paciente"
              ? "Registrar paciente"
              : modal === "enfermero"
                ? "Agregar profesional"
                : "Iniciar tamizaje"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                options={["ENFERMERO", "SUPERVISOR"].map((x) => [x, label(x)])}
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
                <label className="form-check checkbox wide col-12">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="consent"
                    required
                  />{" "}
                  El paciente acepta el consentimiento para la evaluación.
                </label>
              </Form>
            </>
          )}
        </Modal.Body>
      </Modal>
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
      <button className="btn btn-link text-button back" onClick={onBack}>
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
        <p className="alert alert-danger error" role="alert">
          {error}
          <button className="btn btn-outline-danger btn-sm ms-2" onClick={load}>
            Reintentar
          </button>
        </p>
      )}
      <Nav
        variant="tabs"
        className="tabs"
        activeKey={tab}
        onSelect={setTab}
        role="tablist"
        aria-label="Controles del tamizaje"
      >
        {[
          ["antropometria", "01 · Antropometría"],
          ["presion", "02 · Presión arterial"],
          ["cuestionario", "03 · Cuestionario"],
          ["resultado", "04 · Resultado"],
        ].map(([key, title]) => (
          <Nav.Item key={key}>
            <Nav.Link
              as="button"
              id={`control-tab-${key}`}
              eventKey={key}
              role="tab"
              aria-controls="control-panel"
            >
              {title}
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>
      <section
        className="panel card"
        id="control-panel"
        role="tabpanel"
        aria-labelledby={`control-tab-${tab}`}
      >
        <div className="card-body detail-panel">
          {!controls ? (
            <p role="status">Cargando controles…</p>
          ) : tab === "antropometria" ? (
            <>
              <h2>Medidas antropométricas</h2>
              <p className="muted">
                Ingresá las medidas tomadas durante la evaluación.
              </p>
              {controls.anthro ? (
                <div className="stats compact row g-3">
                  {[
                    ["Peso", `${controls.anthro.pesoKg} kg`],
                    ["Talla", `${controls.anthro.tallacm} cm`],
                    ["IMC", controls.anthro.imc.toFixed(1)],
                  ].map(([k, v]) => (
                    <StatCard key={k}>
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </StatCard>
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
                <button
                  className="btn btn-link text-button"
                  onClick={() => setEditing(null)}
                >
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
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setEditing(p)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm"
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
                Completá antropometría, presión y cuestionario antes de
                calcular. Los resultados se obtienen del servidor. Recalculá
                después de modificar los controles para actualizar el informe.
              </p>
              <button
                className="btn btn-primary primary"
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
                    <p className="alert alert-danger error">
                      Derivación inmediata · Avisar al docente responsable.
                    </p>
                  )}
                  <div className="stats compact row g-3">
                    <StatCard>
                      <span>FINDRISC</span>
                      <strong>{result.puntajeFindrisc}</strong>
                      <small>{result.categoriaFindrisc}</small>
                    </StatCard>
                    <StatCard>
                      <span>Riesgo cardiovascular</span>
                      <strong className="smaller">
                        {label(result.riesgoCardiovascular)}
                      </strong>
                      <Badge value={result.semaforoRiesgoCardiovascular} />
                    </StatCard>
                    <StatCard>
                      <span>IMC / Presión</span>
                      <Badge value={result.semaforoImc} />
                      <Badge value={result.semaforoPresion} />
                    </StatCard>
                  </div>
                  <p>{result.observaciones}</p>
                  <p>Derivación: {result.deriva ? "Sí" : "No"}</p>
                  <button
                    className="btn btn-link text-button"
                    onClick={() => window.print()}
                  >
                    <Printer size={16} /> Imprimir informe
                  </button>
                </div>
              )}
            </>
          )}
        </div>
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
          <p
            className="alert alert-success notice d-flex align-items-center gap-2"
            role="status"
          >
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
            <fieldset className="wide col-12">
              <legend>Tipos de antecedentes (seleccioná al menos uno)</legend>
              {[
                "DIABETES",
                "HIPERTENSION",
                "ENFERMEDAD_CARDIOVASCULAR",
                "OTRO",
              ].map((x) => (
                <label key={x} className="form-check checkbox">
                  <input
                    className="form-check-input"
                    name="tiposAntecedentes"
                    type="checkbox"
                    value={x}
                  />
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
