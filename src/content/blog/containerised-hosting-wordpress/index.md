---
title: 'WordPress'
description: >-
  Part 3 of a tutorial on setting up your own web hosting service with
  automation and security using Ubuntu, Docker, Traefik, Let's Encrypt and
  more!
timestamp: 2020-09-25 04:30:00+00:00
updatedTimestamp: 2021-04-27 12:00:33+00:00
series: Containerised Hosting
tags:
  - self-hosting
  - archive
toc: true
draft: false
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---
> [!WARNING]
> This post was restored from the wayback machine archive using LLMs and lightly
> reformatted for this site. A lot of this could be outdated or plain wrong.

Hello Everybody! Tansanrao here. Welcome to part 3 of the Containerised
Hosting series. Today we will be setting up WordPress to run as a separate
stack.

## Step 1 - Create a Docker Compose File

```yaml
version: "3.3"

services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    restart: unless-stopped
    env_file: .env
    environment:
      - MYSQL_DATABASE=wordpress
    volumes:
      - mysql:/var/lib/mysql
    command: "--default-authentication-plugin=mysql_native_password"
    networks:
      - private

  wordpress:
    depends_on:
      - mysql
    container_name: wordpress
    restart: unless-stopped
    image: wordpress:5.5.0-php7.4-apache
    env_file: .env
    environment:
      - WORDPRESS_DB_HOST=mysql:3306
      - WORDPRESS_DB_USER=$MYSQL_USER
      - WORDPRESS_DB_PASSWORD=$MYSQL_PASSWORD
      - WORDPRESS_DB_NAME=wordpress
    labels:
      - traefik.enable=true
      - traefik.http.middlewares.redirect-websecure.redirectscheme.scheme=https
      - traefik.http.routers.wordpress-web.rule=Host(`example.com`)
      - traefik.http.routers.wordpress-web.entrypoints=web
      - traefik.http.routers.wordpress-web.middlewares=redirect-websecure
      - traefik.http.routers.wordpress-websecure.entrypoints=websecure
      - traefik.http.routers.wordpress-websecure.rule=Host(`example.com`)
      - traefik.tags=traefik-public
      - traefik.docker.network=traefik-public
      - traefik.http.routers.wordpress-websecure.tls=true
      - traefik.http.routers.wordpress-websecure.tls.certresolver=myresolver
    volumes:
      - wordpress:/var/www/html/wp-content
      - ./upload.ini:/usr/local/etc/php/conf.d/uploads.ini
    networks:
      - private
      - traefik-public

volumes:
  wordpress:
  mysql:

networks:
  private:
    driver: bridge
  traefik-public:
    external: true
```

In the `docker-compose` file above, we are defining four major things: the
database, the WordPress install, persistent volumes for both, and networks for
the stack.

We first create the `mysql` service using the `mysql:8.0` image. We set the
container name, apply a restart policy to auto-restart the container unless it
is manually stopped, tell it to load environment variables from a file called
`.env`, and assign the persistent volume `mysql` as shown in
`mysql:/var/lib/mysql`. We also pass the command flag
`"--default-authentication-plugin=mysql_native_password"` to force MySQL 8.0 to
use the older password scheme for compatibility with MySQL 5 clients.

Similarly, we define the `wordpress` service. We attach the volume
`wordpress:/var/www/html/wp-content` to provide persistence for uploaded
content. We also pass in a custom `upload.ini` file to configure PHP like so:
`./upload.ini:/usr/local/etc/php/conf.d/uploads.ini`.

The Traefik labels attached are explained in part 2 of this series
[here](/blog/2020/09/containerised-hosting-management-infra/).

We then define the required volumes and networks at the end of the file.

## Step 2 - Create a `.env` File

Create a file called `.env` in the same directory as the `docker-compose`
file:

```bash
nano .env
```

Enter the following and make sure you change the passwords:

```ini
MYSQL_ROOT_PASSWORD=ghost
MYSQL_USER=ghost
MYSQL_PASSWORD=ghost
```

This file is used to pass environment variables without adding credentials to
the GitHub repository.

## Step 3 - Create `upload.ini` to Override PHP

Create a file called `upload.ini` in the same directory as the
`docker-compose` file:

```bash
nano upload.ini
```

Enter the following:

```ini
file_uploads = On
memory_limit = 512M
upload_max_filesize = 512M
post_max_size = 512M
max_execution_time = 600
```

This allows WordPress to accept file uploads up to 500 MB in size and allows
PHP execution to continue for 600 seconds before being killed.

And that's it!

```bash
docker-compose up -d
```

And you are good to go.

As always, you can refer to the repository
[here](https://github.com/tansanrao/containerised-hosting-tutorial) for the
entire structure and final state of each file.

Follow me on [Twitter](https://twitter.com/tansanrao) and
[Instagram](https://instagram.com/tansanrao) for behind-the-scenes updates.
