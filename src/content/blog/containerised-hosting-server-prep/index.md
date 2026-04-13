---
title: 'Server Preparation'
description: >-
  A tutorial on setting up your own web hosting service with automation and
  security using Ubuntu, Docker, Traefik, Let's Encrypt and more!
timestamp: 2020-08-28 05:30:00+00:00
updatedTimestamp: 2021-04-27 11:59:58+00:00
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

## Introduction

This series of posts aims to set up a server as a container host which can be
managed via admin panels through a browser.

This architecture will provide instructions and sample configurations to set up
the following:

- Docker for Ubuntu
- Webmin management panel
- Docker Compose
- Traefik edge router with Let's Encrypt
- Portainer (container management panel)
- WordPress blog and its dependencies
- Ghost blog and its dependencies

This series will be released with one post every week and more sample
configurations may be added in the future.

Let's get started!

## Find a Server

On your favourite public/private cloud provider, personal server, or even a
virtual machine, start by installing Ubuntu Server 20.04. Once the OS is
installed, there are certain things to do to improve the security and usability
of the server.

## Login as Root

To log into your server, you will need your server IP address and `root` user
credentials. If you have an SSH key for authentication, you will need the
private key for the `root` user.

```bash
ssh root@<your_server_ip>
```

Accept the warning about host authenticity if it appears. If you are using
password authentication, provide your `root` password to log in.

_Note: If this is your first time logging into the server with a password, you
may also be prompted to change the `root` password._

## Create a User

Once you are logged in as root, you need to create a new user account.

```bash
adduser <username>
```

Substitute `<username>` with your desired username.

You will be asked a few questions, starting with the account password.

Enter a strong password and, optionally, fill in any of the additional
information if you would like. This is not required and you can just hit
`ENTER` in any field you wish to skip.

## Grant Administrative Rights to the New User

We now have an account with normal privileges. However, we sometimes need to
perform administrative tasks.

We can avoid logging out and logging into the `root` account by simply granting
our current user `root` privileges.

This will allow our normal user to run commands with admin rights by using the
word `sudo` before each command.

As `root`, run the following command to add your new account to the `sudo`
group. Substitute `<username>` with your normal account username:

```bash
usermod -aG sudo <username>
```

Now, when logged in as your regular user, you can type `sudo` before commands
to perform actions with superuser privileges.

## Setup a Firewall (Uncomplicated Firewall a.k.a. UFW)

Ubuntu servers come with UFW installed and this can be used to ensure
connections are allowed only to certain preconfigured services.

Applications can register their profiles with UFW on install. These profiles
allow UFW to manage these applications directly by name. OpenSSH, which is the
service that provides SSH capabilities to the server, has a profile registered
with UFW. We will be using that as an example.

You can see the list by running:

```bash
ufw app list
```

You should see an output similar to:

```bash
Available applications:
  OpenSSH
```

We now need to allow SSH connections through the firewall so that we can log
into the server the next time. We do this by typing:

```bash
ufw allow OpenSSH
```

We can now enable the firewall by running:

```bash
ufw enable
```

Type `y` and press `ENTER` to proceed.

You can see the status of the firewall by running the following command:

```bash
ufw status
```

You should see the following output:

```bash
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
```

**The firewall is now blocking all connections except SSH**, so if you have
any more services, make sure you configure those too. You can refer to
[UFW Essentials](https://www.digitalocean.com/community/tutorials/ufw-essentials-common-firewall-rules-and-commands)
by DigitalOcean for more UFW operations.

## Enable External Access for New User

The process for configuring SSH access for your new user depends on whether
your server's root account uses a password or SSH keys for authentication.

### If the Account Uses Password Authentication

If you logged in to your `root` account using a password, then password
authentication is enabled for SSH. You can SSH to your new user account by
opening up a new terminal session and using SSH with your new username:

```bash
ssh <username>@<your_server_ip>
```

After entering your regular user's password, you'll be logged into your
account. If you need to run a command with administrative rights, append
`sudo` to the start of your command like so:

```bash
sudo <command_to_be_run>
```

You will be prompted for your password the first time in each session when you
run a command with `sudo`.

I do recommend setting up SSH keys for authentication instead of password
authentication. You can follow DigitalOcean's excellent guide on how to do
that,
[here](https://www.digitalocean.com/community/tutorials/how-to-set-up-ssh-keys-on-ubuntu-20-04).

### If the Account Uses SSH Key Authentication

If you logged in to your root account using SSH keys, then password
authentication is disabled for SSH. You will need to add a copy of your local
public key to the new user's `~/.ssh/authorized_keys` file to log in
successfully.

Since your public key is already in the root account's `~/.ssh/authorized_keys`
file on the server, we can copy that file and directory structure to our new
user account in our existing session.

```bash
rsync --archive --chown=<username>:<username> ~/.ssh /home/<username>
```

> **Note:** The `rsync` command treats sources and destinations that end with a
> trailing slash differently than those without a trailing slash. When using
> `rsync` below, be sure that the source directory (`~/.ssh`) does not include
> a trailing slash. Check to make sure you are not using `~/.ssh/`.

## Install Docker Engine for Ubuntu

### Uninstall Existing Versions

```bash
sudo apt-get remove docker docker-engine docker.io containerd runc
```

> It's OK if `apt-get` reports that none of these packages are installed.

### Setup the Repository

Update the `apt` package index and install packages to allow `apt` to use a
repository over HTTPS:

```bash
sudo apt-get update

sudo apt-get install \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
```

Add Docker's official GPG key:

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

Configure the repository for the stable version of Docker:

```bash
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
```

### Install Docker Engine

Update the `apt` package index, and install the latest version of Docker Engine
and `containerd`:

```bash
sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io
```

### Add Your User to the `docker` Group

> [!WARNING]
> The `docker` group grants privileges equivalent to the root user. For details
> on how this impacts security in your system, see [Docker Daemon Attack
> Surface](https://docs.docker.com/engine/security/#docker-daemon-attack-surface).

```bash
sudo usermod -aG docker $USER
```

Log out and log back in so that your group membership is re-evaluated.

### Verify That You Can Run Docker Without `sudo`

```bash
docker run hello-world
```

### Configure Docker to Start on Boot

```bash
sudo systemctl enable docker
```

Part 2 of this series continues with management services and edge routers.
