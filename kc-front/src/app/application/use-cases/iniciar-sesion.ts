import type { AuthPort } from '../ports/auth.port';

export class IniciarSesion {
  constructor(private readonly auth: AuthPort) {}

  execute(): Promise<void> {
    return this.auth.init();
  }
}
