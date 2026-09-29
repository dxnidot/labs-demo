import { Injectable } from '@angular/core';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';
import { AuthPort } from '../../application/ports/auth.port';
import type { Usuario } from '../../domain/models/usuario';

@Injectable()
export class KeycloakAuthAdapter extends AuthPort {
  private readonly keycloak = new Keycloak(environment.keycloak);

  async init(): Promise<void> {
    const authenticated = await this.keycloak.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false,
    });

    if (!authenticated) {
      throw new Error('Keycloak did not authenticate the user.');
    }
  }

  usuarioActual(): Usuario {
    return {
      username: this.keycloak.tokenParsed?.['preferred_username'] ?? this.keycloak.subject ?? '',
      roles: {
        realm: [...(this.keycloak.realmAccess?.roles ?? [])],
        chatApi: [...(this.keycloak.resourceAccess?.['chat-api']?.roles ?? [])],
      },
    };
  }

  token(): string | undefined {
    return this.keycloak.token;
  }

  updateToken(minValidity: number): Promise<boolean> {
    return this.keycloak.updateToken(minValidity);
  }

  logout(): Promise<void> {
    return this.keycloak.logout({ redirectUri: window.location.origin });
  }
}
