import React, { useState, useEffect } from 'react';
import { Device, Telemetry } from '../types';
import { deviceAPI, telemetryAPI } from '../services/api';
import Layout from '../components/Layout';
import Chart from '../components/Chart';

const Devices: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [telemetryData, setTelemetryData] = useState<Telemetry[]>([]);
  const [selectedMetric, setSelectedMetric] = useState('temperature');
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    try {
      const data = await deviceAPI.getAll();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTelemetry = async () => {
    if (!selectedDevice) return;

    try {
      const now = new Date();
      const start = new Date();
      
      switch (timeRange) {
        case '1h':
          start.setHours(now.getHours() - 1);
          break;
        case '24h':
          start.setDate(now.getDate() - 1);
          break;
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        default:
          start.setHours(now.getHours() - 1);
      }

      const data = await telemetryAPI.get({
        device_id: selectedDevice.id,
        metric: selectedMetric,
        start: start.toISOString(),
        end: now.toISOString(),
      });

      setTelemetryData(data);
    } catch (error) {
      console.error('Error fetching telemetry:', error);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      fetchTelemetry();
    }
  }, [selectedDevice, selectedMetric, timeRange]);

  const metrics = [
    { value: 'temperature', label: 'Temperature (°C)', color: '#ef4444' },
    { value: 'co2_ppm', label: 'CO₂ (ppm)', color: '#f59e0b' },
    { value: 'humidity', label: 'Humidity (%)', color: '#3b82f6' },
    { value: 'power_kw', label: 'Power (kW)', color: '#10b981' },
  ];

  const timeRanges = [
    { value: '1h', label: 'Last Hour' },
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Device Analytics</h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Device List */}
            <div className="lg:col-span-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Devices</h3>
              <div className="space-y-2">
                {devices.map((device) => (
                  <button
                    key={device.id}
                    onClick={() => setSelectedDevice(device)}
                    className={`w-full text-left p-3 rounded-lg border ${
                      selectedDevice?.id === device.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{device.name}</div>
                    <div className="text-xs text-gray-500">{device.device_id}</div>
                    <div className="flex items-center mt-1">
                      <div
                        className={`w-2 h-2 rounded-full mr-2 ${
                          device.is_online ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      />
                      <span className="text-xs text-gray-500">
                        {device.is_online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Charts */}
            <div className="lg:col-span-3">
              {selectedDevice && (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {selectedDevice.name} - Telemetry
                    </h3>
                    
                    {/* Controls */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Metric
                        </label>
                        <select
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {metrics.map((metric) => (
                            <option key={metric.value} value={metric.value}>
                              {metric.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Time Range
                        </label>
                        <select
                          value={timeRange}
                          onChange={(e) => setTimeRange(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                        >
                          {timeRanges.map((range) => (
                            <option key={range.value} value={range.value}>
                              {range.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Chart */}
                    {telemetryData.length > 0 ? (
                      <Chart
                        data={telemetryData}
                        title={`${selectedDevice.name} - ${metrics.find(m => m.value === selectedMetric)?.label}`}
                        metric={selectedMetric}
                        color={metrics.find(m => m.value === selectedMetric)?.color}
                      />
                    ) : (
                      <div className="bg-white p-8 rounded-lg shadow text-center">
                        <div className="text-gray-500">
                          <div className="text-4xl mb-4">📊</div>
                          <h3 className="text-lg font-medium">No telemetry data</h3>
                          <p className="text-sm">No data available for the selected time range.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Device Info */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Device Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Device ID</dt>
                        <dd className="text-sm text-gray-900">{selectedDevice.device_id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Protocol</dt>
                        <dd className="text-sm text-gray-900">{selectedDevice.protocol}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">IP Address</dt>
                        <dd className="text-sm text-gray-900">{selectedDevice.ip}:{selectedDevice.port}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Location</dt>
                        <dd className="text-sm text-gray-900">{selectedDevice.location || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                        <dd className="text-sm text-gray-900">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selectedDevice.is_online ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedDevice.is_online ? 'Online' : 'Offline'}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Last Heartbeat</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedDevice.last_heartbeat 
                            ? new Date(selectedDevice.last_heartbeat).toLocaleString()
                            : 'N/A'
                          }
                        </dd>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Devices;