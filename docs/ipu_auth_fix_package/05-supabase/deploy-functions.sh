#!/bin/bash
# Deploy de todas as Edge Functions do IPU Calculator

echo "🚀 Deployando Edge Functions..."

# Autenticação
echo "→ Auth"
supabase functions deploy auth-login
supabase functions deploy auth-logout
supabase functions deploy auth-validate

# Models
echo "→ Models"
supabase functions deploy models-sync
supabase functions deploy models-delete
supabase functions deploy models-get

# Admin
echo "→ Admin"
supabase functions deploy admin-users
supabase functions deploy admin-users-update
supabase functions deploy admin-logs
supabase functions deploy admin-metrics

echo "✅ Deploy concluído!"
