# Sprint 1 – Tailscale Setup and Secure Network Configuration

## Sprint Duration

**15-06-2026 to 28-06-2026**

## Objective

Configure a secure private network using Tailscale to enable safe communication between the virtual machines and monitoring components of the Server Health Monitoring System.

## Work Completed

* Installed **Tailscale** on the Windows system.
* Authenticated using the assigned project account.
* Joined the device to the project's private Tailscale network.
* Verified that the device appeared successfully in the Tailscale admin dashboard.
* Confirmed connectivity by communicating through the assigned Tailscale IP address.
* Validated encrypted communication between connected devices within the private mesh network.

## Tools & Technologies

* Tailscale
* Windows 11
* Git & GitHub

## Outcome

* Successfully configured a secure mesh VPN for the project environment.
* Registered the system within the Tailscale network for private communication.
* Enabled encrypted connectivity without exposing services directly to the public internet.
* Established the networking foundation required for remote monitoring of multiple servers.

## Future Scope

* Integrate **Prometheus** and **Grafana** over the Tailscale network for secure monitoring.
* Enable communication between multiple virtual machines through private IP addresses.
* Support remote administration and monitoring without opening firewall ports.

## Network Flow

**Client Machine → Tailscale Network → Remote Server/VM → Monitoring Services (Prometheus & Grafana)**
