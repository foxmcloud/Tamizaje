package cent35.controllers;

import cent35.dtos.PacienteDTO;
import cent35.models.Paciente;
import cent35.models.enums.Sexo;
import cent35.repositories.PacienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class PacienteController {

    @Autowired
    private PacienteRepository pacienteRepository;

    @GetMapping("/pacientes")
    public List<PacienteDTO> getPacientes() {
        return pacienteRepository.findAll().stream().map(PacienteDTO::new).collect(Collectors.toList());
    }

    @PostMapping("/pacientes")
    public ResponseEntity<Object> registrarPaciente(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd") LocalDate fecha_nacimiento,
            @RequestParam Sexo sexo) {

        if (fecha_nacimiento == null || sexo == null) {
            return new ResponseEntity<>("Faltan datos", HttpStatus.FORBIDDEN);
        }

        Paciente nuevoPaciente = new Paciente(fecha_nacimiento, sexo, LocalDateTime.now());

        pacienteRepository.save(nuevoPaciente);

        return new ResponseEntity<>("Paciente registrado", HttpStatus.CREATED);
    }
}