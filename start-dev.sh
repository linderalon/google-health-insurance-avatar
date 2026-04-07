#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start-dev.sh — start all three healthcare demo services
#
# Usage:
#   chmod +x start-dev.sh
#   ./start-dev.sh
#
# Services started:
#   1. Python ADK agent server   → http://localhost:8000
#   2. Express backend           → http://localhost:3001
#   3. React Vite dev server     → https://localhost:5173  (HTTPS required for WebRTC)
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ─── Colour output ────────────────────────────────────────────────────────────
RED='\033[0;31m'; YELLOW='\033[0;33m'; GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

header()  { echo -e "\n${CYAN}▶ $*${NC}"; }
ok()      { echo -e "  ${GREEN}✓${NC} $*"; }
warn()    { echo -e "  ${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "  ${RED}✗${NC} $*"; }

# ─────────────────────────────────────────────────────────────────────────────
# NETWORK PREREQUISITES — IMPORTANT FOR DEPLOYMENT TEAMS
# ─────────────────────────────────────────────────────────────────────────────
header "Network prerequisites for Kaltura Avatar WebRTC"
echo
echo "  The Kaltura Avatar SDK uses WebRTC which requires STUN/TURN servers."
echo "  If you are behind a corporate firewall or strict NAT, ensure the"
echo "  following rules are in place BEFORE running this demo:"
echo
echo "  ┌──────────────────────────────────────────────────────────────────┐"
echo "  │  KALTURA TURN SERVER IP RANGE (whitelist ALL IPs in this block)  │"
echo "  │                                                                    │"
echo "  │    IP range :  3.41.177.176/29                                     │"
echo "  │    (covers  :  3.41.177.176 – 3.41.177.183)                       │"
echo "  │                                                                    │"
echo "  │  Required ports:                                                   │"
echo "  │    UDP  443    STUN/TURN over UDP (preferred for media)            │"
echo "  │    TCP  443    STUN/TURN over TLS (fallback through proxies)       │"
echo "  │    UDP   80    STUN/TURN over UDP (alternative port)               │"
echo "  │    TCP   80    STUN/TURN over TCP (alternative port)               │"
echo "  │                                                                    │"
echo "  │  Both inbound AND outbound traffic must be allowed.                │"
echo "  └──────────────────────────────────────────────────────────────────┘"
echo
echo "  Additionally, the Kaltura API endpoint must be reachable:"
echo "    https://api.avatar.us.kaltura.ai  (port 443, outbound)"
echo
warn "Skipping this step is the most common cause of WebRTC connection failures."
echo

# ─────────────────────────────────────────────────────────────────────────────
# HTTPS NOTE
# ─────────────────────────────────────────────────────────────────────────────
header "HTTPS requirement"
echo
echo "  WebRTC requires a Secure Context (HTTPS or localhost)."
echo "  • Local dev  → Vite uses a self-signed certificate (accept once in browser)."
echo "  • Production → Use a valid TLS certificate (Let's Encrypt, ACM, etc.)."
echo

# ─────────────────────────────────────────────────────────────────────────────
# ENV FILE CHECKS
# ─────────────────────────────────────────────────────────────────────────────
header "Checking environment files"

if [[ ! -f "$SCRIPT_DIR/backend/.env" ]]; then
  error "backend/.env not found."
  echo "     Copy backend/.env.example → backend/.env and fill in KALTURA_KS."
  exit 1
fi
ok "backend/.env found"

if [[ ! -f "$SCRIPT_DIR/backend/agent/.env" ]]; then
  error "backend/agent/.env not found."
  echo "     Copy backend/agent/.env.example → backend/agent/.env and set GOOGLE_API_KEY."
  exit 1
fi
ok "backend/agent/.env found"

# ─────────────────────────────────────────────────────────────────────────────
# DEPENDENCY CHECKS
# ─────────────────────────────────────────────────────────────────────────────
header "Checking dependencies"

command -v uv >/dev/null 2>&1 || {
  error "'uv' not found. Install it: curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
}
ok "uv found: $(uv --version)"

command -v node >/dev/null 2>&1 || { error "Node.js not found."; exit 1; }
NODE_VER=$(node -e "process.stdout.write(process.version)")
ok "Node.js $NODE_VER"

# ─────────────────────────────────────────────────────────────────────────────
# START SERVICES
# ─────────────────────────────────────────────────────────────────────────────
header "Starting services"

# 1. ADK agent server
echo "  Starting Python ADK agent server on :8000 …"
export PATH="$HOME/.local/bin:$PATH"
"$SCRIPT_DIR/backend/agent/.venv/bin/adk" api_server \
  --auto_create_session \
  --enable_features PROGRESSIVE_SSE_STREAMING \
  "$SCRIPT_DIR/backend" \
  > /tmp/adk_server.log 2>&1 &
ADK_PID=$!
ok "ADK PID $ADK_PID  (logs: /tmp/adk_server.log)"

sleep 3

# 2. Express backend (NODE_EXTRA_CA_CERTS ensures Node trusts Zscaler-intercepted TLS)
echo "  Starting Express backend on :3001 …"
cd "$SCRIPT_DIR/backend"
NODE_EXTRA_CA_CERTS="$SCRIPT_DIR/backend/certs/ca-bundle.pem" node server.js > /tmp/express_server.log 2>&1 &
EXPRESS_PID=$!
ok "Express PID $EXPRESS_PID  (logs: /tmp/express_server.log)"

sleep 1

# 3. Vite frontend (HTTPS)
echo "  Starting React Vite dev server on :5173 (HTTPS) …"
cd "$SCRIPT_DIR/frontend"
npx vite > /tmp/vite_server.log 2>&1 &
VITE_PID=$!
ok "Vite PID $VITE_PID  (logs: /tmp/vite_server.log)"

sleep 3

# ─────────────────────────────────────────────────────────────────────────────
# DONE
# ─────────────────────────────────────────────────────────────────────────────
header "All services started"
echo
echo "  App URL  : https://localhost:5173"
echo "  Backend  : http://localhost:3001/health"
echo "  ADK      : http://localhost:8000/list-apps"
echo
echo -e "  ${YELLOW}First run:${NC} accept the self-signed certificate warning in your browser"
echo "  (click Advanced → Proceed to localhost)."
echo
echo "  To stop all services:"
echo "    kill $ADK_PID $EXPRESS_PID $VITE_PID"
echo
echo "  Press Ctrl+C to stop watching logs (services continue in background)."
echo

# Tail all logs
trap "echo; echo 'Logs closed. Services still running.'" INT
tail -f /tmp/adk_server.log /tmp/express_server.log /tmp/vite_server.log
