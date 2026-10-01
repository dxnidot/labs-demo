// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PageLayout } from "./PageLayout";

afterEach(cleanup);

function montar() {
  return render(
    <PageLayout
      acciones={<button type="button">Acción</button>}
      pestanas={<div role="tablist" />}
      pie={<form>Composer</form>}
      subtitulo="Subtítulo"
      titulo="Título"
    >
      <table className="overflow-x-auto">
        <tbody>
          <tr>
            <td>Contenido largo</td>
          </tr>
        </tbody>
      </table>
    </PageLayout>,
  );
}

describe("PageLayout", () => {
  it("fija encabezado, pestañas y pie con shrink-0", () => {
    const { container } = montar();

    for (const ranura of ["page-header", "page-tabs", "page-footer"]) {
      const elemento = container.querySelector(`[data-slot="${ranura}"]`);
      expect(elemento?.className).toContain("shrink-0");
    }
  });

  it("tiene un único contenedor con scroll y el contenido va en una columna interna de altura automática", () => {
    const { container } = montar();

    const conScroll = Array.from(container.querySelectorAll("*")).filter((nodo) =>
      /(^|\s)overflow-y-auto(\s|$)/.test(nodo.getAttribute("class") ?? ""),
    );
    expect(conScroll).toHaveLength(1);
    const contenido = container.querySelector('[data-slot="page-content"]');
    expect(contenido).toBe(conScroll[0]);
    expect(contenido?.className).toContain("min-h-0");
    expect(contenido?.className).toContain("flex-1");
    expect(contenido?.firstElementChild?.className).toContain("flex-col");
    expect(contenido?.firstElementChild?.className).not.toContain("overflow");
  });

  it("sin desplazable no genera scroll y sin pie ni pestañas no los renderiza", () => {
    const { container } = render(
      <PageLayout desplazable={false} titulo="Solo">
        x
      </PageLayout>,
    );

    expect(container.querySelector('[data-slot="page-content"]')?.className).toContain(
      "overflow-hidden",
    );
    expect(container.querySelector('[data-slot="page-footer"]')).toBeNull();
    expect(container.querySelector('[data-slot="page-tabs"]')).toBeNull();
  });
});
