import type { AclaracionesPort } from '../ports/aclaraciones.port';

export class AprobarAclaracion {
  constructor(private readonly aclaraciones: AclaracionesPort) {}

  execute(id: number) {
    return this.aclaraciones.aprobar(id);
  }
}
