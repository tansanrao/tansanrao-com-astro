---
title: 'Guide: Kubernetes Multi-Master HA Cluster with kubeadm'
description: >-
  A comprehensive guide on setting up a highly available Kubernetes cluster on
  bare-metal or virtual machines using kubeadm, covering load balancer setup,
  etcd configuration, and worker node joining.
pubDate: 2020-09-22
tags:
  - kubernetes
  - infrastructure
  - devops
draft: false
featured: false
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---
This post is going to guide you into setting up a Multi-Master HA
(High-Availability) Kubernetes Cluster on bare-metal or virtual machines. Let's
get started!

**Environment:** Ubuntu 20.04.1 Server  
**Platform:** VMware ESXi (can be adapted to bare-metal)  
**Cluster Size:** 7 nodes (1 Load Balancer, 3 Masters, 3 Workers)  
**Minimum Requirements per VM:** 2 Cores, 4GB RAM

---

## Hostname & IP Assignments

| Role          | Hostname       | IP Address      |
| ------------- | -------------- | --------------- |
| Load Balancer | `k8s-haproxy`  | `192.168.1.112` |
| Master Node 1 | `k8s-master-a` | `192.168.1.113` |
| Master Node 2 | `k8s-master-b` | `192.168.1.114` |
| Master Node 3 | `k8s-master-c` | `192.168.1.115` |
| Worker Node 1 | `k8s-node-a`   | `192.168.1.116` |
| Worker Node 2 | `k8s-node-b`   | `192.168.1.117` |
| Worker Node 3 | `k8s-node-c`   | `192.168.1.118` |

---

## 1. Prepare the Virtual Machines

Ensure all VMs are updated:

```bash
sudo apt update && sudo apt upgrade
```

---

## 2. Setup Client Tools

### Install `cfssl`

```bash
wget https://pkg.cfssl.org/R1.2/cfssl_linux-amd64
wget https://pkg.cfssl.org/R1.2/cfssljson_linux-amd64
chmod +x cfssl*
sudo mv cfssl_linux-amd64 /usr/local/bin/cfssl
sudo mv cfssljson_linux-amd64 /usr/local/bin/cfssljson
cfssl version
```

### Install `kubectl`

```bash
curl -LO https://storage.googleapis.com/kubernetes-release/release/v1.19.0/bin/linux/amd64/kubectl
chmod +x kubectl
sudo mv kubectl /usr/local/bin
kubectl version
```

---

## 3. Install HAProxy Load Balancer

```bash
ssh ubuntu@192.168.1.112
sudo apt-get install haproxy
```

Edit HAProxy config:

```bash
sudo nano /etc/haproxy/haproxy.cfg
```

```
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

```bash
sudo systemctl restart haproxy
```

---

## 4. Generate TLS Certificates

> Can be done on client or HAProxy machine.

### Create CA Config

`ca-config.json`:

```json
{
  "signing": {
    "default": { "expiry": "8760h" },
    "profiles": {
      "kubernetes": {
        "usages": ["signing", "key encipherment", "server auth", "client auth"],
        "expiry": "8760h"
      }
    }
  }
}
```

`ca-csr.json`:

```json
{
  "CN": "Kubernetes",
  "key": { "algo": "rsa", "size": 2048 },
  "names": [{
    "C": "IN",
    "L": "City",
    "O": "OrgName",
    "OU": "CA",
    "ST": "State"
  }]
}
```

```bash
cfssl gencert -initca ca-csr.json | cfssljson -bare ca
```

### Generate Kubernetes Cert

`kubernetes-csr.json`:

```json
{
  "CN": "Kubernetes",
  "key": { "algo": "rsa", "size": 2048 },
  "names": [{
    "C": "IN",
    "L": "City",
    "O": "OrgName",
    "OU": "CA",
    "ST": "State"
  }]
}
```

```bash
cfssl gencert \
  -ca=ca.pem \
  -ca-key=ca-key.pem \
  -config=ca-config.json \
  -hostname=192.168.1.112,192.168.1.113,192.168.1.114,192.168.1.115,127.0.0.1,kubernetes.default \
  -profile=kubernetes kubernetes-csr.json | cfssljson -bare kubernetes
```

### Copy Certs to All Nodes

```bash
for ip in 113 114 115 116 117 118; do
  scp ca.pem kubernetes.pem kubernetes-key.pem ubuntu@192.168.1.$ip:~
