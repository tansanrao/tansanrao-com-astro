---
title: 'Guide: Kubernetes Multi-Master HA Cluster with kubeadm'
description: >-
  A comprehensive guide on setting up a highly available Kubernetes cluster on
  bare-metal or virtual machines using kubeadm, covering load balancer setup,
  etcd configuration, and worker node joining.
pubDate: 2020-09-22T00:00:00.000Z
tags:
  - kubernetes
  - infrastructure
  - devops
draft: false
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---
Hello everybody, Tanuj here! This post is going to guide you into setting up a Multi-Master HA (High-Availability) Kubernetes Cluster on bare-metal or virtual machines.

All our VM images will be based on Ubuntu 20.04.1 Server and for the purpose of this guide, will be Virtual Machines on a VMware ESXi host.

We will require 7 Virtual Machines with a minimum spec of 2 Cores and 4GB RAM per Node for decent performance. Also make sure that you have Static IPs assigned on your DHCP Server.

We are using the following Hostnames & IP Assignments:

* 1 HAProxy Load Balancer Node  
  — k8s-haproxy : `10.0.0.10`
* 3 Etcd/Kubernetes Master Nodes  
  — k8s-master-a : `10.0.0.11`  
  — k8s-master-b : `10.0.0.12`  
  — k8s-master-c : `10.0.0.13`
* 3 Kubernetes Worker Nodes  
  — k8s-node-a : `10.0.0.21`  
  — k8s-node-b : `10.0.0.22`  
  — k8s-node-c : `10.0.0.23`

We will also require 1 linux client machine, if unavailable, the client tools may be installed on the HAProxy node.

The minimum for production use is 2 physical hosts with at least 1 Master on each with the recommended being 3 hosts with 1 Master and 1 Worker Node Each with an external load balancer. For the sake of this guide, I am running all 7 nodes on the same ESXi host. A single host should be safe enough to use for lab and test environments but do not run anything mission critical on it.

Let's get started!

## Prepare Virtual Machines / Servers

Start by preparing 7 machines with Ubuntu 20.04.1 Server using the correct hostnames and IP addresses. Once done, power on all of them and apply the latest updates using:

```shell
sudo apt update && sudo apt upgrade
```

## Setting up Client Tools

### Installing `cfssl`

CFSSL is an SSL tool by Cloudflare which lets us create our Certs and CAs.

#### Step 1 - Download the binaries

```shell
wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
```

#### Step 2 - Add the execution permission to the binaries

```shell
chmod +x cfssl*
```

#### Step 3 - Move the binaries to `/usr/local/bin`

```shell
sudo mv cfssl_linux-amd64 /usr/local/bin/cfssl
sudo mv cfssljson_linux-amd64 /usr/local/bin/cfssljson
```

#### Step 4 - Verify the installation

```shell
cfssl version
```

### Installing kubectl

#### Step 1 - Get the binary

make sure it's the same version as the cluster, in our case we are using v1.19

```shell
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.19.0/bin/linux/amd64/kubectl
```

#### Step 2 - Add the execution permission to the binary

```shell
chmod +x kubectl
```

#### Step 3 - Move the binary to `/usr/local/bin`

```shell
sudo mv kubectl /usr/local/bin
```

#### Step 4 - Verify the installation

```shell
kubectl version
```

## Installing HAProxy Load Balancer

As we will be deploying three Kubernetes master nodes, we need to deploy an HAProxy Load Balancer in front of them to distribute the traffic.

### Step 1 - SSH to the HAProxy VM

```shell
ssh username@10.0.0.10
```

### Step 2 - Install HAProxy

```shell
sudo apt-get install haproxy
```

### Step 3 - Configure HAProxy

```shell
sudo nano /etc/haproxy/haproxy.cfg
```

Enter the following config:

```haproxy
global
...
default
...
frontend kubernetes
bind 10.0.0.10:6443
option tcplog
mode tcp
default_backend kubernetes-master-nodes

backend kubernetes-master-nodes
mode tcp
balance roundrobin
option tcp-check
server k8s-master-a 10.0.0.11:6443 check fall 3 rise 2
server k8s-master-b 10.0.0.12:6443 check fall 3 rise 2
server k8s-master-c 10.0.0.13:6443 check fall 3 rise 2
```

### Step 4 - Restart HAProxy

```shell
sudo systemctl restart haproxy
```

## Generating the TLS certificates

These steps can be done on your Linux client if you have one or on the HAProxy machine depending on where you installed the cfssl tool.

### Creating a Certificate Authority

#### Step 1 - Create the certificate authority configuration file

```shell
nano ca-config.json
```

Enter the following config:

```json
{
  "signing": {
    "default": {
      "expiry": "8760h"
    },
    "profiles": {
      "kubernetes": {
        "usages": ["signing", "key encipherment", "server auth", "client auth"],
        "expiry": "8760h"
      }
    }
  }
}
```

#### Step 2 - Create the certificate authority signing request configuration file

```shell
nano ca-csr.json
```

Enter the following config, Change the names as necessary:

```json
{
  "CN": "Kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
  {
    "C": "US",
    "L": "City",
    "O": "Organization",
    "OU": "CA",
    "ST": "State"
  }
 ]
}
```

#### Step 3 - Generate the certificate authority certificate and private key

```shell
cfssl gencert -initca ca-csr.json | cfssljson -bare ca
```

## Conclusion

Congratulations! Your Bare-metal HA Cluster is ready for use. I recommend setting up Rancher Server for managing it and to setup Traefik as Ingress Controller, Longhorn as a Persistent Volume Provider, Prometheus & Grafana for Metrics and EFK Stack for Logging and Distributed Tracing. Guides for the same are in the works and will be posted in the coming weeks.

For any doubts, suggestions or issues, leave a comment below and I will get back to you asap! Follow me on Twitter & Instagram for behind the scenes and updates.
