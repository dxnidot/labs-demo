import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig, initializeAuthentication } from './app/app.config';
import { App } from './app/app';

initializeAuthentication()
  .then(() => bootstrapApplication(App, appConfig))
  .catch((error: unknown) => console.error('Application startup failed', error));
