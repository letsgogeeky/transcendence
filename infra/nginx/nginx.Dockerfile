FROM nginx:latest

# Generate a self-signed SSL certificate
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/nginx-selfsigned.key \
    -out /etc/ssl/certs/nginx-selfsigned.crt \
    -subj "/C=DE/ST=Baden-Wuttemberg/L=Heilbronn/O=OrcaPong/OU=Amazing/CN=localhost"


RUN cp /etc/ssl/certs/nginx-selfsigned.crt /usr/local/share/ca-certificates/nginx-selfsigned.crt

# Copy the nginx configuration file
# COPY ./conf/nginx.conf /etc/nginx/sites-available/default

# # Copy the static files
# COPY dist /usr/share/nginx/html

# Expose the port
EXPOSE 80
EXPOSE 443

# Start nginx
CMD ["nginx", "-g", "daemon off;"]