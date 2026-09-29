import type { Usuario } from '../../domain/models/usuario';

export abstract class AuthPort {
  abstract init(): Promise<void>;
  abstract usuarioActual(): Usuario;
  abstract token(): string | undefined;
  abstract updateToken(minValidity: number): Promise<boolean>;
  abstract logout(): Promise<void>;
}
