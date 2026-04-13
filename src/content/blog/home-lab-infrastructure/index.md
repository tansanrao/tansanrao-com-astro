---
title: 'Infrastructure'
description: >-
  A guide to setting up a homelab for Kubernetes using HAProxy, MicroK8s,
  MetalLB, and Traefik on a single ESXi node.
timestamp: 2021-04-29 05:22:04+00:00
updatedTimestamp: 2021-05-13 11:13:39+00:00
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

My home lab setup consists of a compute node running ESXi and a NAS running
TrueNAS 12 providing SMB/CIFS shares and S3 services. The ESXi node currently
runs 3 Ubuntu VMs, an Nginx reverse-proxy VM, a Plex server, and a Nextcloud
instance.

Today we will be replacing the Nginx VM with HAProxy and the Nextcloud
instance with a MicroK8s instance. The Nextcloud instance will be moved onto
Kubernetes to provide uniformity across all the clusters I have to administer.
The exact process of deploying Nextcloud on Kubernetes will be covered in a
later post.

This post will cover the process of installing and configuring HAProxy,
MicroK8s, MetalLB for software load balancing, and Traefik for ingress into
MicroK8s.

## Building Out the VMs

### HAProxy VM

The HAProxy VM is going to run Ubuntu 20.04 LTS with 1 vCPU and 1 GB of RAM.
These resources are more than sufficient for the amount of load this system is
going to be experiencing at any time.

#### Installing HAProxy

We start by updating Ubuntu:

```bash
sudo apt update && sudo apt upgrade
```

A reboot may be necessary in the case of kernel or firmware updates, so if
required, please reboot the system before proceeding.

```bash
sudo reboot
```

Install HAProxy from the Ubuntu repositories using APT:

```bash
sudo apt install haproxy
```

Done!

#### Configuring HAProxy

Edit the HAProxy config file using your favourite text editor. I will be using
`nano`.

```bash
sudo nano /etc/haproxy/haproxy.cfg
```

My defaults look like this:

```text
defaults
        log     global
        mode    tcp
        option  dontlog-normal
        option  tcpka
        retries 3
        timeout connect 5000
        timeout client  50000
        timeout server  50000
        errorfile 400 /etc/haproxy/errors/400.http
        errorfile 403 /etc/haproxy/errors/403.http
        errorfile 408 /etc/haproxy/errors/408.http
        errorfile 500 /etc/haproxy/errors/500.http
        errorfile 502 /etc/haproxy/errors/502.http
        errorfile 503 /etc/haproxy/errors/503.http
        errorfile 504 /etc/haproxy/errors/504.http
```

My frontends are a little different. I have Plex and Minio hosted on other VMs
and servers, so I need to provide HTTPS termination for those hosts. The rest
of the traffic is passed through straight to Traefik and the Kubernetes API
server for termination and handling.

```text
frontend http
        mode http
        bind :::80 v4v6
        default_backend traefik_http

frontend https
        bind :::443 v4v6
        acl host_plex req_ssl_sni -i plex.example.com
        acl host_s3 req_ssl_sni -i s3.example.com
        # use tcp content accepts to detects ssl client and server hello.
        tcp-request inspect-delay 5s
        tcp-request content accept if { req_ssl_hello_type 1 }
        use_backend tcp_to_https if host_plex
        use_backend tcp_to_https if host_s3
        default_backend traefik_https

frontend https_termination
        mode http
        bind :::8443 v4v6 ssl crt /etc/haproxy/certs/
        acl host_plex hdr(host) -i plex.example.com
        use_backend plex_http if host_plex
        default_backend truenas_s3

frontend kube-apiserver
        bind :::16443 v4v6
        # use tcp content accepts to detects ssl client and server hello.
        tcp-request inspect-delay 5s
        tcp-request content accept if { req_ssl_hello_type 1 }
        default_backend kube-apiserver_https
```

My backends:

