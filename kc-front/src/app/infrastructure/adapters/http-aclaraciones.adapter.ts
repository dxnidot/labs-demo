import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AclaracionesPort } from '../../application/ports/aclaraciones.port';
import type { ResultadoAprobacion } from '../../domain/models/resultado-aprobacion';

@Injectable()
export class HttpAclaracionesAdapter extends AclaracionesPort {
  private readonly http = inject(HttpClient);

  aprobar(id: number): Promise<ResultadoAprobacion> {
    return firstValueFrom(
      this.http.post<ResultadoAprobacion>(`/api/aclaraciones/${id}/aprobar`, {}),
    );
  }
}