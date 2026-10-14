import {
  createApp,
  ref,
  reactive,
  computed,
  onMounted,
  nextTick,
  watch,
} from "../vendor/vue/vue.esm-browser.prod.js";
import {
  request,
  optionalRequest,
  label,
  age,
  sexLabel,
  dateFormat,
  badgeClass,
  validatePatient,
  validatePressure,
  validateAnthropometry,
  normalizeQuestionnaire,
  buildDirectRegistrationPayload,
  validateDirectRegistrationStep,
} from "./api.js";

function freshDirectForm() {
  const suffix =
    globalThis.crypto?.randomUUID?.().slice(0, 8) ||
    Math.random().toString(36).slice(2, 10);
  return {
    operadorMode: "nuevo",
    operadorId: "",
    operador: { nombre: "", apellido: "", turno: "" },
    pacienteMode: "nuevo",
    pacienteId: "",
    paciente: { fechaNacimiento: "", sexo: "" },
    idRegistro: `TAM-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${suffix.toUpperCase()}`,
    consent: false,
    supervisorId: "",
    antropometria: { pesoKg: "", tallacm: "", cinturacm: "" },
    tomaPresion: { sistolicaMmHg: "", diastolicaMmHg: "" },
    cuestionario: {
      actividadFisica: "",
      frutasVerduras: "",
      medicacion: "",
      tabaquismo: "",
      antecedenteFamiliar: "",
      tiposAntecedentes: [],
    },
  };
}

