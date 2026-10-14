package cent35.models;

import org.hibernate.annotations.GenericGenerator;
import javax.persistence.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.Comparator;
import cent35.models.enums.SemaforoGlobal;

@Entity
public class Tamizaje {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO, generator = "native")
    @GenericGenerator(name = "native", strategy = "native")
    private long id;

    private boolean consent;
    private LocalDateTime timestamp;
    @Column(name = "id_registro", nullable = false, unique = true)
    private String id_registro;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="paciente_id")
    private Paciente paciente;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="operador_id")
    private Enfermero operador;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="supervisor_id")
    private Enfermero supervisor;

    @OneToOne(mappedBy="tamizaje", cascade = CascadeType.ALL)
    private Cuestionario cuestionario;

    @OneToOne(mappedBy="tamizaje", cascade = CascadeType.ALL)
    private Antropometria antropometria;

    @OneToMany(mappedBy = "tamizaje", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<TomaPresion> tomaPresiones = new HashSet<>();

    @OneToOne(mappedBy = "tamizaje", cascade = CascadeType.ALL)
    private ResultadosTamizaje resultados;

    public Tamizaje() {
        this.timestamp = LocalDateTime.now();
    }

    public Tamizaje(boolean consent, String id_registro) {
        this.consent = consent;
        this.id_registro = id_registro;
        this.timestamp = LocalDateTime.now();
    }

    public long getId() { return id; }

    public boolean isConsent() { return consent; }
    public void setConsent(boolean consent) { this.consent = consent; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getId_registro() { return id_registro; }
    public void setId_registro(String id_registro) { this.id_registro = id_registro; }

    public Paciente getPaciente() { return paciente; }
    public void setPaciente(Paciente paciente) { this.paciente = paciente; }

    public Enfermero getOperador() { return operador; }
    public void setOperador(Enfermero operador) { this.operador = operador; }

    public Enfermero getSupervisor() { return supervisor; }
    public void setSupervisor(Enfermero supervisor) { this.supervisor = supervisor; }

    public Cuestionario getCuestionario() { return cuestionario; }
    public void setCuestionario(Cuestionario cuestionario) { vincularCuestionario(cuestionario); }

    public Antropometria getAntropometria() { return antropometria; }
    public void setAntropometria(Antropometria antropometria) { vincularAntropometria(antropometria); }

    public Set<TomaPresion> getTomaPresiones() { return tomaPresiones; }
    public void addTomaPresion(TomaPresion tomaPresion) {
        if (tomaPresion == null) return;
        tomaPresion.setTamizaje(this);
        tomaPresiones.add(tomaPresion);
    }

    public TomaPresion obtenerUltimaTomaPresionValida() {
        return tomaPresiones.stream()
                .filter(toma -> toma != null && toma.validarValores())
                .max(Comparator.comparing(TomaPresion::getNumeroToma,
                        Comparator.nullsFirst(Comparator.naturalOrder())))
                .orElse(null);
    }

    public String clasificarIMC() {
        if (antropometria == null || !antropometria.validar()) return null;
        float imc = antropometria.calcularIMC();
        if (imc < 18.5f || imc >= 25f && imc < 30f) return "AMARILLO";
        if (imc >= 30f) return "ROJO";
        return "VERDE";
    }

    public String clasificarPresion() {
        TomaPresion toma = obtenerUltimaTomaPresionValida();
        if (toma == null) return null;
        int sistolica = toma.getSistolicaMmHg();
        int diastolica = toma.getDiastolicaMmHg();
        if (sistolica >= 140 || diastolica >= 90) return "ROJO";
        if (sistolica >= 130 || diastolica >= 85) return "AMARILLO";
        return "VERDE";
    }

    public boolean esPresionUrgente() {
        TomaPresion toma = obtenerUltimaTomaPresionValida();
        return toma != null && (toma.getSistolicaMmHg() >= 180 || toma.getDiastolicaMmHg() >= 110);
    }

    public SemaforoGlobal calcularSemaforoGlobal(Integer puntajeFindrisc) {
        String imc = clasificarIMC();
        String presion = clasificarPresion();
        String riesgoCardiovascular = clasificarRiesgoCardiovascularSimplificado();

        if ("ROJO".equals(imc) || "ROJO".equals(presion)
                || "ROJO".equals(riesgoCardiovascular)
                || puntajeFindrisc != null && puntajeFindrisc >= 15)
            return SemaforoGlobal.ROJO;
        if ("AMARILLO".equals(imc) || "AMARILLO".equals(presion)
                || "AMARILLO".equals(riesgoCardiovascular)
                || puntajeFindrisc != null && puntajeFindrisc >= 12)
            return SemaforoGlobal.AMARILLO;
        return SemaforoGlobal.VERDE;
    }

    public boolean requiereDerivacion(Integer puntajeFindrisc) {
        return calcularSemaforoGlobal(puntajeFindrisc) == SemaforoGlobal.ROJO;
    }

    public boolean requiereDerivacionInmediata() {
        return esPresionUrgente();
    }

    public String calcularRiesgoCardiovascularSimplificado() {
        if (cuestionario == null) return "DATOS_INSUFICIENTES";
        return "MODO_SIMPLIFICADO_FACTORES_" + contarFactoresRiesgoCardiovascular();
    }

    public String clasificarRiesgoCardiovascularSimplificado() {
        if (cuestionario == null) return null;

        if (cuestionario.getTiposAntecedentes() != null
                && cuestionario.getTiposAntecedentes().stream()
                .anyMatch(tipo -> tipo != null && "ENFERMEDAD_CARDIOVASCULAR".equals(tipo.name()))) {
            return "ROJO";
        }

        int factores = contarFactoresRiesgoCardiovascular();
        if (factores >= 3) return "ROJO";
        if (factores >= 1) return "AMARILLO";
        return "VERDE";
    }

    private int contarFactoresRiesgoCardiovascular() {
        int factores = 0;
        if (cuestionario.getTabaquismo() != null
                && cuestionario.getTabaquismo().name().equals("ACTUAL")) factores++;
        if ("ROJO".equals(clasificarPresion())) factores++;
        if (antropometria != null && antropometria.calcularIMC() >= 30f) factores++;
        if (cuestionario.getTiposAntecedentes() != null
                && !cuestionario.getTiposAntecedentes().isEmpty()) factores++;
        return factores;
    }

    public ResultadosTamizaje getResultados() { return resultados; }
    public void setResultados(ResultadosTamizaje resultados) { vincularResultados(resultados); }

    public void vincularCuestionario(Cuestionario value) { this.cuestionario = value; if (value != null) value.setTamizaje(this); }
    public void vincularAntropometria(Antropometria value) { this.antropometria = value; if (value != null) value.setTamizaje(this); }
    public void vincularResultados(ResultadosTamizaje value) { this.resultados = value; if (value != null) value.setTamizaje(this); }
}