done
```

---

## 5. Prepare All Nodes for `kubeadm`

Create a script `setup.sh` and run:

```bash
chmod +x setup.sh
. setup.sh
```

Contents:

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc -y

sudo apt-get install -y apt-transport-https ca-certificates curl gnupg-agent software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
  "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
sudo usermod -aG docker $USER

curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | sudo apt-key add -
echo "deb https://apt.kubernetes.io/ kubernetes-xenial main" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl

sudo swapoff -a
```

Edit `/etc/fstab` and comment out swap line:

```bash
sudo nano /etc/fstab
# Comment out the line for swap.img or /swap
```

---

## 6. Install and Configure `etcd` on Master Nodes

On each master (113, 114, 115):

```bash
sudo mkdir /etc/etcd /var/lib/etcd
sudo mv ~/ca.pem ~/kubernetes.pem ~/kubernetes-key.pem /etc/etcd

wget https://github.com/etcd-io/etcd/releases/download/v3.4.13/etcd-v3.4.13-linux-amd64.tar.gz
tar xvzf etcd-v3.4.13-linux-amd64.tar.gz
sudo mv etcd-v3.4.13-linux-amd64/etcd* /usr/local/bin/
```

Create `/etc/systemd/system/etcd.service`, updating IP for each host:

```ini
[Unit]
Description=etcd
Documentation=https://github.com/coreos

[Service]
ExecStart=/usr/local/bin/etcd \
  --name <NODE_IP> \
  --cert-file=/etc/etcd/kubernetes.pem \
  --key-file=/etc/etcd/kubernetes-key.pem \
  --peer-cert-file=/etc/etcd/kubernetes.pem \
  --peer-key-file=/etc/etcd/kubernetes-key.pem \
  --trusted-ca-file=/etc/etcd/ca.pem \
  --peer-trusted-ca-file=/etc/etcd/ca.pem \
  --peer-client-cert-auth \
  --client-cert-auth \
  --initial-advertise-peer-urls https://<NODE_IP>:2380 \
  --listen-peer-urls https://<NODE_IP>:2380 \
  --listen-client-urls https://<NODE_IP>:2379,http://127.0.0.1:2379 \
  --advertise-client-urls https://<NODE_IP>:2379 \
  --initial-cluster-token etcd-cluster-0 \
  --initial-cluster 192.168.1.113=https://192.168.1.113:2380,192.168.1.114=https://192.168.1.114:2380,192.168.1.115=https://192.168.1.115:2380 \
  --initial-cluster-state new \
  --data-dir=/var/lib/etcd
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable etcd
sudo systemctl start etcd
```

Check status:

```bash
ETCDCTL_API=3 etcdctl member list
```

---

## 7. Initialize Kubernetes Master Nodes

### First Master (113)

Create `config.yaml`:

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

```bash
sudo kubeadm init --config=config.yaml
```

Copy certs to other masters:

```bash
scp -r /etc/kubernetes/pki ubuntu@192.168.1.114:~
scp -r /etc/kubernetes/pki ubuntu@192.168.1.115:~
```

### Second & Third Masters

- Remove `apiserver.*`
    
- Move `pki` to `/etc/kubernetes`
    
- Create same `config.yaml`
    
- Run `sudo kubeadm init --config=config.yaml`
    

---

## 8. Configure `kubectl` on Client Machine

From Master Node:

```bash
sudo chmod +r /etc/kubernetes/admin.conf
scp ubuntu@192.168.1.113:/etc/kubernetes/admin.conf .
```

On client:

```bash
mkdir ~/.kube
mv admin.conf ~/.kube/config
chmod 600 ~/.kube/config
```

---

## 9. Join Worker Nodes

Run the `kubeadm join` command from earlier on each worker node.

Example:

```bash
sudo kubeadm join 192.168.1.112:6443 --token <token> \
    --discovery-token-ca-cert-hash sha256:<hash>
```

Verify:

```bash
kubectl get nodes
```

---

## 10. Deploy Overlay Network (Calico)

```bash
curl https://docs.projectcalico.org/manifests/calico.yaml -O
kubectl apply -f calico.yaml
kubectl get pods -n kube-system
```

---

## ✅ Cluster is Ready

Consider adding:
- [Rancher](https://rancher.com/) for management
- [Traefik](https://traefik.io/) for Ingress
- [Longhorn](https://longhorn.io/) for volumes
- [Prometheus + Grafana](https://prometheus.io/) for metrics
- [EFK Stack](https://www.elastic.co/what-is/elk-stack) for logging

