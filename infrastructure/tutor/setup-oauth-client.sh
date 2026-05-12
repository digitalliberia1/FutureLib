#!/usr/bin/env bash
# Creates the FutureLib OAuth2 application inside Open edX (via Tutor).
# Run once after `tutor local launch` completes.
#
# Usage:
#   chmod +x infrastructure/tutor/setup-oauth-client.sh
#   OPENEDX_CLIENT_SECRET=your-secret ./infrastructure/tutor/setup-oauth-client.sh

set -euo pipefail

CLIENT_ID="${OPENEDX_CLIENT_ID:-futurelib-client}"
CLIENT_SECRET="${OPENEDX_CLIENT_SECRET:?OPENEDX_CLIENT_SECRET must be set}"
REDIRECT_URI="${OPENEDX_REDIRECT_URI:-https://futurelib.gov.lr/auth/openedx/callback}"

echo "→ Creating OAuth2 application in Open edX LMS..."

tutor local run lms python manage.py lms shell -c "
from oauth2_provider.models import Application
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.filter(is_superuser=True).first()
app, created = Application.objects.get_or_create(
    client_id='${CLIENT_ID}',
    defaults={
        'user': admin,
        'client_secret': '${CLIENT_SECRET}',
        'client_type': 'confidential',
        'authorization_grant_type': 'client-credentials',
        'name': 'FutureLib Integration',
        'redirect_uris': '${REDIRECT_URI}',
        'skip_authorization': True,
    }
)
print('Created:', created, '| Client ID:', app.client_id)
"

echo "→ Granting scopes to FutureLib client..."
tutor local run lms python manage.py lms shell -c "
from edx_django_utils.oauth import create_dot_application
# Trust the application for server-to-server API calls
from oauth2_provider.models import Application, Grant
app = Application.objects.get(client_id='${CLIENT_ID}')
app.skip_authorization = True
app.save()
print('Trust granted to:', app.client_id)
"

echo "✓ FutureLib OAuth2 client configured successfully."
echo "  Client ID:     ${CLIENT_ID}"
echo "  Redirect URI:  ${REDIRECT_URI}"
