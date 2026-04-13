---
title: 'Webmin, Portainer, Traefik and More'
description: >-
  Part 2 of a tutorial on setting up your own web hosting service with
  automation and security using Ubuntu, Docker, Traefik, Let's Encrypt and
  more!
timestamp: 2020-09-04 04:30:00+00:00
updatedTimestamp: 2021-04-27 11:59:46+00:00
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

Hello everybody! Tansanrao here. Welcome to part 2 of the Containerised Hosting
series. Today we will be setting up some global services to provide management
interfaces on your server.

Here's everything you will have set up by the end of this tutorial:

- Docker Compose
- Webmin management interface
- Portainer UI for Docker
- Traefik edge router for routing traffic to containers

Let's get started!

## Step 1 - Install Docker Compose

You can install `docker-compose` by fetching the latest release from the
Compose repository on GitHub. Follow the instructions below to set it up.

```bash
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
```

> If you have problems installing with `curl`, make sure you have `curl`
> installed. If not, follow the command below to set it up and then try the
> above command again.

```bash
sudo apt install curl
```

Now apply execute permissions to the binary with:

```bash
sudo chmod +x /usr/local/bin/docker-compose
```

Check to make sure you have `docker-compose` working by executing it:

```bash
docker-compose --version
```

## Step 2 - Installing Webmin

First you need to update your server's package index.

```bash
sudo apt update
```

Then we add the Webmin repository so that we can install and update Webmin
using the `apt` package manager. We do this by adding the repository to the
`/etc/apt/sources.list` file.

Open the file in your preferred editor. Here, we'll use `nano`:

```bash
sudo nano /etc/apt/sources.list
```

Then add the following line to the bottom of the file to add the new
repository.

```bash
. . .

deb http://download.webmin.com/download/repository sarge contrib
```

Save the file and exit the editor. If you used `nano`, do so by pressing
`CTRL+X`, `Y`, then `ENTER`.

Next, you'll add the Webmin PGP key so that your system will trust the new
repository.

Download the Webmin PGP key with `wget` and add it to your system's list of
keys:

```bash
wget -q -O- http://www.webmin.com/jcameron-key.asc | sudo apt-key add
```

Update the list of packages again in order to include the Webmin repository:

```bash
sudo apt update
```

Then install Webmin:

```bash
sudo apt install webmin
```

At the end of the install process, you will get the following output:

```text
Webmin install complete. You can now login to
https://your_server:10000 as root with your
root password, or as any user who can use sudo.
```

To be able to access it, we need to configure `ufw` to allow traffic to port
10000.

```bash
sudo ufw allow 10000
```

Next, navigate to `https://your_domain:10000` in your web browser, replacing
`your_domain` with the domain name pointing to your server's IP address, or the
server's IP address itself.

> Note: When logging in for the first time, you will see an "Invalid SSL"
> warning. This warning may say something different depending on your browser,
> but the reason for it is that the server has generated a self-signed
> certificate. Allow the exception and proceed. We will be securing this soon.

You'll be presented with a login screen. Sign in with the non-root user you
created in the first part of this tutorial.

Once you log in, the first screen you will see is the Webmin dashboard. You now
have to set the server's hostname. Look for the System hostname field and click
on the link to the right, as shown in the following figure:

