---
title: 'Kubernetes Multi-Master HA Cluster with kubeadm'
description: >-
  This post is going to guide you into setting up a Multi-Master HA
  (High-Availability) Kubernetes Cluster on bare-metal or virtual machines.
timestamp: 2020-09-22 04:30:00+00:00
updatedTimestamp: 2021-04-27 12:01:39+00:00
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
> reformatted for this site. 

Hello everybody, Tansanrao here! This post is going to guide you into setting
up a Multi-Master HA (High-Availability) Kubernetes Cluster on bare-metal or
virtual machines.

All our VM images will be based on Ubuntu 20.04.1 Server and, for the purpose
of this guide, will be virtual machines on a VMware ESXi host.

We will require 7 virtual machines with a minimum spec of 2 cores and 4 GB RAM
per node for decent performance. Also make sure that you have static IPs
assigned on your DHCP server.

We are using the following hostnames and IP assignments:

- 1 HAProxy load balancer node
  `k8s-haproxy`: `192.168.1.112`
- 3 etcd/Kubernetes master nodes
  `k8s-master-a`: `192.168.1.113`
  `k8s-master-b`: `192.168.1.114`
  `k8s-master-c`: `192.168.1.115`
- 3 Kubernetes worker nodes
  `k8s-node-a`: `192.168.1.116`
  `k8s-node-b`: `192.168.1.117`
  `k8s-node-c`: `192.168.1.118`

We will also require 1 Linux client machine. If unavailable, the client tools
may be installed on the HAProxy node.

The minimum for production use is 2 physical hosts with at least 1 master on
each, with the recommended being 3 hosts with 1 master and 1 worker node each,
plus an external load balancer. For the sake of this guide, I am running all 7
nodes on the same ESXi host. A single host should be safe enough to use for
lab and test environments, but do not run anything mission critical on it.

Let's get started!

## Prepare Virtual Machines / Servers

Start by preparing 7 machines with Ubuntu 20.04.1 Server using the correct
hostnames and IP addresses. Once done, power on all of them and apply the
latest updates using:

```bash
sudo apt update && sudo apt upgrade
```

## Setting up Client Tools

### Installing `cfssl`

CFSSL is an SSL tool by Cloudflare which lets us create our certs and CAs.

#### Step 1 - Download the binaries

```bash
wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
```

#### Step 2 - Add execute permission to the binaries

```bash
chmod +x cfssl*
```

#### Step 3 - Move the binaries to `/usr/local/bin`

```bash
sudo mv cfssl_linux-amd64 /usr/local/bin/cfssl
sudo mv cfssljson_linux-amd64 /usr/local/bin/cfssljson
```

#### Step 4 - Verify the installation

```bash
cfssl version
```

### Installing `kubectl`

#### Step 1 - Get the binary

Make sure it is the same version as the cluster. In our case we are using
`v1.19`.

```bash
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.19.0/bin/linux/amd64/kubectl
```

#### Step 2 - Add execute permission to the binary

```bash
chmod +x kubectl
```

#### Step 3 - Move the binary to `/usr/local/bin`

```bash
sudo mv kubectl /usr/local/bin
```

#### Step 4 - Verify the installation

```bash
kubectl version
```

## Installing HAProxy Load Balancer

As we will be deploying three Kubernetes master nodes, we need to deploy an
HAProxy load balancer in front of them to distribute the traffic.

### Step 1 - SSH to the HAProxy VM

```bash
ssh ubuntu@192.168.1.112
```

### Step 2 - Install HAProxy

```bash
sudo apt-get install haproxy
```

### Step 3 - Configure HAProxy

```bash
sudo nano /etc/haproxy/haproxy.cfg
```

Enter the following config:

```text
global
...
default
...
frontend kubernetes
bind 192.168.1.112:6443
option tcplog
mode tcp
default_backend kubernetes-master-nodes

backend kubernetes-master-nodes
mode tcp
balance roundrobin
option tcp-check
server k8s-master-a 192.168.1.113:6443 check fall 3 rise 2
server k8s-master-b 192.168.1.114:6443 check fall 3 rise 2
server k8s-master-c 192.168.1.115:6443 check fall 3 rise 2
```

### Step 4 - Restart HAProxy

```bash
sudo systemctl restart haproxy
```

## Generating the TLS Certificates

These steps can be done on your Linux client if you have one, or on the
HAProxy machine depending on where you installed the `cfssl` tool.

### Creating a Certificate Authority

#### Step 1 - Create the certificate authority configuration file

