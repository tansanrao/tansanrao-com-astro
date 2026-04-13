---
title: 'Nextcloud on Kubernetes with S3 as Primary Storage'
description: >-
  A guide to setting up Nextcloud on Kubernetes with S3 as a storage backend,
  entirely on-premise using MicroK8s and Minio.
timestamp: 2021-05-07 14:30:00+00:00
updatedTimestamp: 2021-05-13 11:13:52+00:00
series: Home Lab
tags:
  - kubernetes
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

This guide is going to walk you through setting up Nextcloud with an S3 backend
on Kubernetes. In this example, I will be using MicroK8s and Minio for
self-hosted S3. If you do not already have a Kubernetes cluster set up, get
one from a cloud provider. If you would like to set up your own bare-metal
cluster, you can refer to my single-node MicroK8s guide
[here](/blog/2021/04/home-lab-infrastructure/), or the multi-node HA cluster
guide using kubeadm
[here](/blog/2020/09/kubernetes-ha-cluster-with-kubeadm/).

## Configure DNS

We begin by adding an `A` record for a subdomain pointing back to our ingress
IP address. This would be your `LoadBalancer` public IP if you are hosted in
the cloud, or if you are hosted at home behind NAT, you would point the
subdomain to your public IP. The exact steps for this would vary between
providers, so I would suggest checking out the documentation or guides provided
by your DNS provider.

For this guide, I will be using `drive.example.com`.

## Deployment in Kubernetes

On your client machine, make sure you have _Helm_ installed and are connected
to your Kubernetes cluster.

### Add the Helm Repository

Add the Nextcloud Helm repo and update your charts.

```bash
helm repo add nextcloud https://nextcloud.github.io/helm/
helm repo update
```

### Prepare `values.yaml`

Create a `values.yaml` file with `nano values.yaml`.

Paste the sections below into the `values.yaml` file one below the other.
Change values as needed.

#### Cronjob

This is the configuration for the Kubernetes cronjob. This is used to `curl`
the cron endpoint every 5 minutes to run background tasks. I would suggest
running this every minute if your Nextcloud server is going to have a lot of
load.

```yaml
cronjob:
  annotations: {}
  curlInsecure: false
  enabled: true
  failedJobsHistoryLimit: 5
  image: {}
  schedule: '*/5 * * * *'
  successfulJobsHistoryLimit: 2
```

#### Disable HPA

Since `HorizontalPodAutoscaler` requires a `ReadWriteMany` persistent volume,
and I do not have it available on my cluster, I will be disabling HPA.

If your usage is under 10 concurrent users, you should be fine with 1 pod and
all the other defaults listed in this guide.

```yaml
hpa:
  enabled: false
```

#### Image

The official chart as of this post still uses `nextcloud-19`, so we will be
updating the image to the latest stable tag available.

```yaml
image:
  repository: nextcloud
  tag: 20.0.9-apache
  pullPolicy: IfNotPresent
```

#### Database

We have 3 options for the database: an internal DB powered by SQLite, MariaDB,
and PostgreSQL. I prefer MariaDB, so I will be enabling that and disabling the
other two.

```yaml
internalDatabase:
  enabled: false
mariadb:
  db:
    name: nextcloud
    password: db-password
    user: nextcloud
  enabled: true
  master:
    persistence:
      accessMode: ReadWriteOnce
      enabled: true
      size: 8Gi
  replication:
    enabled: false
  rootUser:
    password: root-db-password
    forcePassword: true
postgresql:
  enabled: false
```

#### Metrics

This is optional. Only enable this if you want to be able to monitor metrics
with Prometheus.

```yaml
metrics:
  enabled: true
```

#### Nextcloud Config Files

We can add custom `config.php` files to the Nextcloud install here, and these
will be merged and used.

```yaml
nextcloud:
  configs:
    custom.config.php: |-
      <?php
      $CONFIG = array (
        'overwriteprotocol' => 'https',
        'overwrite.cli.url' => 'https://drive.example.com',
        'filelocking.enabled' => 'true',
        'loglevel' => '2',
        'enable_previews' => true,
        'trusted_domains' =>
           [
            'nextcloud',
            'drive.example.com'
           ]
      );
```

In this config file, I will be setting the `overwriteprotocol` and
`overwrite.cli.url` keys to HTTPS and the DNS name `drive.example.com`.

`filelocking.enabled` enables file locking to prevent issues when multiple
clients are accessing or updating the same file.

#### Redis Config

This config file is for Redis caching. This improves performance by a lot and I
would highly recommend leaving this section as it is.

