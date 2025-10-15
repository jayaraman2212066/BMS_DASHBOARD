import random
import json
from datetime import datetime, timedelta
from typing import Dict
import pandas as pd
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
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

def generate_report(device_data: list, start_date: datetime, end_date: datetime, format: str = "pdf") -> bytes:
    """Generate a report in PDF or CSV format"""
    
    if format.lower() == "csv":
        # Generate CSV report
        df = pd.DataFrame(device_data)
        csv_buffer = io.StringIO()
        df.to_csv(csv_buffer, index=False)
        return csv_buffer.getvalue().encode('utf-8')
    
    elif format.lower() == "pdf":
        # Generate PDF report
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title = Paragraph("Voltas BMS Device Report", styles['Title'])
        story.append(title)
        story.append(Spacer(1, 12))
        
        # Date range
        date_range = Paragraph(
            f"Report Period: {start_date.strftime('%Y-%m-%d %H:%M')} to {end_date.strftime('%Y-%m-%d %H:%M')}",
            styles['Normal']
        )
        story.append(date_range)
        story.append(Spacer(1, 12))
        
        # Summary statistics
        if device_data:
            df = pd.DataFrame(device_data)
            
            # Create summary table
            summary_data = [
                ['Metric', 'Average', 'Min', 'Max', 'Count'],
            ]
            
            numeric_columns = df.select_dtypes(include=['number']).columns
            for col in numeric_columns:
                if col in df.columns:
                    summary_data.append([
                        col,
                        f"{df[col].mean():.2f}",
                        f"{df[col].min():.2f}",
                        f"{df[col].max():.2f}",
                        str(len(df[col]))
                    ])
            
            summary_table = Table(summary_data)
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 14),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(Paragraph("Summary Statistics", styles['Heading2']))
            story.append(summary_table)
            story.append(Spacer(1, 12))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
    
    else:
        raise ValueError("Unsupported format. Use 'pdf' or 'csv'")

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
        df = pd.read_csv(io.StringIO(csv_content))
        devices = []
        
        for _, row in df.iterrows():
            device = {
                'device_id': str(row.get('device_id', '')),
                'name': str(row.get('name', '')),
                'protocol': str(row.get('protocol', 'Modbus')),
                'ip': str(row.get('ip', '')),
                'port': int(row.get('port', 502)),
                'location': str(row.get('location', '')),
                'description': str(row.get('description', '')),
                'is_active': bool(row.get('is_active', True))
            }
            
            if validate_device_config(device):
                devices.append(device)
        
        return devices
    except Exception as e:
        raise ValueError(f"Error parsing CSV: {str(e)}")

def calculate_device_health(telemetry_data: list) -> dict:
    """Calculate device health metrics from telemetry data"""
    if not telemetry_data:
        return {"health_score": 0, "status": "unknown"}
    
    df = pd.DataFrame(telemetry_data)
    
    # Calculate health score based on various factors
    health_score = 100
    status = "healthy"
    
    # Check temperature stability
    if 'temperature' in df.columns:
        temp_std = df['temperature'].std()
        if temp_std > 5:  # High temperature variation
            health_score -= 20
            status = "warning"
    
    # Check for alert conditions
    if 'status' in df.columns:
        fault_ratio = (df['status'] == 2).sum() / len(df)
        warning_ratio = (df['status'] == 1).sum() / len(df)
        
        if fault_ratio > 0.1:  # More than 10% faults
            health_score -= 50
            status = "critical"
        elif warning_ratio > 0.2:  # More than 20% warnings
            health_score -= 30
            status = "warning"
    
    health_score = max(0, health_score)
    
    return {
        "health_score": health_score,
        "status": status,
        "last_updated": datetime.utcnow().isoformat()
    }