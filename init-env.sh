#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file with default values..."
    
    # Create .env file with default values
    cat > .env << EOL
AUTH_PORT=8081
CHAT_PORT=8083
MATCH_PORT=8082
DB_PATH=/app/db/auth.db
CHAT_DB_PATH=/app/db/chat.db
MATCH_DB_PATH=/app/db/match.db
SECRET=your-secret-key-here
COOKIE_SECRET=your-cookie-secret-here
REFRESH_SECRET=your-refresh-secret-here
GOOGLE_PASS=your-google-pass-here
INFOBIP_ID=your-infobip-id-here
INFOBIP_TOKEN=your-infobip-token-here
INFOBIP_SENDER=your-infobip-sender-here
SSL_KEY_PATH=/app/certs/server.key
SSL_CERT_PATH=/app/certs/server.crt
GOOGLE_ID=your-google-client-id-here
GOOGLE_SECRET=your-google-client-secret-here
FRONTEND=https://localhost:3000
DATABASE_URL="file:/app/db/auth.db"
CHAT_DATABASE_URL="file:/app/db/chat.db"
MATCH_DATABASE_URL="file:/app/db/match.db"
UPLOAD_DIR="/app/uploads"
NODE_ENV=development
EOL

    echo ".env file created successfully!"
    echo "Please update the sensitive values in the .env file with your actual credentials."
else
    echo ".env file already exists. No changes made."
fi 