![Webmin dashboard hostname link](https://web.archive.org/web/20220129112109im_/https://tansanrao.com/content/images/2020/09/Screenshot-2020-09-02-at-3.48.25-PM.png)

This will take you to the Hostname and DNS Client page. Locate the Hostname
field, and enter your Fully-Qualified Domain Name into the field. Then click
the Save button at the bottom of the page to apply the setting.

![Webmin hostname and DNS client page](https://web.archive.org/web/20220129112109im_/https://tansanrao.com/content/images/2020/09/Screenshot-2020-09-02-at-3.50.28-PM.png)

Done! You have now set up Webmin on your server.

## Step 3 - Creating the Global Infrastructure Stack

Here we will be working with `docker-compose` files to define the container
stacks for our infrastructure.

I recommend creating a `git` repository to make maintaining these configs
easier.

I will be linking a repo for this tutorial at the end of the post. Feel free to
create a fork and modify it to test it out.

In your git repo, create a directory called `global`, inside which all the
config files for our global services will live.

```bash
mkdir global
cd global
```

Now create the `docker-compose` file.

```bash
touch docker-compose.yml
```

### Docker Compose Stack

Open it with `nano` or your favourite text editor.

```bash
nano docker-compose.yml
```

Here we define our first `service` and the `networks` and `volumes` used by
the services. Let's begin with Traefik.

```yaml
version: "3.3"

services:
  traefik:
    image: "traefik:v2.2"
    container_name: "traefik"
    restart: always
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"
    volumes:
      - "letsencrypt:/letsencrypt"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
      - "${PWD}/traefik.toml:/etc/traefik/traefik.toml"
      - "${PWD}/dynamic.toml:/etc/traefik/dynamic.toml"
    networks:
      - internal
      - traefik-public

volumes:
  letsencrypt:

networks:
  traefik-public:
    external: true
  internal:
    external: false
```

Save the file and exit the editor.

Okay, there's a lot of stuff going on in there. Let's break it down.

First we define the version number of the `docker-compose` specification. In
this case we will be using version `3.3` of the `docker-compose` spec.

Next we define the Traefik service under the `services` key. The `image` key
contains the reference and tag from the Docker registry where we fetch the
image. In this case, it is `traefik:v2.2` from Docker Hub.

Then we give it a container name with the `container_name` key. And we specify
a restart policy using the `restart` key. Here we are using the restart policy
of `always` to ensure that all our global services auto-restart on failure.

Next we use the `ports` key to define the mapping between host ports and
container ports. This allows traffic from our host server to flow into and out
of the Docker container. Every pair is defined as
`host_port:container_port` and is passed to the ports key in the form of an
array.

Next we have the `volumes` key. We pass an array of mappings between a Docker
volume or file on the host and the mount point for it in the container. This is
defined as `docker-volume_or_file:/mount/point/in/container`.

Then we define the `networks` that the container belongs to. Here we attach it
to two bridge networks, one called `internal` and one called `traefik-public`.
`internal`, as its name suggests, handles internal communication between all
the containers that are part of the global stack, that is, this
`docker-compose` file. Whereas `traefik-public` is an external network which
contains all the containers that need to be exposed to the internet via the
Traefik edge router, irrespective of what stack they belong to.

You will learn more about why we follow such a network architecture in Part 3
of this tutorial, so be sure to check it out after this.

That brings us to the end of defining the Traefik service. We also created two
sections at the end of the file named `volumes` and `networks`. Here we define
the named volumes we use as part of the stack under `volumes` and the networks
we use in the stack under `networks`.

Now the keen-eyed ones among you may have noticed we are binding three files
under the `volumes` part of the `traefik` service.

The first, `/var/run/docker.sock`, is the Docker socket which exposes the
Docker API to Traefik allowing it to discover and load configurations from
other Docker containers. We bind this with read-only permissions.

Next we have the `traefik.toml` file. This is the static configuration file for
Traefik. Let's create one.

### Traefik Static Configuration File

Start by creating the `traefik.toml` file in the `global` directory:

```bash
touch traefik.toml
```

Open the file:

```bash
nano traefik.toml
```

And paste the following config into it:

```toml
[global]
  checkNewVersion = true
  sendAnonymousUsage = true

[entryPoints]
  [entryPoints.web]
    address = ":80"

  [entryPoints.websecure]
    address = ":443"

[api]
  insecure = true

[providers]
# Enable Docker configuration backend
  [providers.docker]
    exposedByDefault = false

# Enable File Provider
  [providers.file]
    filename = "/etc/traefik/dynamic.toml"

# Enable ACME (Let's Encrypt): automatic SSL.
[certificatesResolvers.myresolver.acme]

  # Email address used for registration.
  #
  # Required
  #
  email = "[email protected]"

  # File or key used for certificates storage.
  #
  # Required
  #
  storage = "/letsencrypt/acme.json"

  # CA server to use.
  # Uncomment the line to use Let's Encrypt's staging server,
  # leave commented to go to prod.
  #
  # Optional
  # Default: "https://acme-v02.api.letsencrypt.org/directory"
  #
  # caServer = "https://acme-staging-v02.api.letsencrypt.org/directory"

  [certificatesResolvers.myresolver.acme.httpChallenge]
    # EntryPoint to use for the HTTP-01 challenges.
    #
    # Required
    #
    entryPoint = "web"
```

Save the file and exit the editor.

This is a lot, and explaining everything here is outside the scope of this
series, but I will try my best to give you a clear understanding of what is
going on here.

Traefik requires two different configurations: a static configuration and a
dynamic configuration. The static configuration is responsible for all the
Traefik-related configuration. The dynamic configuration defines the routers,
services, middleware, and other dynamic properties of a router. Dynamic
configurations can be loaded from multiple providers such as Docker,
Kubernetes, File, Consul, Marathon, Rancher, and more.

Now, let's begin breaking down the `traefik.toml` static configuration.

Under the `global` key, we define global parameters like usage data, update
checking, and so on. Next, we define entry points to the router under the
`entryPoints` key. We define two entry points named `web` and `websecure`
respectively. The `web` entry point handles HTTP data on port 80. This is a
non-SSL/TLS entry point, and for the most part we only use this to respond to
the initial request with a redirect to `HTTPS`. The `websecure` entry point
handles `HTTPS SSL/TLS` traffic on port 443.

Next we set `api.insecure` to true which allows us to access the web dashboard.

We then move onto declaring our providers for the dynamic configuration. We
enable the Docker provider by adding the `[providers.docker]` key under which
we configure the Docker provider to not be exposed to the public by default.
This is done by setting `exposedByDefault` to false. This publishes only
containers that are tagged with the `traefik.enable` label.

We also enable the File provider by passing it the path to `dynamic.toml` under
the `[providers.file]` key.

Next we configure the email and storage for the Let's Encrypt resolver under
the key `certificatesResolvers.myresolver.acme`. This allows us to use the
certificate resolver `myresolver` to automatically complete a Let's Encrypt
challenge and attach a certificate to your router on the SSL entry point
`websecure`.

For a more detailed breakdown of how TOML files work and all the other options
that Traefik provides, refer to the [official docs](https://docs.traefik.io/).

### Traefik Dynamic Configuration

Start by creating the `dynamic.toml` file in the `global` directory:

```bash
touch dynamic.toml
```

Open the file:

```bash
nano dynamic.toml
```

Now paste the following config into it:

```toml
[tls]
  [tls.options]
    [tls.options.minTLS12]
      minVersion = "VersionTLS12"
      preferServerCipherSuites = true
      sniStrict = true
      cipherSuites = [
        "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
        "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
        "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305",
        "TLS_AES_128_GCM_SHA256",
        "TLS_AES_256_GCM_SHA384",
        "TLS_CHACHA20_POLY1305_SHA256"
      ]
      curvePreferences = [
        "CurveP521",
        "CurveP384"
      ]

[http]
  [http.middlewares]
    [http.middlewares.secHeaders]
      [http.middlewares.secHeaders.headers]
        browserXssFilter = true
        contentTypeNosniff = true
        sslRedirect = true
      # HSTS Configuration

      # Set this to false if you want to exclude subdomains from HSTS
        stsIncludeSubdomains = true

      # Set this to true if you want to add your domain to the hstspreload list.
      # This operation is very difficult and time consuming if not impossible to revert.
      # Make sure you read the explanation and do your research properly.
        stsPreload = false

        stsSeconds = 15768000
```

Save the file and exit the editor.

> **Warning!**
>
> HSTS headers have long-term effects. Please read the comments and everything
> below carefully and then make the necessary changes to the config before
> continuing.

Okay, now this config has even more going on than before, but I'll try my best
to make it simple. We are defining two things here: a `middleware` that appends
security-related headers to all the responses, and `options` for the `TLS`
entry point to tighten up security and support only select strong ciphers.

Under the `tls.options` key, we set the minimum supported version to `TLS1.2`
and tell the client to honour server cipher preferences. We also set the `SNI`
check to strict. `SNI` stands for _Server Name Indication_. It is an extension
to the Transport Layer Security computer networking protocol by which a client
indicates which hostname it is attempting to connect to at the start of the
handshaking process.

With strict SNI checking enabled, Traefik won't allow connections from clients
that do not specify a `server_name` extension or don't match any certificate
configured on the `tlsOption`.

Next we define the cipher suites that we want to support explicitly to prevent
weak ciphers from being used. The above config uses the Mozilla recommended
intermediate configuration defined
[here](https://wiki.mozilla.org/Security/Server_Side_TLS).

Moving onto the security headers, the middleware `secHeaders` appends the
`XSS Filter`, `X-Content-Type-Options`, `SSL Redirection`, and `HSTS` headers.

`Cross-site scripting (XSS)` is a type of security vulnerability typically
found in web applications. `XSS` attacks enable attackers to inject
client-side scripts into web pages viewed by other users. A
`cross-site scripting` vulnerability may be used by attackers to bypass access
controls such as the `same-origin` policy. XSS filters work by finding typical
patterns that may be used as XSS attack vectors and removing such code
fragments from user input data.

The `X-Content-Type-Options` header is used to protect against `MIME sniffing`
vulnerabilities. These vulnerabilities can occur when a website allows users to
upload content to a website, however the user disguises a particular file type
as something else. This can give them the opportunity to perform
`cross-site scripting` and compromise the website. We set it to `nosniff` to
indicate to browsers that they are not supposed to perform MIME sniffing.

`SSL Redirection` header does what it says: it asks the browser to access the
website over `HTTPS`.

`HSTS` stands for `Http Strict-Transport-Security`. The HTTP Strict Transport
Security header informs the browser that it should never load a site using HTTP
and should automatically convert all attempts to access the site using HTTP to
HTTPS requests instead.

> Note: The Strict-Transport-Security header is ignored by the browser when
> your site is accessed using HTTP. This is because an attacker may intercept
> HTTP connections and inject the header or remove it. When your site is
> accessed over HTTPS with no certificate errors, the browser knows your site
> is HTTPS capable and will honour the Strict-Transport-Security header.

Google maintains an [HSTS preload](https://hstspreload.org) service. By
following the guidelines and successfully submitting your domain, browsers will
never connect to your domain using an insecure connection. If the preload
header defined above is set to true, it submits your website to the preload
list, which will force all subdomains to be loaded over HTTPS only. This will
cause issues if you are trying to serve something over HTTP, so exercise the
utmost caution before enabling it.

That's it. The difficult part is done.

Now we move onto defining Portainer and routing Webmin through Traefik.

### Portainer Configuration

We now go back to the `docker-compose.yml` file.

```bash
nano docker-compose.yml
```

We then add the following under the `services:` key.

```yaml
# services:
  # Traefik Configuration was here

  portainer:
    image: portainer/portainer
    command: -H unix:///var/run/docker.sock
    restart: always
    ports:
      - 9000:9000
      - 8000:8000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    labels:
      - traefik.enable=true
      - traefik.http.middlewares.portainer-redirect-websecure.redirectscheme.scheme=https
      - traefik.http.routers.portainer-web.rule=Host(`portainer.example.com`)
      - traefik.http.routers.portainer-web.entrypoints=web
      - traefik.http.routers.portainer-web.middlewares=portainer-redirect-websecure
      - traefik.http.routers.portainer-websecure.entrypoints=websecure
      - traefik.http.routers.portainer-websecure.rule=Host(`portainer.example.com`)
      - traefik.tags=traefik-public
      - traefik.docker.network=traefik-public
      - traefik.http.routers.portainer-websecure.tls=true
      - traefik.http.routers.portainer-websecure.tls.certresolver=myresolver
      - traefik.http.services.portainer-global.loadbalancer.server.port=9000
    networks:
      - internal
      - traefik-public

  webmin-proxy:
    image: qoomon/docker-host
    restart: always
    cap_add: ["NET_ADMIN", "NET_RAW"]
    labels:
      - traefik.enable=true
      - traefik.http.middlewares.webmin-redirect-websecure.redirectscheme.scheme=https
      - traefik.http.routers.webmin-web.rule=Host(`webhost.example.com`)
      - traefik.http.routers.webmin-web.entrypoints=web
      - traefik.http.routers.webmin-web.middlewares=webmin-redirect-websecure
      - traefik.http.routers.webmin-websecure.entrypoints=websecure
      - traefik.http.routers.webmin-websecure.rule=Host(`webhost.example.com`)
      - traefik.tags= traefik-public
      - traefik.docker.network=traefik-public
      - traefik.http.routers.webmin-websecure.tls=true
      - traefik.http.routers.webmin-websecure.tls.certresolver=myresolver
      - traefik.http.services.webmin-global.loadbalancer.server.port=10000
    networks:
      - internal
      - traefik-public
```

Save and exit the editor.

Okay, starting with the obvious, we are defining two new services called
`portainer` and `webmin-proxy`. [Portainer](https://www.portainer.io/) is a GUI
for Docker hosts. It allows us to manage containers and check logs remotely
without having to use SSH. `webmin-proxy` uses a container image that maps all
the ports on the host into the container. This essentially allows us to access
ports on the host server from inside our Docker `internal` bridge network. We
use this to forward traffic from Traefik to Webmin running on Ubuntu.

Now the new stuff: Docker labels. We use labels to tag pieces of information to
containers. Traefik reads these labels and configures itself.

The syntax for Traefik labels matches the nested path it follows in the file
configuration. So if we need to define a router we would use
`traefik.http.routers.<routerName>.rule`.

So for each of the above services, we use:

- `traefik.http.middlewares.<middlewareName>.redirectscheme.scheme` to redirect
  traffic on `http` to `https`
- `traefik.http.routers.<routerName-web>.rule` for the router on the HTTP entry
  point
- `traefik.http.routers.<routerName-websecure>.rule` for the router on the
  HTTPS entry point
- `traefik.tags= traefik-public` to tag the container with `traefik-public`
- `traefik.docker.network=traefik-public` to indicate to Traefik to use the
  `traefik-public` network to communicate with this container
- `traefik.http.routers.<routerName-websecure>.tls=true` to enable `tls` on the
  `websecure` entry point
- `traefik.http.routers.<routerName-websecure>.tls.certresolver=myresolver` to
  tell Traefik to use `myresolver` to fetch Let's Encrypt certificates

## Step 4 - Deployment

We need to reconfigure Webmin to honour redirects on the proxy host and port.

```bash
sudo nano /etc/webmin/miniserv.conf
```

And set the following lines. If any are missing, add them at the end of the
file:

```bash
ssl=0
redirect_host=your_domain.com
redirect_port=443 # use 80 if http only
```

Now we edit the file `/etc/webmin/config` to add our domain to the referrers
line:

```bash
sudo nano /etc/webmin/config
```

Add the following line if it doesn't already exist:

```bash
referers=your_domain.com
```

Remember to substitute `your_domain.com` with your actual domain or subdomain
before proceeding.

We now open ports 80 and 443 in `ufw`:

```bash
sudo ufw allow 80
sudo ufw allow 443
```

You can now deploy your entire `docker-compose` stack with one command:

```bash
docker-compose up -d
```

You will be back at your prompt if all goes well.

Feel free to follow me on social media for more updates, and don't forget to
come back next week for Part 3 where we design an additional stack for
WordPress.

You can refer to the repository
[here](https://github.com/tansanrao/containerised-hosting-tutorial) for the
entire structure and final state of each file.
