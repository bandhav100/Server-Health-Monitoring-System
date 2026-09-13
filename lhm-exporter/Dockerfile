FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY lhm-exporter.py .

EXPOSE 9105

CMD ["python", "lhm-exporter.py"]
