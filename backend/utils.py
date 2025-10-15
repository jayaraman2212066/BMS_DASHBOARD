import random
import json
from datetime import datetime, timedelta
from typing import Dict
import io

def simulate_device_data(device_id: str) -> Dict[str, float]:
    """Generate simulated telemetry data for a device"""
    
    # Base values with some randomness
    base_temp = 25.0
    base_co2 = 400.0
    base_humidity = 50.0
    base_power = 5.0
    
    # Add some variation based on device ID for consistency
    device_hash = hash(device_id) % 100
    temp_offset = (device_hash % 10) - 5  # -5 to +5
    co2_offset = (device_hash % 200) - 100  # -100 to +100
    
    # Generate realistic values with some randomness
    temperature = base_temp + temp_offset + random.uniform(-3, 8)
    co2_ppm = base_co2 + co2_offset + random.uniform(-50, 300)
    humidity = base_humidity + random.uniform(-15, 25)
    power_kw = base_power + random.uniform(-2, 3)
    
    # Occasionally generate alert conditions
    if random.random() < 0.05:  # 5% chance
        temperature = random.uniform(46, 55)  # High temperature
    
    if random.random() < 0.03:  # 3% chance
        co2_ppm = random.uniform(1100, 1500)  # High CO2
    
    # Status code (0=OK, 1=WARNING, 2=FAULT)
    status = 0
    if temperature > 45 or co2_ppm > 1000:
        status = 1
    if temperature > 50 or co2_ppm > 1300:
        status = 2
    
    return {
        "temperature": round(temperature, 1),
        "co2_ppm": round(co2_ppm, 0),
        "humidity": round(humidity, 1),
        "power_kw": round(power_kw, 2),
        "status": status
    }

def generate_report(device_data: list, start_date: datetime, end_date: datetime, format: str = "csv") -> str:
    """Generate a simple CSV report"""
    
    if format.lower() == "csv":
        # Generate simple CSV report
        csv_lines = []
        csv_lines.append("Device Report")
        csv_lines.append(f"Period: {start_date.strftime('%Y-%m-%d %H:%M')} to {end_date.strftime('%Y-%m-%d %H:%M')}")
        csv_lines.append("")
        
        if device_data:
            # Add headers
            if device_data:
                headers = list(device_data[0].keys())
                csv_lines.append(",".join(headers))
                
                # Add data rows
                for row in device_data:
                    csv_lines.append(",".join(str(row.get(h, "")) for h in headers))
        
        return "\n".join(csv_lines)
    
    else:
        return "Report format not supported"

def validate_device_config(config: dict) -> bool:
    """Validate device configuration"""
    required_fields = ['device_id', 'name', 'protocol', 'ip', 'port']
    
    for field in required_fields:
        if field not in config:
            return False
    
    # Validate protocol
    if config['protocol'] not in ['Modbus', 'BACnet']:
        return False
    
    # Validate port range
    if not (1 <= config['port'] <= 65535):
        return False
    
    return True

def parse_csv_devices(csv_content: str) -> list:
    """Parse CSV content and return list of device dictionaries"""
    try:
        lines = csv_content.strip().split('\n')
        if len(lines) < 2:
            return []
        
        headers = [h.strip() for h in lines[0].split(',')]
        devices = []
        
        for line in lines[1:]:
            values = [v.strip() for v in line.split(',')]
            if len(values) >= len(headers):
                device = {}
                for i, header in enumerate(headers):
                    if i < len(values):
                        device[header] = values[i]
                
                # Convert types
                if 'port' in device:
                    try:
                        device['port'] = int(device['port'])
                    except:
                        device['port'] = 502
                
                if validate_device_config(device):
                    devices.append(device)
        
        return devices
    except Exception as e:
        raise ValueError(f"Error parsing CSV: {str(e)}")

def calculate_device_health(telemetry_data: list) -> dict:
    """Calculate device health metrics from telemetry data"""
    if not telemetry_data:
        return {"health_score": 0, "status": "unknown"}
    
    # Simple health calculation
    health_score = 100
    status = "healthy"
    
    # Check for alert conditions in recent data
    fault_count = sum(1 for d in telemetry_data if d.get('status') == 2)
    warning_count = sum(1 for d in telemetry_data if d.get('status') == 1)
    
    total_count = len(telemetry_data)
    
    if fault_count > total_count * 0.1:  # More than 10% faults
        health_score -= 50
        status = "critical"
    elif warning_count > total_count * 0.2:  # More than 20% warnings
        health_score -= 30
        status = "warning"
    
    health_score = max(0, health_score)
    
    return {
        "health_score": health_score,
        "status": status,
        "last_updated": datetime.utcnow().isoformat()
    }