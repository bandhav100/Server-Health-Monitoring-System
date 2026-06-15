# Virtual Machine Provisioning Report

-->Project

Server Health Monitoring System

-->Sprint

Sprint-1

-->Objective

Provision a dedicated Ubuntu Server virtual machine to host monitoring and observability tools required for the Server Health Monitoring System.

## Environment Details

### Virtualization Platform

* Oracle VirtualBox

### Virtual Machine Configuration

* VM Name: monitoring-server
* Operating System: Ubuntu Server 26.04 LTS
* Memory Allocation: 2048 MB RAM
* Processors: 2 CPU Cores
* Storage: 25 GB Virtual Disk
* Network Mode: NAT

## Activities Performed

### 1. VirtualBox Installation

* Downloaded and installed Oracle VirtualBox.
* Verified successful installation on Windows host machine.

### 2. Ubuntu Server ISO Setup

* Downloaded Ubuntu Server ISO image.
* Attached ISO image to the virtual machine during creation.

### 3. Virtual Machine Creation

* Created a new virtual machine named "monitoring-server".
* Allocated RAM, CPU cores, and storage according to project requirements.

### 4. Ubuntu Server Installation

* Installed Ubuntu Server operating system.
* Configured hostname as monitoring-server.
* Created administrator user account.
* Enabled OpenSSH Server for remote administration.

### 5. System Verification

Verified successful VM deployment using the following commands:

hostnamectl
free -h
ip a

## Verification Results

### Hostname Verification

* Hostname: monitoring-server

### Virtualization Verification

* Virtualization Platform: Oracle VirtualBox

### Operating System Verification

* Ubuntu Server 26.04 LTS

### Resource Verification

* RAM: 2048 MB
* CPU: 2 Cores
* Disk: 25 GB

### Network Verification

* Network interface successfully configured.
* VM obtained valid IP address.

## Outcome

The virtual machine was successfully provisioned and configured for the Server Health Monitoring System project.

## Sprint Status

Task: Virtual Machine Provisioning

Status: Completed

Assigned To: Bandhav (DevOps Engineer)

Sprint: Sprint-1

