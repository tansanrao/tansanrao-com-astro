---
title: 'Storage, Ingress and Web UIs for Kubernetes Cluster'
description: >-
  A getting started guide to set up persistent volumes, ingress, and web UIs
  for a Kubernetes cluster.
timestamp: 2020-09-29 04:30:00+00:00
updatedTimestamp: 2021-04-29 05:23:48+00:00
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

![Kubernetes storage, ingress, and web UI cover image](https://web.archive.org/web/20211216110157im_/https://tansanrao.com/content/images/2020/09/05_K8S_STORAGE_INGRESS_WEBUI.jpg)

Hello everybody, Tansanrao here! This is a follow-up to the previous guide
about how to [set up an HA Kubernetes
cluster](/blog/2020/09/kubernetes-ha-cluster-with-kubeadm/). We will be
dealing with distributed block storage using Longhorn, an ingress controller
using Traefik, a few useful middleware examples for Traefik, and deploying the
Kubernetes Dashboard.

## Storage: Longhorn Distributed Block Storage for Kubernetes

### What is Longhorn?

Longhorn is a lightweight, reliable, and easy-to-use distributed block storage
system for Kubernetes.

Longhorn is free and open source software. Originally developed by Rancher
Labs, it is now being developed as a sandbox project of the Cloud Native
Computing Foundation.

### Installing Longhorn

Install Longhorn by applying the following manifest with `kubectl`:

```bash
kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml
```

To monitor the progress of the installation, you can use this:

```bash
kubectl get pods \
  --namespace longhorn-system \
  --watch
```

To check for successful deployment, see that all the pods show a ready and
running state like so:

```text
NAME                                        READY     STATUS    RESTARTS   AGE
csi-attacher-6fdc77c485-8wlpg               1/1       Running   0          9d
csi-attacher-6fdc77c485-psqlr               1/1       Running   0          9d
csi-attacher-6fdc77c485-wkn69               1/1       Running   0          9d
csi-provisioner-78f7db7d6d-rj9pr            1/1       Running   0          9d
csi-provisioner-78f7db7d6d-sgm6w            1/1       Running   0          9d
csi-provisioner-78f7db7d6d-vnjww            1/1       Running   0          9d
engine-image-ei-6e2b0e32-2p9nk              1/1       Running   0          9d
engine-image-ei-6e2b0e32-s8ggt              1/1       Running   0          9d
engine-image-ei-6e2b0e32-wgkj5              1/1       Running   0          9d
longhorn-csi-plugin-g8r4b                   2/2       Running   0          9d
longhorn-csi-plugin-kbxrl                   2/2       Running   0          9d
longhorn-csi-plugin-wv6sb                   2/2       Running   0          9d
longhorn-driver-deployer-788984b49c-zzk7b   1/1       Running   0          9d
longhorn-manager-nr5rs                      1/1       Running   0          9d
longhorn-manager-rd4k5                      1/1       Running   0          9d
longhorn-manager-snb9t                      1/1       Running   0          9d
longhorn-ui-67b9b6887f-n7x9q                1/1       Running   0          9d
```

## Dashboard: Kubernetes Web UI

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml
```

To protect your cluster data, Dashboard deploys with a minimal RBAC
configuration by default. Currently, Dashboard only supports logging in with a
bearer token. To create a token for this demo, create a `ServiceAccount`
called `admin-user`.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ServiceAccount
metadata:
  name: admin-user
  namespace: kubernetes-dashboard
EOF
```

Next we create a `ClusterRoleBinding` between the `cluster-admin` cluster role
and the `admin-user` service account.

```bash
cat <<EOF | kubectl apply -f -
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: admin-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
  - kind: ServiceAccount
    name: admin-user
    namespace: kubernetes-dashboard
EOF
```

Next we need to fetch a bearer token.

For Bash, do this:

```bash
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | grep admin-user | awk '{print $1}')
```

For PowerShell, do this:

```bash
kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | sls admin-user | ForEach-Object { $_ -Split '\s+' } | Select -First 1)
```

It should output something like this:

```text
Name:         admin-user-token-v57nw
Namespace:    kubernetes-dashboard
Labels:       <none>
Annotations:  kubernetes.io/service-account.name: admin-user
              kubernetes.io/service-account.uid: 0303243c-4040-4a58-8a47-849ee9ba79c1

Type:  kubernetes.io/service-account-token

Data
====
ca.crt:     1066 bytes
namespace:  20 bytes
token:      eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJpc3MiOiJrdWJlcm5ldGVzL3NlcnZpY2VhY2NvdW50Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9uYW1lc3BhY2UiOiJrdWJlcm5ldGVzLWRhc2hib2FyZCIsImt1YmVybmV0ZXMuaW8vc2VydmljZWFjY291bnQvc2VjcmV0Lm5hbWUiOiJhZG1pbi11c2VyLXRva2VuLXY1N253Iiwia3ViZXJuZXRlcy5pby9zZXJ2aWNlYWNjb3VudC9zZXJ2aWNlLWFjY291bnQubmFtZSI6ImFkbWluLXVzZXIiLCJrdWJlcm5ldGVzLmlvL3NlcnZpY2VhY2NvdW50L3NlcnZpY2UtYWNjb3VudC51aWQiOiIwMzAzMjQzYy00MDQwLTRhNTgtOGE0Ny04NDllZTliYTc5YzEiLCJzdWIiOiJzeXN0ZW06c2VydmljZWFjY291bnQ6a3ViZXJuZXRlcy1kYXNoYm9hcmQ6YWRtaW4tdXNlciJ9.Z2JrQlitASVwWbc-s6deLRFVk5DWD3P_vjUFXsqVSY10pbjFLG4njoZwh8p3tLxnX_VBsr7_6bwxhWSYChp9hwxznemD5x5HLtjb16kI9Z7yFWLtohzkTwuFbqmQaMoget_nYcQBUC5fDmBHRfFvNKePh_vSSb2h_aYXa8GV5AcfPQpY7r461itme1EXHQJqv-SN-zUnguDguCTjD80pFZ_CmnSE1z9QdMHPB8hoB4V68gtswR1VLa6mSYdgPwCHauuOobojALSaMc3RH7MmFUumAgguhqAkX3Omqd3rJbYOMRuMjhANqd08piDC3aIabINX6gP5-Tuuw2svnV6NYQ
```

Now copy the token and store it somewhere safe. We will need it in a minute.

### Accessing the Web UI

We create a proxy to our cluster using `kubectl`:

```bash
kubectl proxy
```

`kubectl` will make Dashboard available at
<http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/>.

The UI can only be accessed from the machine where the command is executed.

![Web UI Login](https://web.archive.org/web/20211216110157im_/https://tansanrao.com/content/images/2020/09/Screenshot-2020-09-25-at-8.48.07-PM.png)
*Web UI Login*

Enter the token from the previous step here to log in.

## Ingress: Traefik Proxy as Ingress Controller

We will be setting up Traefik with Let's Encrypt, with optional Cloudflare DNS
challenge configuration.

### Installing Traefik via Helm Chart

Make sure you have Helm installed, then add the Traefik repo:

```bash
helm repo add traefik https://helm.traefik.io/traefik
```

Update Helm repos:

```bash
helm repo update
```

Create a `traefik-values.yaml` file:

```bash
nano traefik-values.yaml
```

Paste the following into the file:

```yaml
additionalArguments:
  - "--certificatesresolvers.http-le.acme.email=<your_email@example.com>"
  - "--certificatesresolvers.http-le.acme.storage=/data/acme.json"
  - "--certificatesresolvers.http-le.acme.caserver=https://acme-v02.api.letsencrypt.org/directory"
  - "--certificatesresolvers.http-le.acme.httpchallenge=true"
  - "--certificatesresolvers.http-le.acme.httpchallenge.entrypoint=web"
  - "--api.insecure=true"
  - "--accesslog=true"
  - "--log.level=WARN"
  - "--serverstransport.insecureskipverify=true"
```

Change the email to match your valid email address for Let's Encrypt. That will
set up an ACME cert resolver named `http-le` which will use the `web`
entrypoint to perform an `HTTP-01` challenge and issue certs.

To use Cloudflare DNS via a cert resolver named `dns-le` to perform a `DNS-01`
challenge, you can use the values below:

```yaml
additionalArguments:
  - "--certificatesresolvers.dns-le.acme.email=<your_email@example.com>"
  - "--certificatesresolvers.dns-le.acme.storage=/data/acme.json"
  - "--certificatesresolvers.dns-le.acme.caserver=https://acme-v02.api.letsencrypt.org/directory"
  - "--certificatesresolvers.dns-le.acme.dnschallenge=true"
  - "--certificatesresolvers.dns-le.acme.dnschallenge.provider=cloudflare"
  - "--api.insecure=true"
  - "--accesslog=true"
  - "--log.level=WARN"
  - "--serverstransport.insecureskipverify=true"
env:
  - name: CF_DNS_API_TOKEN
    valueFrom:
      secretKeyRef:
        name: cloudflare
        key: dns-token
```

In the Cloudflare version of the values file, we are loading the Cloudflare API
token from a secret, so let's go ahead and create one.

In your Cloudflare dashboard, navigate to your domain page. On the right,
you'll see a section called API. Click on **Get API Token**.

![Get API Token](https://web.archive.org/web/20211216110157im_/https://tansanrao.com/content/images/2020/09/Screenshot-2020-09-26-at-12.03.27-PM.png)
*Get API Token*

Then on the API Tokens tab, click on **Create Token**.

![API Tokens](https://web.archive.org/web/20211216110157im_/https://tansanrao.com/content/images/2020/09/Screenshot-2020-09-26-at-12.05.43-PM.png)
*API Tokens*

Use the **Edit Zone DNS** template and add edit permissions for `Zone.Zone` and
`Zone.DNS`. Then, under **Zone Resources**, include the zone for the domain you
plan on using. In my case, I've chosen to grant access to all zones.

![Token Config](https://web.archive.org/web/20211216110157im_/https://tansanrao.com/content/images/2020/09/Screenshot-2020-09-26-at-12.07.21-PM.png)
*Token Config*

Save the token as it'll only be shown once.

Next we create a secret for the same using `kubectl`:

```bash
kubectl create secret generic cloudflare \
  --from-literal=dns-token='<cloudflare_token_here>'
```

Now we are ready to install Traefik using Helm:

```bash
helm install traefik traefik/traefik --values=traefik-values.yaml
```

Check for successful installation by running:

```bash
kubectl get pods
```

Traefik should be visible with ready pods and a status of `Running`. The
dashboard can be accessed by port-forwarding through `kubectl`:

```bash
kubectl port-forward $(kubectl get pods --selector "app.kubernetes.io/name=traefik" --output=name) 9000:9000
```

The dashboard will be available at <http://localhost:9000/dashboard>.

## Basic Auth Middleware for Traefik

Create a file named `auth-middleware.yaml` and paste the following into it:

```yaml
# Declaring the user list
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: admin-auth
  namespace: default
spec:
  basicAuth:
    secret: authsecret

---
# Note: in a Kubernetes secret the string (e.g. generated by htpasswd) must be base64-encoded first.
# To create an encoded user:password pair, the following command can be used:
# htpasswd -nb user password | openssl base64

apiVersion: v1
kind: Secret
metadata:
  name: authsecret
  namespace: default

data:
  users: <base64_encoded_string>
```

Replace the line at the end with a base64-encoded string from `htpasswd`
generated using this command:

```bash
htpasswd -nb user password | openssl base64
```

Replace `user` and `password` with the username and password that you would
like to use.

Apply the file using `kubectl`:

```bash
kubectl apply -f auth-middleware.yaml
```

## Middleware to Add CORS and `svc-wss-headers`

### CORS Middleware

Create a file named `cors-middleware.yaml` and paste the following:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: cors-allow-all
  namespace: default
spec:
  headers:
    accessControlAllowCredentials: true
    accessControlAllowMethods:
      - "*"
    accessControlAllowOriginList:
      - "*"
    accessControlMaxAge: 100
    addVaryHeader: true
```

It grants all origins permission to use all methods and credentials. Apply it
with `kubectl`:

```bash
kubectl apply -f cors-middleware.yaml
```

### `svc-wss` Middleware

Create a file named `wss-middleware.yaml` and paste the following:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: svc-wss-headers
  namespace: default
spec:
  headers:
    customRequestHeaders:
      X-Forwarded-Proto: "https"
```

It adds `https` in the `X-Forwarded-Proto` header to force secure WebSocket
connections. It is needed only sometimes to get the Longhorn UI to play nicely
with HTTPS in Traefik.

Apply it with `kubectl`:

```bash
kubectl apply -f wss-middleware.yaml
```

## Longhorn UI Router Using IngressRoutes

Create a file named `ingress-longhorn.yaml` and add the following to it:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: longhorn-ui-ingress
  namespace: longhorn-system
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`longhorn.k8s.example.com`)
      kind: Rule
      services:
        - name: longhorn-frontend
          port: 80
          namespace: longhorn-system
      middlewares:
        - name: cors-allow-all
          namespace: default
        - name: admin-auth
          namespace: default
        - name: svc-wss-headers
          namespace: default
  tls:
    certResolver: http-le
```

Here we are creating an `IngressRoute` that matches the hostname
`longhorn.k8s.example.com`. Substitute it for whatever you are going to use. We
are also chaining the 3 middleware we defined above to add CORS, WSS, and basic
auth to the route.

Apply it with `kubectl`:

```bash
kubectl apply -f ingress-longhorn.yaml
```

Done. The UI should be up on the host URL specified in the ingress route.

For any doubts, suggestions, or issues, leave a comment below and subscribe to
the newsletter for the latest posts delivered straight to your inbox. Follow me
on [Twitter](https://twitter.com/tansanrao) and
[Instagram](https://instagram.com/tansanrao) for behind-the-scenes updates.
