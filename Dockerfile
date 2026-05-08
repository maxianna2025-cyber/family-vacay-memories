FROM nginx:alpine

# Модуль ngx_http_sub_module уже встроен в nginx:alpine.
# Конфиг
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
