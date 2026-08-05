#!/bin/bash
# Deploy Edge Functions com flags corretas de JWT verification
#
# Uso:
#   ./deploy-edge-functions.sh              # deploy todas as funções
#   ./deploy-edge-functions.sh auth-login   # deploy apenas auth-login
#   ./deploy-edge-functions.sh models-sync models-get  # deploy funções específicas
#
# Flags:
#   auth-login: --no-verify-jwt (única função pública — recebe credenciais, devolve token)
#   todas as outras: --verify-jwt (default — exige JWT válido)

set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-uqihnpwpcrujqycbuzxv}"

# Funções que exigem --no-verify-jwt (públicas)
NO_JWT_FUNCTIONS=("auth-login")

# Funções que usam --verify-jwt (default, autenticadas)
AUTH_FUNCTIONS=(
  "auth-logout"
  "auth-validate"
  "auth-refresh"
  "models-get"
  "models-sync"
  "models-delete"
  "admin-users"
  "admin-users-update"
  "admin-logs"
  "admin-metrics"
)

# Determina quais funções deployar
if [ $# -eq 0 ]; then
  # Deploy todas
  DEPLOY_NO_JWT=("${NO_JWT_FUNCTIONS[@]}")
  DEPLOY_AUTH=("${AUTH_FUNCTIONS[@]}")
else
  # Deploy apenas as especificadas
  DEPLOY_NO_JWT=()
  DEPLOY_AUTH=()
  for fn in "$@"; do
    if [[ " ${NO_JWT_FUNCTIONS[*]} " =~ " ${fn} " ]]; then
      DEPLOY_NO_JWT+=("$fn")
    else
      DEPLOY_AUTH+=("$fn")
    fi
  done
fi

echo "=== Deploy Edge Functions ==="
echo "Project: $PROJECT_REF"
echo ""

# Deploy funções sem JWT verification
for fn in "${DEPLOY_NO_JWT[@]}"; do
  echo "→ Deploying $fn (--no-verify-jwt)..."
  npx supabase functions deploy "$fn" --project-ref "$PROJECT_REF" --no-verify-jwt
  echo "  ✅ $fn deployed"
done

# Deploy funções com JWT verification (default)
for fn in "${DEPLOY_AUTH[@]}"; do
  echo "→ Deploying $fn (--verify-jwt)..."
  npx supabase functions deploy "$fn" --project-ref "$PROJECT_REF"
  echo "  ✅ $fn deployed"
done

echo ""
echo "=== Deploy complete ==="

# Validação pós-deploy
if [ ${#DEPLOY_NO_JWT[@]} -gt 0 ]; then
  echo ""
  echo "Validando auth-login (deve retornar INVALID_CREDENTIALS sem Authorization header)..."
  AUTH_LOGIN_URL="https://${PROJECT_REF}.supabase.co/functions/v1/auth-login"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$AUTH_LOGIN_URL" \
    -H "Content-Type: application/json" \
    -H "apikey: ${SUPABASE_ANON_KEY:-placeholder}" \
    -d '{"email":"test@test.com","password":"wrong"}')

  if [ "$HTTP_CODE" = "401" ]; then
    echo "  ✅ auth-login returns 401 (INVALID_CREDENTIALS) — correct"
  else
    echo "  ⚠️  auth-login returned $HTTP_CODE — expected 401"
    echo "  → If 401 with UNAUTHORIZED_NO_AUTH_HEADER, --no-verify-jwt was not applied"
  fi
fi
