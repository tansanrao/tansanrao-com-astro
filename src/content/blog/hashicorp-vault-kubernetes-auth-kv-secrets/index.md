---
title: 'HashiCorp Vault: Installation, Kubernetes Auth Method and KV Secrets Engine'
description: >-
  A guide on how to install HashiCorp Vault, configure Kubernetes auth, and
  enable the KV secrets engine.
timestamp: 2021-05-21 12:28:47+00:00
updatedTimestamp: 2021-05-28 14:23:38+00:00
tags:
  - kubernetes
  - secrets
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

Hey everyone! Today's post is a guide on setting up HashiCorp Vault on a
Kubernetes cluster and configuring the Kubernetes auth method to enable pods to
authenticate with Vault. We will also be setting up the key-value secrets
engine. I will be configuring Vault to run in standalone mode in a single
Kubernetes cluster here while mentioning the relevant changes to deploy in HA
mode.

For production deployments, I would highly recommend running Vault with Consul
as the storage backend in a separate Kubernetes cluster from the rest of the
workloads.

### What is currently set up?

- Single-node MicroK8s cluster. Refer to my Home Lab Infrastructure post
  [here](/blog/2021/04/home-lab-infrastructure/) for complete details.
- Client machine with Helm, `kubectl`, and the Vault CLI. Refer
  [here](https://www.vaultproject.io/docs/install) for instructions on how to
  install the Vault CLI.

### What do I want?

- Vault running in standalone mode on Kubernetes
- KV secrets engine
- Kubernetes auth method
- Demo policies and service accounts for testing

## Installing Vault

We begin by adding the HashiCorp repo for Helm charts:

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com

helm search repo hashicorp/vault
```

Next we write the `values.yaml` file for the release. The YAML below is for the
standalone deployment. If you are interested in an HA deployment, refer to the
next one.

```yaml
global:
  metrics:
    enabled: true

  # Run Vault in "standalone" mode. This is the default mode that will deploy if
  # no arguments are given to helm. This requires a PVC for data storage to use
  # the "file" backend. This mode is not highly available and should not be scaled
  # past a single replica.
  standalone:
    enabled: true
```

Here I've changed `global.metrics.enabled` and `standalone.enabled` to `true`.
We will be accepting the chart defaults for everything else.

This `values.yaml` file is for an HA deployment. You have two options for HA:
you can either use Consul as a storage backend if you have it configured
already, or you can use a Raft storage backend and Vault will create persistent
volumes to store data. The values below are ready to use with the default
Consul chart deployment. You can make changes as necessary. We will be
accepting all other chart defaults.

```yaml
global:
  metrics:
    enabled: true

  ha:
    enabled: false
    replicas: 3

    # Set the api_addr configuration for Vault HA
    # See https://www.vaultproject.io/docs/configuration#api_addr
    # If set to null, this will be set to the Pod IP Address
    apiAddr: null

    # Enables Vault's integrated Raft storage. Unlike the typical HA modes where
    # Vault's persistence is external (such as Consul), enabling Raft mode will create
    # persistent volumes for Vault to store data according to the configuration under server.dataStorage.
    # The Vault cluster will coordinate leader elections and failovers internally.
    raft:
      # Enables Raft integrated storage
      enabled: false
      # Set the Node Raft ID to the name of the pod
      setNodeId: false

      # Note: Configuration files are stored in ConfigMaps so sensitive data
      # such as passwords should be either mounted through extraSecretEnvironmentVars
      # or through a Kube secret. For more information see:
      # https://www.vaultproject.io/docs/platform/k8s/helm/run#protecting-sensitive-vault-configurations
      config: |
        ui = true
        listener "tcp" {
          tls_disable = 1
          address = "[::]:8200"
          cluster_address = "[::]:8201"
        }
        storage "raft" {
          path = "/vault/data"
        }
        service_registration "kubernetes" {}

    # config is a raw string of default configuration when using a Stateful
    # deployment. Default is to use Consul for its HA storage backend.
    # This should be HCL.
    config: |
      ui = true
      listener "tcp" {
        tls_disable = 1
        address = "[::]:8200"
        cluster_address = "[::]:8201"
      }
      storage "consul" {
        path = "vault"
        address = "HOST_IP:8500"
      }
      service_registration "kubernetes" {}
```

To go over the chart defaults and make other changes, refer to the
`values.yaml` file in
[this repo](https://github.com/hashicorp/vault-helm).

Next we create a namespace for Vault:

```bash
kubectl create namespace vault
```

And then we can install the chart using Helm:

```bash
helm install -f values.yaml vault hashicorp/vault -n vault
```

### Configuring Ingress

To expose the Vault API and UI publicly, I will be adding a Traefik
`IngressRoute`. If you are not using Traefik, you will need to configure an
ingress to point to the `vault-ui` service in the `vault` namespace. If you are
interested in trying out Traefik, I have a guide
[here](/blog/2020/09/guide-storage-ingress-webui-k8s/).

_Note: If you are not going to be using a public ingress point, you will have
to forward the service using `kubectl` and use localhost as your Vault address.
In that case, you can skip these steps for setting up ingress._

Paste the following into `vault-ui.yaml`:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: vault-ui
spec:
  entryPoints:
    - websecure
  routes:
    - match: Host(`vault.example.com`)
      kind: Rule
      services:
        - name: vault
          port: 8200
          namespace: vault
  tls:
    certResolver: dns-le

---
apiVersion: traefik.containo.us/v1alpha1
kind: IngressRoute
metadata:
  name: vault-ui-redirect
spec:
  entryPoints:
    - web
  routes:
    - match: Host(`vault.example.com`)
      kind: Rule
      services:
        - name: noop@internal
          kind: TraefikService
      middlewares:
        - name: https-redirect
          namespace: default
```

Apply the `IngressRoute` using:

```bash
kubectl apply -f vault-ui.yaml -n vault
```

Here is the `https-redirect` middleware I use. Paste this into
`https-redirect.yaml`:

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: https-redirect
spec:
  redirectScheme:
    scheme: https
    permanent: true
```

Apply the middleware in the `default` namespace:

```bash
kubectl apply -f https-redirect.yaml
```

### Verifying Vault Install

Next we connect to Vault and check the status. We create an environment
variable `VAULT_ADDR` that holds the URL to the Vault API. This is the URL from
the `IngressRoute`.

_Note: If you are not going to be using a public ingress point, you will have
to forward the service using `kubectl` and use localhost as your Vault
address._

```bash
export VAULT_ADDR=https://vault.example.com

vault status
```

If your output looks similar to this, you are good to go.

```text
Key                Value
---                -----
Seal Type          shamir
Initialized        false
Sealed             true
Total Shares       0
Threshold          0
Unseal Progress    0/0
Unseal Nonce       n/a
Version            1.7.0
Storage Type       file
HA Enabled         false
```

### Initializing Vault

Next, we initialize Vault using the following:

```bash
vault operator init
```

This should give you an output similar to this:

```text
Unseal Key 1: lH/IjmT0sEUINflFRz0SlvcwX1/9bDIZ6HMbB9bPXWOX
Unseal Key 2: f6+Hz6duvNrkBzNGvo0l0JBs/YmUZ09HWDpA/Gw27ed/
Unseal Key 3: ialsgJBFfcVfIOqJNu3jNSbXedSU+popfaPOWFMDPqUD
Unseal Key 4: lUiKmgwZF5DyFb3r8IQeczosaR9N+V+CBuvyszz1cGlv
Unseal Key 5: osNxZY0p4R4nlHw/Ppp4z93kuPtXWlkwyI+dfG+qqEFc

Initial Root Token: s.qsp44Sw1tenwPIlYjFa8CeX8

Vault initialized with 5 key shares and a key threshold of 3. Please securely
distribute the key shares printed above. When the Vault is re-sealed,
restarted, or stopped, you must supply at least 3 of these keys to unseal it
before it can start servicing requests.

Vault does not store the generated master key. Without at least 3 key to
reconstruct the master key, Vault will remain permanently sealed!

It is possible to generate new unseal keys, provided you have a quorum of
existing unseal keys shares. See "vault operator rekey" for more information.
```

> Store the unseal keys carefully as you will lose access to your Vault along
> with the data in it if you lose the keys. You will have to recreate a new
> Vault.

Done. Now log into Vault using the initial root token.

```bash
vault login
```

## Setup Kubernetes Auth

The following steps assume you are using the same cluster for Vault and your
workloads. If you are using separate clusters, you will have to run these
commands on the cluster where your workloads are.

### ServiceAccount and ClusterRoleBinding

First, we create a `ServiceAccount` and `ClusterRoleBinding` for Vault to
access the `TokenReview` API. If you are running separate clusters, you will
have to set your `kubectl` context to the cluster running the workloads.

```bash
kubectl create serviceaccount vault-sa -n vault

kubectl apply -f - <<EOH
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: role-tokenreview-binding
  namespace: vault
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: system:auth-delegator
subjects:
  - kind: ServiceAccount
    name: vault-sa
    namespace: vault
EOH
```

### Configuring Kubernetes Auth Method

If you are running separate clusters, you will have to replace `k8s_host` and
`k8s_port` values with the Kubernetes API endpoint for your workloads cluster
and set your `kubectl` context to the cluster running the workloads.

```bash
k8s_host="$(kubectl exec vault-0 -n vault -- printenv | grep KUBERNETES_PORT_443_TCP_ADDR | cut -f 2- -d "=" | tr -d " ")"

k8s_port="443"

k8s_cacert="$(kubectl config view --raw --minify --flatten -o jsonpath='{.clusters[].cluster.certificate-authority-data}' | base64 --decode)"

secret_name="$(kubectl get serviceaccount vault-sa -n vault -o go-template='{{ (index .secrets 0).name }}')"

tr_account_token="$(kubectl get secret ${secret_name} -n vault -o go-template='{{ .data.token }}' | base64 --decode)"

vault auth enable kubernetes

vault write auth/kubernetes/config token_reviewer_jwt="${tr_account_token}" kubernetes_host="https://${k8s_host}:${k8s_port}" kubernetes_ca_cert="${k8s_cacert}"
```

## Setting Up KV Secrets Engine

### Enabling KV Engine

Refer to [the Vault docs](https://www.vaultproject.io/docs/secrets/kv) for the
differences between KV version 1 and version 2. We will be using version 1
here.

```bash
vault secrets enable -version=1 kv
```

### Creating the Demo ServiceAccount

```bash
kubectl create sa demo-sa -n vault
```

### Adding Vault Policies and Vault Roles for Kubernetes Access

```bash
vault policy write demo-policy - <<EOF
path "kv/*"
{
  capabilities = ["read"]
}
EOF

vault write auth/kubernetes/role/demo-role \
  bound_service_account_names=demo-sa \
  bound_service_account_namespaces=vault \
  policies=demo-policy \
  ttl=24h
```

This policy allows read access for all secrets present under the path `kv/*`.

The role `demo-role` allows our `demo-sa` `ServiceAccount` present in the
`vault` namespace access to Vault under the `demo-policy` capabilities.

### Test Authentication

```bash
demo_secret_name="$(kubectl get serviceaccount demo-sa -n vault -o go-template='{{ (index .secrets 0).name }}')"

demo_account_token="$(kubectl get secret ${demo_secret_name} -n vault -o go-template='{{ .data.token }}' | base64 --decode)"

vault write auth/kubernetes/login role=demo-role jwt=$demo_account_token
```

This should give you an output containing your access token. Save this for
later.

## Adding Data to KV Store

```bash
vault write kv/test FOO=BAR HELLO=WORLD
```

Read the secrets using the access token for `demo-sa` to ensure everything is
working fine.

```bash
vault login <token-returned-by-kubernetes-login>

vault read kv/test
```

If your output contains the data we wrote above, you have installed and
configured Vault successfully.

The continuation to this post, which shows you how to use the Vault Agent
Injector to inject sidecars into pods, is here:

[HashiCorp Vault: Loading Environment Variables using VaultSidecar for Node.js API Servers](/blog/2021/05/hashicorp-vault-sidecar/)
