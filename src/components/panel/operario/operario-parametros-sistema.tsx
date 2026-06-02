import {
  OperarioParametroPrecioSection,
  type ParametroPrecioSectionConfig,
} from "@/components/panel/operario/operario-parametro-precio-section";
import {
  PARAMETRO_PRECIO_ORDEN,
  PARAMETRO_PRECIO_UI,
  type ParametroPrecioSlug,
  type PrecioHistorialItem,
} from "@/lib/domain/sistema-parametros";

export type ParametroPrecioData = {
  historial: PrecioHistorialItem[];
  precioActivo: PrecioHistorialItem | null;
};

type Props = {
  parametros: Record<ParametroPrecioSlug, ParametroPrecioData>;
};

function sectionConfig(slug: ParametroPrecioSlug): ParametroPrecioSectionConfig {
  const ui = PARAMETRO_PRECIO_UI[slug];
  return { slug, ...ui };
}

export function OperarioParametrosSistema({ parametros }: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Parámetros de sistema
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Configuración global de precios. Cada cambio queda registrado con su vigencia.
        </p>
      </div>

      {PARAMETRO_PRECIO_ORDEN.map((slug) => {
        const data = parametros[slug];
        return (
          <OperarioParametroPrecioSection
            key={slug}
            config={sectionConfig(slug)}
            historial={data.historial}
            precioActivo={data.precioActivo}
          />
        );
      })}
    </div>
  );
}
