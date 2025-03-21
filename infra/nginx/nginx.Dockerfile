FROM nginx:latest

# generate ssl certificate
RUN openssl genrsa -out /etc/nginx/ssl/private.key 2048
RUN openssl req -new -key /etc/nginx/ssl/private.key -out /etc/nginx/ssl/certificate.csr -subj "/CN=localhost"
RUN openssl x509 -req -days 365 -in /etc/nginx/ssl/certificate.csr -signkey /etc/nginx/ssl/private.key -out /etc/nginx/ssl/certificate.crt

# copy the ssl certificate to the nginx configuration
COPY /etc/nginx/ssl/certificate.crt /etc/nginx/ssl/certificate.crt
COPY /etc/nginx/ssl/private.key /etc/nginx/ssl/private.key

# Copy the nginx configuration file
COPY ./conf/nginx.conf /etc/nginx/sites-available/default

# # Copy the static files
# COPY dist /usr/share/nginx/html

# Expose the port
EXPOSE 80
EXPOSE 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]