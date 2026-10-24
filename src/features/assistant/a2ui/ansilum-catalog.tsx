/**
 * The Ansilum A2UI catalog (https://a2ui.org, protocol v0.9): the only components an
 * agent surface may use here. The agent builds them from tool data
 * (ansilum-ai `schemas/a2ui.py`); this file defines their API with zod and renders
 * them with the app's own cards.
 *
 * Schemas use `zod/v3`: A2UI's binder reads zod 3 schema metadata (`_def.typeName`).
 */
import type { FC } from 'react'
import {
  createComponentImplementation,
  type ReactComponentImplementation,
} from '@a2ui/react/v0_9'
import { Catalog, type ComponentApi } from '@a2ui/web_core/v0_9'
import { z } from 'zod/v3'
import { DataTableCard, MetricGroupCard } from '../components/answer-cards'

export const ANSILUM_CATALOG_ID =
  'https://ansilum.com/a2ui/catalogs/ansilum/v1.json'

const unit = z.enum(['currency', 'count', 'percent', 'quantity'])

export const MetricGroupApi = {
  name: 'MetricGroup',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    metrics: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        value: z.number().nullable(),
        unit,
        currency: z.string().optional(),
        changePercent: z.number().optional(),
      })
    ),
  }),
}

export const DataTableApi = {
  name: 'DataTable',
  schema: z.object({
    title: z.string(),
    columns: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        unit: z.union([unit, z.literal('text')]).optional(),
      })
    ),
    rows: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
    currency: z.string().optional(),
  }),
}

/**
 * `createComponentImplementation` with the props type named here: TypeScript
 * gives up inferring it through A2UI's binder types for these schemas (TS2589).
 * The schema still validates every surface at runtime.
 */
function implement<Props>(
  api: { name: string; schema: z.ZodType<Props> },
  View: FC<{ props: Props }>
): ReactComponentImplementation {
  return createComponentImplementation(
    api as unknown as ComponentApi,
    View as unknown as Parameters<typeof createComponentImplementation>[1]
  )
}

const MetricGroup = implement(MetricGroupApi, ({ props }) => (
  <MetricGroupCard
    component={{
      type: 'metric_group',
      title: props.title,
      subtitle: props.subtitle ?? null,
      source_tool: '',
      metrics: props.metrics.map((metric) => ({
        key: metric.key,
        label: metric.label,
        value: metric.value,
        unit: metric.unit,
        currency: metric.currency ?? null,
        change_percent: metric.changePercent ?? null,
      })),
    }}
  />
))

const DataTable = implement(DataTableApi, ({ props }) => (
  <DataTableCard
    component={{
      type: 'data_table',
      title: props.title,
      columns: props.columns,
      rows: props.rows,
      currency: props.currency ?? null,
      source_tool: '',
    }}
  />
))

export const ansilumCatalog = new Catalog(ANSILUM_CATALOG_ID, 'v0.9', [
  MetricGroup,
  DataTable,
])
