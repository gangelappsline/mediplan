import { Building2, CalendarCheck, Store, Target, UserRound, Users } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Edge, Node } from '@xyflow/react';

import { FlowCanvas } from '@/shared/components/flow/FlowCanvas';
import { entityNode, flowEdge, layoutColumns } from '@/shared/components/flow/layout';
import type { FlowTone } from '@/shared/components/flow/nodes';
import type { Business, BusinessStatusName } from '@/types';

interface BusinessEcosystemMapProps {
  business: Business;
}

const STATUS_TONE: Record<BusinessStatusName, FlowTone> = {
  active: 'success',
  pending: 'warn',
  suspended: 'danger',
};

/**
 * Ecosistema de un negocio: quién lo administra y qué volumen maneja
 * (clientes, leads y citas) con los contadores que devuelve
 * `GET /admin/businesses/{business}`.
 */
export function BusinessEcosystemMap({ business }: BusinessEcosystemMapProps) {
  const navigate = useNavigate();
  const tone = STATUS_TONE[business.status.name as BusinessStatusName] ?? 'neutral';

  const { nodes, edges } = useMemo(() => {
    const positions = layoutColumns(
      [
        [{ id: 'business', height: 120 }],
        [
          { id: 'owner', height: 100 },
          { id: 'clients', height: 100 },
          { id: 'leads', height: 100 },
          { id: 'appointments', height: 100 },
        ],
      ],
      { columnWidth: 200, columnGap: 130, rowGap: 22 },
    );

    const flowNodes: Node[] = [
      entityNode({
        id: 'business',
        position: positions.business ?? { x: 0, y: 0 },
        data: {
          label: business.name,
          valueText: business.status.label,
          description: [business.city, business.email].filter(Boolean).join(' · ') || 'Sin datos de contacto',
          icon: Building2,
          tone,
          width: 236,
          emphasized: true,
        },
      }),
      entityNode({
        id: 'owner',
        position: positions.owner ?? { x: 0, y: 110 },
        data: {
          label: business.owner?.name ?? 'Sin propietario',
          valueText: business.owner?.email ?? 'Cuenta sin asignar',
          icon: UserRound,
          tone: 'info',
          size: 'sm',
          width: 200,
          onSelect: business.owner ? () => navigate(`/admin/usuarios/${business.owner?.id}`) : undefined,
        },
      }),
      entityNode({
        id: 'clients',
        position: positions.clients ?? { x: 0, y: 220 },
        data: {
          label: 'Clientes',
          value: business.clients_count ?? 0,
          icon: Users,
          tone: 'success',
          size: 'sm',
          width: 200,
        },
      }),
      entityNode({
        id: 'leads',
        position: positions.leads ?? { x: 0, y: 320 },
        data: {
          label: 'Leads',
          value: business.leads_count ?? 0,
          icon: Target,
          tone: 'warn',
          size: 'sm',
          width: 200,
        },
      }),
      entityNode({
        id: 'appointments',
        position: positions.appointments ?? { x: 0, y: 420 },
        data: {
          label: 'Citas',
          value: business.appointments_count ?? 0,
          icon: CalendarCheck,
          tone: 'violet',
          size: 'sm',
          width: 200,
        },
      }),
    ];

    const flowEdges: Edge[] = [
      flowEdge({ id: 'b-owner', source: 'business', target: 'owner', label: 'administra', tone: 'info' }),
      flowEdge({ id: 'b-clients', source: 'business', target: 'clients', label: 'atiende', tone: 'success' }),
      flowEdge({ id: 'b-leads', source: 'business', target: 'leads', label: 'capta', tone: 'warn' }),
      flowEdge({
        id: 'b-appointments',
        source: 'business',
        target: 'appointments',
        label: 'agenda',
        tone: 'violet',
        animated: (business.appointments_count ?? 0) > 0,
      }),
    ];

    return { nodes: flowNodes, edges: flowEdges };
  }, [business, navigate, tone]);

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      ariaLabel={`Ecosistema del negocio ${business.name}`}
      height={380}
      showControls={false}
      caption={
        <span className="inline-flex items-center gap-1.5">
          <Store className="size-3.5" />
          {business.owner ? 'El propietario se abre con clic.' : 'Este negocio no tiene propietario asignado.'}
        </span>
      }
    />
  );
}
