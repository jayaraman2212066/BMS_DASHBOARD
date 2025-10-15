import React, { useState, useEffect } from 'react';
import { Device, DashboardStats } from '../types';
import { deviceAPI, dashboardAPI } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import DeviceCard from '../components/DeviceCard';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { subscribe } = useWebSocket();

  const fetchData = async () => {
    try {
      const [devicesData, statsData] = await Promise.all([
        deviceAPI.getAll(),
        dashboardAPI.getStats(),
      ]);
      setDevices(devicesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to WebSocket updates
    const unsubscribe = subscribe('telemetry_update', () => {
      fetchData();
    });

    return unsubscribe;
  }, [subscribe]);

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
          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🏭</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Devices
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.total_devices}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">✅</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Devices
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.active_devices}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🟢</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Online Devices
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.online_devices}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🚨</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Alerts
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.active_alerts}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">🌬️</div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Avg CO₂
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {stats.avg_co2_ppm} ppm
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Devices Grid */}
          <div className="mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Device Status
            </h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {devices.map((device) => (
                <DeviceCard
                  key={device.id}
                  device={device}
                  onUpdate={fetchData}
                />
              ))}
            </div>
          </div>

          {devices.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <div className="text-4xl mb-4">🏭</div>
                <h3 className="text-lg font-medium">No devices found</h3>
                <p className="text-sm">Add some devices to get started.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;