#!/bin/sh

# If BACKEND_URL is not set, warn or default
if [ -z "$BACKEND_URL" ]; then
    echo "WARNING: BACKEND_URL is not set. API calls may fail."
fi

# Substitute environment variables in nginx.conf.template and output to default.conf
# We only substitute $BACKEND_URL and $PORT
envsubst '${BACKEND_URL} ${PORT}' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf

echo "DEBUG: Nginx Configuration applied:"
cat /etc/nginx/conf.d/default.conf
echo "DEBUG: Content of /usr/share/nginx/html:"
echo "DEBUG: Checking permissions path..."
ls -ld /usr
ls -ld /usr/share
ls -ld /usr/share/nginx
ls -ld /usr/share/nginx/html
echo "DEBUG: Content of /usr/share/nginx/html/index.html:"
cat /usr/share/nginx/html/index.html
echo "DEBUG: End content"

# Execute the CMD (nginx)
exec "$@"
