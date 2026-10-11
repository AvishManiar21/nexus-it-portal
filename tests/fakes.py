"""In-memory stand-ins for the Supabase client and the asyncpg pool, for endpoint tests."""
from __future__ import annotations

import itertools
from contextlib import asynccontextmanager
from typing import Any, Callable


class _Result:
    def __init__(self, data):
        self.data = data


class FakeQuery:
    """Supports the query-builder calls the app uses. Filters apply to select/update; writes are recorded."""

    def __init__(self, db: "FakeSupabase", table: str):
        self.db, self.table = db, table
        self.op, self.payload, self.filters = "select", None, []
        self.order_by: tuple[str, bool] | None = None
        self.limit_n: int | None = None
        self.or_filter: str | None = None

    # reads
    def select(self, *_args, **_kwargs):
        return self

    def eq(self, key, value):
        self.filters.append(lambda r: r.get(key) == value)
        return self

    def is_(self, key, value):
        self.filters.append(lambda r: r.get(key) is None if value == "null" else r.get(key) == value)
        return self

    def order(self, column, desc=False):
        self.order_by = (column, desc)
        return self

    def limit(self, n):
        self.limit_n = n
        return self

    def or_(self, expression):
        self.or_filter = expression
        self.db.calls.append(("or_", self.table, expression))
        return self

    # writes
    def insert(self, payload):
        self.op, self.payload = "insert", payload
        return self

    def upsert(self, payload, on_conflict=None):
        self.op, self.payload = "upsert", payload
        return self

    def update(self, payload):
        self.op, self.payload = "update", payload
        return self

    def execute(self):
        if self.db.fail_on.get(self.table):
            raise RuntimeError(f"simulated failure on {self.table}")
        rows = self.db.tables.setdefault(self.table, [])
        if self.op in ("insert", "upsert"):
            row = {"id": next(self.db.ids), "created_at": "2026-10-11T00:00:00+00:00", **self.payload}
            self.db.calls.append((self.op, self.table, self.payload))
            if not self.db.empty_writes.get(self.table):
                rows.append(row)
                return _Result([row])
            return _Result([])
        matched = [r for r in rows if all(f(r) for f in self.filters)]
        if self.op == "update":
            self.db.calls.append(("update", self.table, self.payload))
            for r in matched:
                r.update(self.payload)
            return _Result(matched)
        if self.order_by:
            col, desc = self.order_by
            matched = sorted(matched, key=lambda r: r.get(col) or "", reverse=desc)
        if self.limit_n is not None:
            matched = matched[: self.limit_n]
        return _Result(matched)


class FakeSupabase:
    def __init__(self, tables: dict[str, list[dict]] | None = None):
        self.tables = {k: [dict(r) for r in v] for k, v in (tables or {}).items()}
        self.calls: list[tuple] = []
        self.ids = itertools.count(1000)
        self.fail_on: dict[str, bool] = {}       # table -> raise on execute
        self.empty_writes: dict[str, bool] = {}  # table -> writes return no rows

    def table(self, name: str) -> FakeQuery:
        return FakeQuery(self, name)

    def writes(self, op: str, table: str) -> list[dict]:
        return [payload for (o, t, payload) in self.calls if o == op and t == table]


class FakeConn:
    """asyncpg connection stand-in: answers queries via a handler(sql, args)."""

    def __init__(self, handler: Callable[[str, tuple], Any]):
        self.handler = handler

    async def fetchval(self, sql, *args):
        return self.handler(sql, args)

    async def fetchrow(self, sql, *args):
        return self.handler(sql, args)

    async def fetch(self, sql, *args):
        return self.handler(sql, args)


class FakePool:
    def __init__(self, handler: Callable[[str, tuple], Any]):
        self.handler = handler

    @asynccontextmanager
    async def acquire(self):
        yield FakeConn(self.handler)
