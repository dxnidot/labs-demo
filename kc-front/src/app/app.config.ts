import { ApplicationConfig, inject, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { AuthPort } from './application/ports/auth.port';
import { AclaracionesPort } from './application/ports/aclaraciones.port';
import { MenuPort } from './application/ports/menu.port';
import { AprobarAclaracion } from './application/use-cases/aprobar-aclaracion';
import { IniciarSesion } from './application/use-cases/iniciar-sesion';
import { ObtenerMenu } from './application/use-cases/obtener-menu';
import { routes } from './app.routes';
import { HttpAclaracionesAdapter } from './infrastructure/adapters/http-aclaraciones.adapter';
import { HttpMenuAdapter } from './infrastructure/adapters/http-menu.adapter';
import { KeycloakAuthAdapter } from './infrastructure/adapters/keycloak-auth.adapter';
import { apiAuthInterceptor } from './infrastructure/interceptors/api-auth.interceptor';

const keycloakAuthAdapter = new KeycloakAuthAdapter();

export const initializeAuthentication = () => new IniciarSesion(keycloakAuthAdapter).execute();

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([apiAuthInterceptor])),
    provideRouter(routes),
    { provide: AuthPort, useValue: keycloakAuthAdapter },
    { provide: MenuPort, useClass: HttpMenuAdapter },
    { provide: AclaracionesPort, useClass: HttpAclaracionesAdapter },
    {
      provide: IniciarSesion,
      useFactory: () => new IniciarSesion(inject(AuthPort)),
    },
    {
      provide: ObtenerMenu,
      useFactory: () => new ObtenerMenu(inject(MenuPort)),
    },
    {
      provide: AprobarAclaracion,
      useFactory: () => new AprobarAclaracion(inject(AclaracionesPort)),
    },
  ],
};