createApp({
  setup() {
    const page = ref("registro"),
      query = ref(""),
      loading = ref(true),
      loadError = ref(""),
      notice = ref("");
    const busy = ref(false),
      formError = ref(""),
      modalKind = ref("");
    const patients = ref([]),
      staff = ref([]),
      records = ref([]),
      record = ref(null);
    const detailLoading = ref(false),
      detailError = ref(""),
      tab = ref("antropometria");
    const anthropometry = ref(null),
      pressure = ref([]),
      savedQuestionnaire = ref(null),
      result = ref(null);
    const editingPressure = ref(null),
      resultOutdated = ref(false);
    const directForm = reactive(freshDirectForm());
    const directStep = ref(0);
    const directMaxStep = ref(0);
    const directSteps = [
      {
        title: "Enfermero",
        description: "Agregá al enfermero responsable o elegí uno registrado.",
      },
      {
        title: "Paciente",
        description:
          "Ingresá los datos del paciente o seleccioná uno registrado.",
      },
      {
        title: "Atención",
        description:
          "Confirmá el identificador y el consentimiento del paciente.",
      },
      {
        title: "Medidas",
        description: "Registrá el peso, la talla y la cintura.",
      },
      { title: "Presión", description: "Ingresá la toma de presión arterial." },
      {
        title: "Hábitos y antecedentes",
        description: "Completá las respuestas junto al paciente.",
      },
      {
        title: "Revisar y guardar",
        description: "Revisá los datos antes de guardar la atención completa.",
      },
    ];
    const directStepDescription = computed(
      () => directSteps[directStep.value].description,
    );
    const directProgress = computed(
      () => (directStep.value + 1) / directSteps.length,
    );
    const directError = ref("");
    const directSaved = ref(null);
    const directResult = computed(() => directSaved.value?.resultado || null);
    const directMode = computed(() => page.value === "registro");
    const patientForm = reactive({ fecha_nacimiento: "", sexo: "" });
    const staffForm = reactive({
      nombre: "",
      apellido: "",
      rol: "",
      turno: "",
    });
    const screeningForm = reactive({
      id_registro: "",
      paciente: "",
      operador: "",
      supervisor: "",
      consent: false,
    });
    const anthroForm = reactive({ pesoKg: "", tallacm: "", cinturacm: "" });
    const pressureForm = reactive({ sistolicaMmHg: "", diastolicaMmHg: "" });
    const questionForm = reactive({
      actividadFisica: "",
      frutasVerduras: "",
      medicacion: "",
      tabaquismo: "",
      antecedenteFamiliar: "",
      tiposAntecedentes: [],
    });
    const sections = [
      { key: "registro", title: "Registro por pasos", icon: "＋" },
      { key: "inicio", title: "Resumen", icon: "◈" },
      { key: "tamizajes", title: "Tamizajes", icon: "▤" },
      { key: "pacientes", title: "Pacientes", icon: "♧" },
      { key: "equipo", title: "Equipo de salud", icon: "✚" },
    ];
    const sexes = [
      { value: "F", label: "Femenino" },
      { value: "M", label: "Masculino" },
      { value: "O", label: "Otro" },
    ];
    const options = (values) =>
      values.map((value) => ({ value, label: label(value) }));
    const roles = options(["ENFERMERO", "SUPERVISOR"]),
      shifts = options(["MAÑANA", "TARDE", "VESPERTINO"]);
    const tobacco = [
      { value: "NUNCA", label: "Nunca fumó" },
      { value: "EX", label: "Exfumador" },
      { value: "ACTUAL", label: "Fumador actual" },
    ];
    const families = [
      { value: "NO", label: "Sin antecedentes" },
      { value: "SEGUNDO_GRADO", label: "Abuelos, tíos o sobrinos" },
      { value: "PRIMER_GRADO", label: "Padres, hermanos o hijos" },
    ];
    const antecedentTypes = options([
      "DIABETES",
      "HIPERTENSION",
      "ENFERMEDAD_CARDIOVASCULAR",
      "OTRO",
    ]);
    const operators = computed(() =>
      staff.value.filter((person) => person.rol === "ENFERMERO"),
    );
    const supervisors = computed(() =>
      staff.value.filter((person) => person.rol === "SUPERVISOR"),
    );
    const directReview = computed(() => {
      const operador =
        directForm.operadorMode === "nuevo"
          ? directForm.operador
          : operators.value.find(
              (person) => person.id === Number(directForm.operadorId),
            );
      const paciente =
        directForm.pacienteMode === "nuevo"
          ? {
              fecha_nacimiento: directForm.paciente.fechaNacimiento,
              sexo: directForm.paciente.sexo,
            }
          : patients.value.find(
              (person) => person.id_paciente === Number(directForm.pacienteId),
            );
      const supervisor = supervisors.value.find(
        (person) => person.id === Number(directForm.supervisorId),
      );
      const answers = directForm.cuestionario;
      const booleanLabel = (value) =>
        value === true || value === "true"
          ? "Sí"
          : value === false || value === "false"
            ? "No"
            : "Sin responder";
      const familyTypes =
        answers.antecedenteFamiliar !== "NO" && answers.tiposAntecedentes.length
          ? ` (${answers.tiposAntecedentes.map(label).join(", ")})`
          : "";
      return {
        operador: operador
          ? `${operador.nombre.trim()} ${operador.apellido.trim()} · ${label(operador.turno)}`
          : "Sin seleccionar",
        paciente: paciente
          ? `${directForm.pacienteMode === "existente" ? `Paciente #${paciente.id_paciente} · ` : "Paciente nuevo · "}${dateFormat(paciente.fecha_nacimiento)} · ${sexLabel(paciente.sexo)}`
          : "Sin seleccionar",
        registro: `${directForm.idRegistro.trim()} · Consentimiento ${directForm.consent ? "aceptado" : "pendiente"}`,
        supervisor: supervisor
          ? `${supervisor.nombre} ${supervisor.apellido}`
          : "Sin supervisor",
        antropometria: `${directForm.antropometria.pesoKg} kg · ${directForm.antropometria.tallacm} cm de talla · ${directForm.antropometria.cinturacm} cm de cintura`,
        presion: `${directForm.tomaPresion.sistolicaMmHg} / ${directForm.tomaPresion.diastolicaMmHg} mmHg`,
        cuestionario: `Actividad física: ${booleanLabel(answers.actividadFisica)}. Frutas y verduras: ${booleanLabel(answers.frutasVerduras)}. Medicación: ${booleanLabel(answers.medicacion)}. Tabaquismo: ${label(answers.tabaquismo)}. Familiares: ${label(answers.antecedenteFamiliar)}${familyTypes}.`,
      };
    });
    const canCreateScreening = computed(
      () => patients.value.length > 0 && operators.value.length > 0,
    );
    const canCalculateResult = computed(() =>
      Boolean(
        record.value?.consent &&
        !detailLoading.value &&
        !detailError.value &&
        anthropometry.value &&
        savedQuestionnaire.value &&
        pressure.value.length,
      ),
    );
    const pageTitle = computed(() =>
      record.value
        ? "Ficha de tamizaje"
        : {
            registro: "Registrar atención",
            inicio: "Una mirada a la salud de tu comunidad",
            pacientes: "Pacientes",
            equipo: "Equipo de salud",
            tamizajes: "Tamizajes",
          }[page.value],
    );
    const pageDescription = computed(() =>
      record.value
        ? `Registro ${record.value.id_registro}`
        : page.value === "registro"
          ? "Completá la atención paso a paso, desde el enfermero hasta el resultado."
          : "Registrá, evaluá y acompañá cada paso de la atención.",
    );
    const modalTitle = computed(
      () =>
        ({
          paciente: "Registrar paciente",
          enfermero: "Agregar profesional",
          tamizaje: "Iniciar tamizaje",
        })[modalKind.value] || "Registrar",
    );
    const matches = (value) =>
      JSON.stringify(value)
        .toLocaleLowerCase("es")
        .includes(query.value.trim().toLocaleLowerCase("es"));
    const filteredPatients = computed(() => patients.value.filter(matches));
    const filteredStaff = computed(() => staff.value.filter(matches));
    const filteredRecords = computed(() => records.value.filter(matches));
    const recentRecords = computed(() =>
      [...filteredRecords.value].sort((a, b) => b.id - a.id).slice(0, 5),
    );
    let registrationModal, launcher;
    let reloadVersion = 0;

    function resetDirectRegistration() {
      const previousOperator = directSaved.value?.operador?.id;
      Object.assign(directForm, freshDirectForm());
      if (
        previousOperator &&
        operators.value.some((person) => person.id === previousOperator)
      ) {
        directForm.operadorMode = "existente";
        directForm.operadorId = String(previousOperator);
      }
      directSaved.value = null;
      directError.value = "";
      directStep.value = 0;
      directMaxStep.value = 0;
    }
    function startDirectRegistration() {
      if (busy.value) return;
      resetDirectRegistration();
      notice.value = "";
      navigate("registro");
      focusDirectStep();
    }
    async function focusDirectStep(error = false) {
      await nextTick();
      const target = document.getElementById(
        error ? "direct-error" : "direct-step-heading",
      );
      target?.focus({ preventScroll: true });
      document
        .getElementById("direct-wizard")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function validateDirectStepsThrough(last) {
      for (let index = 0; index <= last; index++) {
        try {
          validateDirectRegistrationStep(directForm, index);
        } catch (error) {
          directStep.value = index;
          directError.value = error.message;
          focusDirectStep(true);
          return false;
        }
      }
      return true;
    }
    function goToDirectStep(index) {
      if (
        busy.value ||
        directSaved.value ||
        !Number.isInteger(index) ||
        index < 0 ||
        index > directMaxStep.value
      )
        return;
      directError.value = "";
      if (index > directStep.value && !validateDirectStepsThrough(index - 1))
        return;
      directStep.value = index;
      focusDirectStep();
    }
    function previousDirectStep() {
      goToDirectStep(directStep.value - 1);
    }
    async function submitDirectStep() {
      if (busy.value || loading.value || loadError.value || directSaved.value)
        return;
      directError.value = "";
      if (directStep.value === directSteps.length - 1) {
        await saveDirectRegistration();
        return;
      }
      try {
        validateDirectRegistrationStep(directForm, directStep.value);
        const form = document.getElementById("direct-registration-form");
        if (form && !form.reportValidity()) return;
        directStep.value += 1;
        directMaxStep.value = Math.max(directMaxStep.value, directStep.value);
        focusDirectStep();
      } catch (error) {
        directError.value = error.message;
        focusDirectStep(true);
      }
    }
    async function saveDirectRegistration() {
      if (
        busy.value ||
        directSaved.value ||
        directStep.value !== directSteps.length - 1
      )
        return;
      if (!validateDirectStepsThrough(directSteps.length - 2)) return;
      busy.value = true;
      directError.value = "";
      try {
        const body = buildDirectRegistrationPayload(directForm);
        const saved = await request("/tamizajes/completo", {
          method: "POST",
          body,
        });
        directSaved.value = saved;
        notice.value =
          "Atención guardada. Enfermero, paciente y controles quedaron vinculados correctamente.";
        setRoute("registro");
        await reload();
        await nextTick();
        document
          .getElementById("direct-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
        document
          .getElementById("direct-result")
          ?.focus({ preventScroll: true });
      } catch (error) {
        directError.value = error.message;
        focusDirectStep(true);
      } finally {
        busy.value = false;
      }
    }
    function printDirectResult() {
      if (directResult.value) window.print();
    }
    function setRoute(hash) {
      window.history.replaceState(
        null,
        "",
        `${location.pathname}${location.search}#${hash}`,
      );
    }
    function navigate(key) {
      if (!sections.some((section) => section.key === key)) return;
      page.value = key;
      record.value = null;
      query.value = "";
      formError.value = "";
      detailError.value = "";
      setRoute(key);
    }
    async function reload() {
      const version = ++reloadVersion;
      loading.value = true;
      loadError.value = "";
      try {
        const [newPatients, newStaff, newRecords] = await Promise.all([
          request("/pacientes"),
          request("/enfermeros"),
          request("/tamizajes"),
        ]);
        if (version !== reloadVersion) return;
        patients.value = newPatients;
        staff.value = newStaff;
        records.value = newRecords;
      } catch (error) {
        if (version === reloadVersion) loadError.value = error.message;
      } finally {
        if (version === reloadVersion) loading.value = false;
      }
    }
    async function openModal(kind) {
      if (busy.value) return;
      if (kind === "tamizaje") {
        startDirectRegistration();
        return;
      }
      launcher = document.activeElement;
      formError.value = "";
      modalKind.value = kind;
      Object.assign(patientForm, { fecha_nacimiento: "", sexo: "" });
      Object.assign(staffForm, {
        nombre: "",
        apellido: "",
        rol: "",
        turno: "",
      });
      Object.assign(screeningForm, {
        id_registro: "",
        paciente: "",
        operador: "",
        supervisor: "",
        consent: false,
      });
      await nextTick();
      registrationModal.show();
    }
    function closeModal() {
      if (!busy.value) registrationModal.hide();
    }
    async function saveModal() {
      if (busy.value) return;
      busy.value = true;
      formError.value = "";
      try {
        const kind = modalKind.value;
        if (kind === "paciente") {
          await request("/pacientes", {
            method: "POST",
            params: validatePatient(patientForm),
          });
        } else if (kind === "enfermero") {
          const values = {
            ...staffForm,
            nombre: staffForm.nombre.trim(),
            apellido: staffForm.apellido.trim(),
          };
          if (
            !values.nombre ||
            !values.apellido ||
            !roles.some((x) => x.value === values.rol) ||
            !shifts.some((x) => x.value === values.turno)
          )
            throw new Error("Completá todos los datos del profesional.");
          await request("/enfermeros", { method: "POST", params: values });
        } else if (kind === "tamizaje") {
          if (!screeningForm.consent)
            throw new Error("El paciente debe aceptar el consentimiento.");
          const code = screeningForm.id_registro.trim();
          if (!code) throw new Error("Ingresá un identificador de registro.");
          if (
            !patients.value.some(
              (p) => p.id_paciente === Number(screeningForm.paciente),
            )
          )
            throw new Error("Seleccioná un paciente registrado.");
          if (
            !operators.value.some(
              (p) => p.id === Number(screeningForm.operador),
            )
          )
            throw new Error("Seleccioná un operador con rol enfermero.");
          if (
            screeningForm.supervisor &&
            !supervisors.value.some(
              (p) => p.id === Number(screeningForm.supervisor),
            )
          )
            throw new Error("Seleccioná un supervisor válido.");
          await request("/tamizajes", {
            method: "POST",
            body: {
              id_registro: code,
              consent: true,
              paciente: { id_paciente: Number(screeningForm.paciente) },
              operador: { id: Number(screeningForm.operador) },
              supervisor: screeningForm.supervisor
                ? { id: Number(screeningForm.supervisor) }
                : null,
            },
          });
          const updated = await request("/tamizajes");
          records.value = updated;
          const created = updated.find((row) => row.id_registro === code);
          if (!created)
            throw new Error(
              "La ficha fue guardada. Actualizá la lista para abrirla.",
            );
          await openRecord(created);
        } else return;
        registrationModal.hide();
        notice.value =
          kind === "tamizaje"
            ? "Ficha creada. Completá los controles."
            : "Registro guardado correctamente.";
        await reload();
      } catch (error) {
        formError.value = error.message;
      } finally {
        busy.value = false;
      }
    }
    async function loadRecord() {
      if (!record.value) return;
      const id = record.value.id;
      detailLoading.value = true;
      detailError.value = "";
      try {
        const base = `/tamizajes/${id}`;
        const [anthro, takes, questions, report] = await Promise.all([
          optionalRequest(`${base}/antropometria`),
          request(`${base}/tomas-presion`),
          optionalRequest(`${base}/cuestionario`),
          optionalRequest(`${base}/resultado`),
        ]);
        if (record.value?.id !== id) return;
        anthropometry.value = anthro;
        pressure.value = takes;
        savedQuestionnaire.value = questions;
        result.value = report;
      } catch (error) {
        if (record.value?.id === id) detailError.value = error.message;
      } finally {
        if (record.value?.id === id) detailLoading.value = false;
      }
    }
    async function openRecord(row) {
      page.value = "tamizajes";
      record.value = row;
      query.value = "";
      tab.value = "antropometria";
      anthropometry.value = null;
      pressure.value = [];
      savedQuestionnaire.value = null;
      result.value = null;
      resultOutdated.value = false;
      detailError.value = "";
      formError.value = "";
      cancelPressureEdit();
      Object.assign(anthroForm, { pesoKg: "", tallacm: "", cinturacm: "" });
      Object.assign(questionForm, {
        actividadFisica: "",
        frutasVerduras: "",
        medicacion: "",
        tabaquismo: "",
        antecedenteFamiliar: "",
        tiposAntecedentes: [],
      });
      setRoute(`tamizajes/${row.id}`);
      await loadRecord();
    }
    function backToRecords() {
      navigate("tamizajes");
    }
    function requireConsent() {
      if (!record.value?.consent)
        throw new Error("El paciente no aceptó el consentimiento.");
    }
    async function mutateControl(operation, message) {
      if (busy.value) return;
      busy.value = true;
      formError.value = "";
      try {
        if (detailLoading.value || detailError.value)
          throw new Error(
            "Actualizá los controles antes de registrar cambios.",
          );
        requireConsent();
        await operation();
        if (directSaved.value?.tamizaje.id === record.value.id)
          resetDirectRegistration();
        resultOutdated.value = Boolean(result.value);
        await loadRecord();
        notice.value = message;
      } catch (error) {
        formError.value = error.message;
      } finally {
        busy.value = false;
      }
    }
    async function saveAnthropometry() {
      if (anthropometry.value) return;
      await mutateControl(
        () =>
          request(`/tamizajes/${record.value.id}/antropometria`, {
            method: "POST",
            body: validateAnthropometry(anthroForm),
          }),
        "Antropometría guardada correctamente.",
      );
    }
    function editPressure(take) {
      if (busy.value) return;
      editingPressure.value = take;
      Object.assign(pressureForm, {
        sistolicaMmHg: take.sistolicaMmHg,
        diastolicaMmHg: take.diastolicaMmHg,
      });
      formError.value = "";
    }
    function cancelPressureEdit() {
      editingPressure.value = null;
      Object.assign(pressureForm, { sistolicaMmHg: "", diastolicaMmHg: "" });
    }
    async function savePressure() {
      await mutateControl(async () => {
        const values = validatePressure(pressureForm);
        await request(
          editingPressure.value
            ? `/tomas-presion/${editingPressure.value.idControl}`
            : `/tamizajes/${record.value.id}/tomas-presion`,
          { method: editingPressure.value ? "PUT" : "POST", body: values },
        );
        cancelPressureEdit();
      }, "Toma de presión guardada correctamente.");
    }
    async function deletePressure(take) {
      if (
        busy.value ||
        !window.confirm(`¿Eliminar la toma ${take.numeroToma}?`)
      )
        return;
      await mutateControl(async () => {
        await request(`/tomas-presion/${take.idControl}`, { method: "DELETE" });
        if (editingPressure.value?.idControl === take.idControl)
          cancelPressureEdit();
      }, "Toma de presión eliminada. Recalculá el resultado si corresponde.");
    }
    async function saveQuestionnaire() {
      if (savedQuestionnaire.value) return;
      await mutateControl(
        () =>
          request(`/tamizajes/${record.value.id}/cuestionario`, {
            method: "POST",
            body: normalizeQuestionnaire(questionForm),
          }),
        "Cuestionario guardado correctamente.",
      );
    }
    async function calculateResult() {
      if (busy.value) return;
      busy.value = true;
      formError.value = "";
      try {
        requireConsent();
        if (!canCalculateResult.value)
          throw new Error(
            "Completá antropometría, presión y cuestionario antes de calcular.",
          );
        result.value = await request(
          `/tamizajes/${record.value.id}/resultado`,
          { method: "POST" },
        );
        if (directSaved.value?.tamizaje.id === record.value.id)
          resetDirectRegistration();
        resultOutdated.value = false;
      } catch (error) {
        formError.value = error.message;
      } finally {
        busy.value = false;
      }
    }
    function printResult() {
      if (resultOutdated.value) {
        formError.value =
          "Recalculá el resultado antes de imprimir el informe actualizado.";
        return;
      }
      if (result.value) window.print();
    }
    watch(tab, () => {
      formError.value = "";
    });
    watch(
      () => questionForm.antecedenteFamiliar,
      (value) => {
        if (value === "NO") questionForm.tiposAntecedentes = [];
      },
    );
    watch(
      () => directForm.cuestionario.antecedenteFamiliar,
      (value) => {
        if (value === "NO") directForm.cuestionario.tiposAntecedentes = [];
      },
    );
    onMounted(async () => {
      const element = document.getElementById("registration-modal");
      registrationModal = new window.bootstrap.Modal(element);
      element.addEventListener("shown.bs.modal", () =>
        element
          .querySelector("input:not(:disabled),select:not(:disabled)")
          ?.focus(),
      );
      element.addEventListener("hidden.bs.modal", () => {
        modalKind.value = "";
        formError.value = "";
        if (launcher?.isConnected) launcher.focus();
      });
      await reload();
      const hash = location.hash.slice(1);
      const match = /^tamizajes\/(\d+)$/.exec(hash);
      if (match) {
        try {
          await openRecord(await request(`/tamizajes/${match[1]}`));
        } catch (error) {
          navigate("tamizajes");
          loadError.value = error.message;
        }
      } else if (sections.some((section) => section.key === hash))
        navigate(hash);
    });
    return {
      page,
      directForm,
      directStep,
      directMaxStep,
      directSteps,
      directStepDescription,
      directProgress,
      directReview,
      directError,
      directSaved,
      directResult,
      directMode,
      startDirectRegistration,
      submitDirectStep,
      previousDirectStep,
      goToDirectStep,
      saveDirectRegistration,
      printDirectResult,
      query,
      loading,
      loadError,
      notice,
      busy,
      formError,
      modalKind,
      record,
      detailLoading,
      detailError,
      tab,
      patients,
      staff,
      records,
      anthropometry,
      pressure,
      savedQuestionnaire,
      result,
      resultOutdated,
      editingPressure,
      patientForm,
      staffForm,
      screeningForm,
      anthroForm,
      pressureForm,
      questionForm,
      sections,
      sexes,
      roles,
      shifts,
      tobacco,
      families,
      antecedentTypes,
      operators,
      supervisors,
      canCreateScreening,
      canCalculateResult,
      pageTitle,
      pageDescription,
      modalTitle,
      filteredPatients,
      filteredStaff,
      filteredRecords,
      recentRecords,
      navigate,
      reload,
      openModal,
      closeModal,
      saveModal,
      openRecord,
      backToRecords,
      loadRecord,
      saveAnthropometry,
      editPressure,
      cancelPressureEdit,
      savePressure,
      deletePressure,
      saveQuestionnaire,
      calculateResult,
      printResult,
      label,
      age,
      sexLabel,
      dateFormat,
      badgeClass,
    };
  },
}).mount("#app");
