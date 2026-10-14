package cent35.dtos;

import cent35.models.Cuestionario;
import cent35.models.enums.AntecedentesFamiliares;
import cent35.models.enums.Tabaquismo;
import cent35.models.enums.TipoAntecedente;
import java.util.ArrayList;
import java.util.List;

public class CuestionarioDTO {

    private Long idControl;
    private Boolean actividadFisica;
    private Boolean frutasVerduras;
    private Boolean medicacion;
    private Tabaquismo tabaquismo;
    private AntecedentesFamiliares antecedenteFamiliar;
    private List<TipoAntecedente> tiposAntecedentes;

    public CuestionarioDTO(Cuestionario cuestionario) {
        this.idControl = cuestionario.getIdControl();
        this.actividadFisica = cuestionario.getActividadFisica();
        this.frutasVerduras = cuestionario.getFrutasVerduras();
        this.medicacion = cuestionario.getMedicacion();
        this.tabaquismo = cuestionario.getTabaquismo();
        this.antecedenteFamiliar = cuestionario.getAntecedenteFamiliar();
        this.tiposAntecedentes = new ArrayList<>(cuestionario.getTiposAntecedentes());
    }

    public Long getIdControl() {
        return idControl;
    }
    public Boolean getActividadFisica() {
        return actividadFisica;
    }
    public Boolean getFrutasVerduras() {
        return frutasVerduras;
    }
    public Boolean getMedicacion() {
        return medicacion;
    }
    public Tabaquismo getTabaquismo() {
        return tabaquismo;
    }
    public AntecedentesFamiliares getAntecedenteFamiliar() {
        return antecedenteFamiliar;
    }
    public List<TipoAntecedente> getTiposAntecedentes() {
        return tiposAntecedentes;
    }
}