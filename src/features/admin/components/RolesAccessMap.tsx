import {
  CalendarDays,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
  Store,
  Target,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Edge, Node } from '@xyflow/react';

import { FlowCanvas } from '@/shared/components/flow/FlowCanvas';
import { entityNode, flowEdge, layoutColumns } from '@/shared/components/flow/layout';
import type { EntityNodeLink } from '@/shared/components/flow/nodes';
import type { RoleCatalogItem, RoleName } from '@/types';

interface RolesAccessMapProps {
  roles: ReadonlyArray<RoleCatalogItem>;
}

interface PanelDefinition {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Roles que pueden entrar a este panel. */
  roles: ReadonlyArray<RoleName>;
  /** Pantallas; `to` solo se activa para las rutas del rol administrador. */
  screens: ReadonlyArray<{ label: string; icon: LucideIcon; to?: string }>;
}

/** Paneles de la aplicación y qué rol puede usarlos (según `RequireRole`). */
const PANELS: ReadonlyArray<PanelDefinition> = [
  {
    id: 'admin',
    label: 'Administración',
    description: 'Control de la plataforma',
    icon: ShieldCheck,
    roles: ['admin'],
    screens: [
      { label: 'Resumen', icon: LayoutDashboard, to: '/admin' },
      { label: 'Usuarios', icon: Users, to: '/admin/usuarios' },
      { label: 'Negocios', icon: Store, to: '/admin/negocios' },
      { label: 'Leads', icon: Target, to: '/admin/leads' },
      { label: 'Roles', icon: ShieldCheck, to: '/admin/roles' },
    ],
  },
  {
    id: 'business',
    label: 'Panel de negocio',
    description: 'Agenda y CRM de la clínica',
    icon: Store,
    roles: ['business'],
    screens: [
      { label: 'Resumen', icon: LayoutDashboard },
      { label: 'Agenda', icon: CalendarDays },
      { label: 'Clientes', icon: Users },
      { label: 'Pipeline', icon: Target },
      { label: 'Seguimientos', icon: ClipboardList },
      { label: 'WhatsApp', icon: MessageCircle },
      { label: 'Reportes', icon: ChartColumn },
      { label: 'Configuración', icon: Settings },
    ],
  },
  {
    id: 'client',
    label: 'Área de cliente',
    description: 'Citas del paciente',
    icon: UserRound,
    roles: ['client'],
    screens: [
      { label: 'Resumen', icon: LayoutDashboard },
      { label: 'Mis citas', icon: CalendarDays },
    ],
  },
];

const ROLE_TONE: Record<RoleName, 'primary' | 'info' | 'violet'> = {
  admin: 'violet',
  business: 'primary',
  client: 'info',
};

function panelHeight(panel: PanelDefinition): number {
  const rows = Math.ceil(panel.screens.length / 3);
  return 84 + rows * 30;
}

/**
 * Mapa de acceso por rol: qué panel abre cada rol y qué pantallas tiene.
 * Al elegir un rol se resalta su rama y se atenúan las demás.
 */
export function RolesAccessMap({ roles }: RolesAccessMapProps) {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<RoleName | null>(null);

  const { nodes, edges } = useMemo(() => {
    const orderedRoles = [...roles];
    const positions = layoutColumns(
      [
        orderedRoles.map((role) => ({ id: `role-${role.name}`, height: 112 })),
        PANELS.map((panel) => ({ id: panel.id, height: panelHeight(panel) })),
      ],
      { columnWidth: 236, columnGap: 150, rowGap: 30 },
    );

    const roleNodes: Node[] = orderedRoles.map((role) => {
      const isActive = activeRole === role.name;
      const dimmed = activeRole !== null && !isActive;

      return entityNode({
        id: `role-${role.name}`,
        position: positions[`role-${role.name}`] ?? { x: 0, y: 0 },
        dimmed,
        data: {
          label: role.label,
          value: role.users_count ?? 0,
          description: role.description ?? `Rol «${role.name}»`,
          icon: ShieldCheck,
          tone: ROLE_TONE[role.name] ?? 'primary',
          width: 236,
          emphasized: isActive,
          valueText: 'usuarios con este rol',
          onSelect: () => setActiveRole((current) => (current === role.name ? null : role.name)),
        },
      });
    });

    const panelNodes: Node[] = PANELS.map((panel) => {
      const allowed = activeRole === null || panel.roles.includes(activeRole);
      const navigable = panel.roles.includes('admin');

      const links: EntityNodeLink[] = panel.screens.map((screen) => ({
        label: screen.label,
        icon: screen.icon,
        to: navigable ? screen.to : undefined,
        title: navigable ? `Abrir ${screen.label}` : `Pantalla del panel «${panel.label}»`,
      }));

      return entityNode({
        id: panel.id,
        position: positions[panel.id] ?? { x: 0, y: 0 },
        dimmed: !allowed,
        data: {
          label: panel.label,
          description: panel.description,
          icon: panel.icon,
          tone: panel.id === 'admin' ? 'violet' : panel.id === 'business' ? 'primary' : 'info',
          width: 300,
          links,
          emphasized: activeRole !== null && allowed,
        },
      });
    });

    const flowEdges: Edge[] = PANELS.flatMap((panel) =>
      panel.roles
        .filter((roleName) => orderedRoles.some((role) => role.name === roleName))
        .map((roleName) =>
          flowEdge({
            id: `${roleName}-${panel.id}`,
            source: `role-${roleName}`,
            target: panel.id,
            animated: activeRole === roleName,
            dimmed: activeRole !== null && activeRole !== roleName,
            tone: activeRole === roleName ? ROLE_TONE[roleName] : 'neutral',
          }),
        ),
    );

    return { nodes: [...roleNodes, ...panelNodes], edges: flowEdges };
  }, [roles, activeRole]);

  return (
    <FlowCanvas
      nodes={nodes}
      edges={edges}
      ariaLabel="Mapa de acceso por rol"
      height={470}
      showMiniMap={false}
      caption={
        activeRole ? (
          <button
            type="button"
            onClick={() => setActiveRole(null)}
            className="rounded-full bg-primary/10 px-2.5 py-1 font-medium text-primary transition-colors hover:bg-primary/15"
          >
            Mostrando acceso de «{roles.find((role) => role.name === activeRole)?.label}» · quitar filtro
          </button>
        ) : (
          <span>Elige un rol para resaltar las pantallas a las que puede entrar.</span>
        )
      }
      aside={
        <button
          type="button"
          onClick={() => navigate('/admin/usuarios')}
          className="text-xs font-medium text-primary transition-colors hover:underline"
        >
          Gestionar usuarios y sus roles
        </button>
      }
    />
  );
}
