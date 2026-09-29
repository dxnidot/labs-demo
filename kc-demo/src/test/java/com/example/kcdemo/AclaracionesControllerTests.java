package com.example.kcdemo;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.Test;

class AclaracionesControllerTests {

    @Test
    void returnsDemoClarifications() {
        AclaracionesController controller = new AclaracionesController();

        List<AclaracionesController.Aclaracion> aclaraciones = controller.aclaraciones();

        assertEquals(2, aclaraciones.size());
        assertEquals(1L, aclaraciones.get(0).id());
        assertEquals("pendiente", aclaraciones.get(0).estatus());
        assertEquals(2L, aclaraciones.get(1).id());
        assertEquals("pendiente", aclaraciones.get(1).estatus());
    }

    @Test
    void approvesRequestedClarification() {
        AclaracionesController controller = new AclaracionesController();

        AclaracionesController.Aprobacion aprobacion = controller.aprobar(42L);

        assertNotNull(aprobacion);
        assertEquals(42L, aprobacion.id());
        assertEquals("aprobada", aprobacion.estatus());
    }
}