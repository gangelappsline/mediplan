import { ShieldCheck } from 'lucide-react';

import { useAdminRoles } from '@/features/admin/hooks';
import { PageHeader } from '@/shared/components/PageHeader';
import { QueryBoundary } from '@/shared/components/QueryState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';

/** Catálogo de roles de la plataforma (`GET /admin/roles`). */
export function AdminRolesPage() {
  const roles = useAdminRoles();

  return (
    <div className="space-y-6">
      <PageHeader title="Roles" description="Roles disponibles y cuántos usuarios tiene cada uno." />
      <QueryBoundary isLoading={roles.isLoading} error={roles.error} onRetry={() => void roles.refetch()}>
        <div className="grid gap-4 md:grid-cols-3">
          {(roles.data ?? []).map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" aria-hidden />
                  <CardTitle>{role.label}</CardTitle>
                </div>
                <CardDescription>{role.description ?? `Rol «${role.name}»`}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tabular-nums">{role.users_count ?? 0}</p>
                <p className="text-sm text-muted-foreground">usuarios con este rol</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </QueryBoundary>
    </div>
  );
}