```yaml
    redis.config.php: |-
      <?php
      $CONFIG = array (
        'memcache.local' => '\\OC\\Memcache\\Redis',
        'memcache.distributed' => '\OC\Memcache\Redis',
        'memcache.locking' => '\OC\Memcache\Redis',
        'redis' => array(
          'host' => getenv('REDIS_HOST'),
          'port' => getenv('REDIS_HOST_PORT') ?: 6379,
          'password' => getenv('REDIS_HOST_PASSWORD')
        )
      );
```

This overrides the default config so that it takes the Redis password into
account. The Helm chart installs Redis without a password by default, and that
has caused authentication problems in the past.

#### S3 Config

The last custom config file is for the S3 configuration.

```yaml
    s3.config.php: |-
      <?php
      $CONFIG = array (
        'objectstore' => array(
          'class' => '\\OC\\Files\\ObjectStore\\S3',
          'arguments' => array(
            'bucket'     => 'bucket-name',
            'autocreate' => true,
            'key'        => 's3-access-key',
            'secret'     => 's3-secret-key',
            'region'     => 's3-region',
            'hostname'   => 's3-endpoint',
            'use_ssl'    => true,
            'use_path_style' => true
          )
        )
      );
```

Minio uses path-style accessing of buckets, so I have set `use_path_style` to
`true`. If you are using AWS S3, Wasabi, or something else that allows you to
access a bucket by the DNS name, set this to `false`. Fill in all the other
details as per your S3 provider.

#### Default Configs

Here we disable the Redis config since we are overriding it above.

```yaml
  defaultConfigs:
    .htaccess: true
    apache-pretty-urls.config.php: true
    apcu.config.php: true
    apps.config.php: true
    autoconfig.php: false
    redis.config.php: false
    smtp.config.php: true
```

#### Hostname and Admin User

Here we specify the hostname and username/password for the admin user.

```yaml
  host: drive.example.com
  password: admin-password
  username: admin-user
```

#### Email Settings

Here you can configure any SMTP service to send email. This is useful as it
allows Nextcloud to send notifications and password reset functionality via
email.

```yaml
  mail:
    domain: domain.com
    enabled: false
    fromAddress: user
    smtp:
      authtype: LOGIN
      host: domain.com
      name: user
      password: pass
      port: 465
      secure: ssl
```

#### Persistence

This persistence config is for Nextcloud itself. The user data is stored in S3,
but Nextcloud still stores other data here.

```yaml
persistence:
  accessMode: ReadWriteOnce
  annotations: {}
  enabled: true
  size: 8Gi
```

#### Redis Deployment

Here we configure the Helm chart to set up Redis with a password.

```yaml
redis:
  enabled: true
  password: 'redis-password'
  usePassword: true
```

#### Replica Count

If you have decided to leave HPA off, add this line to make sure the deployment
is configured with 1 replica only.

```yaml
replicaCount: 1
```

### Installation

Finally, to install Nextcloud, MariaDB, and Redis, create a namespace with
`kubectl` and use Helm to create a release.

```bash
kubectl create ns nextcloud

helm upgrade --install --namespace nextcloud -f your-values.yaml nextcloud nextcloud/nextcloud
```

You will see output like below:

```bash
Release "nextcloud" has been upgraded. Happy Helming!
NAME: nextcloud
LAST DEPLOYED: Fri Apr 23 15:08:35 2021
NAMESPACE: nextcloud
STATUS: deployed
```

### Traefik IngressRoute

Since my cluster is configured to use Traefik Proxy for ingress, which I highly
recommend, I will be creating an `IngressRoute` for Nextcloud.

For more information on how to set up Traefik, refer to my previous post
[here](/blog/2020/09/guide-storage-ingress-webui-k8s/).

Create a YAML file using `nano nextcloud-ingress.yaml`.

Paste the following in it:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: nextcloud-web
spec:
  entryPoints:
    - web
  routes:
    - kind: Rule
      match: Host(`drive.example.com`) && PathPrefix(`/`)
      services:
        - name: nextcloud
          namespace: nextcloud
          port: 8080
---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: nextcloud-websecure
spec:
  entryPoints:
    - websecure
  routes:
    - kind: Rule
      match: Host(`drive.example.com`) && PathPrefix(`/`)
      services:
        - name: nextcloud
          namespace: nextcloud
          port: 8080
  tls:
    certResolver: dns-le
```

Apply the `IngressRoute` using:

```bash
kubectl apply -f nextcloud-ingress.yaml -n nextcloud
```
