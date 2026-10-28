#!/usr/bin/env bash
#
# Trigger a Render deploy for the "lanterns" web service and watch it finish.
#
#   source ~/.zshrc     # provides RENDER_API_KEY
#   ./deploy.sh         # deploy the service's linked branch (origin/main)
#   ./deploy.sh status  # just print the latest deploy status
#
# The API key is read from the environment: it is never echoed, logged or
# written to any file. Nothing else in the repo is modified.

set -euo pipefail

API="https://api.render.com/v1"
export SERVICE_NAME="${SERVICE_NAME:-lanterns}"
POLL_SECONDS="${POLL_SECONDS:-10}"
MAX_POLLS="${MAX_POLLS:-90}"

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "RENDER_API_KEY is not set - source your .zshrc first." >&2
  exit 1
fi

auth=(-H "Authorization: Bearer ${RENDER_API_KEY}")

owner_id=$(curl -fsS "${auth[@]}" "$API/owners" |
  python3 -c 'import json, sys; print(json.load(sys.stdin)[0]["owner"]["id"])')

# The list endpoint returns [{cursor, service:{...}}, ...].
service_id=$(curl -fsS "${auth[@]}" "$API/services?limit=100" | python3 -c '
import json, os, sys
name = os.environ["SERVICE_NAME"]
for item in json.load(sys.stdin):
    service = item.get("service", item)
    if service.get("name") == name:
        print(service["id"])
        break
')

if [ -z "$service_id" ]; then
  echo "No Render service named \"$SERVICE_NAME\" found in this workspace." >&2
  exit 1
fi

echo "Service: $SERVICE_NAME ($service_id)"

if [ "${1:-}" = "status" ]; then
  curl -fsS "${auth[@]}" "$API/services/$service_id/deploys?limit=1" |
    python3 -c '
import json, sys
items = json.load(sys.stdin)
deploy = (items[0].get("deploy", items[0]) if items else {})
print("latest deploy: {} - {}".format(deploy.get("id", "none"), deploy.get("status", "unknown")))'
  exit 0
fi

# Trigger a deploy. Deliberately no curl -f here: on an API error the response
# body (which explains why) would be swallowed before we can print it.
post_body=$(curl -sS "${auth[@]}" \
  -X POST -H "Content-Type: application/json" -d '{"clear_cache": false}' \
  -w $'\n%{http_code}' "$API/services/$service_id/deploys") || {
  echo "Could not reach the Render API." >&2
  exit 1
}
http_code=$(printf '%s' "$post_body" | tail -n1)
json=$(printf '%s' "$post_body" | sed '$d')
if [ "$http_code" != "201" ] && [ "$http_code" != "202" ]; then
  echo "Render API error (HTTP $http_code): $json" >&2
  exit 1
fi
deploy_id=$(printf '%s' "$json" |
  python3 -c 'import json, sys; print(json.load(sys.stdin)["id"])')

echo "Deploy: $deploy_id (checking every ${POLL_SECONDS}s, up to $MAX_POLLS times)"

for _ in $(seq 1 "$MAX_POLLS"); do
  status=$(curl -fsS "${auth[@]}" "$API/services/$service_id/deploys/$deploy_id" |
    python3 -c 'import json, sys; print(json.load(sys.stdin)["status"])')
  echo "  status: $status"
  case "$status" in
    live)
      echo "Deploy is live."
      exit 0
      ;;
    build_failed | update_failed | canceled | deprovisioned)
      echo "Deploy ended: $status - last build log lines:" >&2
      curl -fsS "${auth[@]}" "$API/logs?resource=$service_id&ownerId=$owner_id&limit=40" |
        python3 -c '
import json, sys
for line in reversed(json.load(sys.stdin).get("logs", [])):
    print(line["message"])' >&2 || true
      exit 1
      ;;
  esac
  sleep "$POLL_SECONDS"
done

echo "Timed out waiting for the deploy; check the Render dashboard." >&2
exit 1
