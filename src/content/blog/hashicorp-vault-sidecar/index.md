---
title: 'HashiCorp Vault: Loading Environment Variables using VaultSidecar for Node.js API Servers'
description: >-
  A guide on how to use the Vault Agent Injector to attach sidecars and fetch
  environment variables in a Node.js application.
timestamp: 2021-05-28 14:23:21+00:00
updatedTimestamp: 2021-05-28 14:23:21+00:00
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

Hey everyone! Today's post is a continuation of last week's post on installing
Vault, configuring the Kubernetes auth method, and the KV secrets engine. If
you haven't read it yet, check it out
[here](/blog/2021/05/hashicorp-vault-kubernetes-auth-kv-secrets/).

This guide is going to use my Node.js API server template
`express-ts-boilerplate` available
[here](https://github.com/tansanrao/express-ts-boilerplate). It is a work in
progress template written in TypeScript, with more features and documentation
coming soon. Feel free to use it as a base and build upon it. Pull requests are
welcome.

## What Do We Currently Have?

- Single-node MicroK8s cluster. Refer to my Home Lab Infrastructure post
  [here](/blog/2021/04/home-lab-infrastructure/) for complete details.
- Vault running in standalone mode on Kubernetes
- KV secrets engine enabled
- Kubernetes auth method configured

## What Do We Need?

- Helm chart annotations for Vault sidecar
- Service account for the Node server
- Loading the environment variables into the application

## Creating a Namespace

Let's start by creating a namespace for this demo.

```bash
kubectl create namespace vault-demo
```

## Creating a Service Account

Next, let's create a service account for our application to use.

```bash
kubectl create sa vault-demo-sa -n vault-demo
```

## Adding Environment Variables to Vault

Log into Vault if you haven't done so already. If you are following along from
the previous post, use your initial root token to login.

```bash
export VAULT_ADDR=https://vault.example.com

vault login
```

Now add your environment variables to Vault on a path used by the KV store. In
my previous post, we configured it on the path `kv/`, so I will be using the
path `kv/env/boilerplate` here. If you are using my boilerplate code, the
required variables are listed in the `example.env` file.

```bash
vault write kv/env/boilerplate SQL_USER=devuser SQL_PASS=devpassword SQL_NAME=demo_db SQL_HOST=mysql SQL_PORT=3306 NOSQL_USER=devuser NOSQL_PASS=devpassword NOSQL_NAME=demo_db NOSQL_HOST=mongodb NOSQL_PORT=27017
```

## Creating a Policy and a Demo Role

Now we need to create the policy and role for our application to use. I will be
calling them `demo-policy` and `demo-role` respectively. The policy grants full
read permissions to all secrets stored in the KV secrets engine. Change the
path for tighter access control as needed.

```bash
vault policy write demo-policy - <<EOF
path "kv/*"
{
  capabilities = ["read"]
}
EOF

vault write auth/kubernetes/role/demo-role \
  bound_service_account_names=vault-demo-sa \
  bound_service_account_namespaces=vault-demo \
  policies=demo-policy \
  ttl=24h
```

Here, we are permitting the `vault-demo-sa` service account in the
`vault-demo` namespace to authenticate with this role.

## Testing Authentication

You can test if the role is working as expected by trying to log in as the
service account as follows.

```bash
demo_secret_name="$(kubectl get serviceaccount vault-demo-sa -n vault-demo -o go-template='{{ (index .secrets 0).name }}')"

demo_account_token="$(kubectl get secret ${demo_secret_name} -n vault-demo -o go-template='{{ .data.token }}' | base64 --decode)"

vault write auth/kubernetes/login role=demo-role jwt=$demo_account_token
```

If it returns a token, everything is fine.

## Adding Annotations and ServiceAccount to the Helm Chart

Now that the Vault preparation is done, we need to add our annotations and
specify our service account in the Helm chart. Edit your `values.yaml` file and
set the following.

```yaml
serviceAccount:
  # Specifies whether a service account should be created
  create: false
  # Annotations to add to the service account
  annotations: {}
  # The name of the service account to use.
  # If not set and create is true, a name is generated using the fullname template
  name: "vault-demo-sa"

podAnnotations:
  vault.hashicorp.com/agent-inject: "true"
  vault.hashicorp.com/role: "demo-role"
  vault.hashicorp.com/agent-inject-secret-envvars: "kv/env/boilerplate"
  vault.hashicorp.com/agent-inject-template-envvars: |
    {{ with secret "kv/env/boilerplate" -}}
    {{ range $k, $v := .Data }}
    {{ $k }}={{ $v }}
    {{ end }}
    {{- end }}
```

In the `serviceAccount` section, we are instructing the chart not to create an
account and to instead use the service account name provided.

In the annotations, the first line instructs the Vault Agent Injector to inject
the Vault sidecar into this pod. The second line defines the role to
authenticate with, and the third and fourth lines indicate the path of the
secret and the template with which to expose it in the mounted file.

Here, the part after `agent-inject-secret-` is taken as the name for this
secret. It is mounted as a file at the path `/vault/secrets/<name>` inside the
containers. The template allows us to transform the secret before writing it
into the file. The template above takes the key and value from the secret and
writes it in the form `key=value`, which is the standard `.env` format.

## Setting up the Node Application to Use the Mounted File

I use `dotenv` to load `.env` files into the environment, so I will be checking
if the Vault mounted secret exists at `/vault/secrets/envvars`. If the file
exists, then it is used by `dotenv`. If it doesn't exist, the default location
is used.

```ts
// use different env file when running with vault sidecar
if (fs.existsSync('/vault/secrets/envvars')) {
  const envLoad = dotenv.config({ path: '/vault/secrets/envvars' });
  if (envLoad.error) {
    throw envLoad.error;
  }
} else {
  const envLoad = dotenv.config();
  if (envLoad.error) {
    throw envLoad.error;
  }
}
```

This code segment is part of my config file `config/config.ts` in the
boilerplate template source code.

Here is how the code looks as part of the entire config file.

```ts
import * as dotenv from "dotenv";
import * as fs from "fs";

interface ServerConfig {
  port: number;
  sql_name: string;
  sql_user: string;
  sql_pass: string;
  sql_host: string;
  sql_port: number;
  nosql_name: string;
  nosql_user: string;
  nosql_pass: string;
  nosql_host: string;
  nosql_port: number;
}

// use different env file when running with vault sidecar
if (fs.existsSync('/vault/secrets/envvars')) {
  const envLoad = dotenv.config({ path: '/vault/secrets/envvars' });
  if (envLoad.error) {
    throw envLoad.error;
  }
} else {
  const envLoad = dotenv.config();
  if (envLoad.error) {
    throw envLoad.error;
  }
}

const config: ServerConfig = {
  port: normalizePort(process.env.port || 3000),
  sql_user: process.env.SQL_USER || "devuser",
  sql_pass: process.env.SQL_PASS || "devpassword",
  sql_name: process.env.SQL_NAME || "pmplerp_items",
  sql_host: process.env.SQL_HOST || "mysql",
  sql_port: normalizePort(process.env.SQL_PORT || 3306),
  nosql_user: process.env.NOSQL_USER || "devuser",
  nosql_pass: process.env.NOSQL_PASS || "devpassword",
  nosql_name: process.env.NOSQL_NAME || "pmplerp_items",
  nosql_host: process.env.NOSQL_HOST || "mysql",
  nosql_port: normalizePort(process.env.NOSQL_PORT || 27017)
};

function normalizePort(val: string | number) {
  const port = parseInt(<string>val, 10);

  if (port >= 0) {
    // port number
    return port;
  }

  throw new Error("Port number Invalid");
}

export default config;
```

## Deploy Helm Chart to Cluster

Once all this is in place, you can go ahead and deploy the chart to your
cluster. If you are following along with my template repo, you can use the
following command.

```bash
helm upgrade --install --wait boilerplate ./chart -n vault-demo
```

If you want to know more about the Vault agent injector, refer to the injector
docs here:

[Agent Sidecar Injector Overview | Vault by HashiCorp](https://www.vaultproject.io/docs/platform/k8s/injector)