```bash
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

```bash
nano ca-csr.json
```

Enter the following config. Change the names as necessary:

```json
{
  "CN": "Kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "IN",
      "L": "Belgaum",
      "O": "Tansanrao",
      "OU": "CA",
      "ST": "Karnataka"
    }
  ]
}
```

#### Step 3 - Generate the certificate authority certificate and private key

```bash
cfssl gencert -initca ca-csr.json | cfssljson -bare ca
```

#### Step 4 - Verify that `ca-key.pem` and `ca.pem` were generated

```bash
ls -la
```

### Creating the Certificate for the etcd Cluster

#### Step 1 - Create the certificate signing request configuration file

```bash
nano kubernetes-csr.json
```

Add the following config:

```json
{
  "CN": "Kubernetes",
  "key": {
    "algo": "rsa",
    "size": 2048
  },
  "names": [
    {
      "C": "IN",
      "L": "Belgaum",
      "O": "Tansanrao",
      "OU": "CA",
      "ST": "Karnataka"
    }
  ]
}
```

#### Step 2 - Generate the certificate and private key

```bash
cfssl gencert \
  -ca=ca.pem \
  -ca-key=ca-key.pem \
  -config=ca-config.json \
  -hostname=192.168.1.112,192.168.1.113,192.168.1.114,192.168.1.115,127.0.0.1,kubernetes.default \
  -profile=kubernetes kubernetes-csr.json | \
  cfssljson -bare kubernetes
```

#### Step 3 - Verify that `kubernetes-key.pem` and `kubernetes.pem` were generated

```bash
ls -la
```

#### Step 4 - Copy the certificates to each node

```bash
scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.113:~
scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.114:~
scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.115:~
scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.116:~
scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.117:~
scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.118:~
```

## Preparing the Nodes for `kubeadm`

### Initial Setup for All Master and Worker Machines

Copy the commands below and paste them into a `setup.sh` file and then execute
it with `. setup.sh`.

This script will check for and uninstall older versions of Docker and replace
them with the latest version of `docker-ce` for Ubuntu 20.04. It will also add
the Kubernetes repository and install `kubelet`, `kubeadm`, and `kubectl`,
then mark those packages to prevent auto updates.

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc

sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -

sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"

sudo apt-get install -y docker-ce docker-ce-cli containerd.io

sudo usermod -aG docker tansanrao

curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb https://apt.kubernetes.io/ kubernetes-xenial main
EOF
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

sudo swapoff -a
```

Now we need to turn swap off for the nodes by editing `/etc/fstab` on each
machine.

```bash
sudo nano /etc/fstab
```

Comment the line that starts with `/swap` or `/swap.img`. My `/etc/fstab`
looked like this after making the change:

```bash
# /etc/fstab: static file system information.
#
# Use 'blkid' to print the universally unique identifier for a
# device; this may be used with UUID= as a more robust way to name devices
# that works even if disks are added and removed. See fstab(5).
#
# <file system> <mount point>   <type>  <options>       <dump>  <pass>
# / was on /dev/ubuntu-vg/ubuntu-lv during curtin installation
/dev/disk/by-id/dm-uuid-LVM-s96R5iaP77QRtKuZZ0mYLuJcarDuQldMUj3yYFLQDRKWOqz9PHtLTnMMl2cbxpkC / ext4 defaults 0 0
# /boot was on /dev/sda2 during curtin installation
/dev/disk/by-uuid/bcc851c2-bbc4-44c0-bb36-c142eedd63a6 /boot ext4 defaults 0 0
#/swap.img      none    swap    sw      0       0
```

### Installing and Configuring etcd on All 3 Master Nodes

#### Step 1 - Download and move etcd files and certs to their respective places

```bash
sudo mkdir /etc/etcd /var/lib/etcd

sudo mv ~/ca.pem ~/kubernetes.pem ~/kubernetes-key.pem /etc/etcd

wget https://github.com/etcd-io/etcd/releases/download/v3.4.13/etcd-v3.4.13-linux-amd64.tar.gz

tar xvzf etcd-v3.4.13-linux-amd64.tar.gz

sudo mv etcd-v3.4.13-linux-amd64/etcd* /usr/local/bin/
```

#### Step 2 - Create an etcd systemd unit file

```bash
sudo nano /etc/systemd/system/etcd.service
```

Enter the following config:

