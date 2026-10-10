import {
  Building2,
  CalendarDays,
  ChartColumn,
  ClipboardList,
  LayoutDashboard,
  MessageCircle,
  Settings,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const businessNav: NavGroup[] = [
  {
    label: 'Principal',
    items: [
      { to: '/dashboard', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
    ],
  },
  {
    label: 'CRM',
    items: [
      { to: '/dashboard/clientes', label: 'Clientes', icon: Users },
      { to: '/dashboard/pipeline', label: 'Pipeline', icon: Target },
      { to: '/dashboard/seguimientos', label: 'Seguimientos', icon: ClipboardList },
    ],
  },
  {
    label: 'Crecimiento',
    items: [
      { to: '/dashboard/whatsapp', label: 'WhatsApp', icon: MessageCircle },
      { to: '/dashboard/reportes', label: 'Reportes', icon: ChartColumn },
    ],
  },
];

export const businessFooterItem: NavItem = {
  to: '/dashboard/configuracion',
  label: 'Configuración',
  icon: Settings,
};

export const clientNav: NavGroup[] = [
  {
    label: 'Mi cuenta',
    items: [
      { to: '/cuenta', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/cuenta/citas', label: 'Mis citas', icon: CalendarDays },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    label: 'Plataforma',
    items: [
      { to: '/admin', label: 'Resumen', icon: LayoutDashboard, end: true },
      { to: '/admin/usuarios', label: 'Usuarios', icon: Users },
      { to: '/admin/negocios', label: 'Negocios', icon: Building2 },
      { to: '/admin/leads', label: 'Leads', icon: Target },
      { to: '/admin/roles', label: 'Roles', icon: ShieldCheck },
    ],
  },
];
