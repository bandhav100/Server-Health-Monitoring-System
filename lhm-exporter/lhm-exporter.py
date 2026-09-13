import requests
from flask import Flask, Response

app = Flask(__name__)

LHM_URL = "http://host.docker.internal:8085/data.json"

INSTANCE = "host.docker.internal:8085"
JOB = "hardware_monitor"


def walk(node):
    yield node

    for child in node.get("Children", []) or []:
        yield from walk(child)


def parse_value(value):
    if value is None:
        return None

    try:
        text = str(value).strip()

        for unit in ["C", "MHz", "MB", "GB", "V", "%"]:
            text = text.replace(unit, "")

        return float(text.strip().split()[0])

    except (ValueError, TypeError, IndexError):
        return None


def metric(name, value, sensor_name):
    sensor_name = sensor_name.replace('"', '\\"')

    return (
        f'{name}{{instance="{INSTANCE}",'
        f'job="{JOB}",'
        f'sensorName="{sensor_name}"}} {value}'
    )


@app.get("/")
def root():
    return "LHM exporter running"


@app.get("/metrics")
def metrics():

    try:
        response = requests.get(LHM_URL, timeout=5)
        response.raise_for_status()

        data = response.json()

        lines = [
            "# HELP lhm_cpu_temperature_celsius CPU temperature",
            "# TYPE lhm_cpu_temperature_celsius gauge",

            "# HELP lhm_storage_temperature_celsius Storage temperature",
            "# TYPE lhm_storage_temperature_celsius gauge",

            "# HELP lhm_gpuamd_load_percent AMD GPU load",
            "# TYPE lhm_gpuamd_load_percent gauge",

            "# HELP lhm_gpuamd_clock_hertz AMD GPU clock",
            "# TYPE lhm_gpuamd_clock_hertz gauge",

            "# HELP lhm_gpuamd_voltage_volts AMD GPU voltage",
            "# TYPE lhm_gpuamd_voltage_volts gauge",

            "# HELP lhm_gpuamd_smalldata_bytes AMD GPU memory usage",
            "# TYPE lhm_gpuamd_smalldata_bytes gauge",
        ]

        for root_node in data.get("Children", []) or []:

            for sensor in walk(root_node):

                text = str(sensor.get("Text", "")).strip()
                sensor_type = str(sensor.get("Type", "")).strip()

                value = parse_value(sensor.get("RawValue"))

                if value is None:
                    continue

                # CPU temperature
                if (
                    sensor_type == "Temperature"
                    and text == "Core (Tctl/Tdie)"
                ):
                    lines.append(
                        metric(
                            "lhm_cpu_temperature_celsius",
                            value,
                            "Core (Tctl/Tdie)"
                        )
                    )

                # SSD temperature
                elif (
                    sensor_type == "Temperature"
                    and text == "Composite Temperature"
                ):
                    lines.append(
                        metric(
                            "lhm_storage_temperature_celsius",
                            value,
                            "Composite Temperature"
                        )
                    )

                # GPU load
                elif (
                    sensor_type == "Load"
                    and text == "GPU Core"
                ):
                    lines.append(
                        metric(
                            "lhm_gpuamd_load_percent",
                            value,
                            "GPU Core"
                        )
                    )

                # GPU clock
                elif (
                    sensor_type == "Clock"
                    and text == "GPU Core"
                ):
                    lines.append(
                        metric(
                            "lhm_gpuamd_clock_hertz",
                            value * 1000000,
                            "GPU Core"
                        )
                    )

                # GPU voltage
                elif (
                    sensor_type == "Voltage"
                    and text == "GPU Core"
                ):
                    lines.append(
                        metric(
                            "lhm_gpuamd_voltage_volts",
                            value,
                            "GPU Core"
                        )
                    )

                # GPU memory used
                elif (
                    sensor_type == "SmallData"
                    and text == "GPU Memory Used"
                ):
                    lines.append(
                        metric(
                            "lhm_gpuamd_smalldata_bytes",
                            value * 1024 * 1024,
                            "GPU Memory Used"
                        )
                    )

        lines.append("")

        return Response(
            "\n".join(lines),
            mimetype="text/plain"
        )

    except Exception as exc:

        return Response(
            "# LHM exporter error\n"
            f"# {exc}\n",
            status=503,
            mimetype="text/plain"
        )


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=9105
    )
