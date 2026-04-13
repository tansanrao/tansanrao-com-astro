---
title: 'Docker Explained: What is it? Why does it exist?'
description: >-
  This post is aimed at giving you a semi-detailed idea of what Docker is, what
  containers are and how they work. So what really is Docker? Read on!
timestamp: 2020-09-01 04:30:00+00:00
updatedTimestamp: 2021-04-29 05:24:00+00:00
tags:
  - containers
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

Hello everybody! Tansanrao here. In my previous post about building a web
hosting service with containers, we talked about using something called Docker
to build and run our containers. This post is aimed at giving you a
semi-detailed idea of what Docker is, what containers are, and how they work.
Let's get started!

## What is Docker?

Docker is a tool designed to make it easier to create, deploy, and run
applications in a reproducible way using containers.

Containers allow a developer to package an application with all the libraries,
dependencies, and everything else it needs to run as one package. With this,
the developer can be assured that irrespective of the configurations on the
host machine on which the container is deployed, it will run properly and the
behaviour will not differ from the machine used when developing and testing the
code.

## Why Docker over a Regular VM?

One can compare Docker containers to a virtual machine, but instead of creating
an entire operating system in a package, Docker allows you to package only the
application and its dependencies while sharing the Linux kernel on the host
machine.

This allows containers to ship with only the libraries and dependencies that
are not already present on the host operating system and significantly reduces
the size of the packages while boosting performance and deployment times.

## What is a Container?

Containers are a way of packaging an application in a way which is platform
independent and extremely portable across various distributions of Linux.

Containers require three categories of software:

- Builder: technology used to build a container
- Engine: technology used to run a container
- Orchestration: technology used to manage multiple containers

One of the appealing attributes of containers is their ability to gracefully
die and respawn on demand, irrespective of whether a container died due to a
crash or simply because it was no longer needed due to low-traffic conditions.

This is possible because containers are very cheap to start and they are
designed to appear, work, and disappear seamlessly on demand.

Containers are meant to be ephemeral, lasting for a short time, and thus tasks
related to monitoring and managing them are not handled by humans in real time
but are instead collected centrally and automated.

Linux containers have allowed a major shift in high-availability computing, and
there are many tools to help develop and run services in containers. Docker is
one of many that are compatible with the [Open Container Initiative
(OCI) Spec](https://opencontainers.org/). OCI is an industry standards
organization tasked with encouraging innovation and development in the field of
containers without the danger of being locked to a single vendor.

Docker provides the functionalities of a builder and an engine. Docker Engine
depends on `containerd` to provide the `runC` runtime. `containerd` is an
abstraction layer that allows an engine to delegate the tasks of handling
syscalls and actually running the container on a host.

Now you may have heard a lot of buzz about Kubernetes. If you were wondering
what it was, it is one of the tools that provides container orchestration.

What is container orchestration? Put simply, container orchestration automates
the deployment, management, scaling, and networking of containers.

## Who is it for?

Docker is a tool that is designed for both developers and system
administrators, making it part of many DevOps toolchains and pipelines.

It allows developers to focus on writing code without worrying about the system
that it will ultimately run on. It also allows them to get a head-start in
development by using one of the thousands of programs already designed to run
in a Docker container.

For system operations staff, Docker allows flexibility and reduces the number
of systems needed thanks to the smaller footprint of containers and their lower
performance overhead when running.
