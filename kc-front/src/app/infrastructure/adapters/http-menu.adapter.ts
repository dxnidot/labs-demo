import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MenuPort } from '../../application/ports/menu.port';
import type { MenuOpcion } from '../../domain/models/menu-opcion';

@Injectable()
export class HttpMenuAdapter extends MenuPort {
  private readonly http = inject(HttpClient);

  obtenerMenu(): Promise<MenuOpcion[]> {
    return firstValueFrom(this.http.get<MenuOpcion[]>('/api/menu'));
  }
}