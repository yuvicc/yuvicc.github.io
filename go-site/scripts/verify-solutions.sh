#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../exercises"
export GOCACHE="${GOCACHE:-/tmp/go45-go-build}"
go test ./...
