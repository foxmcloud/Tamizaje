package cent35.controllers;

import cent35.dtos.EnfermeroDTO;
import cent35.models.Enfermero;
import cent35.models.enums.RolEnfermero;
import cent35.models.enums.Turnos;
import cent35.repositories.EnfermeroRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class EnfermeroController {

    @Autowired
    private EnfermeroRepository enfermeroRepository;

    @GetMapping("/enfermeros")
    public List<EnfermeroDTO> getEnfermeros() {
        return enfermeroRepository.findAll().stream().map(EnfermeroDTO::new).collect(Collectors.toList());
    }

    @GetMapping("/enfermeros/{id}")
    public EnfermeroDTO getEnfermero(@PathVariable int id) {
        return enfermeroRepository.findById(id).map(EnfermeroDTO::new).orElse(null);
    }

    @PostMapping("/enfermeros")
    public ResponseEntity<Object> createEnfermero(
            @RequestParam String nombre,
            @RequestParam String apellido,
            @RequestParam RolEnfermero rol,
            @RequestParam Turnos turno) {

        if (nombre.isEmpty() || apellido.isEmpty() || rol == null || turno == null) {
            return new ResponseEntity<>("Faltan datos", HttpStatus.FORBIDDEN);
        }

        Enfermero enfermero = new Enfermero(nombre, apellido, rol, turno);
        enfermeroRepository.save(enfermero);

        return new ResponseEntity<>("Enfermero creado exitosamente", HttpStatus.CREATED);
    }
}