```text
backend traefik_http
        mode http
        server traefik 192.168.2.10:80 check

backend traefik_https
        mode tcp
        # maximum SSL session ID length is 32 bytes.
        stick-table type binary len 32 size 30k expire 30m

        acl clienthello req_ssl_hello_type 1
        acl serverhello rep_ssl_hello_type 2

        # use tcp content accepts to detects ssl client and server hello.
        tcp-request inspect-delay 5s
        tcp-request content accept if clienthello

        # no timeout on response inspect delay by default.
        tcp-response content accept if serverhello

        # SSL session ID (SSLID) may be present on a client or server hello.
        # Its length is coded on 1 byte at offset 43 and its value starts
        # at offset 44.
        # Match and learn on request if client hello.
        stick on payload_lv(43,1) if clienthello

        # learn on response if server hello.
        stick store-response payload_lv(43,1) if serverhello

        server traefik 192.168.2.10:443 check

backend kube-apiserver_https
        mode tcp
        # maximum SSL session ID length is 32 bytes.
        stick-table type binary len 32 size 30k expire 30m

        acl clienthello req_ssl_hello_type 1
        acl serverhello rep_ssl_hello_type 2

        # use tcp content accepts to detects ssl client and server hello.
        tcp-request inspect-delay 5s
        tcp-request content accept if clienthello

        # no timeout on response inspect delay by default.
        tcp-response content accept if serverhello

        # SSL session ID (SSLID) may be present on a client or server hello.
        # Its length is coded on 1 byte at offset 43 and its value starts
        # at offset 44.
        # Match and learn on request if client hello.
        stick on payload_lv(43,1) if clienthello

        # learn on response if server hello.
        stick store-response payload_lv(43,1) if serverhello

        server microk8s-1 192.168.1.187:16443 check inter 5s downinter 5s fall 3 rise 3

backend plex_http
        mode http
        option forwardfor
        server plex 192.168.1.51:32400 check

backend truenas_s3
        mode http
        server truenas_minio_1 192.168.1.45:9000 check ssl verify none
        server truenas_minio_2 192.168.1.153:9000 check ssl verify none

backend tcp_to_https
        mode tcp
        server haproxy_https 127.0.0.1:8443 check
```

Make sure to change the labels, names, and IPs as necessary.

#### Issuing Certificates Using Certbot

Install Certbot as a snap:

```bash
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
sudo snap set certbot trust-plugin-with-root=ok
```

I prefer verifying with DNS to avoid setting up HTTP challenges through
HAProxy. Since my DNS provider is Cloudflare, I will be installing the
Cloudflare plugin too. Refer to the Certbot documentation for all supported
methods.

```bash
sudo snap install certbot-dns-cloudflare
```

Next, set up credentials for Cloudflare:

```bash
nano cloudflare.ini
```

Paste your Cloudflare token in the following format:

```ini
# Cloudflare API token used by Certbot
dns_cloudflare_api_token = 0123456789abcdef0123456789abcdef01234567
```

Next, generate the certificates you need using:

```bash
certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials ~/cloudflare.ini \
  -d example.com \
  -d www.example.com
```

#### Installing Certs in HAProxy

HAProxy expects a single file containing the full chain and private key, so we
will have to concatenate the files before copying them to the HAProxy
directory.

Create the directory `/etc/haproxy/certs/` to store certificates:

```bash
mkdir /etc/haproxy/certs/
```

Combine the certs for HAProxy and copy them into the certs directory:

```bash
sudo cat /etc/letsencrypt/live/example.com/fullchain.pem \
    /etc/letsencrypt/live/example.com/privkey.pem \
    | sudo tee /etc/haproxy/certs/example.com.pem
```

Keep in mind you will have to have 1 file for every host name you are
terminating with HAProxy. If you issue a single cert for multiple host names,
duplicate them with the other names.

### MicroK8s VM (Ubuntu 20.04, 6 vCPU, 12 GB RAM)

The MicroK8s VM is going to be running Ubuntu 20.04 with 6 vCPUs and 12 GB of
RAM. I would prefer a little more RAM, but this is all I can spare for this VM
now. Let's start with step 1.

#### Installing MicroK8s

First, let's make sure that the system is completely up to date.

```bash
sudo apt update && sudo apt upgrade
```

Reboot if necessary:

```bash
sudo reboot
```

Now, we can install MicroK8s using snap. I will be using the `1.21/stable`
channel for this VM.

```bash
sudo snap install microk8s --classic --channel=1.21/stable
```

Test if MicroK8s installed properly by running `microk8s status`. You may have
to add your user to the `microk8s` group and take ownership of the `~/.kube`
directory to be able to do this.

