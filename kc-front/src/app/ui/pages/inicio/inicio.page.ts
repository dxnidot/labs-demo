import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AuthPort } from '../../../application/ports/auth.port';
import { AprobarAclaracion } from '../../../application/use-cases/aprobar-aclaracion';
import { ObtenerMenu } from '../../../application/use-cases/obtener-menu';
import type { MenuOpcion } from '../../../domain/models/menu-opcion';
import type { ResultadoAprobacion } from '../../../domain/models/resultado-aprobacion';
import type { Usuario } from '../../../domain/models/usuario';

interface MensajeOperacion {
  tipo: 'success' | 'error' | 'info';
  texto: string;
}

@Component({
  selector: 'app-inicio-page',
  templateUrl: './inicio.page.html',
})
export class InicioPage implements OnInit {
  private readonly auth = inject(AuthPort);
  private readonly obtenerMenu = inject(ObtenerMenu);
  private readonly aprobarAclaracion = inject(AprobarAclaracion);

  readonly usuario = signal<Usuario | null>(null);
  readonly menu = signal<MenuOpcion[]>([]);
  readonly errorMenu = signal('');
  readonly resultado = signal<MensajeOperacion | null>(null);
  readonly aprobando = signal(false);

  ngOnInit(): void {
    this.usuario.set(this.auth.usuarioActual());
    void this.cargarMenu();
  }

  async cargarMenu(): Promise<void> {
    this.errorMenu.set('');

    try {
      this.menu.set(await this.obtenerMenu.execute());
    } catch (error: unknown) {
      const status = error instanceof HttpErrorResponse ? ` (HTTP ${error.status})` : '';
      this.errorMenu.set(`No se pudo cargar el menú${status}.`);
    }
  }

  async ejecutarAccion(accion: string): Promise<void> {
    if (accion === 'aprobar') {
      await this.aprobar(1);
      return;
    }

    if (accion === 'consultar') {
      await this.cargarMenu();
      return;
    }

    this.resultado.set({ tipo: 'info', texto: `Acción seleccionada: ${accion}.` });
  }

  async aprobar(id: number): Promise<void> {
    if (this.aprobando()) {
      return;
    }

    this.aprobando.set(true);
    this.resultado.set(null);

    try {
      const respuesta: ResultadoAprobacion = await this.aprobarAclaracion.execute(id);
      this.resultado.set({
        tipo: 'success',
        texto: `Aclaración ${respuesta.id}: ${respuesta.estatus}.`,
      });
    } catch (error: unknown) {
      const texto =
        error instanceof HttpErrorResponse
          ? error.status === 403
            ? 'HTTP 403: No tienes permiso para aprobar esta aclaración.'
            : `HTTP ${error.status}: No se pudo aprobar la aclaración.`
          : 'No se pudo completar la aprobación.';
      this.resultado.set({ tipo: 'error', texto });
    } finally {
      this.aprobando.set(false);
    }
  }

  cerrarSesion(): Promise<void> {
    return this.auth.logout();
  }
}