```ini
[Unit]
Description=etcd
Documentation=https://github.com/coreos

[Service]
ExecStart=/usr/local/bin/etcd \
  --name 192.168.1.113 \
  --cert-file=/etc/etcd/kubernetes.pem \
  --key-file=/etc/etcd/kubernetes-key.pem \
  --peer-cert-file=/etc/etcd/kubernetes.pem \
  --peer-key-file=/etc/etcd/kubernetes-key.pem \
  --trusted-ca-file=/etc/etcd/ca.pem \
  --peer-trusted-ca-file=/etc/etcd/ca.pem \
  --peer-client-cert-auth \
  --client-cert-auth \
  --initial-advertise-peer-urls https://192.168.1.113:2380 \
  --listen-peer-urls https://192.168.1.113:2380 \
  --listen-client-urls https://192.168.1.113:2379,http://127.0.0.1:2379 \
  --advertise-client-urls https://192.168.1.113:2379 \
  --initial-cluster-token etcd-cluster-0 \
  --initial-cluster 192.168.1.113=https://192.168.1.113:2380,192.168.1.114=https://192.168.1.114:2380,192.168.1.115=https://192.168.1.115:2380 \
  --initial-cluster-state new \
  --data-dir=/var/lib/etcd
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Replace the IP address in all fields except the `--initial-cluster` field to
match the machine IP.

#### Step 3 - Reload the daemon configuration

```bash
sudo systemctl daemon-reload
```

#### Step 4 - Enable etcd to start at boot time

```bash
sudo systemctl enable etcd
```

#### Step 5 - Start etcd

```bash
sudo systemctl start etcd
```

**Repeat the process for all 3 master nodes and then move to step 6.**

#### Step 6 - Verify that the cluster is up and running

```bash
ETCDCTL_API=3 etcdctl member list
```

It should give you an output similar to this:

```text
73ea126859b3ba4, started, 192.168.1.114, https://192.168.1.114:2380, https://192.168.1.114:2379, false
a28911111213cc6c, started, 192.168.1.115, https://192.168.1.115:2380, https://192.168.1.115:2379, false
feadb5a763a32caa, started, 192.168.1.113, https://192.168.1.113:2380, https://192.168.1.113:2379, false
```

## Initialising the Master Nodes

### Initialising the First Master Node

#### Step 1 - SSH to the first master node

```bash
ssh ubuntu@192.168.1.113
```

#### Step 2 - Create the configuration file for `kubeadm`

```bash
nano config.yaml
```

Enter the following config:

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: v1.19.0
controlPlaneEndpoint: "192.168.1.112:6443"
etcd:
  external:
    endpoints:
      - https://192.168.1.113:2379
      - https://192.168.1.114:2379
      - https://192.168.1.115:2379
    caFile: /etc/etcd/ca.pem
    certFile: /etc/etcd/kubernetes.pem
    keyFile: /etc/etcd/kubernetes-key.pem
networking:
  podSubnet: 10.30.0.0/24
apiServer:
  certSANs:
    - "192.168.1.112"
  extraArgs:
    apiserver-count: "3"
```

Add any additional domains or IP addresses that you would want to connect to
the cluster under `certSANs`.

#### Step 3 - Initialise the machine as a master node

```bash
sudo kubeadm init --config=config.yaml
```

#### Step 4 - Copy the certificates to the two other masters

```bash
sudo scp -r /etc/kubernetes/pki ubuntu@192.168.1.114:~
sudo scp -r /etc/kubernetes/pki ubuntu@192.168.1.115:~
```

### Initialising the Second Master Node

#### Step 1 - SSH to the second master node

```bash
ssh ubuntu@192.168.1.114
```

#### Step 2 - Remove `apiserver.crt` and `apiserver.key`

```bash
rm ~/pki/apiserver.*
```

#### Step 3 - Move the certificates to the `/etc/kubernetes` directory

```bash
sudo mv ~/pki /etc/kubernetes/
```

#### Step 4 - Create the configuration file for `kubeadm`

```bash
nano config.yaml
```

Enter the following config:

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: v1.19.0
controlPlaneEndpoint: "192.168.1.112:6443"
etcd:
  external:
    endpoints:
      - https://192.168.1.113:2379
      - https://192.168.1.114:2379
      - https://192.168.1.115:2379
    caFile: /etc/etcd/ca.pem
    certFile: /etc/etcd/kubernetes.pem
    keyFile: /etc/etcd/kubernetes-key.pem
networking:
  podSubnet: 10.30.0.0/24
apiServer:
  certSANs:
    - "192.168.1.112"
  extraArgs:
    apiserver-count: "3"