```bash
sudo usermod -a -G microk8s <username>
sudo chown -f -R <username> ~/.kube
```

_Note: Replace `<username>` with your username._

Run `newgrp microk8s` to reload user groups in the current session.

`microk8s status` should return the following:

```text
microk8s is running
high-availability: no
  datastore master nodes: 127.0.0.1:19001
  datastore standby nodes: none
addons:
  enabled:
    ha-cluster           # Configure high availability on the current node
  disabled:
    ambassador           # Ambassador API Gateway and Ingress
    cilium               # SDN, fast with full network policy
    dashboard            # The Kubernetes dashboard
    dns                  # CoreDNS
    fluentd              # Elasticsearch-Fluentd-Kibana logging and monitoring
    gpu                  # Automatic enablement of Nvidia CUDA
    helm                 # Helm 2 - the package manager for Kubernetes
    helm3                # Helm 3 - Kubernetes package manager
    host-access          # Allow Pods connecting to Host services smoothly
    ingress              # Ingress controller for external access
    istio                # Core Istio service mesh services
    jaeger               # Kubernetes Jaeger operator with its simple config
    keda                 # Kubernetes-based Event Driven Autoscaling
    knative              # The Knative framework on Kubernetes.
    kubeflow             # Kubeflow for easy ML deployments
    linkerd              # Linkerd is a service mesh for Kubernetes and other frameworks
    metallb              # Loadbalancer for your Kubernetes cluster
    metrics-server       # K8s Metrics Server for API access to service metrics
    multus               # Multus CNI enables attaching multiple network interfaces to pods
    openebs              # OpenEBS is the open-source storage solution for Kubernetes
    openfaas             # openfaas serverless framework
    portainer            # Portainer UI for your Kubernetes cluster
    prometheus           # Prometheus operator for monitoring and logging
    rbac                 # Role-Based Access Control for authorisation
    registry             # Private image registry exposed on localhost:32000
    storage              # Storage class; allocates storage from host directory
    traefik              # traefik Ingress controller for external access
```

#### Enabling Required Add-ons for MicroK8s

We will require `dns`, `helm3`, `metallb`, `rbac`, `storage`, and
`prometheus` for this deployment. We can enable them using the MicroK8s CLI.

```bash
microk8s enable dns helm3 rbac storage metallb prometheus
```

MetalLB requires an IP address range for allocation of software network load
balancers. Since my home network operates on the `192.168.0.0/16` subnet, I
will be using `192.168.2.10-192.168.2.250` for MetalLB.

```text
Enabling MetalLB
Enter each IP address range delimited by comma (e.g. '10.64.140.43-10.64.140.49,192.168.0.105-192.168.0.111'): 192.168.2.10-192.168.2.250
```

#### Adding Additional CSRs for My Public IP and DNS for the APIServer

If you are going to be exposing the APIServer to the internet, you will need
to add your public DNS name and your IP address to the CSR template. This will
allow MicroK8s to include the name and IP in its certificates.

```bash
nano /var/snap/microk8s/current/certs/csr.conf.template
```

Add your DNS and IP entries under `[ alt_names ]`:

```ini
[ req ]
default_bits = 2048
prompt = no
default_md = sha256
req_extensions = req_ext
distinguished_name = dn

[ dn ]
C = GB
ST = Canonical
L = Canonical
O = Canonical
OU = Canonical
CN = 127.0.0.1

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = kubernetes
DNS.2 = kubernetes.default
DNS.3 = kubernetes.default.svc
DNS.4 = kubernetes.default.svc.cluster
DNS.5 = kubernetes.default.svc.cluster.local
IP.1 = 127.0.0.1
IP.2 = 10.152.183.1
#MOREIPS

[ v3_ext ]
authorityKeyIdentifier=keyid,issuer:always
basicConstraints=CA:FALSE
keyUsage=keyEncipherment,dataEncipherment,digitalSignature
extendedKeyUsage=serverAuth,clientAuth
subjectAltName=@alt_names
```

Now that this is done, and the required DNS entries have been made, we can
connect to this cluster from anywhere.

Copy the _kubeconfig_ using `microk8s config` and add it to your client
machine.

Done!

For setting up Traefik Proxy as ingress, you can refer to my previous post
[here](/blog/2020/09/guide-storage-ingress-webui-k8s/).
