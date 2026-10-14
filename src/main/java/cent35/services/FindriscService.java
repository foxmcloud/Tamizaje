package cent35.services;

import cent35.models.Antropometria;
import cent35.models.Cuestionario;
import cent35.models.Paciente;
import cent35.models.Tamizaje;
import cent35.models.enums.AntecedentesFamiliares;
import org.springframework.stereotype.Service;

/** Calcula FINDRISC con los datos disponibles en la ficha actual. */
@Service
public class FindriscService {

    /**
     * Esta versión no usa cintura porque la jornada decidió no tomar ese dato.
     * Tampoco suma glucemia elevada previa porque el modelo recibido no la registra.
     */
    public Integer calcularPuntaje(Tamizaje tamizaje) {
        if (tamizaje == null) return null;
        Paciente paciente = tamizaje.getPaciente();
        Antropometria antropometria = tamizaje.getAntropometria();
        Cuestionario cuestionario = tamizaje.getCuestionario();
        if (paciente == null || antropometria == null || cuestionario == null
                || paciente.getFecha_nacimiento() == null || !antropometria.validar()
                || !cuestionario.validar()) return null;

        int puntos = 0;
        int edad = paciente.calcularEdad();
        if (edad >= 65) puntos += 4;
        else if (edad >= 55) puntos += 3;
        else if (edad >= 45) puntos += 2;

        float imc = antropometria.calcularIMC();
        if (imc > 30f) puntos += 3;
        else if (imc >= 25f) puntos += 1;

        if (Boolean.FALSE.equals(cuestionario.getActividadFisica())) puntos += 2;
        if (Boolean.FALSE.equals(cuestionario.getFrutasVerduras())) puntos += 1;
        if (Boolean.TRUE.equals(cuestionario.getMedicacion())) puntos += 2;

        AntecedentesFamiliares antecedentes = cuestionario.getAntecedenteFamiliar();
        if (antecedentes == AntecedentesFamiliares.PRIMER_GRADO) puntos += 5;
        else if (antecedentes == AntecedentesFamiliares.SEGUNDO_GRADO) puntos += 3;
        return puntos;
    }

    public String clasificarPuntaje(Integer puntaje) {
        if (puntaje == null) return "DATOS_INSUFICIENTES";
        if (puntaje < 7) return "BAJO";
        if (puntaje <= 11) return "LIGERAMENTE_ELEVADO";
        if (puntaje <= 14) return "MODERADO";
        if (puntaje <= 20) return "ALTO";
        return "MUY_ALTO";
    }
}