```

#### Step 5 - Initialise the machine as a master node

```bash
sudo kubeadm init --config=config.yaml
```

### Initialising the Third Master Node

#### Step 1 - SSH to the third master node

```bash
ssh ubuntu@192.168.1.115
```

#### Step 2 - Remove `apiserver.crt` and `apiserver.key`

```bash
rm ~/pki/apiserver.*
```

#### Step 3 - Move the certificates to the `/etc/kubernetes` directory

```bash
sudo mv ~/pki /etc/kubernetes/
```

#### Step 4 - Create the configuration file for `kubeadm`

```bash
nano config.yaml
```

Enter the following config:

```yaml
apiVersion: kubeadm.k8s.io/v1beta2
kind: ClusterConfiguration
kubernetesVersion: v1.19.0
controlPlaneEndpoint: "192.168.1.112:6443"
etcd:
  external:
    endpoints:
      - https://192.168.1.113:2379
      - https://192.168.1.114:2379
      - https://192.168.1.115:2379
    caFile: /etc/etcd/ca.pem
    certFile: /etc/etcd/kubernetes.pem
    keyFile: /etc/etcd/kubernetes-key.pem
networking:
  podSubnet: 10.30.0.0/24
apiServer:
  certSANs:
    - "192.168.1.112"
  extraArgs:
    apiserver-count: "3"
```

#### Step 5 - Initialise the machine as a master node

```bash
sudo kubeadm init --config=config.yaml
```

#### Step 6 - Save the join command printed in the output

Example output:

```bash
kubeadm join 192.168.1.112:6443 --token c5tkdt.47tjw72synw7qbn9 \
    --discovery-token-ca-cert-hash sha256:069081b1116e821958da62e8d1c185b1df94849bdeb414761e992585f4034ce8
```

Use the output from your terminal and not this post.

## Configure `kubectl` on the Client Machine

#### Step 1 - SSH to one of the master nodes

```bash
ssh ubuntu@192.168.1.113
```

#### Step 2 - Add permissions to the `admin.conf` file

```bash
sudo chmod +r /etc/kubernetes/admin.conf
```

#### Step 3 - From the client machine, copy the configuration file

```bash
scp ubuntu@192.168.1.113:/etc/kubernetes/admin.conf .
```

#### Step 4 - Create and configure the `kubectl` configuration directory

```bash
mkdir ~/.kube
mv admin.conf ~/.kube/config
chmod 600 ~/.kube/config
```

#### Step 5 - Revert the permissions of the config file

```bash
sudo chmod 600 /etc/kubernetes/admin.conf
```

#### Step 6 - Test access to the Kubernetes API from the client machine

```bash
kubectl get nodes
```

Expected output:

```text
NAME           STATUS     ROLES    AGE     VERSION
k8s-master-a   NotReady   master   44m     v1.19.2
k8s-master-b   NotReady   master   11m     v1.19.2
k8s-master-c   NotReady   master   5m50s   v1.19.2
```

## Initialise the Worker Nodes

SSH into each worker node and execute the `kubeadm join` command that you
copied previously.

```bash
sudo kubeadm join 192.168.1.112:6443 --token c5tkdt.47tjw72synw7qbn9 \
    --discovery-token-ca-cert-hash sha256:069081b1116e821958da62e8d1c185b1df94849bdeb414761e992585f4034ce8
```

Once all three worker nodes have joined the cluster, test the API to check the
available nodes from the client machine.

```bash
kubectl get nodes
```

Expected output:

```text
NAME           STATUS     ROLES    AGE   VERSION
k8s-master-a   NotReady   master   53m   v1.19.2
k8s-master-b   NotReady   master   20m   v1.19.2
k8s-master-c   NotReady   master   14m   v1.19.2
k8s-node-a     NotReady   <none>   26s   v1.19.2
k8s-node-b     NotReady   <none>   19s   v1.19.2
k8s-node-c     NotReady   <none>   18s   v1.19.2
```

## Deploying the Overlay Network

We will be using Project Calico as the overlay network, but you are free to
use alternatives such as Flannel or Weave Net.

### Apply the manifest to deploy Calico

```bash
curl https://docs.projectcalico.org/manifests/calico.yaml -O
kubectl apply -f calico.yaml
```

### Check that all the pods deployed correctly

```bash
kubectl get pods -n kube-system
```

Congratulations! Your bare-metal HA cluster is ready for use. I recommend
setting up Rancher Server for managing it, Traefik as an ingress controller,
Longhorn as a persistent volume provider, Prometheus and Grafana for metrics,
and an EFK stack for logging and distributed tracing.
