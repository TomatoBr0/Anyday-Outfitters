#!/usr/bin/env bash
# Spin up a throwaway Postgres, apply stubs + migration, run RLS tests.
set -euo pipefail
BIN=${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin | tail -1)}
DIR=$(mktemp -d)
PORT=${PORT:-54329}
trap '"$BIN/pg_ctl" -D "$DIR" stop -m immediate >/dev/null 2>&1 || true; rm -rf "$DIR"' EXIT
if [ "$(id -u)" = 0 ]; then RUN="su postgres -c"; chown -R postgres "$DIR"; else RUN="bash -c"; fi
$RUN "$BIN/initdb -D $DIR -U postgres -A trust >/dev/null"
$RUN "$BIN/pg_ctl -D $DIR -o '-p $PORT -k /tmp' -l $DIR/log start >/dev/null"
sleep 1
H=$(cd "$(dirname "$0")" && pwd)
P="psql -h /tmp -p $PORT -U postgres -v ON_ERROR_STOP=1 -q"
$P -c 'create database t'
$P -d t -f "$H/stubs.sql"
$P -d t -f "$H/../migrations/0001_social.sql"
$P -d t -f "$H/grants.sql"
$P -d t -t -A -o /dev/null -f "$H/rls_test.sql" 2>&1 | sed 's/^psql:[^ ]* NOTICE:  //'
