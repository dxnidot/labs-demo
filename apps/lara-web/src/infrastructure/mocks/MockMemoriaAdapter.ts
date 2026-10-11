// MOCK: colecciones y fragmentos técnicos completamente ficticios, guardados solo en memoria.
import type { MemoriaPort } from "../../application/ports/MemoriaPort";
import type { ColeccionMemoria, ResultadoMemoria } from "../../domain/ResultadoMemoria";

const colecciones: readonly ColeccionMemoria[] = [
  { clave: "flujo-autorizacion", nombre: "Flujos de autorización" },
  { clave: "servicios", nombre: "Servicios de ejemplo" },
  { clave: "recuerdos", nombre: "Recuerdos de sesión" },
];

const resultados: readonly (ResultadoMemoria & { coleccion: string })[] = [
  {
    coleccion: "flujo-autorizacion",
    fuente: "guia/flujo-publico.md · fragmento 4",
    fragmento: "Una aplicación de navegador puede usar un flujo con verificación PKCE. Las credenciales privadas no deben incluirse en el cliente.",
    puntaje: 0.86,
  },
  {
    coleccion: "recuerdos",
    fuente: "recuerdo · nota de ejemplo",
    fragmento: "En una sesión de práctica se revisó la diferencia entre un cliente público y uno confidencial.",
    puntaje: 0.79,
  },
  {
    coleccion: "servicios",
    fuente: "guia/servicios.md · fragmento 2",
    fragmento: "Un servicio valida la firma y el emisor de una credencial antes de procesar sus permisos.",
    puntaje: 0.64,
  },
];

/** Proporciona colecciones y fragmentos ficticios para desarrollar la vista de memoria.
 * @author Daniel Tovar
 * @since 2026-10-10
 */
export class MockMemoriaAdapter implements MemoriaPort {
  listarColecciones(): Promise<ColeccionMemoria[]> {
    return Promise.resolve(colecciones.map((coleccion) => ({ ...coleccion })));
  }

  buscar(consulta: string, coleccion?: string): Promise<ResultadoMemoria[]> {
    const terminos = consulta.toLocaleLowerCase("es").trim().split(/\s+/).filter(Boolean);
    return Promise.resolve(
      resultados
        .filter((resultado) => coleccion === undefined || resultado.coleccion === coleccion)
        .filter((resultado) => {
          const contenido = `${resultado.fuente} ${resultado.fragmento}`.toLocaleLowerCase("es");
          return terminos.length === 0 || terminos.some((termino) => contenido.includes(termino));
        })
        .map(({ coleccion: _coleccion, ...resultado }) => ({ ...resultado })),
    );
  }
}
