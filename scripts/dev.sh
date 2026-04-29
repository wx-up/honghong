#!/bin/bash
set -Eeuo pipefail


PORT="${PORT:-5001}"
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
DEPLOY_RUN_PORT="${PORT}"


cd "${COZE_WORKSPACE_PATH}"

# macOS 通常没有可用的 `ss`，用 `lsof` 才能正确发现占用（否则会出现“显示空闲但 listen 报 EADDRINUSE”）。
list_pids_listening_on_port() {
    local port="$1"
    if command -v lsof >/dev/null 2>&1; then
        lsof -nP -tiTCP:"${port}" -sTCP:LISTEN 2>/dev/null | sort -u
    elif command -v ss >/dev/null 2>&1; then
        ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | sort -u
    else
        echo "Warning: neither lsof nor ss found; cannot check port ${port}" >&2
    fi
}

kill_port_if_listening() {
    local pids_line
    if ! list_pids_listening_on_port "${DEPLOY_RUN_PORT}" | grep -q .; then
      echo "Port ${DEPLOY_RUN_PORT} is free."
      return
    fi
    pids_line="$(list_pids_listening_on_port "${DEPLOY_RUN_PORT}" | paste -sd' ' -)"
    echo "Port ${DEPLOY_RUN_PORT} in use by PIDs: ${pids_line} (SIGKILL)"
    while read -r pid; do
      [[ -z "${pid}" ]] && continue
      kill -9 "${pid}" 2>/dev/null || true
    done < <(list_pids_listening_on_port "${DEPLOY_RUN_PORT}")
    sleep 1
    if list_pids_listening_on_port "${DEPLOY_RUN_PORT}" | grep -q .; then
      pids_line="$(list_pids_listening_on_port "${DEPLOY_RUN_PORT}" | paste -sd' ' -)"
      echo "Warning: port ${DEPLOY_RUN_PORT} still busy after SIGKILL, PIDs: ${pids_line}"
      echo "Hint: pick another free port, e.g. PORT=3000 pnpm dev" >&2
    else
      echo "Port ${DEPLOY_RUN_PORT} cleared."
    fi
}

echo "Clearing port ${PORT} before start."
kill_port_if_listening
echo "Starting HTTP service on port ${PORT} for dev..."

PORT=$PORT pnpm tsx watch src/server.ts
