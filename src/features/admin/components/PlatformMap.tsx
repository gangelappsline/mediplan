import {
  Building2,
  CalendarCheck,
  HeartPulse,
  ShieldCheck,
  Target,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Edge, Node } from '@xyflow/react';

import { FlowCanvas } from '@/shared/components/flow/FlowCanvas';
import { entityNode, flowEdge, layoutColumns } from '@/shared/components/flow/layout';
import type { EntityNodeData } from '@/shared/components/flow/nodes';
import type { AdminDashboardData } from '@/types';

interface PlatformMapProps {
  data: AdminDashboardData;
}

const METRIC_HEIGHT = 112;
const PLAIN_HEIGHT = 96;

/**
 * Mapa interactivo de la plataforma construido con los datos de
 * `GET /admin/dashboard`: qué entidades existen, cómo se relacionan y cuántas
 * hay. Los nodos navegables llevan al listado correspondiente.
 */
export function PlatformMap({ data }: PlatformMapProps) {
  const navigate = useNavigate();

  const { nodes, edges } = useMemo(() => {
    const positions = layoutColumns(
      [
        [{ id: 'platform', height: METRIC_HEIGHT }],
        [
          { id: 'users', height: METRIC_HEIGHT },
          { id: 'businesses', height: METRIC_HEIGHT },
          { id: 'leads', height: METRIC_HEIGHT },
        ],
        [
          { id: 'roles', height: PLAIN_HEIGHT },
          { id: 'clients', height: METRIC_HEIGHT },
          { id: 'appointments', height: METRIC_HEIGHT },
          { id: 'conversion', height: PLAIN_HEIGHT },
        ],
      ],
      { columnWidth: 216, columnGap: 116, rowGap: 26 },
    );

    const definitions: Record<string, EntityNodeData> = {
      platform: {
        label: 'MediPlan',
        valueText: 'Plataforma',
        description: 'Agenda y CRM para clínicas',
        icon: HeartPulse,
        tone: 'primary',
        width: 216,
        metrics: [
          { label: 'negocios', value: data.businesses.total },
          { label: 'usuarios', value: data.users.total },
        ],
      },
      users: {
        label: 'Usuarios',
        value: data.users.total,
        icon: Users,
        tone: 'info',
        width: 216,
        metrics: [
          { label: 'nuevos', value: data.users.new_last_month },
          { label: 'inactivos', value: data.users.inactive },
        ],
        onSelect: () => navigate('/admin/usuarios'),
      },
      businesses: {
        label: 'Negocios',
        value: data.businesses.total,
        icon: Building2,
        tone: 'primary',
        width: 216,
        metrics: [
          { label: 'nuevos', value: data.businesses.new_last_month },
          {
            label: 'pendientes',
            value: data.businesses.by_status.find((status) => status.name === 'pending')?.total ?? 0,
          },
        ],
        onSelect: () => navigate('/admin/negocios'),
      },
      leads: {
        label: 'Leads',
        value: data.leads.total,
        icon: Target,
        tone: 'warn',
        width: 216,
        metrics: [
          { label: 'abiertos', value: data.leads.open },
          { label: 'ganados', value: data.leads.won },
        ],
        onSelect: () => navigate('/admin/leads'),
      },
      roles: {
        label: 'Roles',
        value: data.users.by_role.length,
        valueText: 'catálogo',
        icon: ShieldCheck,
        width: 216,
        onSelect: () => navigate('/admin/roles'),
      },
      clients: {
        label: 'Clientes',
        value: data.clients.total,
        icon: UserRound,
        tone: 'success',
        width: 216,
        metrics: [{ label: 'nuevos', value: data.clients.new_last_month }],
      },
      appointments: {
        label: 'Citas',
        value: data.appointments.total,
        icon: CalendarCheck,
        tone: 'violet',
        width: 216,
        metrics: [
          { label: 'hoy', value: data.appointments.today },
          { label: 'próximas', value: data.appointments.upcoming },
        ],
      },
      conversion: {
        label: 'Conversión',
        valueText: `${data.leads.conversion_rate}%`,
        description: 'Leads ganados sobre el total',
        icon: TrendingUp,
        tone: data.leads.conversion_rate >= 25 ? 'success' : 'warn',
        width: 216,
      },
    };

    const flowNodes: Node[] = Object.entries(definitions).map(([id, nodeData]) =>
      entityNode({ id, position: positions[id] ?? { x: 0, y: 0 }, data: nodeData }),
    );

    const flowEdges: Edge[] = [
      flowEdge({ id: 'p-users', source: 'platform', target: 'users', label: 'cuentas' }),
      flowEdge({ id: 'p-businesses', source: 'platform', target: 'businesses', label: 'operan' }),
      flowEdge({ id: 'p-leads', source: 'platform', target: 'leads' }),
      flowEdge({ id: 'users-roles', source: 'users', target: 'roles', label: 'permisos' }),
      flowEdge({ id: 'b-clients', source: 'businesses', target: 'clients', label: 'atienden', tone: 'success' }),
      flowEdge({ id: 'b-appointments', source: 'businesses', target: 'appointments', animated: true, tone: 'violet' }),
      flowEdge({ id: 'l-conversion', source: 'leads', target: 'conversion', label: 'ganan', tone: 'warn' }),
    ];

    return { nodes: flowNodes, edges: flowEdges };
  }, [data, navigate]);

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      ariaLabel="Mapa de la plataforma: usuarios, negocios, clientes, leads y citas"
      height={430}
      caption={
        <span>
          Los nodos resaltados se pueden abrir con clic o con <kbd>Enter</kbd> al enfocarlos.
        </span>
      }
    />
  );
}
