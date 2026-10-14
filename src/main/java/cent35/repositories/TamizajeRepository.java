package cent35.repositories;

import cent35.models.Tamizaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@RepositoryRestResource
public interface TamizajeRepository extends JpaRepository<Tamizaje, Long> {
    @Query("select case when count(t) > 0 then true else false end " +
           "from Tamizaje t where t.id_registro = :idRegistro")
    boolean existsByIdRegistro(@Param("idRegistro") String idRegistro);
}
