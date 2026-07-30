---
title: XNU Architecture and Build Overview
description: >-
  This is the first post in a series to port Apple's XNU kernel to Raspberry Pi
  devices. In this post, we'll be exploring the XNU kernel architecture, key
  components, and build system.
timestamp: 2026-07-28 00:00:00+00:00
series: XNU on Pi 
tags:
  - xnu
  - kernel
  - raspberry-pi
toc: true
draft: false 
authors:
  - name: Tanuj Ravi Rao
    url: 'https://tansanrao.com'
---

This summer, to procrastinate on my research, I needed a side-project. Since
most of my research is on eBPF and the Linux kernel, I wanted to play with
something different. And after [my previous deep dive on Apple's Darwin OS and
XNU
kernel](https://tansanrao.com/blog/2025/04/xnu-kernel-and-darwin-evolution-and-architecture/),
I wanted to get some hands-on time with XNU. What better way to do it than by
porting it to non-Apple hardware! After leaving this on my "list of ideas that I
will get to someday" for a while, it was finally time to get to it. 

XNU-on-Pi is a project with the goal of porting XNU to a Raspberry Pi and
getting as much of the hardware working as possible over the next 3 weeks. For
userland, we want a standard shell like bash or zsh and some basic utilities.
Now that we have LLMs to act as amazing semantic search engines over a codebase,
I have a feeling it'll be significantly faster to debug and learn, allowing me
to get pretty far in the 3 weeks I allowed myself. 

My plan so far is to do a bunch of reading on XNUs architecture, the way the
source code is organized, the build system, and the ARM64 / Raspberry Pi boot
process. Then I'll start working towards a Hello World from XNU to the UART
port. I'll figure out the rest of the scope once I get there. To familiarize
myself with the codebase and the boot process, I'm essentially cloning the
source, finding the `_start` method, and then using "go to definition" for
everything called after it. Any parts that I don't understand, I let an LLM
explain it to me. The rest of this post is just a high-level summary of all my
notes and I'll link to the source for the interesting bits. 

## XNU high-level architecture

Apple describes XNU as a hybrid of Mach, FreeBSD-derived components, and IOKit.
The core components of XNU are:
- Mach
- BSD
- IOKit
- Platform Expert
- libkern
- Security and code signing

### Mach: `osfmk/`

Mach is an operating system kernel developed at Carnegie Mellon University by
Richard Rashid and Avie Tevanian to support operating system research. It is
considered one of the earliest examples of a microkernel. 

Mach supplies XNU with the fundamental execution and resource-management
machinery such as tasks, threads, scheduling, context switching, IPC (Mach
ports, messages), virtual memory, locks, timers, and architecture-specific code.

### BSD: `bsd/`

The BSD layer supplies XNU with the UNIX/POSIX interface: processes, process
groups, sessions, POSIX/BSD system calls, VFS and filesystem infrastructure,
sockets, the networking stack, `fork`, `spawn`, and `exec`. It also handles
root-device selection, root mounting, PID 1 creation and initial userspace
launch.

On startup, XNU transitions from Mach into BSD through the
[`bsd_init()`](https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.121.6/bsd/kern/bsd_init.c#L485-L1080)
function. `bsd_init()` initializes the BSD world, mounts and authenticates the
root filesystem and eventually calls `bsd_utaskbootstrap()` which creates PID 1
and prepares its task and VM map before `load_init_program()` invokes the normal
XNU exec method. A BSD process is associated with a Mach task, BSD threads
are backed by Mach threads, and exec replaces the VM map belonging to a task.

### IOKit: `iokit/`

IOKit is XNU's in-kernel C++ driver and service framework. It provides the
IORegistry and device-tree plane, memory descriptors, DMA abstractions,
power-management and platform-service interfaces, integration with kernel
extensions and BSD device discovery, and the `IOService` matching and lifecycle.
According to the
[docs](https://developer.apple.com/documentation/driverkit/ioservice), "An
`IOService` object is the base class the system uses to represent all devices
and device-related interfaces. When the user plugs in a device, the system
creates one or more service objects to manage interactions with that device."

The initialization stages are in
[`iokit/Kernel/IOStartIOKit.cpp`](https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.121.6/iokit/Kernel/IOStartIOKit.cpp).
`InitIOKit()` initializes IOLib, IOKit Mach ports, interrupt accounting, and
creates an `IOPlatformExpertDevice` root from the device tree (more on this
later). `ConfigureIOKit()` configures defaults and `StartIOKitMatching()` starts
general `IOService` matching. This separation seems to be necessary for security
reasons, IOKit core objects are initialized early in the boot process but
general driver matching is delayed until the kernel is locked down.

### Platform Expert: `pexpert/`

Platform Expert is actually two separate but related layers. The open-source
`pexpert/` layer runs before ordinary IOKit matching, it consumes `boot_args`
and the device tree, identifies the machine, records framebuffer information,
parses boot arguments, finds early serial hardware, maps the
interrupt-controller and timer resources, and provides early console/debugging
services.

In
[`arm_init.c`](https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.121.6/osfmk/arm/arm_init.c#L349-L691),
there are two invocations for `PE_init_platform()` which setup stuff in phases:

```c
PE_init_platform(FALSE, boot_args);   // BootArgs, device tree, early platform
...
PE_init_platform(TRUE, &BootCpuData); // interrupt/timebase and later mappings
```

later, IOKit's `IOPlatformExpertDevice` becomes the registry root. Apple's
platform-family kexts (kernel extensions) in the kernelcache (BootKC) supplies
the detailed SoC and product implementation that the generic XNU Platform Expert
does not contain. You can extract the kernel cache from an Apple packaged IPSW
if you are interested in digging deeper.

### libkern: `libkern/`

libkern is the kernel C/C++ runtime and common support layer. It includes
primitives and abstractions for common kernel data structures and operations
like `OSObject`, `OSMetaClass`, `OSArray`, `OSDictionary`, `OSSet`, `OSString`,
kernel Run-Time Type Information (RTTI), and reference counting. It also
includes low-level memory/string functions, hashing, compression, logging,
firmware/image support, kext-related linking and metadata handling functions.

### Security and code signing

Security is distributed across the kernel with the `security/` directory
containing the TrustedBSD Mandatory Access Control Framework which is a
policy-dispatch mechanism. The public XNU tree contains:

- MAC Framework hooks and dispatch.
- process, credential, vnode, and exec enforcement plumbing.
- code-signatures structures and VM integration.
- trust-cache runtime interfaces.
- code-signing-monitor integration.
- Image4/CoreTrust interfaces.
- machine-lockdown ordering. 

Some policy modules are private with only hooks and integration points present
in the public release. In particular, the AppleMobileFileIntegrity (AMFI) and
Sandbox policies are external and private. During startup, XNU initializes the
MAC Framework and code-signing configuration, later initializes trust-cache
state, removes temporary bootstrap-linking segments, and calls
`machine_lockdown()` before ordinary operation.

## iBoot and the boot chain

On Apple silicon, Apple’s documented boot chain has iBoot load the system-paired
firmware, static trust cache, device tree, and Boot Kernel Collection (BootKC).
Depending on policy, it can also load an Auxiliary Kernel Collection, and it
verifies the signed system volume’s root hash. The BootKC typically contains XNU
plus the built-in/prelinked kexts.

The ARM64 `boot_args` structure passed into XNU typically includes: virtual and
physical kernel bases, memory size and top-of-kernel-data address, framebuffer
information, device-tree pointer and length, boot command line, and boot flags.

> iBoot authenticates, loads, and describes the boot environment. XNU takes
> ownership of kernel execution and runtime enforcement.

## ARM64 startup sequence

XNU today contains two ARM64 startup paths. A classic Page Protection Layer
(PPL) path and a new Secure Page Table Monitor (SPTM) path.

### Classic PPL path

The rough call graph is:

```
iBoot
  -> _start
  -> start_first_cpu
       mask DAIF
       establish early vectors and stacks
       read BootArgs bases
       construct bootstrap identity and KVA tables
       program TCR, TTBR0, TTBR1 and MAIR
       enable MMU and caches through SCTLR
  -> arm_init
       PE_init_platform(FALSE)
       bootstrap CPU/thread/time structures
       arm_vm_init
       serial and framebuffer console
       PE_init_platform(TRUE)
       interrupt controller and timebase
  -> machine_startup
  -> kernel_bootstrap
       VM, IPC, console, MAC, code signing, tasks, threads
       create bootstrap thread
       first real context switch
  -> kernel_bootstrap_thread
       sched_startup
       early IOKit
       enable ordinary interrupts
       trust caches and lockdown
       start IOKit matching
       bsd_init
  -> mount/authenticate root
  -> create PID 1
  -> exec initial userspace program
```

At
[`_start`](https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.121.6/osfmk/arm64/start.s),
XNU branches to `start_first_cpu` which takes the BootArgs pointer, masks all
[DAIF](https://support.arm.com/documentation/ddi0595/2021-03/AArch64-Registers/DAIF--Interrupt-Mask-Bits?lang=en)
exceptions, installs an early vector, creates exception and interrupt stacks,
and reads the virtual/physical address bases supplied in BootArgs.

It then builds both an identity mapping and a kernel-virtual mapping using
bootstrap page tables. It programs the translation table and memory attribute
registers and finally writes `SCTLR_EL1_DEFAULT`, explicitly enabling the caches
and MMU before transferring to
[`arm_init()`](https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.121.6/osfmk/arm/arm_init.c#L198).

### SPTM Path

For the SPTM path, SPTM jumps into XNU and passes: an entry reason in x0, iBoot
BootArgs in x1, and SPTM BootArgs in x2. SPTM initially maps only XNU’s
boot-executable segment as executable. XNU then establishes stacks, rebases and
signs pointers, installs its final exception vectors, tells SPTM that fixups are
complete, and then branches to the SPTM-specific `arm_init()`. The high-level
goal remains similar to the PPL path, but page ownership, page-table mutation,
executable-page typing, and protected code-signing state are mediated by
SPTM/TXM.

### Common Mach bootstrap

[`kernel_bootstrap()`](https://github.com/apple-oss-distributions/xnu/blob/xnu-12377.121.6/osfmk/kern/startup.c#L521)
initializes allocator-backed VM, OSLog and the regular console, the MAC
(Mandatory Access Control) framework, Mach IPC, machine and clock state,
code-signing configuration, tasks, threads, workqueues, turnstiles (mechanism
used to implement priority inheritance), and exceptions. It then creates
`kernel_bootstrap_thread` and performs the first actual context switch with
`load_context()`.

The bootstrap thread creates the idle thread and calls `sched_startup()`. It
starts thread-call, clock, and device services; initializes IOKit; verifies that
interrupts remain masked; and finally calls `spllo()` to permit ordinary
interrupts. It then initializes the later security stages, loads trust-cache
state, calls `machine_lockdown()`, starts general IOKit matching, and hands of
to the BSD portion using `bsd_init()`.

### Transition to Userspace
`bsd_init()` mounts the root filesystem and performs root authentication where
required. It then calls `bsd_utaskbootstrap()`, which clones the initial
process, obtains PID 1, initializes its VM map and IPC state, and schedules its
init task. The init task calls `load_init_program()` through exec, which on
macOS is normally `launchd`.


## SDK versus KDK
The SDK is the primary compiler target environment with target headers and
module maps, deployment-version information, stubs and development tools, and a
staging area for generated/private dependencies under `/usr/local`. The KDK
which is the Kernel Debug Kit, is tied more closely to a particular macOS build.
It provides matching kernel symbols and dSYMs, private kernel headers and
metadata, per-machine kernel-support archives, platform and monitor libraries
that are used during XNU linking. 

## Next Steps

With all of this background out of the way, we can now start hacking with XNU.
My next steps are to setup a proper environment to build in, setup Qemu with the
`raspi4b` model and correct DTBs, write a simple loader program that the Pi can
boot, and print Hello World to the UART port. Once we have a loader program
working, it'll be time to teach XNU about the BCM2711 SoC used by the Pi, and
see if we can get the loader to handoff cleanly to XNU boot and get a hello
world out of XNU.
