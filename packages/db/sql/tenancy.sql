-- Tenancy hardening (ADR-0003). Applied by `pnpm --filter @pyra/db harden`
-- after migrations, and safe to re-run: every statement is idempotent.
--
-- This is not a Drizzle migration because drizzle-kit does not model roles,
-- grants, or FORCE ROW LEVEL SECURITY. Keeping it as readable SQL that runs
-- after every migration means a table added tomorrow is covered by adding one
-- name to the array below, not by remembering to write a policy by hand.

-- Row-level security on every domain table.
--
-- FORCE matters: Postgres exempts a table's owner from its own policies unless
-- forced. Without it the isolation guarantee would hold for the runtime role
-- and quietly not hold for migrations, seeds, or integration tests.
do $$
declare
	domain_table text;
begin
	foreach domain_table in array array['audit_log'] loop
		if to_regclass(format('public.%I', domain_table)) is null then
			raise notice 'table %  does not exist yet; skipping', domain_table;
			continue;
		end if;

		execute format('alter table public.%I enable row level security', domain_table);
		execute format('alter table public.%I force row level security', domain_table);
		execute format('drop policy if exists department_isolation on public.%I', domain_table);

		-- `with check` is not optional. `using` alone governs what a tenant can
		-- read; without the check they could still write a row into another
		-- department. The `true` argument to current_setting makes an unset
		-- variable return NULL rather than raise, and NULL fails the comparison,
		-- so an unscoped connection sees nothing instead of everything.
		execute format(
			'create policy department_isolation on public.%I'
			' using (department_id = current_setting(''app.department_id'', true)::uuid)'
			' with check (department_id = current_setting(''app.department_id'', true)::uuid)',
			domain_table
		);
	end loop;
end
$$;

-- Grants for the non-owner runtime role, when it exists.
do $$
begin
	if not exists (select 1 from pg_roles where rolname = 'pyra_app') then
		raise notice 'role pyra_app does not exist; skipping grants. Set PYRA_APP_PASSWORD and re-run to create it.';
		return;
	end if;

	execute 'grant usage on schema public to pyra_app';
	execute 'grant select, insert, update, delete on all tables in schema public to pyra_app';
	execute 'grant usage, select on all sequences in schema public to pyra_app';
	execute 'alter default privileges in schema public grant select, insert, update, delete on tables to pyra_app';
	execute 'alter default privileges in schema public grant usage, select on sequences to pyra_app';

	-- PRD 6.4 wants an audit trail the application cannot rewrite. A grant is
	-- the only place that can actually say so; a policy cannot.
	if to_regclass('public.audit_log') is not null then
		execute 'revoke update, delete on public.audit_log from pyra_app';
	end if;

	-- pg-boss creates its own tables on start, which a non-owner cannot do in a
	-- schema it does not own. Its own schema keeps the queue working without
	-- granting CREATE on public.
	if to_regnamespace('pgboss') is null then
		execute 'create schema pgboss authorization pyra_app';
	else
		execute 'alter schema pgboss owner to pyra_app';
	end if;
end
$$;
