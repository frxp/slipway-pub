FROM composer:2 AS vendor
WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

FROM php:8.5-cli-alpine
WORKDIR /app
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY --from=vendor /app/vendor ./vendor
COPY . .
RUN composer dump-autoload --optimize --no-dev --no-interaction \
    && cp -n .env.example .env \
    && mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && touch database/database.sqlite
EXPOSE 8000
CMD ["sh", "-c", "php artisan key:generate --force && php artisan migrate --force && php artisan serve --host=0.0.0.0 --port=8000"]
