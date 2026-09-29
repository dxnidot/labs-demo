import type { ResultadoAprobacion } from '../../domain/models/resultado-aprobacion';

export abstract class AclaracionesPort {
  abstract aprobar(id: number): Promise<ResultadoAprobacion>;
}
