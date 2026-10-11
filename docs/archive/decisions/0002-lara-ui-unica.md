# ADR-0002: Lara, una sola UI para el lab

- Contexto: el lab tiene varias piezas por revisar (Keycloak, kc-demo, kc-front, bpm-sync, agentes ADK) y cada una se valida por separado. Conservar esa separación ayuda a entender los flujos, pero la navegación y el monitoreo se vuelven más pesados si cada vista vive en una app distinta.
- Decisión: crear una sola UI en React (Lara, carpeta `agents-ui`) con el chat y una vista por pieza del lab. La interfaz centraliza el estado del sistema y deja la parte operativa en repos o servicios específicos.
- Alternativas consideradas: seguir con `kc-front` como Angular y abrir otra app para el chat; usar solo Open WebUI para la conversación y dejar el lab como panel externo; mantener varias UI sin un punto de entrada único.
- Consecuencias: un solo login y un solo client de Keycloak para la capa de experiencia; más trabajo en la UI para consolidar múltiples vistas; las pantallas administrativas quedan en modo solo lectura para no introducir cambios accidentales en los sistemas productivos del laboratorio.
- Estado: Propuesta
